export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      className="text-sm"
      style={{ color: error ? "var(--color-neg)" : "var(--color-pos)" }}
    >
      {error ?? success}
    </p>
  );
}
