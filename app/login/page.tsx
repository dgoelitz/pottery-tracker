export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const isMissingSetup = params.setup === "missing";
  const hasError = params.error === "1";
  const nextPath = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <section className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">Mud Goods</h1>
        <p className="mt-2 text-sm text-stone-600">Enter the shared app password to continue.</p>

        {isMissingSetup && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            App access is locked because the production password settings are missing.
          </p>
        )}

        {hasError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            That password did not work.
          </p>
        )}

        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              autoFocus
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm outline-none focus:border-stone-500"
              name="password"
              type="password"
              disabled={isMissingSetup}
              required
            />
          </label>
          <button
            className="w-full rounded-md bg-stone-900 px-4 py-2 font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isMissingSetup}
            type="submit"
          >
            Unlock
          </button>
        </form>
      </section>
    </main>
  );
}
