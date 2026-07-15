export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      className={
        error
          ? "text-sm text-red-600 dark:text-red-400"
          : "text-sm text-green-600 dark:text-green-400"
      }
    >
      {error ?? success}
    </p>
  );
}
