export type ChartPoint = { id: string; label: string; value: number };
export type ChartSeries = { id: string; points: ChartPoint[] };
export type ChartData = {
  title?: string;
  series: ChartSeries[];
  total?: number;
  meta?: Record<string, unknown>;
};

