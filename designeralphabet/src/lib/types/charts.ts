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
