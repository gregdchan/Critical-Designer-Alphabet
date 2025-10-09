/**
 * Sanity utilities for fetching static session metadata and questions
 */

import client from '$lib/sanity';
import type { Question, QuestionOption } from '$lib/types/charts';

export interface SanitySessionData {
	code: string;
	title?: string;
	status?: string;
	phase?: string;
	questions: Question[];
}

/**
 * Fetch session data from Sanity (static metadata)
 * This is used for questions, labels, and chart configuration
 */
export async function getSanitySessionData(code: string): Promise<SanitySessionData | null> {
	try {
		// Note: This is a placeholder query - adjust based on your Sanity schema
		const query = `*[_type == "session" && code == $code][0]{
			code,
			title,
			status,
			phase,
			"questions": questions[]->{
				_id,
				title,
				section,
				type,
				"options": options[]{
					"id": _key,
					label,
					color
				}
			}
		}`;

		const data = await client.fetch(query, { code });

		if (!data) {
			return null;
		}

		return {
			code: data.code,
			title: data.title,
			status: data.status,
			phase: data.phase,
			questions: (data.questions || []).map((q: any) => ({
				id: q._id,
				title: q.title,
				section: q.section,
				type: q.type,
				options: q.options || []
			}))
		};
	} catch (error) {
		console.error('Error fetching Sanity session data:', error);
		return null;
	}
}

/**
 * Fetch template data for session configuration
 */
export async function getSanityTemplate(templateSlug: string) {
	try {
		const query = `*[_type == "template" && slug.current == $slug][0]{
			title,
			description,
			"questions": questions[]->{
				_id,
				title,
				section,
				type,
				"options": options[]{
					"id": _key,
					label,
					color
				}
			},
			sections,
			dashboards,
			phases
		}`;

		return await client.fetch(query, { slug: templateSlug });
	} catch (error) {
		console.error('Error fetching Sanity template:', error);
		return null;
	}
}

/**
 * Get chart color mapping from design tokens
 */
export function getChartColor(index: number): string {
	const colors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'var(--chart-6)',
		'var(--chart-7)',
		'var(--chart-8)'
	];
	return colors[index % colors.length];
}

/**
 * Cache for Sanity data to reduce API calls
 */
const sanityCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSanityData<T>(
	key: string,
	fetcher: () => Promise<T>
): Promise<T | null> {
	const cached = sanityCache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data as T;
	}

	const data = await fetcher();
	if (data) {
		sanityCache.set(key, { data, timestamp: Date.now() });
	}
	return data;
}
