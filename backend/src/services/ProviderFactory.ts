import type { EmbeddingProvider } from '../interfaces/EmbeddingProvider.js';
import { VoyageEmbeddings, type VoyageConfig } from './voyage.js';
import { BedrockEmbeddings, type BedrockConfig } from './bedrock.js';

function requireString(obj: Record<string, unknown>, key: string, label: string): string {
  const val = obj[key];
  if (typeof val !== 'string' || !val) {
    throw new Error(`${label} is required`);
  }
  return val;
}

function optionalString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

export function createProvider(
  provider: string,
  config: Record<string, unknown>,
): EmbeddingProvider {
  switch (provider) {
    case 'voyage': {
      const validated: VoyageConfig = {
        apiKey: requireString(config, 'apiKey', 'Voyage API key'),
        model: requireString(config, 'model', 'Model'),
      };
      return new VoyageEmbeddings(validated);
    }
    case 'bedrock': {
      const validated: BedrockConfig = {
        region: requireString(config, 'region', 'Region'),
        accessKeyId: requireString(config, 'accessKeyId', 'Access Key ID'),
        secretAccessKey: requireString(config, 'secretAccessKey', 'Secret Access Key'),
        sessionToken: optionalString(config, 'sessionToken'),
        model: requireString(config, 'model', 'Model'),
      };
      return new BedrockEmbeddings(validated);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
