import { createClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION ?? '2024-09-01';

if (!projectId || !dataset) {
  throw new Error('Missing Sanity configuration. Set VITE_SANITY_PROJECT_ID and VITE_SANITY_DATASET.');
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true
});

export default client;
