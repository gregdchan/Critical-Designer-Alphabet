<script lang="ts">
  import { onMount } from 'svelte';
  export let data: { code: string; api: any };

  const success = data?.api?.success;
  const session = data?.api?.session ?? {};
  const participants = data?.api?.participants ?? [];
  const responses = data?.api?.responses ?? [];
  const questions = data?.api?.questions ?? [];
  const timeline = data?.api?.timeline ?? [];

  const ideas = responses.filter((r: any) => (r.type || r.questions?.response_type || 'written') === 'written' || (r.type || '').toLowerCase() === 'text');
  const totalVotes = ideas.reduce((sum: number, r: any) => sum + (Number(r.votes) || 0), 0);
  const avgVotes = ideas.length > 0 ? Math.round((totalVotes / ideas.length) * 10) / 10 : 0;

  const topIdeas = [...ideas]
    .sort((a: any, b: any) => (Number(b.votes) || 0) - (Number(a.votes) || 0))
    .slice(0, 12);

  const sharedValues = ideas.filter((r: any) => (Number(r.votes) || 0) >= 1).length;

  const lensCounts: Record<string, number> = {};
  for (const r of ideas) {
    const lens = (r.questions?.section || 'General') as string;
    lensCounts[lens] = (lensCounts[lens] || 0) + 1;
  }
  const lensSummary = Object.entries(lensCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Compute shared selections for multi-choice questions (identical answers chosen by 2+ participants)
  const isChoiceType = (rt: string | null | undefined) =>
    ['singleChoice', 'multiSelect', 'multiple_choice', 'multiselect'].includes((rt || '').toString());

  const choiceResponses = (responses || []).filter((r: any) =>
    isChoiceType(r.type || r.questions?.response_type)
  );

  const choiceCounts = new Map<string, { count: number; questionId: string; questionText: string; text: string }>();
  for (const r of choiceResponses) {
    const questionText = r.questions?.text || 'Question';
    const qid = r.question_id || '';
    const text: string = (r.text || '').trim();
    let choices: string[] = [];
    if (text.includes(';')) {
      choices = text.split(';').map((s) => s.trim()).filter(Boolean);
    } else if (text.includes(',')) {
      choices = text.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (text.length) {
      choices = [text];
    }
    for (const c of choices) {
      const norm = c.toLowerCase();
      const key = JSON.stringify([qid, norm]);
      const existing = choiceCounts.get(key);
      if (existing) existing.count += 1;
      else choiceCounts.set(key, { count: 1, questionId: qid, questionText, text: c });
    }
  }

  const sharedChoices = Array.from(choiceCounts.values())
    .filter((v) => v.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Data for simple visualizations
  const lensAll = Object.entries(lensCounts).sort((a, b) => b[1] - a[1]);
  const maxLens = Math.max(1, ...lensAll.map(([, v]) => v));

  const topVotedIdeas = topIdeas.filter((r: any) => (Number(r.votes) || 0) >= 1).slice(0, 10);
  const maxVotes = Math.max(1, ...topVotedIdeas.map((r: any) => Number(r.votes) || 0));

  const maxChoice = Math.max(1, ...sharedChoices.map((c) => c.count || 0));

  function printPdf() {
    window.print();
  }

  onMount(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('print') === '1') {
      setTimeout(() => window.print(), 300);
    }
  });
</script>

<svelte:head>
  <title>Export — {session?.name || data.code}</title>
</svelte:head>

{#if !success}
  <div class="sheet">
    <h1 class="title">Export</h1>
    <p class="muted">Could not load session {data.code}.</p>
  </div>
{:else}
  <div class="sheet">
    <header class="sheet-header">
      <div>
        <h1 class="title">{session.name || `Session ${data.code}`}</h1>
        <p class="subtitle">Code {data.code} · {new Date(session.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="actions no-print">
        <button class="btn" on:click={printPdf}>Download PDF</button>
        <a class="btn ghost" href={`/api/export/${data.code}`} target="_blank" rel="noopener">Markdown</a>
      </div>
    </header>

    {#if session.challenge}
      <section class="block">
        <h2>Challenge Focus</h2>
        <p class="body">{session.challenge}</p>
      </section>
    {/if}

    <section class="grid metrics">
      <div class="metric">
        <div class="metric-value">{participants.length}</div>
        <div class="metric-label">Participants</div>
      </div>
      <div class="metric">
        <div class="metric-value">{ideas.length}</div>
        <div class="metric-label">Written Ideas</div>
      </div>
      <div class="metric">
        <div class="metric-value">{totalVotes}</div>
        <div class="metric-label">Total Votes</div>
      </div>
      <div class="metric">
        <div class="metric-value">{avgVotes}</div>
        <div class="metric-label">Avg Votes / Idea</div>
      </div>
      <div class="metric">
        <div class="metric-value">{sharedValues}</div>
        <div class="metric-label">Shared Values (votes ≥ 1)</div>
      </div>
    </section>

  <section class="block two-col">
    <div>
      <h2>Top Ideas</h2>
      {#if topIdeas.length === 0}
        <p class="muted">No ideas yet.</p>
      {:else}
        <ol class="list">
          {#each topIdeas as r}
            <li>
              <div class="idea-text">{r.text}</div>
              <div class="idea-meta">{r.votes || 0} votes · {r.questions?.section || 'General'}</div>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
    <div>
      <h2>Lens Mix</h2>
      {#if lensSummary.length === 0}
        <p class="muted">No data.</p>
      {:else}
        <ul class="list compact">
          {#each lensSummary as [lens, count]}
            <li class="row">
              <span>{lens}</span>
              <span class="muted">{count}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

  <section class="block two-col">
    <div>
      <h2>Top Shared Values — Voted Ideas</h2>
      {#if sharedValues === 0}
        <p class="muted">No ideas received votes yet.</p>
      {:else}
        <ol class="list">
          {#each topVotedIdeas.slice(0,8) as r}
            <li>
              <div class="idea-text">{r.text}</div>
              <div class="idea-meta">{r.votes || 0} votes · {r.questions?.section || 'General'}</div>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
    <div>
      <h2>Top Shared Values — Common Choices</h2>
      {#if sharedChoices.length === 0}
        <p class="muted">No repeated selections yet.</p>
      {:else}
        <ol class="list">
          {#each sharedChoices as c}
            <li>
              <div class="idea-text">{c.text}</div>
              <div class="idea-meta">{c.count} selections · {c.questionText}</div>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  </section>

    <section class="block">
      <h2>Timeline Highlights</h2>
      {#if timeline.length === 0}
        <p class="muted">No timeline entries yet.</p>
      {:else}
        <ul class="list">
          {#each timeline as t}
            <li>
              <div class="row">
                <strong>{t.label}</strong>
                <span class="muted">{new Date(t.created_at).toLocaleString()}</span>
              </div>
              <div class="body">{t.item_text}</div>
              <div class="muted small">
                {#if t.owner}Owner: {t.owner}{/if}
                {#if t.metric} {t.owner ? ' · ' : ''}Metric: {t.metric}{/if}
                {#if t.risk_note} {(t.owner || t.metric) ? ' · ' : ''}Risk: {t.risk_note}{/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  <footer class="no-print note">
    Tip: Use the Download PDF button or your browser’s Print dialog.
  </footer>
  </div>
{/if}

<!-- Page 2: Visualizations -->
{#if success}
  <div class="sheet page-break">
    <header class="sheet-header">
      <div>
        <h1 class="title">Visual Highlights</h1>
        <p class="subtitle">Session {data.code}</p>
      </div>
      <div class="actions no-print">
        <button class="btn" on:click={printPdf}>Download PDF</button>
      </div>
    </header>

    <section class="block two-col">
      <div>
        <h2>Lens Mix (Top)</h2>
        {#if lensAll.length === 0}
          <p class="muted">No data.</p>
        {:else}
          <div class="hbars">
            {#each lensAll.slice(0, 12) as [lens, count]}
              <div class="hbar" style={`--w: ${(count / maxLens) * 100}`}> 
                <div class="hbar-fill"></div>
                <div class="hbar-label">{lens}</div>
                <div class="hbar-value">{count}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div>
        <h2>Shared Values — Voted Ideas</h2>
        {#if topVotedIdeas.length === 0}
          <p class="muted">No ideas received votes yet.</p>
        {:else}
          <div class="hbars">
            {#each topVotedIdeas as r}
              <div class="hbar" style={`--w: ${((Number(r.votes)||0) / maxVotes) * 100}`}> 
                <div class="hbar-fill alt"></div>
                <div class="hbar-label truncate" title={r.text}>{r.text}</div>
                <div class="hbar-value">{r.votes || 0}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <section class="block">
      <h2>Shared Values — Common Choices</h2>
      {#if sharedChoices.length === 0}
        <p class="muted">No repeated selections yet.</p>
      {:else}
        <div class="hbars">
          {#each sharedChoices as c}
            <div class="hbar" style={`--w: ${(c.count / maxChoice) * 100}`}> 
              <div class="hbar-fill warm"></div>
              <div class="hbar-label truncate" title={`${c.text} — ${c.questionText}`}>{c.text}</div>
              <div class="hbar-value">{c.count}</div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{/if}

<style>
  :global(html), :global(body) {
    background: #f7f7fb;
  }
  .sheet {
    max-width: 960px;
    margin: 24px auto;
    background: white;
    border: 1px solid hsl(var(--border-subtle, 220 20% 88%));
    border-radius: 12px;
    padding: 24px 28px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.06);
    color: hsl(var(--text-primary, 220 15% 20%));
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
  }
  .sheet-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
  .title { margin: 0; font-size: 22px; font-weight: 700; }
  .subtitle { margin: 4px 0 0; font-size: 12px; color: hsl(var(--text-muted, 220 10% 45%)); }
  .actions { display: flex; gap: 8px; }
  .btn { background: hsl(var(--brand, 200 80% 45%)); color: white; border: none; border-radius: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .btn.ghost { background: transparent; color: hsl(var(--brand, 200 80% 45%)); border: 1px solid currentColor; }
  .grid.metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 18px; }
  .metric { background: #f6f8fb; border: 1px solid #e7ebf2; border-radius: 10px; padding: 12px; text-align: center; }
  .metric-value { font-size: 20px; font-weight: 700; }
  .metric-label { font-size: 11px; color: #6b7280; }
  .block { margin-top: 20px; }
  .block.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
  h2 { font-size: 14px; margin: 0 0 8px; font-weight: 700; }
  .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
  .list.compact { gap: 6px; }
  .row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .idea-text { font-size: 13px; }
  .idea-meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .muted { color: #6b7280; }
  .small { font-size: 11px; }
  .body { font-size: 13px; }
  .note { margin-top: 16px; font-size: 12px; color: #6b7280; }
  .hbars { display: grid; gap: 6px; margin-top: 8px; }
  .hbar { position: relative; height: 22px; border-radius: 6px; background: #f3f4f6; border: 1px solid #e5e7eb; overflow: hidden; }
  .hbar-fill { position: absolute; inset: 0; width: calc(var(--w, 0) * 1%); background: linear-gradient(90deg, #2eaadc, #1771c1); border-right: 1px solid #2563eb; }
  .hbar-fill.alt { background: linear-gradient(90deg, #10b981, #059669); border-right-color: #059669; }
  .hbar-fill.warm { background: linear-gradient(90deg, #f59e0b, #d97706); border-right-color: #d97706; }
  .hbar-label { position: absolute; left: 10px; top: 3px; font-size: 12px; color: #111827; max-width: calc(100% - 70px); }
  .hbar-value { position: absolute; right: 8px; top: 3px; font-size: 12px; color: #374151; }
  .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  @media print {
    :global(html), :global(body) { background: white; }
    .sheet { border: none; border-radius: 0; box-shadow: none; margin: 0; padding: 16px 18px; }
    .no-print { display: none !important; }
    .grid.metrics { grid-template-columns: repeat(4, 1fr); }
    .block.two-col { grid-template-columns: 1fr 1fr; }
    .page-break { break-before: page; page-break-before: always; }
  }
</style>
