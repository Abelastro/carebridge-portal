"use client";

import { useFormState } from "react-dom";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Work email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
      </div>
      <div>
        <label htmlFor="passphrase" className="mb-1.5 block text-sm font-medium text-ink">
          Passphrase
        </label>
        <input id="passphrase" name="passphrase" type="password" autoComplete="current-password"
          required minLength={8}
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
      </div>
      {state.error ? <p role="alert" className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
        Sign in
      </button>
    </form>
  );
}
