/**
 * Workshop Type Definitions
 */

export type Question = {
	id: string;
	room_code: string;
	text: string;
	response_type?: string;
	config?: Record<string, unknown>;
	recommended_dashboards?: string[];
	phase_key?: string | null;
	order_index?: number | null;
	enable_voting?: boolean;
	lens?: string | null;
	created_at?: string;
};

export type Participant = {
	id: string;
	room_code: string;
	name: string;
	role?: string;
	color?: string;
	email?: string | null;
	device_id?: string | null;
	created_at: string;
};

export type Response = {
	id: string;
	room_code: string;
	question_id: string;
	participant_id: string | null;
	text: string;
	metadata?: any;
	cards?: string[];
	votes?: number;
	created_at?: string;
};

export type Session = {
	id: string;
	room_code: string;
	title: string;
	description?: string;
	status?: 'planned' | 'live' | 'done';
	created_at: string;
	updated_at?: string;
};

export type Phase = {
	id: string;
	room_code: string;
	phase_key: string;
	name: string;
	description?: string;
	duration_minutes?: number;
	status?: 'pending' | 'active' | 'completed';
	started_at?: string | null;
	completed_at?: string | null;
	order_index?: number;
	created_at: string;
};
