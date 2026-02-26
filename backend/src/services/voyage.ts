import axios from 'axios';
import type {
  EmbeddingProvider,
  EmbedResult,
  MultimodalInput,
} from '../interfaces/EmbeddingProvider.js';

export interface VoyageConfig {
  apiKey: string;
  model: string;
}

const MULTIMODAL_MODELS = ['voyage-multimodal-3', 'voyage-multimodal-3.5'];

export class VoyageEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private readonly baseUrl = 'https://api.voyageai.com/v1';

  constructor(config: VoyageConfig) {
    if (!config.apiKey) throw new Error('Voyage API key is required');
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  supportsMultimodal(): boolean {
    return MULTIMODAL_MODELS.includes(this.model);
  }

  getDimension(): number {
    if (this.model === 'voyage-3-lite') return 512;
    return 1024;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async embedQuery(text: string): Promise<EmbedResult> {
    if (this.supportsMultimodal()) {
      return this.callMultimodal(
        [{ content: [{ type: 'text', text }] }],
        'query',
      );
    }
    return this.callText([text], 'query');
  }

  async embedDocument(text: string, imageDataUrl?: string): Promise<EmbedResult> {
    if (this.supportsMultimodal()) {
      const content: MultimodalInput['content'] = [];
      if (text) content.push({ type: 'text', text });
      if (imageDataUrl) content.push({ type: 'image_base64', image_base64: imageDataUrl });
      if (content.length === 0) throw new Error('At least text or image is required');
      return this.callMultimodal([{ content }], 'document');
    }
    if (!text) throw new Error('Text is required for non-multimodal models');
    return this.callText([text], 'document');
  }

  private async callText(
    texts: string[],
    inputType: 'query' | 'document',
  ): Promise<EmbedResult> {
    const response = await axios.post(
      `${this.baseUrl}/embeddings`,
      { input: texts, model: this.model, input_type: inputType },
      { headers: this.headers, timeout: 30_000 },
    );
    return this.parseResponse(response.data);
  }

  private async callMultimodal(
    inputs: MultimodalInput[],
    inputType: 'query' | 'document',
  ): Promise<EmbedResult> {
    const response = await axios.post(
      `${this.baseUrl}/multimodalembeddings`,
      { inputs, model: this.model, input_type: inputType || null },
      { headers: this.headers, timeout: 120_000 },
    );
    return this.parseResponse(response.data);
  }

  private parseResponse(data: unknown): EmbedResult {
    const d = data as { data?: { embedding?: number[] }[]; usage?: { total_tokens?: number } };
    const embedding = d?.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Unexpected Voyage API response: missing embedding data');
    }
    return {
      embedding,
      dimensions: embedding.length,
      tokensUsed: d.usage?.total_tokens,
    };
  }
}
