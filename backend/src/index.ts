import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProvider } from './services/ProviderFactory.js';
import { SecureConfigStore } from './services/SecureConfigStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

const configStore = new SecureConfigStore(path.resolve(__dirname, '..'));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function resolveEndpoint(providerName: string, model: string, region?: string): string {
  if (providerName === 'voyage') {
    return model.includes('multimodal')
      ? 'https://api.voyageai.com/v1/multimodalembeddings'
      : 'https://api.voyageai.com/v1/embeddings';
  }
  return `https://bedrock-runtime.${region || 'us-east-1'}.amazonaws.com`;
}

function contentSummary(content: { text?: string; imageBase64?: string }) {
  return {
    textLength: content.text?.length ?? 0,
    hasImage: !!content.imageBase64,
    imageSizeKb: content.imageBase64
      ? Math.round((content.imageBase64.length * 3) / 4 / 1024)
      : 0,
  };
}

function extractProviderError(err: unknown): { message: string; statusCode: number } {
  let message = err instanceof Error ? err.message : 'Unknown error';
  let statusCode = 500;

  // Axios-style errors (Voyage)
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: Record<string, unknown>; status?: number } };
    statusCode = axiosErr.response?.status || 500;
    const data = axiosErr.response?.data;
    if (data) {
      const providerMsg =
        (typeof data.detail === 'string' && data.detail) ||
        (typeof data.message === 'string' && data.message) ||
        (typeof data.error === 'string' && data.error) ||
        (typeof data.error === 'object' && data.error !== null &&
          typeof (data.error as Record<string, unknown>).message === 'string' &&
          (data.error as Record<string, unknown>).message);
      if (providerMsg) message = providerMsg as string;
    }
  }

  // AWS SDK errors (Bedrock)
  if (err && typeof err === 'object' && '$metadata' in err) {
    const awsErr = err as { $metadata?: { httpStatusCode?: number }; name?: string; message?: string };
    statusCode = awsErr.$metadata?.httpStatusCode || 500;
    if (awsErr.message) message = awsErr.message;
    if (awsErr.name) message = `${awsErr.name}: ${message}`;
  }

  return { message, statusCode };
}

app.post('/api/embed', async (req, res) => {
  const t0 = performance.now();
  const timestamp = new Date().toISOString();

  try {
    const { provider: providerName, config, content, inputType } = req.body;

    if (!providerName || !config || !content) {
      res.status(400).json({ error: 'Missing required fields: provider, config, content' });
      return;
    }

    if (!content.text && !content.imageBase64) {
      res.status(400).json({ error: 'At least text or imageBase64 must be provided' });
      return;
    }

    if (inputType === 'query' && !content.text) {
      res.status(400).json({ error: 'Query input requires text' });
      return;
    }

    const provider = createProvider(providerName, config);
    const isQuery = inputType === 'query';

    const result = isQuery
      ? await provider.embedQuery(content.text)
      : await provider.embedDocument(content.text || '', content.imageBase64);

    const latencyMs = Math.round(performance.now() - t0);

    res.json({
      ...result,
      debug: {
        timestamp,
        provider: providerName,
        model: config.model,
        endpoint: resolveEndpoint(providerName, config.model, config.region),
        inputType: isQuery ? 'query' : 'document',
        contentSummary: contentSummary(content),
        latencyMs,
        dimensions: result.dimensions,
        tokensUsed: result.tokensUsed ?? null,
        status: 'ok' as const,
      },
    });
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - t0);
    const { message, statusCode } = extractProviderError(err);
    console.error('Embed error:', message);

    const { provider: pName, config: cfg, content, inputType } = req.body ?? {};
    const model = cfg?.model ?? '?';

    res.status(statusCode).json({
      error: message,
      debug: {
        timestamp,
        provider: pName ?? '?',
        model,
        endpoint: pName ? resolveEndpoint(pName, model, cfg?.region) : '?',
        inputType: inputType ?? '?',
        contentSummary: content
          ? contentSummary(content)
          : { textLength: 0, hasImage: false, imageSizeKb: 0 },
        latencyMs,
        dimensions: null,
        tokensUsed: null,
        status: 'error' as const,
        error: message,
      },
    });
  }
});

app.get('/api/config', async (_req, res) => {
  try {
    const config = await configStore.loadConfig();
    res.json({ saved: await configStore.hasConfig(), config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load config';
    console.error('Config load error:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      res.status(400).json({ error: 'Invalid config payload' });
      return;
    }
    await configStore.saveConfig(config);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save config';
    console.error('Config save error:', message);
    res.status(500).json({ error: message });
  }
});

app.delete('/api/config', async (_req, res) => {
  try {
    await configStore.deleteConfig();
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete config';
    console.error('Config delete error:', message);
    res.status(500).json({ error: message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await configStore.initialize();
  app.listen(PORT, () => {
    console.log(`Embedding Tester backend running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
