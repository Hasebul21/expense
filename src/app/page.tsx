import Dashboard from "../components/Dashboard";
import { requireUser } from "@/lib/dal";
import { loadUserData } from "@/lib/expense-data";

// Server Component: requireUser() redirects to /login if there's no session,
// then we load this user's expenses/budgets (RLS-scoped) and hand them to the
// client Dashboard as the initial snapshot.
export default async function Home() {
  const user = await requireUser();
  const { expenses, budgets } = await loadUserData();

  return (
    <Dashboard
      initialExpenses={expenses}
      initialBudgets={budgets}
      userEmail={user.email ?? ""}
    />
  );
}
