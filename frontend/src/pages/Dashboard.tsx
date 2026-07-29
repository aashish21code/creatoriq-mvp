import { useAuth0 } from '@auth0/auth0-react';

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
        <p className="mt-4 text-slate-400">Welcome{user?.name ? `, ${user.name}` : ''}.</p>
      </div>
    </div>
  );
}
