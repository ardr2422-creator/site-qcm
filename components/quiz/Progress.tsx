type Props = {
  /** Numéro de la question affichée (à partir de 1). */
  current: number;
  total: number;
};

/** Barre de progression en segments : « Devinette 2 sur 5 ». */
export function Progress({ current, total }: Props) {
  return (
    <div
      role="progressbar"
      aria-label="Progression dans le jeu"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Devinette ${current} sur ${total}`}
    >
      <div className="flex items-baseline justify-between">
        <p className="surtitre">Devinette</p>
        <p className="font-serif text-lg font-semibold text-nuit-900" aria-hidden="true">
          {current}
          <span className="text-nuit-600"> / {total}</span>
        </p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const state =
            step < current
              ? "bg-bleu-600"
              : step === current
                ? "bg-ciel-500"
                : "bg-givre-300";
          return (
            <span
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${state}`}
            />
          );
        })}
      </div>
    </div>
  );
}
