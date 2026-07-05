"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/lib/admin-actions";

export default function LoginForm({ next }) {
  const [state, formAction, pending] = useActionState(loginAdmin, null);

  return (
    <form action={formAction} className="program-form">
      {state?.message ? <p className="form-error">{state.message}</p> : null}
      <input type="hidden" name="next" value={next} />
      <label>
        Username
        <input name="username" type="text" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
