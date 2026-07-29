import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => loginWithRedirect();
  const handleSignUp = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold text-white">CreatorIQ</h1>
          <p className="mt-2 text-sm text-slate-400">AI content intelligence for creators</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
          <h2 className="text-lg font-medium text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to your account to continue</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Log in
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Sign up
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing you agree to CreatorIQ's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
