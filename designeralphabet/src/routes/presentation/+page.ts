import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		sessionCode: url.searchParams.get('code') ?? ''
	};
};
