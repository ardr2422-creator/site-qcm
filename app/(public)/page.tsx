import { Logo } from "@/components/brand/Logo";
import { FrostFrieze, Ornament } from "@/components/illustrations/Winter";
import { HomeCta } from "@/components/quiz/HomeCta";
import { site } from "@/data/site";
import { typo } from "@/lib/typo";

export default function HomePage() {
  return (
    <article className="carte my-auto animate-fade-up px-6 pb-9 pt-8 text-center sm:px-10 sm:pb-11 sm:pt-10">
      {/* Le logo sert de titre : son texte est lu par les lecteurs d'écran. */}
      <h1>
        <Logo
          priority
          title={typo(site.title)}
          className="mx-auto w-full max-w-[20rem] sm:max-w-[24rem]"
        />
      </h1>

      <p className="surtitre mt-7">{typo(site.eyebrow)}</p>
      <p className="mt-2 text-balance font-serif text-xl italic leading-snug text-ciel-600 sm:text-2xl">
        {typo(site.tagline)}
      </p>

      <Ornament className="mx-auto my-6 h-3 w-28" />

      <p className="mx-auto max-w-md text-pretty text-lg text-nuit-700">
        {typo(site.intro)}
      </p>

      <div className="mt-8">
        <HomeCta />
      </div>

      <FrostFrieze count={5} className="mx-auto mt-9 w-full max-w-[12rem]" />
    </article>
  );
}
