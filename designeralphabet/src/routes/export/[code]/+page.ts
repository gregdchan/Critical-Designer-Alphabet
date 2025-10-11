import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const code = (params.code || '').toUpperCase();
  try {
    const res = await fetch(`/api/dashboard/${encodeURIComponent(code)}`);
    let json: any = { success: false };
    try {
      json = await res.json();
    } catch {}
    return { code, api: json };
  } catch {
    return { code, api: { success: false, error: 'Failed to load session' } };
  }
};

// Render this page on the client only to avoid SSR errors when data is missing
export const ssr = false;
export const csr = true;
