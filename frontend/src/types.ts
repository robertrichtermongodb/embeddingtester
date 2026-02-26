export type Provider = 'voyage' | 'bedrock';

export interface VoyageConfig {
  apiKey: string;
  model: string;
}

export interface BedrockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  model: string;
}

export interface ProviderSettings {
  provider: Provider;
  voyage: VoyageConfig;
  bedrock: BedrockConfig;
}

export interface ContentItem {
  id: string;
  label: string;
  text: string;
  imageDataUrl: string | null;
  imageName: string | null;
  isEmbedding: boolean;
}

export interface QueryResult {
  itemId: string;
  label: string;
  similarity: number;
  text: string;
  hasImage: boolean;
  embedding: number[];
}

export const ALL_MODELS_ID = '__all__';

export interface SearchRun {
  id: string;
  timestamp: string;
  query: string;
  model: string;
  queryEmbedding: number[];
  tokensUsed: number | null;
  results: QueryResult[];
}

export const VOYAGE_MODELS = [
  { id: 'voyage-multimodal-3', label: 'voyage-multimodal-3', multimodal: true },
  { id: 'voyage-multimodal-3.5', label: 'voyage-multimodal-3.5', multimodal: true },
  { id: 'voyage-3', label: 'voyage-3', multimodal: false },
  { id: 'voyage-3-lite', label: 'voyage-3-lite', multimodal: false },
  { id: 'voyage-code-3', label: 'voyage-code-3', multimodal: false },
];

export const BEDROCK_MODELS = [
  { id: 'amazon.titan-embed-image-v1', label: 'Titan Multimodal Embedding v1', multimodal: true },
  { id: 'amazon.titan-embed-text-v2:0', label: 'Titan Text Embedding v2', multimodal: false },
  { id: 'amazon.titan-embed-text-v1', label: 'Titan Text Embedding v1', multimodal: false },
  { id: 'cohere.embed-english-v3', label: 'Cohere Embed English v3', multimodal: false },
  { id: 'cohere.embed-multilingual-v3', label: 'Cohere Embed Multilingual v3', multimodal: false },
];

export function isMultimodalModel(provider: Provider, modelId: string): boolean {
  const models = provider === 'voyage' ? VOYAGE_MODELS : BEDROCK_MODELS;
  return models.find(m => m.id === modelId)?.multimodal ?? false;
}

export type SortColumn = 'time' | 'query' | 'model' | 'tokens' | 'item' | 'similarity';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

export const DEFAULT_SORT_DIRECTION: Record<SortColumn, SortDirection> = {
  time: 'desc',
  query: 'asc',
  model: 'asc',
  tokens: 'desc',
  item: 'asc',
  similarity: 'desc',
};

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  endpoint: string;
  inputType: string;
  contentSummary: {
    textLength: number;
    hasImage: boolean;
    imageSizeKb: number;
  };
  latencyMs: number;
  dimensions: number | null;
  tokensUsed: number | null;
  status: 'ok' | 'error';
  error?: string;
}
