import client from '$lib/sanity';

export interface Card {
  name: string;
  cardID: string
  type: string;
  color: string;
  description: string;
  prompt: string;
  _id: string;
}

export async function fetchCards(): Promise<Card[]> {
  const query = '*[_type == "cards"]';
  const cards = await client.fetch(query);
  return cards;
}