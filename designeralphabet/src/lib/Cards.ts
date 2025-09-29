import client from '$lib/sanity';

export type ReadingListItem = {
  title: string;
  url?: string;
};

export type LocalizedText = {
  en?: string;
  es?: string;
  fr?: string;
  pt?: string;
  [key: string]: string | undefined;
};

export type StyleMeta = {
  icon?: string;
  neonColor?: string;
  animationStyle?: string;
};

export type Card = {
  _id: string;
  title: string;
  slug?: { current: string } | string;
  letter?: string;
  category?: string;
  color?: string;
  description?: string;
  prompt?: string;
  tags?: string[];
  sources?: string[];
  readingList?: ReadingListItem[];
  exampleUse?: string[];
  cardID: string;
  postId?: string;
  styleMeta?: StyleMeta;
  description_i18n?: LocalizedText;
  prompt_i18n?: LocalizedText;
};

const cardsQuery = `*[_type == "cards"]|order(letter asc){
  _id,
  title,
  name,
  slug,
  letter,
  color,
  description,
  prompt,
  tags,
  sources,
  readingList[]{ title, url },
  exampleUse,
  cardID,
  postId,
  styleMeta,
  description_i18n,
  prompt_i18n,
  "category": coalesce(category, type),
  "cardIDLegacy": coalesce(CardID, slug.current)
}`;

export async function fetchCards(): Promise<Card[]> {
  const raw = await client.fetch(cardsQuery);
  return raw.map((card: any) => {
    const {
      _id,
      title,
      name,
      slug,
      letter,
      category,
      description,
      color,
      prompt,
      tags,
      sources,
      readingList,
      exampleUse,
      styleMeta,
      description_i18n,
      prompt_i18n,
      cardID,
      cardIDLegacy,
      postId
    } = card;

    return {
      _id,
      title: title ?? name ?? 'Untitled Card',
      slug,
      letter,
      category,
      color: styleMeta?.neonColor ?? color,
      description,
      prompt,
      tags,
      sources,
      readingList,
      exampleUse,
      styleMeta,
      description_i18n,
      prompt_i18n,
      postId,
      cardID: cardID ?? cardIDLegacy ?? slug?.current ?? _id
    } satisfies Card;
  });
}
