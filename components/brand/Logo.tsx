import Image from "next/image";

/**
 * Logo « Le royaume des glaces d'Argenteuil » (fichier fourni, dans public/logo/).
 * Le fichier SVG n'est chargé qu'une fois puis mis en cache par le navigateur.
 */

/** Dimensions du dessin (viewBox du fichier), pour réserver la place. */
const WIDTH = 1128;
const HEIGHT = 484;

type Props = {
  className?: string;
  /** "couleur" sur fond clair, "blanc" sur fond foncé. */
  variant?: "couleur" | "blanc";
  /** Texte lu par les lecteurs d'écran ("" = décoratif, déjà dit à côté). */
  title?: string;
  /** À activer quand le logo est le premier élément visible de la page. */
  priority?: boolean;
};

export function Logo({
  className,
  variant = "couleur",
  title = "Le royaume des glaces d’Argenteuil",
  priority = false,
}: Props) {
  return (
    <Image
      src={
        variant === "blanc"
          ? "/logo/royaume-des-glaces-blanc.svg"
          : "/logo/royaume-des-glaces.svg"
      }
      alt={title}
      width={WIDTH}
      height={HEIGHT}
      unoptimized
      priority={priority}
      className={className}
    />
  );
}
