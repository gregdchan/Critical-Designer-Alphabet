export type ChartPoint = { id: string; label: string; value: number };
export type ChartSeries = { id: string; points: ChartPoint[] };
export type ChartData = {
	title?: string;
	series: ChartSeries[];
	total?: number;
	meta?: Record<string, unknown>;
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
