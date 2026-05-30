import { signIn } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sent, error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-medium">Clarity</h1>
          <p className="text-sm text-neutral-500">
            Your external brain for ADHD
          </p>
        </header>
        {sent ? (
          <p className="text-sm text-center">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form action={signIn} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-[#3B6EA5]"
            />
            <button
              type="submit"
              className="w-full px-3 py-2 bg-[#3B6EA5] text-white rounded-md font-medium hover:bg-[#2f5a85] transition-colors"
            >
              Email me a sign-in link
            </button>
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
