export default function ProfileLoading() {
  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-10 dark:bg-black lg:-m-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl animate-pulse flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-40 rounded-full bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-4 w-72 rounded-full bg-zinc-100 dark:bg-zinc-900" />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="h-4 w-48 rounded-full bg-zinc-100 dark:bg-zinc-800" />

          <div className="mt-4 flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-56 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>

          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div className="h-3 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-11 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-3 h-9 w-40 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-28 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}
