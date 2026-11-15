export default function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Alert({ kind = 'error', children }) {
  const c = { error: 'bg-red-50 text-red-700 border-red-200', warning: 'bg-amber-50 text-amber-800 border-amber-200', info: 'bg-emerald-50 text-emerald-800 border-emerald-200' }[kind];
  return <div role="alert" className={`rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>;
}
