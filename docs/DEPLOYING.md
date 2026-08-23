# Deploying HostStats on Cloudflare

HostStats is a static site — every CSV is parsed in the visitor's browser and
nothing is uploaded. That means it deploys as plain files on Cloudflare Workers
static assets, with no server, no database and no runtime cost.

Two separate things are set up here:

1. **Hosting** — put the site on Cloudflare at your own domain.
2. **Login** — put Cloudflare Access in front of it so only the people you
   name can open it, signing in with Facebook.

They are independent. You can do (1) and leave the site public, or add (2)
later without touching a line of code.

---

## 1. Hosting

### One-off deploy from your laptop

```bash
npm install
npx wrangler login      # opens a browser, authorises the CLI
npm run deploy          # builds ./out and uploads it
```

`npm run deploy` runs `next build` (which writes the static export to `out/`)
and then `npx wrangler deploy`, which reads `wrangler.jsonc`. First deploy asks to
create the Worker; after that it just uploads.

You'll get a URL like `https://hoststats.<your-subdomain>.workers.dev`. Open
it and confirm the page loads.

### Deploy automatically on every push

`.github/workflows/deploy.yml` already does this. It needs one **variable**
and one **secret** — they live on separate tabs under **Settings → Secrets and
variables → Actions** in GitHub.

| Name                    | Kind     | Where to get it                                                                              |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | It is the hex string in any Cloudflare dashboard URL: `dash.cloudflare.com/<account-id>/...` |
| `CLOUDFLARE_API_TOKEN`  | Secret   | My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template                |

The account ID is not a credential — it appears in every dashboard URL and is
useless without a token — so it belongs in Variables. That also keeps it out of
the log masker: as a secret it renders as `***` in Wrangler output, which is
unhelpful precisely when you are debugging a failed deploy.

Name the token after what uses it, for example
`hoststats-github-actions-deploy`, so you can revoke the right one later. Give
each consumer its own token rather than sharing one, and set an expiry if
offered.

Pushes to `main` then build and deploy on their own.

Scope the token to the **Edit Cloudflare Workers** template rather than a
global key — it can only touch Workers, so a leak can't reach the rest of the
account.

### Your own domain

In the Cloudflare dashboard: **Workers & Pages → hoststats → Settings → Domains
& Routes → Add → Custom domain**, and enter `hoststats.brignano.io`.

Because `brignano.io` is already a Cloudflare zone, the DNS record is created
and proxied for you — no CNAME to copy anywhere, and the certificate is issued
automatically.

You do not have to do this before setting up login. Access can protect the
`workers.dev` URL on its own, so you can get Facebook sign-in working and test
it end to end before moving any DNS.

> **Moving off Vercel?** Add the custom domain on Cloudflare _after_ removing
> it from the Vercel project, or the DNS record will conflict.

### What's in the box

| File              | Why                                                                          |
| ----------------- | ---------------------------------------------------------------------------- |
| `wrangler.jsonc`  | Points Workers static assets at `./out`, serves `404.html` for unknown paths |
| `next.config.mjs` | `output: "export"` — no server runtime                                       |
| `public/_headers` | Immutable caching for hashed assets, plus CSP and other security headers     |

`_headers` gives `/_next/static/*` a one-year immutable cache. Those filenames
contain a content hash, so a new build produces new names and returning
visitors re-download only what actually changed.

---

## 2. Login with Facebook

Cloudflare Access sits in front of the site. Someone opening it gets a
Cloudflare login screen, signs in with Facebook, and only reaches the app if
their email is on your list. Nobody else gets through, and the app itself needs
no auth code at all.

This works on the `workers.dev` URL as well as a custom domain, so do it first
and move DNS later.

This is on the **Zero Trust free plan** — up to 50 users at no cost.

### Step 1 — Find your team domain

