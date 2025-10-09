import type { Question } from '$lib/realtime';
import type { Response } from '$lib/gamification';
import type { ChartData, ChartPoint } from '$lib/types/charts';

export type InferredQuestionType =
  | 'multipleChoice'
  | 'rating'
  | 'boolean'
  | 'voting'
  | 'openText';

function isTruthyBooleanWord(s: string) {
  const v = s.trim().toLowerCase();
  return v === 'yes' || v === 'true';
}

function isFalseyBooleanWord(s: string) {
  const v = s.trim().toLowerCase();
  return v === 'no' || v === 'false';
}

function looksBoolean(values: string[]) {
  if (values.length === 0) return false;
  let valid = 0;
  for (const v of values) {
    if (isTruthyBooleanWord(v) || isFalseyBooleanWord(v)) valid += 1;
  }
  return valid > 0 && valid === values.length;
}

function looksNumeric(values: string[]) {
  if (values.length === 0) return false;
  let numeric = 0;
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) numeric += 1;
  }
  return numeric > 0 && numeric >= Math.ceil(values.length * 0.6);
}

function hasLongText(values: string[]) {
  return values.some((v) => (v?.trim()?.length ?? 0) >= 30 || /\s/.test(v) && v.trim().length >= 10);
}

function getOptionsFromConfig(question: Question): string[] {
  const cfg = (question?.config ?? {}) as Record<string, unknown>;
  const raw = (cfg as any).options;
  if (Array.isArray(raw)) {
    return raw
      .map((o) => (typeof o === 'string' ? o : String(o?.label ?? o?.value ?? '')))
      .filter((s) => typeof s === 'string' && s.trim().length > 0);
  }
  return [];
}

export function inferQuestionType(question: Question, responses: Response[]): InferredQuestionType {
  // If explicit type exists on the record, honor it
  const explicit: string | null = (question as any)?.type ?? question?.response_type ?? null;
  if (explicit) {
    // Normalize common values into our set
    const norm = explicit.toLowerCase();
    if (['multiple_choice', 'multiselect', 'singlechoice', 'singlechoice', 'choice'].includes(norm)) return 'multipleChoice';
    if (['scale', 'rating', 'number', 'numeric'].includes(norm)) return 'rating';
    if (['boolean', 'yesno', 'yes_no'].includes(norm)) return 'boolean';
    if (['voting', 'vote'].includes(norm)) return 'voting';
    if (['written', 'text', 'opentext', 'open_text'].includes(norm)) return 'openText';
  }

  const options = getOptionsFromConfig(question);
  if (options.length > 0) return 'multipleChoice';

  // Extract raw values from responses
  const texts = (responses ?? [])
    .map((r) => (r?.text ?? '').toString())
    .filter((s) => s && s.trim().length > 0);

  // Voting if votes present or question explicitly enables it
  const hasVotes = (responses ?? []).some((r) => (r?.votes ?? 0) > 0) || Boolean(question?.enable_voting);
  if (hasVotes) return 'voting';

  if (texts.length === 0) return 'multipleChoice';

  if (looksBoolean(texts)) return 'boolean';
  if (looksNumeric(texts)) return 'rating';
  if (hasLongText(texts)) return 'openText';

  // Default
  return 'multipleChoice';
}

