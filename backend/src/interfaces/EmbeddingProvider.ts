export interface EmbedResult {
  embedding: number[];
  dimensions: number;
  tokensUsed?: number;
}

export type MultimodalContentPiece =
  | { type: 'text'; text: string }
  | { type: 'image_base64'; image_base64: string };

export interface MultimodalInput {
  content: MultimodalContentPiece[];
}

export interface EmbeddingProvider {
  embedQuery(text: string): Promise<EmbedResult>;
  embedDocument(text: string, imageDataUrl?: string): Promise<EmbedResult>;
  supportsMultimodal(): boolean;
  getDimension(): number;
}
