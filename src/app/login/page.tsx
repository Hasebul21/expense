import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in · Expenses",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl shadow-lg shadow-violet-500/25 dark:from-[#7b5536] dark:to-[#43301f]">
          💸
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#f1e7da]">
          Expenses
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#95806c]">
          Sign in to track your spending
        </p>
      </div>
      <LoginForm urlError={error} />
    </main>
  );
}
