import { FrostFrieze, Ornament, WinterHero } from "@/components/illustrations/Winter";
import { HomeCta } from "@/components/quiz/HomeCta";
import { site } from "@/data/site";
import { typo } from "@/lib/typo";

export default function HomePage() {
  return (
    <article className="carte my-auto animate-fade-up px-6 pb-9 pt-8 text-center sm:px-10 sm:pb-11 sm:pt-10">
      <WinterHero className="mx-auto w-full max-w-[17rem]" />

      <p className="surtitre mt-6">{typo(site.eyebrow)}</p>
      <h1 className="mt-3 text-balance font-serif text-[2.125rem] font-semibold leading-[1.12] tracking-tight text-nuit-900 sm:text-5xl">
        {typo(site.title)}
      </h1>
      <p className="mt-4 text-balance font-serif text-xl italic leading-snug text-ciel-600 sm:text-2xl">
        {typo(site.tagline)}
      </p>

      <Ornament className="mx-auto my-6 h-3 w-28" />

      <p className="mx-auto max-w-md text-pretty text-lg text-nuit-700">
        {typo(site.intro)}
      </p>

      <div className="mt-8">
        <HomeCta />
      </div>

      <FrostFrieze className="mx-auto mt-9 max-w-[13rem]" />
    </article>
  );
}
