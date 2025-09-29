import client from '$lib/sanity';

export type PageSection = {
  _key: string;
  title?: string;
  eyebrow?: string;
  bodyText?: string;
  accentColor?: string;
  image?: {
    url: string;
    alt?: string;
  } | null;
};

export type PageContent = {
  _id: string;
  title: string;
  slug?: string;
  eyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  summaryText?: string;
  cta?: {
    label?: string;
    href?: string;
  } | null;
  sections?: PageSection[];
  localizedHeroSubtitle?: Record<string, string | undefined> | null;
  localizedSummary?: Record<string, string | undefined> | null;
};

const pageQuery = `*[_type == "pages" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  eyebrow,
  heroTitle,
  heroSubtitle,
  summaryText: select(defined(summary) => pt::text(summary), null),
  cta,
  sections[]{
    _key,
    title,
    eyebrow,
    accentColor,
    bodyText: select(defined(body) => pt::text(body), null),
    "image": select(
      defined(media) => {
        "url": media.asset->url,
        "alt": coalesce(media.altText, media.asset->originalFilename)
      },
      null
    )
  },
  localizedHeroSubtitle,
  localizedSummary
}`;

export async function fetchPage(slug: string): Promise<PageContent | null> {
  const page = await client.fetch(pageQuery, { slug });
  if (!page) return null;
  return page satisfies PageContent;
}
