"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="font-semibold text-nuit-900">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "erreur-connexion" : undefined}
          className="mt-2 block w-full rounded-xl border-2 border-nuit-500 bg-white px-4 py-3 text-nuit-900 focus:border-bleu-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ciel-500"
        />
      </div>

      {state.error ? (
        <p
          id="erreur-connexion"
          role="alert"
          className="rounded-xl border border-erreur-600 bg-erreur-50 px-4 py-3 text-[0.9375rem] font-medium text-erreur-800"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="md" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
