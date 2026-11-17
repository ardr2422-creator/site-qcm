import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet";
type Size = "lg" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "text-center leading-tight transition-colors duration-150 select-none " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-bleu-700 text-white shadow-sm hover:bg-bleu-800 active:bg-bleu-900",
  secondary:
    "border-2 border-bleu-700 bg-givre-50 text-bleu-800 hover:bg-glace-100 active:bg-glace-200",
  quiet:
    "text-ciel-600 underline decoration-ciel-200 decoration-2 underline-offset-4 hover:text-ciel-700 hover:decoration-ciel-500",
};

const sizes: Record<Size, string> = {
  lg: "min-h-14 px-8 py-3 text-lg",
  md: "min-h-12 px-6 py-2.5 text-base",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "lg",
  extra = "",
): string {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/** Flèche discrète pour les boutons « suivant ». */
export function ArrowRight() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