export function buildChartForQuestion(
  question: Question,
  responses: Response[]
): { type: InferredQuestionType; data: ChartData | null } {
  const type = inferQuestionType(question, responses);
  // Dev visibility
  console.debug('Chart inference:', question?.text ?? question?.section ?? '(untitled)', '→', type);
  console.debug('  Question ID:', question.id, '| Room Code:', (question as any).room_code);
  console.debug('  Responses count:', responses.length);
  console.debug('  Response question_ids:', responses.map(r => r.question_id).slice(0, 5));

  // Build chart data per inferred type
  switch (type) {
    case 'multipleChoice': {
      const options = getOptionsFromConfig(question);
      const counts = new Map<string, number>();

      // Normalize function to handle variations
      const normalize = (str: string) => str.trim().toLowerCase();

      // Map to track normalized -> original label
      const labelMap = new Map<string, string>();

      // Initialize counts for all configured options
      if (options.length > 0) {
        for (const opt of options) {
          const normalized = normalize(opt);
          counts.set(normalized, 0);
          labelMap.set(normalized, opt); // Store original casing
        }
      }

      // Check if this is a multiSelect question (can have comma-separated values)
      const isMultiSelect = ((question as any)?.response_type ?? '').toLowerCase() === 'multiselect';

      for (const r of responses ?? []) {
        const raw = (r?.text ?? '').toString().trim();
        if (!raw) continue;

        if (isMultiSelect) {
          // Split comma-separated values and count each individually
          const selections = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
          for (const selection of selections) {
            const normalized = normalize(selection);
            counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
            // Store first occurrence of label if not already stored
            if (!labelMap.has(normalized)) {
              labelMap.set(normalized, selection);
            }
          }
        } else {
          // Single selection - count as-is
          const normalized = normalize(raw);
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
          if (!labelMap.has(normalized)) {
            labelMap.set(normalized, raw);
          }
        }
      }

      const points: ChartPoint[] = Array.from(counts.entries())
        .map(([normalizedLabel, value]) => ({
          id: normalizedLabel,
          label: labelMap.get(normalizedLabel) || normalizedLabel, // Use original label
          value: Number(value) || 0
        }))
        .filter((p) => Number.isFinite(p.value) && p.value > 0) // Filter out zero counts
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

      const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
      return {
        type,
        data: {
          title: question?.text ?? question?.section ?? 'Responses',
          series: [{ id: question.id, points }],
          total,
          meta: { kind: 'multipleChoice', totalResponses: responses?.length || 0 }
        }
      };
    }
    case 'rating': {
      const counts = new Map<string, number>();
      for (const r of responses ?? []) {
        const v = Number((r?.text ?? '').toString());
        if (Number.isFinite(v)) {
          const key = String(v);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      const points: ChartPoint[] = Array.from(counts.entries())
        .map(([label, value]) => ({ id: label, label, value: Number(value) || 0 }))
        .sort((a, b) => Number(a.label) - Number(b.label));
      const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);

      // Extract scale settings from question config if available
      const cfg = (question?.config ?? {}) as Record<string, unknown>;
      const scale = cfg.scale as any;
      const scaleSettings = scale ? {
        min: scale.min ?? 0,
        max: scale.max ?? 10,
        minLabel: scale.minLabel ?? 'Min',
        maxLabel: scale.maxLabel ?? 'Max'
      } : { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };

      return {
        type,
        data: {
          title: question?.text ?? 'Rating',
          series: [{ id: question.id, points }],
          total,
          meta: { kind: 'rating', scaleSettings, totalResponses: responses?.length || 0 }
        }
      };
    }
    case 'boolean': {
      let yes = 0;
      let no = 0;
      for (const r of responses ?? []) {
        const t = (r?.text ?? '').toString().trim();
        if (!t) continue;
        if (isTruthyBooleanWord(t)) yes += 1;
        else if (isFalseyBooleanWord(t)) no += 1;
        // Note: responses that don't match yes/no patterns are ignored
      }
      const points: ChartPoint[] = [
        { id: 'yes', label: 'Yes', value: yes },
        { id: 'no', label: 'No', value: no }
      ].filter(p => p.value > 0 || yes + no === 0); // Show both if at least one has data
      const total = yes + no;
      return {
        type,
        data: {
          title: question?.text ?? 'Yes/No',
          series: [{ id: question.id, points }],
          total,
          meta: { kind: 'boolean', totalResponses: responses?.length || 0 }
        }
      };
    }
    case 'voting':
    case 'openText':
      // Word cloud uses raw responses; UI will pass filtered responses directly
      return { type, data: null };
    default:
      return { type: 'multipleChoice', data: null };
  }
}

