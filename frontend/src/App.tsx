import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProviderSettings, ContentItem, QueryResult, SearchRun, DebugLogEntry, Provider } from './types';
import { usePersistedState } from './hooks/usePersistedState';
import { ALL_MODELS_ID, VOYAGE_MODELS, BEDROCK_MODELS } from './types';
import { ProviderConfig } from './components/ProviderConfig';
import { ContentPanel } from './components/ContentPanel';
import { QueryPanel } from './components/QueryPanel';
import { DebugConsole } from './components/DebugConsole';
import { cosineSimilarity } from './utils/cosine';

function makeItem(index: number): ContentItem {
  return {
    id: crypto.randomUUID(),
    label: `Item ${index}`,
    text: '',
    imageDataUrl: null,
    imageName: null,
    isEmbedding: false,
  };
}

function buildEmbedContent(item: ContentItem): { text?: string; imageBase64?: string } {
  const content: { text?: string; imageBase64?: string } = {};
  if (item.text) content.text = item.text;
  if (item.imageDataUrl) content.imageBase64 = item.imageDataUrl;
  return content;
}

const defaultConfig: ProviderSettings = {
  provider: 'voyage',
  voyage: { apiKey: '', model: 'voyage-multimodal-3' },
  bedrock: {
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    model: 'amazon.titan-embed-text-v2:0',
  },
};

async function loadSavedConfig(): Promise<ProviderSettings | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    const { saved, config } = await res.json();
    if (!saved || !config) return null;
    return config as ProviderSettings;
  } catch {
    return null;
  }
}

async function persistConfig(config: ProviderSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function callEmbed(
  config: ProviderSettings,
  content: { text?: string; imageBase64?: string },
  inputType: 'document' | 'query',
  onDebug?: (entry: DebugLogEntry) => void,
) {
  const activeConfig =
    config.provider === 'voyage' ? config.voyage : config.bedrock;

  const res = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      config: activeConfig,
      content,
      inputType,
    }),
  });

  const body = await res.json().catch(() => ({} as Record<string, unknown>));

  if (body.debug && onDebug) {
    onDebug({ ...body.debug, id: crypto.randomUUID() });
  }

  if (!res.ok) {
    throw new Error((body as { error?: string }).error || `Embedding failed (${res.status})`);
  }

  return body as { embedding: number[]; dimensions: number; tokensUsed?: number };
}

function makeConfigForModel(base: ProviderSettings, modelId: string): ProviderSettings {
  if (base.provider === 'voyage') {
    return { ...base, voyage: { ...base.voyage, model: modelId } };
  }
  return { ...base, bedrock: { ...base.bedrock, model: modelId } };
}

