import { useEffect, useRef, useState } from 'react';
import type { DebugLogEntry } from '../types';
import { formatTime } from '../utils/format';

interface Props {
  entries: DebugLogEntry[];
  onClear: () => void;
}

function EntryRow({ entry }: { entry: DebugLogEntry }) {
  const isError = entry.status === 'error';
  const providerColor =
    entry.provider === 'voyage'
      ? 'text-blue-400'
      : entry.provider === 'bedrock'
        ? 'text-orange-400'
        : 'text-gray-400';

  return (
    <div className={`font-mono text-[11px] leading-relaxed px-3 py-1.5 border-b border-gray-800 ${isError ? 'bg-red-950/30' : 'hover:bg-gray-800/50'}`}>
      <div className="flex items-start gap-3">
        <span className="text-gray-500 shrink-0 w-[60px]">{formatTime(entry.timestamp)}</span>
        <span className={`shrink-0 w-[52px] ${providerColor}`}>{entry.provider}</span>
        <span className="text-gray-300 shrink-0 w-[60px]">{entry.inputType}</span>
        <span className="text-purple-400 shrink-0">{entry.model}</span>
        <span className="ml-auto flex items-center gap-3 text-gray-500 shrink-0">
          {entry.contentSummary.textLength > 0 && (
            <span>{entry.contentSummary.textLength} chars</span>
          )}
          {entry.contentSummary.hasImage && (
            <span className="text-purple-500">{entry.contentSummary.imageSizeKb} KB img</span>
          )}
          <span className={entry.latencyMs > 3000 ? 'text-amber-400' : 'text-gray-400'}>
            {entry.latencyMs} ms
          </span>
          {isError ? (
            <span className="text-red-400 font-medium">ERR</span>
          ) : (
            <span className="text-green-400">{entry.dimensions}d</span>
          )}
          {entry.tokensUsed != null && (
            <span className="text-cyan-500">{entry.tokensUsed} tok</span>
          )}
        </span>
      </div>
      {isError && entry.error && (
        <div className="text-red-400 mt-0.5 ml-[calc(60px+52px+60px+36px)] text-[10px]">
          {entry.error}
        </div>
      )}
      <div className="text-gray-600 mt-0.5 ml-[calc(60px+12px)] text-[10px] truncate">
        {entry.endpoint}
      </div>
    </div>
  );
}

const COLLAPSED_H = '36px';
const EXPANDED_H = '260px';

export function DebugConsole({ entries, onClear }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length, collapsed]);

  const panelHeight = collapsed ? COLLAPSED_H : EXPANDED_H;

  return (
    <>
      {/* spacer so page content isn't hidden behind the fixed panel */}
      <div style={{ height: panelHeight }} className="transition-all duration-200" />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 flex flex-col transition-all duration-200"
        style={{ height: panelHeight }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 cursor-pointer select-none shrink-0"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[10px]">{collapsed ? '▲' : '▼'}</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-300">Debug Console</span>
            <span className="text-[10px] text-gray-500">{entries.length} requests</span>
          </div>
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onClear(); }}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-600">
                Embedding requests will appear here...
              </div>
            ) : (
              entries.map(entry => <EntryRow key={entry.id} entry={entry} />)
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </>
  );
}
