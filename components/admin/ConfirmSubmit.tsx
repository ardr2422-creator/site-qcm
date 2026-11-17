"use client";

import type { ReactNode } from "react";

type Props = {
  /** Question posée avant l'envoi du formulaire. */
  message: string;
  className?: string;
  children: ReactNode;
};

/** Bouton d'envoi qui demande confirmation (actions irréversibles). */
export function ConfirmSubmit({ message, className, children }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
