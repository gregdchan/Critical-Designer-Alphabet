export interface ChartProps {
	roomCode: string;
	theme?: 'dark' | 'light';
	width?: number;
	height?: number;
}

export interface BubbleDatum {
	id: string;
	lens: string;
	text: string;
	votes: number;
	cardsCount: number;
	x?: number;
	y?: number;
	radius?: number;
}

export interface RiskDatum {
	id: string;
	risk: string;
	impact: number;
	likelihood: number;
	votes: number;
	text?: string;
}

export interface MaturityData {
	level: number; // 1-5
	stage: string;
	description: string;
	progress: number; // 0-1
}

export interface HeatmapCell {
	row: string;
	col: string;
	value: number;
	label?: string;
}

export interface ParticipationPoint {
	timestamp: Date;
	submissions: number;
	fairnessMultiplier: number;
}

export interface EthicsAxis {
	name: string;
	value: number; // 0-100
	color: string;
}

export interface CultureKeyword {
	word: string;
	frequency: number;
	angle: number;
	radius: number;
}

export interface TimelineNode {
	id: string;
	phase: string;
	status: 'pending' | 'active' | 'completed';
	timestamp?: Date;
	summary?: string;
}

export interface WordNode {
	id: string;
	word: string;
	frequency: number;
	lens: string;
	x?: number;
	y?: number;
}

export interface WordLink {
	source: string;
	target: string;
	strength: number;
}

export interface ChartMargins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ChartDimensions {
	width: number;
	height: number;
	innerWidth: number;
	innerHeight: number;
	margins: ChartMargins;
}

// ===== Unified Chart Data Types =====
// For consistent rendering across facilitator and presentation pages

export type ChartPoint = {
	label: string;
	value: number;
	color?: string;
	metadata?: Record<string, unknown>;
};

export type ChartSeries = {
	id: string;
	label?: string;
	points: ChartPoint[];
	color?: string;
};

export type ChartData = {
	title: string;
	series: ChartSeries[];
	meta?: Record<string, unknown>;
};

export type QuestionOption = {
	id: string;
	label: string;
	color?: string;
};

export type Question = {
	id: string;
	title: string;
	section?: string;
	type?: 'multiple_choice' | 'scale' | 'text' | 'landscape';
	options?: QuestionOption[];
	metadata?: Record<string, unknown>;
};

export type Response = {
	id: string;
	session_code: string;
	question_id: string;
	participant_id: string;
	response_text?: string;
	option_id?: string;
	scale_value?: number;
	landscape_x?: number;
	landscape_y?: number;
	votes?: number;
	created_at: string;
};

export type SessionState = {
	code: string;
	status?: string;
	phase?: string;
	questions: Question[];
	responses: Response[];
	responseCounts: Record<string, number>; // question_id:option_id -> count
	updatedAt: number;
};

// Chart-specific data structures
export type WordCloudData = {
	text: string;
	value: number;
	color?: string;
}[];

export type LandscapePoint = {
	x: number;
	y: number;
	label: string;
	color?: string;
	metadata?: Record<string, unknown>;
};

export type RoadmapItem = {
	label: string;
	category: string;
	position: number;
	color?: string;
};

export type HeatmapData = {
	x: number;
	y: number;
	value: number;
	label?: string;
	color?: string;
}[];
