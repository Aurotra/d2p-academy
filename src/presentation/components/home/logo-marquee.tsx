import Link from "next/link";

import { PARTNER_LOGOS, type PartnerLogo } from "@/shared/constants/partner-logos";

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Repeat until one half of the track is wider than a typical desktop viewport. */
function buildSeamlessLoop(logos: PartnerLogo[]): PartnerLogo[] {
  if (logos.length === 0) {
    return [];
  }

  const half: PartnerLogo[] = [];
  while (half.length < 8) {
    half.push(...logos);
  }

  return [...half, ...half];
}

function LogoMark({
  logo,
  interactive,
}: {
  logo: PartnerLogo;
  interactive: boolean;
}) {
  const image = (
    // SVG/PNG wordmarks; next/image blocks SVG by default.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt=""
      className="h-auto max-h-10 w-auto max-w-[8.75rem] object-contain grayscale opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 sm:max-h-12 sm:max-w-[10.5rem]"
      draggable={false}
    />
  );

  const className =
    "group inline-flex h-16 shrink-0 items-center justify-center px-6 sm:h-[4.5rem] sm:px-8";

  if (!interactive || !logo.url) {
    return (
      <span className={className} title={logo.name}>
        {image}
      </span>
    );
  }

  if (isExternalUrl(logo.url)) {
    return (
      <a
        href={logo.url}
        className={`${className} rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40`}
        target="_blank"
        rel="noreferrer"
        title={logo.name}
        aria-label={logo.name}
      >
        {image}
      </a>
    );
  }

  return (
    <Link
      href={logo.url}
      className={`${className} rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40`}
      title={logo.name}
      aria-label={logo.name}
    >
      {image}
    </Link>
  );
}

export function LogoMarquee({ logos = PARTNER_LOGOS }: { logos?: PartnerLogo[] }) {
  if (logos.length === 0) {
    return null;
  }

  const loop = buildSeamlessLoop(logos);
  const halfLength = loop.length / 2;
  const linkedSrcs = new Set<string>();

  return (
    <section
      aria-labelledby="partner-logos-heading"
      className="border-t border-border-surface bg-surface-base py-10 sm:py-12"
    >
      <h2
        id="partner-logos-heading"
        className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-secondary"
      >
        İş birliklerimiz
      </h2>

      <ul className="sr-only">
        {logos.map((logo) => (
          <li key={logo.name}>{logo.name}</li>
        ))}
      </ul>

      <div className="relative mt-5 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface-base to-transparent sm:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface-base to-transparent sm:w-24"
        />

        <ul className="logo-marquee-track flex w-max items-center motion-reduce:hidden">
          {loop.map((logo, index) => {
            const inSecondHalf = index >= halfLength;
            const interactive = !inSecondHalf && Boolean(logo.url) && !linkedSrcs.has(logo.src);
            if (interactive) {
              linkedSrcs.add(logo.src);
            }

            return (
              <li key={`${logo.src}-${index}`} aria-hidden={inSecondHalf || undefined}>
                <LogoMark
                  logo={interactive ? logo : { ...logo, url: undefined }}
                  interactive={interactive}
                />
              </li>
            );
          })}
        </ul>

        <ul className="hidden flex-wrap items-center justify-center gap-2 px-4 motion-reduce:flex">
          {logos.map((logo) => (
            <li key={logo.src}>
              <LogoMark logo={logo} interactive={Boolean(logo.url)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
