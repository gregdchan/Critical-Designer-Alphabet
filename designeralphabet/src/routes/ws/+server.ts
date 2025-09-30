import type { RequestHandler } from './$types';
import { registerSocket, unregisterSocket, setPresence, broadcast } from '$lib/server/realtime';
import {
	addResponse,
	addTimelineItem,
	addQuestion,
	addChatMessage,
	updateSessionStatus,
	voteResponse,
	updateScore
} from '$lib/server/workshop';

function ensureRoom(code: string | undefined | null): string {
	if (!code) {
		throw new Error('Room code is required');
	}
	return code;
}

export const GET: RequestHandler = async ({ request }) => {
	const upgrade = request.headers.get('upgrade');
	if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
		return new Response('Expected a websocket upgrade request', { status: 400 });
	}

	const WebSocketPair = (globalThis as any).WebSocketPair;
	if (!WebSocketPair) {
		console.error('WebSocketPair is not available in this environment');
		return new Response('WebSockets not supported', { status: 500 });
	}

	const pair = new WebSocketPair();
	const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
	(server as any).accept?.();

	let roomCode: string | null = null;

	server.addEventListener('message', async (event) => {
		try {
			const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
			const type = data?.type;

			switch (type) {
				case 'HELLO': {
					roomCode = ensureRoom(data.code);
					registerSocket(roomCode, server);
					setPresence(roomCode, server, {
						participantId: data.participantId ?? null,
						name: data.name ?? 'Guest',
						role: data.role ?? 'participant',
						color: data.color ?? '#06b6d4'
					});
					server.send(JSON.stringify({ type: 'ACK', ack: 'HELLO', code: roomCode }));
					break;
				}
				case 'ADD_RESPONSE': {
					const code = ensureRoom(data.code ?? roomCode);
					await addResponse({
						code,
						questionId: String(data.questionId),
						participantId: data.participantId ? String(data.participantId) : null,
						text: data.text,
						cards: Array.isArray(data.cards) ? data.cards : []
					});
					break;
				}
				case 'CAST_VOTE': {
					await voteResponse({
						responseId: String(data.responseId),
						delta: Number(data.delta ?? 0)
					});
					break;
				}
				case 'ADD_TIMELINE': {
					const code = ensureRoom(data.code ?? roomCode);
					await addTimelineItem({
						code,
						label: data.label,
						itemText: data.itemText,
						owner: data.owner,
						metric: data.metric,
						riskNote: data.riskNote
					});
					break;
				}
				case 'ADD_QUESTION': {
					const code = ensureRoom(data.code ?? roomCode);
					await addQuestion({ code, section: data.section, text: data.text });
					break;
				}
				case 'SEND_CHAT': {
					const code = ensureRoom(data.code ?? roomCode);
					await addChatMessage({
						code,
						participantId: data.participantId ?? null,
						message: data.message
					});
					break;
				}
				case 'CHANGE_STEP': {
					const code = ensureRoom(data.code ?? roomCode);
					await updateSessionStatus(code, data.status);
					break;
				}
				case 'SYNC_TIMER': {
					const code = ensureRoom(data.code ?? roomCode);
					broadcast(code, {
						type: 'TIMER_SYNC',
						remaining: data.remaining,
						state: data.state
					});
					break;
				}
				case 'SCORE_UPDATE': {
					await updateScore({
						participantId: String(data.participantId),
						delta: Number(data.delta ?? 0),
						badge: data.badge
					});
					break;
				}
				default: {
					server.send(
						JSON.stringify({
							type: 'ERROR',
							error: `Unknown message type: ${type}`
						})
					);
				}
			}
		} catch (error) {
			console.error('WebSocket message error', error);
			server.send(JSON.stringify({ type: 'ERROR', error: (error as Error).message }));
		}
	});

	server.addEventListener('close', () => {
		if (roomCode) {
			unregisterSocket(roomCode, server);
		}
	});

	server.addEventListener('error', (event) => {
		console.error('WebSocket error', event);
		if (roomCode) {
			unregisterSocket(roomCode, server);
		}
	});

	return new Response(null, {
		status: 101,
		webSocket: client
	} as any);
};
