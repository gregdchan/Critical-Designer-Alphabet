import type { ChartData, ChartPoint } from '$lib/types/charts';

type AnyRow = Record<string, any>;

// Tally responses by option for a question; robust to differing payloads.
export function tallyByOption(rows: AnyRow[], title?: string): ChartData {
  const points: ChartPoint[] = [];
  const counts = new Map<string, { label: string; count: number }>();

  for (const row of rows ?? []) {
    // Prefer explicit option_id/option_label
    const qid = row?.question_id;
    if (!qid) continue;

    const add = (id: string, label: string) => {
      if (!id) return;
      const entry = counts.get(id) ?? { label: label || id, count: 0 };
      entry.count += 1;
      counts.set(id, entry);
    };

    if (row.option_id) {
      add(String(row.option_id), String(row.option_label ?? row.option_id));
      continue;
    }

    // Fallbacks: try to parse value (string | array | number)
    let v = row.value;
    try {
      if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{') || v.startsWith('"'))) {
        v = JSON.parse(v);
      }
    } catch {
      // treat as raw string
    }
    if (Array.isArray(v)) {
      v.forEach((it) => add(String(it), String(it)));
    } else if (v != null) {
      add(String(v), String(v));
    }
  }

  for (const [id, entry] of counts.entries()) {
    const value = Number(entry.count);
    if (Number.isFinite(value) && value >= 0) {
      points.push({ id, label: entry.label, value });
    }
  }

  // Stable ordering: descending value then label
  points.sort((a, b) => (b.value - a.value) || a.label.localeCompare(b.label));

  const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
  return {
    title,
    series: [{ id: 'tally', points }],
    total,
    meta: { kind: 'tallyByOption' }
  };
}

