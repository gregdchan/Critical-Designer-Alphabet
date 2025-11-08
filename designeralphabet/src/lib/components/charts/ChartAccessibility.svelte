<script lang="ts">
	export let chartTitle: string;
	export let chartDescription: string;
	export let dataTableHeaders: string[] = [];
	export let dataTableRows: (string | number)[][] = [];
	export let showDataTable = false;

	let isTableVisible = false;

	function toggleTable() {
		isTableVisible = !isTableVisible;
	}
</script>

<div class="chart-accessibility">
	<!-- Screen reader announcement -->
	<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
		{chartTitle}: {chartDescription}
	</div>

	<!-- Toggle for data table view -->
	{#if dataTableHeaders.length > 0 && dataTableRows.length > 0}
		<div class="mb-3 flex items-center justify-between">
			<button
				on:click={toggleTable}
				class="text-xs text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
				aria-expanded={isTableVisible}
				aria-controls="chart-data-table"
			>
				{isTableVisible ? '📊 Show Chart' : '📋 Show Data Table'}
			</button>
			<span class="text-xs text-ink-muted">
				{dataTableRows.length}
				{dataTableRows.length === 1 ? 'row' : 'rows'}
			</span>
		</div>

		<!-- Accessible data table -->
		{#if isTableVisible}
			<div
				id="chart-data-table"
				class="mb-4 overflow-x-auto rounded-lg border border-line bg-surface"
				role="region"
				aria-label="Data table for {chartTitle}"
				tabindex="0"
			>
				<table class="w-full text-left text-sm">
					<caption class="sr-only">{chartDescription}</caption>
					<thead class="border-b border-line bg-surface-muted">
						<tr>
							{#each dataTableHeaders as header}
								<th
									class="px-4 py-2 font-semibold text-ink"
									scope="col"
								>
									{header}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each dataTableRows as row, rowIndex}
							<tr class="border-b border-line last:border-b-0 hover:bg-surface-muted/50">
								{#each row as cell, cellIndex}
									<td class="px-4 py-2 text-ink-muted">
										{cellIndex === 0 ? cell : typeof cell === 'number' ? cell.toLocaleString() : cell}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Chart container (passed via slot) -->
	<div role="img" aria-label={chartDescription}>
		<slot />
	</div>

	<!-- Keyboard navigation hints -->
	<div class="mt-3 text-xs text-ink-muted">
		<details class="cursor-pointer">
			<summary class="hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
				⌨️ Keyboard Navigation
			</summary>
			<ul class="ml-4 mt-2 space-y-1 list-disc">
				<li><kbd class="rounded bg-surface-muted px-1 py-0.5">Tab</kbd> - Navigate between elements</li>
				<li><kbd class="rounded bg-surface-muted px-1 py-0.5">Enter</kbd> - Activate buttons/links</li>
				<li><kbd class="rounded bg-surface-muted px-1 py-0.5">Esc</kbd> - Close modals/tooltips</li>
				<li><kbd class="rounded bg-surface-muted px-1 py-0.5">Arrow Keys</kbd> - Navigate within charts (when focused)</li>
			</ul>
		</details>
	</div>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	kbd {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875em;
	}
</style>
