import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type {
  EmbeddingProvider,
  EmbedResult,
} from '../interfaces/EmbeddingProvider.js';

export interface BedrockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  model: string;
}

const DIMENSION_MAP: Record<string, number> = {
  'amazon.titan-embed-text-v1': 1536,
  'amazon.titan-embed-text-v2:0': 1024,
  'amazon.titan-embed-image-v1': 1024,
  'cohere.embed-english-v3': 1024,
  'cohere.embed-multilingual-v3': 1024,
};

function stripDataUri(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export class BedrockEmbeddings implements EmbeddingProvider {
  private client: BedrockRuntimeClient;
  private model: string;

  constructor(config: BedrockConfig) {
    if (!config.accessKeyId || !config.secretAccessKey) {
      throw new Error('Bedrock requires accessKeyId and secretAccessKey');
    }
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        ...(config.sessionToken ? { sessionToken: config.sessionToken } : {}),
      },
      requestHandler: { requestTimeout: 60_000 } as never,
    });
    this.model = config.model;
  }

  supportsMultimodal(): boolean {
    return this.model.startsWith('amazon.titan-embed-image');
  }

  getDimension(): number {
    return DIMENSION_MAP[this.model] ?? 1024;
  }

  async embedQuery(text: string): Promise<EmbedResult> {
    return this.invoke(text, 'query');
  }

  async embedDocument(text: string, imageDataUrl?: string): Promise<EmbedResult> {
    return this.invoke(text, 'document', imageDataUrl);
  }

  private async invoke(
    text: string,
    inputType: 'query' | 'document',
    imageDataUrl?: string,
  ): Promise<EmbedResult> {
    let body: Record<string, unknown>;

    if (this.model.startsWith('amazon.titan-embed-image')) {
      body = {};
      if (text) body.inputText = text;
      if (imageDataUrl) body.inputImage = stripDataUri(imageDataUrl);
      if (!text && !imageDataUrl) {
        throw new Error('At least text or image is required');
      }
    } else if (this.model.startsWith('amazon.titan-embed-text')) {
      if (!text) throw new Error('Text is required for Titan text models');
      body = { inputText: text };
      if (this.model.includes('v2')) {
        body.dimensions = 1024;
        body.normalize = true;
      }
    } else if (this.model.startsWith('cohere.embed')) {
      if (!text) throw new Error('Text is required for Cohere models');
      body = {
        texts: [text],
        input_type: inputType === 'query' ? 'search_query' : 'search_document',
        truncate: 'END',
      };
    } else {
      throw new Error(`Unsupported Bedrock model: ${this.model}`);
    }

    const command = new InvokeModelCommand({
      modelId: this.model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(new TextDecoder().decode(response.body));
    } catch {
      throw new Error('Failed to parse Bedrock response as JSON');
    }

    const embedding: number[] | undefined = this.model.startsWith('cohere.embed')
      ? (result.embeddings as number[][])?.[0]
      : result.embedding as number[] | undefined;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Unexpected Bedrock response: missing embedding data');
    }

    return { embedding, dimensions: embedding.length };
  }
}
