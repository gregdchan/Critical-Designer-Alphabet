export type ChartPoint = {
	id?: string;
	label: string;
	value: number;
	color?: string;
	metadata?: Record<string, unknown>;
};
export type ChartSeries = { id: string; label?: string; points: ChartPoint[] };
export type ChartData = {
	title?: string;
	series: ChartSeries[];
	total?: number;
	meta?: Record<string, unknown>;
};

export type QuestionOption = {
	id: string;
	label: string;
	color?: string;
};

export type Question = {
	id: string;
	title?: string;
	section?: string;
	type?: string;
	options?: QuestionOption[];
};

// Chart dimension and layout types
export type ChartMargins = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type ChartDimensions = {
	width: number;
	height: number;
	innerWidth: number;
	innerHeight: number;
	margins: ChartMargins;
};

// Chart-specific data types
export type BubbleDatum = {
	id: string;
	lens: string;
	text: string;
	votes: number;
	cardsCount: number;
	count: number;
	color: string;
	radius?: number;
	x?: number;
	y?: number;
};

export type RiskDatum = {
	id: string;
	risk: string;
	impact: number;
	likelihood: number;
	votes: number;
	text: string;
};

export type ParticipationPoint = {
	timestamp: Date;
	submissions: number;
	fairnessMultiplier?: number;
};

export type WordCloudData = ChartPoint[];
export type LandscapePoint = ChartPoint;
export type RoadmapItem = ChartPoint;
export type HeatmapData = ChartPoint[];
