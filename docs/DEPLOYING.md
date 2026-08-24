# Deploying HostStats on Cloudflare

HostStats is a static site — every CSV is parsed in the visitor's browser and
nothing is uploaded. That means it deploys as plain files on Cloudflare Workers
static assets, with no server, no database and no runtime cost.

Two separate things are set up here:

1. **Hosting** — put the site on Cloudflare at your own domain.
2. **Login** — put Cloudflare Access in front of it so only the people you
   name can open it.

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
`workers.dev` URL on its own, so you can get sign-in working and test it end to
end before moving any DNS.

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

## 2. Login

Cloudflare Access sits in front of the site. Someone opening it gets a sign-in
screen, and only reaches the app if their email is on your list. Nobody else
gets through, and the app itself needs no auth code at all.

This works on the `workers.dev` URL as well as a custom domain, so you can set
it up and test it before moving any DNS.

Free on the **Zero Trust free plan** — up to 50 users.

### Choosing a sign-in method

| Method           | Setup                           | Good for                                 |
| ---------------- | ------------------------------- | ---------------------------------------- |
| **One-time PIN** | None                            | Family and friends — recommended         |
| **Google**       | An OAuth client in Google Cloud | People who all have Google accounts      |
| **Facebook**     | Blocked in practice — see below | Not usable without a registered business |

**Facebook does not work for a personal site.** Meta grants `public_profile`
and `email` at _Standard Access_, which only permits sign-in by people holding
a role on the Facebook app — admin, developer or tester. Letting anyone else
log in needs _Advanced Access_, and that requires App Review plus Business
Verification, which wants legal business registration documents. For a family
dashboard that is a dead end. The alternative — adding each relative as an app
"Tester" — makes them accept a developer invite on developers.facebook.com,
which is worse than the problem it solves.

### One-time PIN

Cloudflare emails a six-digit code. There is no identity provider to configure,
no app to register, and nothing for the visitor to install or approve.

1. In the Cloudflare dashboard, go to **Zero Trust** → **Integrations** →
   **Identity providers**.
2. Select **Add new** → **One-time PIN**. There is nothing to fill in.

That is the entire setup. Now protect the site (below).

> If anyone reports the code never arriving, it is almost always spam
> filtering. Codes come from `noreply@notify.cloudflare.com`.

### Google (optional)

Worth it if everyone already has a Google account and you would rather they did
not type codes. Unlike Meta, Google treats email and profile as non-sensitive
scopes, so this does not sit behind business verification.

1. Find your **team domain**: **Zero Trust** → **Settings** → **Custom Pages**
   → **Team domain**, e.g. `yourteam.cloudflareaccess.com`. Your callback URL is
   that domain plus `/cdn-cgi/access/callback`.
2. In the [Google Cloud console](https://console.cloud.google.com/), create an
   **OAuth client ID** of type _Web application_, and add that callback URL as
   an authorised redirect URI.
3. Back in Cloudflare: **Zero Trust** → **Integrations** → **Identity
   providers** → **Add new** → **Google**, and paste the client ID and secret.
4. Save, then use **Test** to confirm the round trip.

### Protect the site

This protects the Worker itself, which covers its `workers.dev` URL, any custom
domain you add later, and preview URLs — all at once, with nothing to keep in
sync when domains change.

1. **Workers & Pages** → **hoststats** → **Access**.
2. Select **Protect this Worker**. Cover **production and previews** — a
   preview URL serves the same app, so leaving it open defeats the point.
3. Choose who can sign in: **email address**, and add each person's.
4. Select the login methods you configured. Enabling more than one lets people
   pick.
5. Save.

Access is deny-by-default: anyone who does not match an Allow policy is
refused, so you never write a deny rule.

Open the site in a private window to check you get the sign-in screen.

To protect one specific hostname instead — for example only
`hoststats.brignano.io`, leaving `workers.dev` open — create a **self-hosted
application** under **Zero Trust** → **Access controls** → **Applications**
with that hostname as the application domain, and attach the same policy.

### Adding people later

For a handful of addresses, editing the policy is fine. Past a dozen or so,
build a reusable group under **Zero Trust** → **Access controls** → **Groups**,
then attach that group to every site instead of maintaining parallel lists.

### Sanity checks

| Symptom                                | Cause                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No sign-in screen at all               | The hostname is not proxied through Cloudflare, or the Access application is not attached to this Worker |
| Signed in, then denied                 | That email is not in the Allow policy                                                                    |
| PIN email never arrives                | Spam filtering — allowlist `noreply@notify.cloudflare.com`                                               |
| Google returns `redirect_uri_mismatch` | The callback URL in Google Cloud does not exactly match the team domain, including `https://`            |

---

## Costs

|                       |                                       |
| --------------------- | ------------------------------------- |
| Workers static assets | Free tier covers 100,000 requests/day |
| Zero Trust Access     | Free up to 50 users                   |
| Bandwidth             | Free                                  |

A family dashboard will not come close to any of these.
