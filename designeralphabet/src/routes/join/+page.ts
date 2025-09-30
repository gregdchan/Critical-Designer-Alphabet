import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  return {
    code: url.searchParams.get('code') || ''
  };
};