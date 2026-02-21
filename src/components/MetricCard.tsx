interface Props {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, sub, highlight }: Props) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-sm ${
        highlight ? "bg-brand text-white" : "bg-white text-gray-800"
      }`}
    >
      <p
        className={`text-sm font-medium uppercase tracking-wide mb-1 ${
          highlight ? "text-red-100" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p className="text-4xl font-bold">{value}</p>
      {sub && (
        <p className={`text-sm mt-1 ${highlight ? "text-red-100" : "text-gray-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
