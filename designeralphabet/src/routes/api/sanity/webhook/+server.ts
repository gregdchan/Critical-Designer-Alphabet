import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import crypto from 'crypto';

const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

/**
 * Sanity Webhook Handler
 *
 * This endpoint receives webhooks from Sanity when content is published.
 * It syncs question updates (including recommended_dashboards) to Supabase.
 *
 * Setup in Sanity:
 * 1. Go to Manage > API > Webhooks
 * 2. Create new webhook with URL: https://your-domain.com/api/sanity/webhook
 * 3. Set secret and add it to your .env as SANITY_WEBHOOK_SECRET
 * 4. Filter for document type: question
 * 5. Enable on: create, update
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify webhook signature if secret is configured
		if (SANITY_WEBHOOK_SECRET) {
			const signature = request.headers.get('sanity-webhook-signature');
			if (!signature) {
				console.error('[Sanity Webhook] Missing signature header');
				return json({ success: false, error: 'Missing signature' }, { status: 401 });
			}

			const body = await request.text();
			const hash = crypto
				.createHmac('sha256', SANITY_WEBHOOK_SECRET)
				.update(body)
				.digest('hex');

			if (signature !== hash) {
				console.error('[Sanity Webhook] Invalid signature');
				return json({ success: false, error: 'Invalid signature' }, { status: 401 });
			}

			// Parse body after verification
			const payload = JSON.parse(body);
			return await handleWebhook(payload);
		} else {
			// No secret configured, process without verification (dev mode)
			console.warn('[Sanity Webhook] No secret configured, processing without verification');
			const payload = await request.json();
			return await handleWebhook(payload);
		}
	} catch (error: any) {
		console.error('[Sanity Webhook] Error:', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};

async function handleWebhook(payload: any) {
	const { _type, _id, _rev } = payload;

	console.log('[Sanity Webhook] Received:', { type: _type, id: _id, rev: _rev });

	// Only handle question documents
	if (_type !== 'question') {
		return json({ success: true, message: 'Ignored non-question document' });
	}

	// Handle question deletion
	if (payload._deleted) {
		console.log('[Sanity Webhook] Question deleted:', _id);

		const sessionCode = payload.sessionCode || payload.session_code;
		const questionText = payload.text;

		if (sessionCode && questionText) {
			// Delete the question from Supabase
			const { error } = await supabaseAdmin
				.from('questions')
				.delete()
				.eq('room_code', sessionCode)
				.eq('text', questionText);

			if (error) {
				console.error('[Sanity Webhook] Failed to delete question:', error);
				return json({ success: false, error: error.message }, { status: 500 });
			}

			console.log('[Sanity Webhook] Question deleted from Supabase');
			return json({ success: true, message: 'Question deleted' });
		}

		return json({ success: true, message: 'Question deletion noted (no session code)' });
	}

	// Extract question data from payload
	const question = payload;
	const sessionCode = question.sessionCode || question.session_code;

	if (!sessionCode) {
		console.error('[Sanity Webhook] No session code found in question');
		return json({ success: false, error: 'Session code required' }, { status: 400 });
	}

	// Map Sanity question to Supabase format
	const questionData = {
		room_code: sessionCode,
		section: question.section || question.text || 'Untitled Question',
		text: question.text || question.section || '',
		lens: question.lens || null,
		response_type: question.responseType || question.response_type || 'written',
		phase_key: question.phaseKey || question.phase_key || null,
		enable_voting: question.enableVoting ?? question.enable_voting ?? false,
		map_type: question.mapType || question.map_type || null,
		config: question.config || {},
		order_index: question.orderIndex ?? question.order_index ?? 0,
		recommended_dashboards: Array.isArray(question.recommendedDashboards)
			? question.recommendedDashboards
			: (question.recommended_dashboards || [])
	};

	// Check if question already exists in Supabase
	const { data: existing } = await supabaseAdmin
		.from('questions')
		.select('id')
		.eq('room_code', sessionCode)
		.eq('text', questionData.text)
		.maybeSingle();

	if (existing) {
		// Update existing question
		console.log('[Sanity Webhook] Updating question:', existing.id);
		const { error } = await supabaseAdmin
			.from('questions')
			.update(questionData)
			.eq('id', existing.id);

		if (error) {
			console.error('[Sanity Webhook] Update failed:', error);
			return json({ success: false, error: error.message }, { status: 500 });
		}

		console.log('[Sanity Webhook] Question updated successfully');
		return json({
			success: true,
			message: 'Question updated',
			questionId: existing.id
		});
	} else {
		// Insert new question
		console.log('[Sanity Webhook] Creating new question');
		const { data, error } = await supabaseAdmin
			.from('questions')
			.insert(questionData)
			.select('id')
			.single();

		if (error) {
			console.error('[Sanity Webhook] Insert failed:', error);
			return json({ success: false, error: error.message }, { status: 500 });
		}

		console.log('[Sanity Webhook] Question created successfully');
		return json({
			success: true,
			message: 'Question created',
			questionId: data.id
		});
	}
}
