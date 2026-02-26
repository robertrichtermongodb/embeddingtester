import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100_000;

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class SecureConfigStore {
  private configDir: string;
  private masterKeyPath: string;
  private credentialsPath: string;
  private masterKey: Buffer | null = null;

  constructor(baseDir: string) {
    this.configDir = path.join(baseDir, 'config');
    this.masterKeyPath = path.join(this.configDir, 'master.key');
    this.credentialsPath = path.join(this.configDir, 'credentials.enc');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });

    try {
      const keyData = await fs.readFile(this.masterKeyPath, 'utf8');
      this.masterKey = Buffer.from(keyData.trim(), 'base64');
    } catch {
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
      await fs.writeFile(this.masterKeyPath, this.masterKey.toString('base64'), { mode: 0o600 });
    }

    console.log(
      `SecureConfigStore initialized (config dir: ${this.configDir}, ` +
        `has saved config: ${await this.hasConfig()})`,
    );
  }

  async hasConfig(): Promise<boolean> {
    try {
      await fs.access(this.credentialsPath);
      return true;
    } catch {
      return false;
    }
  }

  private encrypt(data: string): string {
    if (!this.masterKey) throw new Error('Store not initialized');

    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.pbkdf2Sync(this.masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
  }

  private decrypt(encryptedData: string): string {
    if (!this.masterKey) throw new Error('Store not initialized');

    const combined = Buffer.from(encryptedData, 'base64');
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = crypto.pbkdf2Sync(this.masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  async saveConfig(config: Record<string, unknown>): Promise<void> {
    let existing: Record<string, unknown> = {};
    if (await this.hasConfig()) {
      try {
        existing = await this.loadConfig();
      } catch (e) {
        console.warn('Could not read existing config, overwriting:', e instanceof Error ? e.message : e);
        existing = {};
      }
    }

    const merged = deepMerge(existing, config);
    const json = JSON.stringify(merged, null, 2);
    const encrypted = this.encrypt(json);

    await fs.writeFile(this.credentialsPath, encrypted, { mode: 0o600 });
  }

  async loadConfig(): Promise<Record<string, unknown>> {
    if (!(await this.hasConfig())) return {};

    const encrypted = (await fs.readFile(this.credentialsPath, 'utf8')).trim();
    const json = this.decrypt(encrypted);
    return JSON.parse(json);
  }

  async deleteConfig(): Promise<void> {
    try {
      await fs.unlink(this.credentialsPath);
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) continue;
    const sv = source[key];
    const tv = target[key];
    if (
      sv && typeof sv === 'object' && !Array.isArray(sv) &&
      tv && typeof tv === 'object' && !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}
