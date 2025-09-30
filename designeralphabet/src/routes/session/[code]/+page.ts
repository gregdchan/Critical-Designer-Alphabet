import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	return {
		sessionCode: params.code ?? '',
		role: url.searchParams.get('role') ?? 'participant'
	};
};
