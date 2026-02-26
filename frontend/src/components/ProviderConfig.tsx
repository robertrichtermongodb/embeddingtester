import { useState } from 'react';
import type { ProviderSettings, Provider } from '../types';
import { VOYAGE_MODELS, BEDROCK_MODELS, isMultimodalModel } from '../types';

interface ParsedCreds {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region?: string;
}

function parseAwsCredentials(text: string): ParsedCreds {
  const result: ParsedCreds = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key === 'aws_access_key_id') result.accessKeyId = value;
    else if (key === 'aws_secret_access_key') result.secretAccessKey = value;
    else if (key === 'aws_session_token') result.sessionToken = value;
    else if (key === 'region') result.region = value;
  }
  return result;
}

interface Props {
  config: ProviderSettings;
  onChange: (config: ProviderSettings) => void;
  onSave: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  configLoaded: boolean;
}

const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white';
const selectCls = inputCls;

export function ProviderConfig({ config, onChange, onSave, saveStatus, configLoaded }: Props) {
  const setProvider = (provider: Provider) =>
    onChange({ ...config, provider });

  const isMultimodal = isMultimodalModel(
    config.provider,
    config.provider === 'voyage' ? config.voyage.model : config.bedrock.model
  );

  const providerColor =
    config.provider === 'voyage'
      ? 'bg-blue-50 border-blue-200 text-blue-700'
      : 'bg-orange-50 border-orange-200 text-orange-700';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Provider Configuration
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setProvider('voyage')}
            className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              config.provider === 'voyage'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Voyage AI
          </button>
          <button
            onClick={() => setProvider('bedrock')}
            className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              config.provider === 'bedrock'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            AWS Bedrock
          </button>
        </div>

        <div className={`text-xs px-3 py-2 rounded-md border ${providerColor} mb-4`}>
          {isMultimodal ? 'Multimodal (text + image)' : 'Text only'}
        </div>
      </div>

      {config.provider === 'voyage' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>API Key</label>
            <input
              type="password"
              value={config.voyage.apiKey}
              onChange={e =>
                onChange({
                  ...config,
                  voyage: { ...config.voyage, apiKey: e.target.value },
                })
              }
              placeholder="pa-..."
              className={inputCls}
            />
            <a
              href="https://dash.voyageai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-blue-500 hover:underline mt-1 inline-block"
            >
              Get API key from voyageai.com
            </a>
          </div>

          <div>
            <label className={labelCls}>Model</label>
            <select
              value={config.voyage.model}
              onChange={e =>
                onChange({
                  ...config,
                  voyage: { ...config.voyage, model: e.target.value },
                })
              }
              className={selectCls}
            >
              {VOYAGE_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label} {m.multimodal ? '(multimodal)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {config.provider === 'bedrock' && (
        <div className="space-y-3">
          <CredentialsPastePanel
            onApply={creds =>
              onChange({
                ...config,
                bedrock: {
                  ...config.bedrock,
                  ...(creds.accessKeyId && { accessKeyId: creds.accessKeyId }),
                  ...(creds.secretAccessKey && { secretAccessKey: creds.secretAccessKey }),
                  ...(creds.sessionToken !== undefined && { sessionToken: creds.sessionToken }),
                  ...(creds.region && { region: creds.region }),
                },
              })
            }
          />

          <div>
            <label className={labelCls}>Region</label>
            <input
              type="text"
              value={config.bedrock.region}
              onChange={e =>
                onChange({
                  ...config,
                  bedrock: { ...config.bedrock, region: e.target.value },
                })
              }
              placeholder="us-east-1"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Access Key ID</label>
            <input
              type="text"
              value={config.bedrock.accessKeyId}
              onChange={e =>
                onChange({
                  ...config,
                  bedrock: { ...config.bedrock, accessKeyId: e.target.value },
                })
              }
              placeholder="AKIA..."
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Secret Access Key</label>
            <input
              type="password"
              value={config.bedrock.secretAccessKey}
              onChange={e =>
                onChange({
                  ...config,
                  bedrock: {
                    ...config.bedrock,
                    secretAccessKey: e.target.value,
                  },
                })
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Session Token{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="password"
              value={config.bedrock.sessionToken}
              onChange={e =>
                onChange({
                  ...config,
                  bedrock: {
                    ...config.bedrock,
                    sessionToken: e.target.value,
                  },
                })
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Model</label>
            <select
              value={config.bedrock.model}
              onChange={e =>
                onChange({
                  ...config,
                  bedrock: { ...config.bedrock, model: e.target.value },
                })
              }
              className={selectCls}
            >
              {BEDROCK_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label} {m.multimodal ? '(multimodal)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {configLoaded && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className="w-full py-2 text-xs font-medium rounded-md border transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved (encrypted)'
                : saveStatus === 'error'
                  ? 'Save failed — retry'
                  : 'Save credentials to disk'}
          </button>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            AES-256-GCM encrypted, stored locally
          </p>
        </div>
      )}
    </div>
  );
}

function CredentialsPastePanel({ onApply }: { onApply: (creds: ParsedCreds) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleApply = () => {
    const creds = parseAwsCredentials(text);
    const found = Object.values(creds).filter(Boolean).length;
    if (found === 0) {
      setMsg({ ok: false, text: 'No credentials found — check the format.' });
      return;
    }
    onApply(creds);
    const parts = [
      creds.accessKeyId && 'Access Key ID',
      creds.secretAccessKey && 'Secret Access Key',
      creds.sessionToken && 'Session Token',
      creds.region && 'Region',
    ].filter(Boolean).join(', ');
    setMsg({ ok: true, text: `Applied: ${parts}` });
    setText('');
  };

  return (
    <div className="border border-orange-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setMsg(null); }}
        className="w-full flex items-center justify-between px-3 py-2 bg-orange-50 hover:bg-orange-100 text-xs font-medium text-orange-800 transition-colors"
      >
        <span>Paste credentials profile</span>
        <span className="text-orange-500 text-[10px]">{open ? '▲ hide' : '▼ expand'}</span>
      </button>
      {open && (
        <div className="p-3 bg-white space-y-2">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Paste the block from <code className="bg-gray-100 px-1 rounded">~/.aws/credentials</code> or
            the "Copy credentials" text from the AWS SSO portal.
          </p>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setMsg(null); }}
            rows={5}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
            placeholder={'[my-profile]\naws_access_key_id=ASIA...\naws_secret_access_key=...\naws_session_token=...'}
            spellCheck={false}
          />
          {msg && (
            <p className={`text-[10px] font-medium ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
              {msg.ok ? '✓' : '✗'} {msg.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!text.trim()}
              className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => { setText(''); setMsg(null); setOpen(false); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
