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
  summary,
  cta,
  sections[]{
    _key,
    title,
    eyebrow,
    accentColor,
    body,
    media{
      "url": asset->url,
      "alt": coalesce(altText, asset->originalFilename)
    }
  },
  localizedHeroSubtitle,
  localizedSummary
}`;

function toPlainText(blocks: any): string | undefined {
	if (!Array.isArray(blocks)) return undefined;
	const text = blocks
		.map((block: any) => {
			if (typeof block === 'string') return block;
			if (!Array.isArray(block?.children)) return '';
			return block.children
				.filter((child: any) => typeof child.text === 'string')
				.map((child: any) => child.text)
				.join('');
		})
		.join('\n')
		.trim();
	return text.length ? text : undefined;
}

export async function fetchPage(slug: string): Promise<PageContent | null> {
	const raw = await client.fetch(pageQuery, { slug });
	if (!raw) return null;

	const page: PageContent = {
		_id: raw._id,
		title: raw.title,
		slug: raw.slug,
		eyebrow: raw.eyebrow,
		heroTitle: raw.heroTitle,
		heroSubtitle: raw.heroSubtitle,
		summaryText: toPlainText(raw.summary),
		cta: raw.cta ?? null,
		sections: Array.isArray(raw.sections)
			? raw.sections.map((section: any) => ({
					_key: section._key,
					title: section.title,
					eyebrow: section.eyebrow,
					accentColor: section.accentColor,
					bodyText: toPlainText(section.body),
					image: section.media?.url
						? {
								url: section.media.url,
								alt: section.media.alt ?? undefined
							}
						: null
				}))
			: [],
		localizedHeroSubtitle: raw.localizedHeroSubtitle ?? null,
		localizedSummary: raw.localizedSummary ?? null
	};

	return page;
}
