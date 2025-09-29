import type { PageLoad } from './$types';
import { fetchPage } from '$lib/pages';

export const load: PageLoad = async () => {
  try {
    const page = await fetchPage('about');
    return { page };
  } catch (error) {
    console.error('Failed to load about page from Sanity', error);
    return { page: null, error: 'Unable to load About content from Sanity.' };
  }
};
