import { useState } from 'react';
import type { Provider, SearchRun, SortColumn, SortConfig } from '../types';
import { VOYAGE_MODELS, BEDROCK_MODELS, ALL_MODELS_ID, DEFAULT_SORT_DIRECTION } from '../types';
import { formatTime, downloadJson } from '../utils/format';
import { applySortConfig, toggleSortColumn } from '../utils/sorting';

interface Props {
  queryText: string;
  onQueryTextChange: (text: string) => void;
  history: SearchRun[];
  isQuerying: boolean;
  onQuery: () => void;
  onClearHistory: () => void;
  hasContent: boolean;
  provider: Provider;
  model: string;
  onProviderChange: (provider: Provider) => void;
  onModelChange: (model: string) => void;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score * 100));
  const color =
    pct >= 80
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-yellow-500'
        : pct >= 40
          ? 'bg-orange-500'
          : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-600 w-12 text-right">
        {score.toFixed(3)}
      </span>
    </div>
  );
}

function SortIndicator({ direction }: { direction: 'asc' | 'desc' }) {
  return (
    <span className="ml-0.5 text-indigo-500">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  );
}

function SortableHeader({
  label,
  column,
  align,
  sortConfig,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  align?: 'left' | 'right';
  sortConfig: SortConfig;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const isActive = sortConfig.column === column;
  return (
    <th
      className={`px-3 py-2 select-none cursor-pointer hover:text-indigo-600 transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${isActive ? 'text-indigo-600' : ''} ${className ?? ''}`}
      onClick={() => onSort(column)}
    >
      {label}
      {isActive && <SortIndicator direction={sortConfig.direction} />}
    </th>
  );
}

export function QueryPanel({
  queryText,
  onQueryTextChange,
  history,
  isQuerying,
  onQuery,
  onClearHistory,
  hasContent,
  provider,
  model,
  onProviderChange,
  onModelChange,
}: Props) {
  const models = provider === 'voyage' ? VOYAGE_MODELS : BEDROCK_MODELS;
  const isAllModels = model === ALL_MODELS_ID;
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'time', direction: 'desc' });

  const handleSort = (column: SortColumn) => {
    setSortConfig(prev => toggleSortColumn(prev, column, DEFAULT_SORT_DIRECTION));
  };

  const sortedHistory = applySortConfig(history, sortConfig);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onQuery();
    }
  };

  const handleProviderSwitch = (p: Provider) => {
    onProviderChange(p);
    const defaultModel = p === 'voyage' ? VOYAGE_MODELS[0].id : BEDROCK_MODELS[0].id;
    onModelChange(defaultModel);
  };

  const providerBtnCls = (p: Provider) =>
    `px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
      provider === p
        ? p === 'voyage'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-orange-600 text-white border-orange-600'
        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
    }`;

  const dlBtnCls =
    'text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-700 transition-colors';

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Query</h2>
      <p className="text-xs text-gray-500 mb-3">
        Embeds all content items and the query, then ranks by cosine similarity
      </p>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          <button onClick={() => handleProviderSwitch('voyage')} className={providerBtnCls('voyage')}>
            Voyage AI
          </button>
          <button onClick={() => handleProviderSwitch('bedrock')} className={providerBtnCls('bedrock')}>
            Bedrock
          </button>
        </div>
        <select
          value={model}
          onChange={e => onModelChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value={ALL_MODELS_ID}>All Models</option>
          <optgroup label="Models">
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.label}{m.multimodal ? ' (multimodal)' : ''}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {isAllModels && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          <strong>Heads up:</strong> "All Models" will run your query against every {provider === 'voyage' ? 'Voyage AI' : 'Bedrock'} model sequentially.
          This can generate significant API load and cost.
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={queryText}
          onChange={e => onQueryTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a search query..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={onQuery}
          disabled={isQuerying || !queryText.trim() || !hasContent}
          className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isQuerying ? 'Running...' : 'Search'}
        </button>
      </div>

      {!hasContent && (
        <div className="text-xs text-gray-400 italic">
          Add at least one content item with text or an image.
        </div>
      )}

      {history.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Results ({history.length} {history.length === 1 ? 'run' : 'runs'})
            </span>
            <button
              onClick={onClearHistory}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear history
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  <SortableHeader label="Time" column="time" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Query" column="query" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Model" column="model" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Tokens" column="tokens" align="right" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Item" column="item" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Similarity" column="similarity" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="text-left px-3 py-2 w-[100px]">Embeddings</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map(run =>
                  run.results.map((r, idx) => (
                    <tr
                      key={`${run.id}-${r.itemId}`}
                      className={`border-t hover:bg-gray-50 transition-colors ${
                        idx === 0 ? 'border-gray-300' : 'border-gray-100'
                      }`}
                    >
                      <td className="px-3 py-2 text-[10px] text-gray-400 whitespace-nowrap">
                        {idx === 0 ? formatTime(run.timestamp) : ''}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-[140px] truncate">
                        {idx === 0 ? run.query : ''}
                      </td>
                      <td className="px-3 py-2 text-[10px] whitespace-nowrap">
                        {idx === 0 && (
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            run.model.startsWith('voyage')
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            {run.model}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-gray-500 text-right font-mono whitespace-nowrap">
                        {idx === 0 && (
                          run.tokensUsed != null
                            ? run.tokensUsed.toLocaleString()
                            : '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {r.label}
                        {r.hasImage && (
                          <span className="ml-1 text-[9px] bg-purple-100 text-purple-600 px-1 py-0.5 rounded-full">
                            img
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <ScoreBar score={r.similarity} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {idx === 0 && (
                            <button
                              onClick={() =>
                                downloadJson(`query_${run.model}_embedding.json`, {
                                  type: 'query',
                                  query: run.query,
                                  model: run.model,
                                  dimensions: run.queryEmbedding.length,
                                  embedding: run.queryEmbedding,
                                })
                              }
                              className={dlBtnCls}
                              title="Download query embedding"
                            >
                              ↓ Q
                            </button>
                          )}
                          <button
                            onClick={() =>
                              downloadJson(
                                `${r.label.replace(/[^a-zA-Z0-9_-]/g, '_')}_${run.model}_embedding.json`,
                                {
                                  type: 'document',
                                  label: r.label,
                                  model: run.model,
                                  dimensions: r.embedding.length,
                                  embedding: r.embedding,
                                },
                              )
                            }
                            className={dlBtnCls}
                            title="Download document embedding"
                          >
                            ↓ D
                          </button>
                        </div>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