export default function App() {
  const [config, setConfig] = useState<ProviderSettings>(defaultConfig);
  const [items, setItems] = usePersistedState<ContentItem[]>(
    'items',
    [makeItem(1)],
    loaded => loaded.map(i => ({ ...i, isEmbedding: false })),
  );
  const [nextIndex, setNextIndex] = usePersistedState('nextIndex', 2);
  const [queryText, setQueryText] = usePersistedState('queryText', '');
  const [searchHistory, setSearchHistory] = usePersistedState<SearchRun[]>('searchHistory', []);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [debugLog, setDebugLog] = usePersistedState<DebugLogEntry[]>('debugLog', []);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const addDebugEntry = useCallback((entry: DebugLogEntry) => {
    setDebugLog(prev => [...prev, entry]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSavedConfig().then(saved => {
      if (cancelled) return;
      if (saved) {
        setConfig(prev => ({
          provider: saved.provider ?? prev.provider,
          voyage: { ...prev.voyage, ...saved.voyage },
          bedrock: { ...prev.bedrock, ...saved.bedrock },
        }));
      }
      setConfigLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSaveConfig = useCallback(async () => {
    setSaveStatus('saving');
    const ok = await persistConfig(config);
    setSaveStatus(ok ? 'saved' : 'error');
    if (!ok) setError('Failed to save configuration');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, [config]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const currentModel =
    config.provider === 'voyage' ? config.voyage.model : config.bedrock.model;

  const addItem = useCallback(() => {
    setItems(prev => [...prev, makeItem(nextIndex)]);
    setNextIndex(n => n + 1);
  }, [nextIndex]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<ContentItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const handleQuery = useCallback(async () => {
    if (!queryText.trim()) return;

    const contentItems = itemsRef.current.filter(i => i.text || i.imageDataUrl);
    if (contentItems.length === 0) {
      setError('No content items to embed');
      return;
    }

    setError(null);
    setIsQuerying(true);

    const isAll = currentModel === ALL_MODELS_ID;
    const modelsToRun = isAll
      ? (config.provider === 'voyage' ? VOYAGE_MODELS : BEDROCK_MODELS).map(m => m.id)
      : [currentModel];

    let anySuccess = false;

    try {
      for (const modelId of modelsToRun) {
        const runConfig = makeConfigForModel(config, modelId);
        let totalTokens = 0;
        let hasTokens = false;

        try {
          const embeddings = new Map<string, number[]>();

          setItems(prev =>
            prev.map(i =>
              contentItems.some(c => c.id === i.id) ? { ...i, isEmbedding: true } : i,
            ),
          );

          for (const item of contentItems) {
            try {
              const { embedding, tokensUsed } = await callEmbed(
                runConfig, buildEmbedContent(item), 'document', addDebugEntry,
              );
              embeddings.set(item.id, embedding);
              if (tokensUsed != null) { totalTokens += tokensUsed; hasTokens = true; }
            } catch {
              if (!isAll) throw new Error(`Failed to embed "${item.label}"`);
            }
          }

          if (embeddings.size === 0) continue;

          const { embedding: qEmb, tokensUsed: qTokens } = await callEmbed(
            runConfig, { text: queryText }, 'query', addDebugEntry,
          );
          if (qTokens != null) { totalTokens += qTokens; hasTokens = true; }

          const results: QueryResult[] = contentItems
            .filter(i => embeddings.has(i.id))
            .map(item => ({
              itemId: item.id,
              label: item.label,
              similarity: cosineSimilarity(qEmb, embeddings.get(item.id)!),
              text: item.text,
              hasImage: !!item.imageDataUrl,
              embedding: embeddings.get(item.id)!,
            }))
            .sort((a, b) => b.similarity - a.similarity);

          const run: SearchRun = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            query: queryText,
            model: modelId,
            queryEmbedding: qEmb,
            tokensUsed: hasTokens ? totalTokens : null,
            results,
          };

          setSearchHistory(prev => [...prev, run]);
          anySuccess = true;
        } catch (e: unknown) {
          if (!isAll) throw e;
        }
      }

      if (isAll && !anySuccess) {
        setError('All models failed — check the debug console for details');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setItems(prev => prev.map(i => ({ ...i, isEmbedding: false })));
      setIsQuerying(false);
    }
  }, [queryText, config, currentModel, addDebugEntry]);

  const hasContent = items.some(i => i.text || i.imageDataUrl);

  const handleProviderChange = useCallback((provider: Provider) => {
    setConfig(prev => ({ ...prev, provider }));
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setConfig(prev => {
      if (prev.provider === 'voyage') {
        return { ...prev, voyage: { ...prev.voyage, model } };
      }
      return { ...prev, bedrock: { ...prev.bedrock, model } };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          Et
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Embedding Tester</h1>
          <p className="text-xs text-gray-500">
            Ad-hoc testing for embedding configurations
          </p>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="w-80 bg-white border-r border-gray-200 p-5 flex-shrink-0 overflow-y-auto">
          <ProviderConfig
            config={config}
            onChange={setConfig}
            onSave={handleSaveConfig}
            saveStatus={saveStatus}
            configLoaded={configLoaded}
          />
        </aside>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between"
            >
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 ml-4 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <ContentPanel
            items={items}
            onAdd={addItem}
            onRemove={removeItem}
            onUpdate={updateItem}
          />

          <QueryPanel
            queryText={queryText}
            onQueryTextChange={setQueryText}
            history={searchHistory}
            isQuerying={isQuerying}
            onQuery={handleQuery}
            onClearHistory={() => setSearchHistory([])}
            hasContent={hasContent}
            provider={config.provider}
            model={currentModel}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
          />
        </main>
      </div>

      <DebugConsole
        entries={debugLog}
        onClear={() => setDebugLog([])}
      />
    </div>
  );
}
