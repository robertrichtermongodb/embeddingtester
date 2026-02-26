import type { SearchRun, SortConfig, SortColumn } from '../types';

type RunAccessor = (run: SearchRun) => string | number | null;

const RUN_ACCESSORS: Record<string, RunAccessor> = {
  time: run => run.timestamp,
  query: run => run.query.toLowerCase(),
  model: run => run.model.toLowerCase(),
  tokens: run => run.tokensUsed,
};

const RUN_LEVEL_COLUMNS = new Set<SortColumn>(['time', 'query', 'model', 'tokens']);

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sortRuns(runs: SearchRun[], accessor: RunAccessor, ascending: boolean): SearchRun[] {
  const sorted = [...runs].sort((a, b) => compareValues(accessor(a), accessor(b)));
  return ascending ? sorted : sorted.reverse();
}

function sortResultsWithinRuns(runs: SearchRun[], column: 'item' | 'similarity', ascending: boolean): SearchRun[] {
  return runs.map(run => ({
    ...run,
    results: [...run.results].sort((a, b) => {
      const va = column === 'item' ? a.label.toLowerCase() : a.similarity;
      const vb = column === 'item' ? b.label.toLowerCase() : b.similarity;
      const cmp = compareValues(va, vb);
      return ascending ? cmp : -cmp;
    }),
  }));
}

export function applySortConfig(history: SearchRun[], config: SortConfig): SearchRun[] {
  const ascending = config.direction === 'asc';

  if (RUN_LEVEL_COLUMNS.has(config.column)) {
    const accessor = RUN_ACCESSORS[config.column];
    return sortRuns(history, accessor, ascending);
  }

  const newestFirst = [...history].reverse();
  return sortResultsWithinRuns(newestFirst, config.column as 'item' | 'similarity', ascending);
}

export function toggleSortColumn(current: SortConfig, clicked: SortColumn, defaultDirection: Record<SortColumn, 'asc' | 'desc'>): SortConfig {
  if (current.column === clicked) {
    return { column: clicked, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { column: clicked, direction: defaultDirection[clicked] };
}
