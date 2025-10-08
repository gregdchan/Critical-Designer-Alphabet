#!/usr/bin/env ts-node
import 'dotenv/config';
import {createClient} from '@sanity/client';

type UnknownRecord = Record<string, unknown>;

const projectId = process.env.SANITY_PROJECT_ID ?? 'pctfp1xq';
const dataset = process.env.SANITY_DATASET ?? 'production';
const token = process.env.SANITY_WRITE_TOKEN;
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-09-01';

if (!token) {
  console.error(
    'Missing SANITY_WRITE_TOKEN. Generate a token with write access and set it in your environment before running this script.',
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value && value !== 0) return [];
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record._type === 'string') {
      return [value as T];
    }
    return Object.values(record) as T[];
  }
  return [value as T];
}

function ensureStringArray(value: unknown): string[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry === null || entry === undefined) return null;
      try {
        return JSON.stringify(entry);
      } catch {
        return String(entry);
      }
    })
    .filter((entry): entry is string => Boolean(entry && entry.trim()));
}

function normalizePhases(phases: unknown): UnknownRecord[] {
  return toArray<UnknownRecord>(phases).map((phase) => {
    const normalized: UnknownRecord = {...phase};

    if (phase?.breakoutRounds) {
      normalized.breakoutRounds = toArray<UnknownRecord>(phase.breakoutRounds).map((round) => {
        const normalizedRound: UnknownRecord = {...round};
        if (round?.questions) {
          normalizedRound.questions = toArray<UnknownRecord>(round.questions);
        }
        return normalizedRound;
      });
    }

    return normalized;
  });
}

async function run() {
  const docs = await client.fetch<
    Array<{_id: string; _rev: string; phases?: unknown; sections?: UnknownRecord}>
  >(`*[_type == "workshopTemplate"]{_id,_rev,phases,sections}`);

  if (!docs.length) {
    console.log('No workshopTemplate documents found. Nothing to normalize.');
    return;
  }

  let patched = 0;

  for (const doc of docs) {
    const setUpdates: UnknownRecord = {};
    const unsetPaths: string[] = [];

    if (doc.phases !== undefined) {
      const normalizedPhases = normalizePhases(doc.phases);
      if (JSON.stringify(normalizedPhases) !== JSON.stringify(doc.phases)) {
        setUpdates.phases = normalizedPhases;
      }
    }

    const sections = doc.sections as UnknownRecord | undefined;
    if (sections?.onboarding && typeof sections.onboarding === 'object') {
      const onboarding = sections.onboarding as UnknownRecord;
      const onboardingUpdates: UnknownRecord = {};

      const whatToBring = ensureStringArray(onboarding.whatToBring);
      if (JSON.stringify(whatToBring) !== JSON.stringify(onboarding.whatToBring)) {
        onboardingUpdates.whatToBring = whatToBring;
      }

      const rules = ensureStringArray(onboarding.rules);
      if (JSON.stringify(rules) !== JSON.stringify(onboarding.rules)) {
        onboardingUpdates.rules = rules;
      }

      const quickStart = ensureStringArray(onboarding.quickStart);
      if (JSON.stringify(quickStart) !== JSON.stringify(onboarding.quickStart)) {
        onboardingUpdates.quickStart = quickStart;
      }

      if (Object.keys(onboardingUpdates).length > 0) {
        setUpdates['sections.onboarding'] = {
          ...onboarding,
          ...onboardingUpdates,
        };
      }
    }

    if (sections?.synthesis && typeof sections.synthesis === 'object') {
      const synthesis = sections.synthesis as UnknownRecord;
      const methods = ensureStringArray(synthesis.methods);
      if (JSON.stringify(methods) !== JSON.stringify(synthesis.methods)) {
        setUpdates['sections.synthesis'] = {
          ...synthesis,
          methods,
        };
      }
    }

    if (sections?.commitments && typeof sections.commitments === 'object') {
      const commitments = sections.commitments as UnknownRecord;
      const exportFields = ensureStringArray(commitments.exportFields);
      if (JSON.stringify(exportFields) !== JSON.stringify(commitments.exportFields)) {
        setUpdates['sections.commitments'] = {
          ...commitments,
          exportFields,
        };
      }
    }

    const visuals = (sections?.visuals ?? {}) as UnknownRecord;
    if (visuals?.charts !== undefined) {
      const charts = ensureStringArray(visuals.charts);
      if (JSON.stringify(charts) !== JSON.stringify(visuals.charts)) {
        setUpdates['sections.visuals'] = {
          ...visuals,
          charts,
        };
      }
    }

    const facilitation = (doc.sections?.facilitation ?? {}) as UnknownRecord;
    if (facilitation?.roles !== undefined) {
      const roles = ensureStringArray(facilitation.roles);
      if (JSON.stringify(roles) !== JSON.stringify(facilitation.roles)) {
        setUpdates['sections.facilitation'] = {
          ...facilitation,
          roles,
        };
      }
    }

    if (Object.keys(setUpdates).length === 0 && unsetPaths.length === 0) {
      continue;
    }

    const patch = client.patch(doc._id, {ifRevisionID: doc._rev});
    if (Object.keys(setUpdates).length > 0) {
      patch.set(setUpdates);
    }
    if (unsetPaths.length > 0) {
      patch.unset(unsetPaths);
    }

    await patch.commit();
    patched += 1;
    console.log(`Normalized workshopTemplate ${doc._id}`);
  }

  console.log(`Done. Updated ${patched} document${patched === 1 ? '' : 's'}.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