Cloudflare dashboard → **Zero Trust** → **Settings** → **Custom Pages**, and
look for **Team domain**. It looks like `yourteam.cloudflareaccess.com`. If you
have never used Zero Trust, you'll be asked to pick a team name first.

Your callback URL is that domain plus a fixed path:

```
https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/callback
```

Keep it handy — Facebook needs it in step 2.

### Step 2 — Create the Facebook app

1. Go to [developers.facebook.com](https://developers.facebook.com/) and sign
   in with your own Facebook account.
2. **My Apps → Create App**.
3. For the use case, pick **Authenticate and request data from users with
   Facebook Login**.
4. Give it a name your family will recognise — they will see it on the consent
   screen. "HostStats" is fine.
5. Once created, add the **Facebook Login** product if it isn't already there.
6. **Facebook Login → Settings → Valid OAuth Redirect URIs**: paste the
   callback URL from step 1. Save.
7. **App settings → Basic**: copy the **App ID** and **App Secret**.

### Step 3 — Switch the app to Live

This is the step everyone misses. A new Facebook app starts in **Development**
mode, where _only_ people listed as admins, developers or testers of the app
can log in. Your mother is none of those, so she'll hit an unhelpful error.

Flip the toggle at the top of the Facebook dashboard from **Development** to
**Live**.

Facebook will ask for a privacy policy URL before it lets you go live. Any
reachable page stating that you don't collect anything will do.

You do _not_ need App Review or business verification for this. Access only
asks for `public_profile` and `email`, which every app gets by default.

### Step 4 — Add Facebook to Cloudflare

1. **Zero Trust → Integrations → Identity providers → Add new**.
2. Choose **Facebook**.
3. Paste the **App ID** and **App Secret**.
4. Save, then use **Test** to confirm the round trip works before you rely on it.

### Step 5 — Protect the site

The quickest route protects the Worker itself, which covers its `workers.dev`
URL, any custom domain you add later, and preview URLs — all at once, with
nothing to keep in sync when domains change.

1. Cloudflare dashboard → **Workers & Pages** → **hoststats** → **Access**.
2. Select **Protect this Worker**, and choose production (add previews too if
   you want those private).
3. Choose who can sign in: **email address**, and add each family member's.
4. Select **Facebook** as the login method. Turn off the others unless you want
   them as a backup.
5. Save.

To protect one specific hostname instead — for example only
`hoststats.brignano.io`, leaving `workers.dev` open — create a **self-hosted
application** under **Zero Trust → Access controls → Applications** with that
hostname as the application domain, and attach the same Allow policy.

Access is deny-by-default: anyone who doesn't match an Allow policy is refused,
so you never have to write a deny rule.

Open the site in a private window to check you get the login screen.

### The catch worth knowing about

**Access matches on email, and Facebook doesn't always supply one.** Accounts
created with only a phone number, or where the user declines to share their
email on the consent screen, come back with no email address — and an
email-based policy can't match them. You'll see them bounce off the login
screen with no obvious reason.

If that happens to someone, the fastest fix is to add **One-time PIN** as a
second login method. Cloudflare emails them a six-digit code; no Facebook app,
no consent screen, nothing to install. For a handful of relatives this is often
less friction than Facebook, so it's worth offering both and letting people
pick.

### Sanity checks

| Symptom                              | Cause                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| "App not active" / "cannot load app" | The Facebook app is still in Development mode (step 3)                                   |
| `redirect_uri` mismatch              | The callback URL in Facebook doesn't exactly match the team domain, including `https://` |
| Login succeeds, then Access denies   | The email Facebook returned isn't in the Allow policy — or Facebook returned none at all |
| No login screen at all               | The hostname isn't proxied through Cloudflare, or the Access app hostname is a typo      |

---

## Costs

|                       |                                       |
| --------------------- | ------------------------------------- |
| Workers static assets | Free tier covers 100,000 requests/day |
| Zero Trust Access     | Free up to 50 users                   |
| Bandwidth             | Free                                  |

A family dashboard will not come close to any of these.
