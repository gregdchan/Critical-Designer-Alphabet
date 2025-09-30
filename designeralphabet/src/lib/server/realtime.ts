/*
 * Realtime coordination utilities shared between REST endpoints and the WebSocket handler.
 */

export type BroadcastPayload = Record<string, any> & { type: string };

export type PresencePayload = {
	participantId?: number | null;
	name: string;
	role: 'facilitator' | 'participant';
	color: string;
};

type RoomState = {
	sockets: Set<WebSocket>;
	presence: Map<WebSocket, PresencePayload>;
};

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomCode: string): RoomState {
	let room = rooms.get(roomCode);
	if (!room) {
		room = {
			sockets: new Set<WebSocket>(),
			presence: new Map<WebSocket, PresencePayload>()
		};
		rooms.set(roomCode, room);
	}
	return room;
}

export function registerSocket(roomCode: string, socket: WebSocket) {
	const room = getOrCreateRoom(roomCode);
	room.sockets.add(socket);
}

export function unregisterSocket(roomCode: string, socket: WebSocket) {
	const room = rooms.get(roomCode);
	if (!room) return;
	room.sockets.delete(socket);
	room.presence.delete(socket);
	if (room.sockets.size === 0) {
		rooms.delete(roomCode);
	} else {
		broadcastPresence(roomCode);
	}
}

export function setPresence(roomCode: string, socket: WebSocket, payload: PresencePayload) {
	const room = getOrCreateRoom(roomCode);
	room.presence.set(socket, payload);
	broadcastPresence(roomCode);
}

export function broadcastPresence(roomCode: string) {
	const room = rooms.get(roomCode);
	if (!room) return;
	const participants = Array.from(room.presence.values()).map((presence) => ({
		participantId: presence.participantId ?? null,
		name: presence.name,
		role: presence.role,
		color: presence.color
	}));
	broadcast(roomCode, { type: 'PRESENCE', participants });
}

export function broadcast(roomCode: string, payload: BroadcastPayload) {
	const room = rooms.get(roomCode);
	if (!room) return;
	const message = JSON.stringify(payload);
	for (const socket of room.sockets) {
		try {
			socket.send(message);
		} catch (error) {
			console.error('Failed to broadcast message', error);
		}
	}
}

export function listConnected(roomCode: string) {
	const room = rooms.get(roomCode);
	if (!room) return [] as PresencePayload[];
	return Array.from(room.presence.values());
}
