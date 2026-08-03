"use client";


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Something went wrong!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {error.message}
            </p>
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}