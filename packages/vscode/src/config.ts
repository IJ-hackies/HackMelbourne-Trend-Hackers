import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { RoastConfig, Provider, ReactionImageEntry } from '@git-gud/core';

export interface GitGudConfig {
  enabled: boolean;
  aiProvider: Provider;
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  claudeApiKey: string;
  claudeModel: string;
  openaiApiKey: string;
  openaiModel: string;
  xaiApiKey: string;
  xaiModel: string;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  commitMessageStyle: 'clean' | 'savage';
}

export function getConfig(): GitGudConfig {
  const c = vscode.workspace.getConfiguration('gitgud');
  return {
    enabled: c.get<boolean>('enabled', true),
    aiProvider: c.get<Provider>('aiProvider', 'gemini'),
    ollamaApiKey: c.get<string>('ollamaApiKey', ''),
    ollamaModel: c.get<string>('ollamaModel', ''),
    ollamaBaseUrl: c.get<string>('ollamaBaseUrl', ''),
    geminiApiKey: c.get<string>('geminiApiKey', ''),
    geminiModel: c.get<string>('geminiModel', 'gemini-2.5-flash'),
    claudeApiKey: c.get<string>('claudeApiKey', ''),
    claudeModel: c.get<string>('claudeModel', 'claude-sonnet-4-6'),
    openaiApiKey: c.get<string>('openaiApiKey', ''),
    openaiModel: c.get<string>('openaiModel', 'gpt-4o-mini'),
    xaiApiKey: c.get<string>('xaiApiKey', ''),
    xaiModel: c.get<string>('xaiModel', 'grok-3-mini'),
    voiceEnabled: c.get<boolean>('voiceEnabled', false),
    soundEnabled: c.get<boolean>('soundEnabled', true),
    commitMessageStyle: c.get<'clean' | 'savage'>('commitMessageStyle', 'clean'),
  };
}

let cachedReactionImages: ReactionImageEntry[] | undefined;

export function loadReactionImages(extensionPath: string): ReactionImageEntry[] {
  if (cachedReactionImages) return cachedReactionImages;
  try {
    const jsonPath = path.join(extensionPath, 'media', 'reactions', 'reactions.json');
    const manifest = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    cachedReactionImages = manifest.images ?? [];
  } catch {
    cachedReactionImages = [];
  }
  return cachedReactionImages!;
}

export function getRoastConfig(config: GitGudConfig, extensionPath?: string): RoastConfig | undefined {
  const p = config.aiProvider;
  console.log(`[GitGud] getRoastConfig: provider=${p}`);
  const reactionImages = extensionPath ? loadReactionImages(extensionPath) : undefined;

  if (p === 'gemini' && config.geminiApiKey) {
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey, model: config.geminiModel || undefined }, reactionImages };
  }
  if (p === 'claude' && config.claudeApiKey) {
    return { provider: 'claude', claude: { apiKey: config.claudeApiKey, model: config.claudeModel || undefined }, reactionImages };
  }
  if (p === 'openai' && config.openaiApiKey) {
    return { provider: 'openai', openai: { apiKey: config.openaiApiKey, model: config.openaiModel || undefined }, reactionImages };
  }
  if (p === 'xai' && config.xaiApiKey) {
    return { provider: 'xai', xai: { apiKey: config.xaiApiKey, model: config.xaiModel || undefined }, reactionImages };
  }
  if (p === 'ollama' && config.ollamaApiKey) {
    return { provider: 'ollama', ollama: { apiKey: config.ollamaApiKey, model: config.ollamaModel || undefined, baseUrl: config.ollamaBaseUrl || undefined }, reactionImages };
  }
  console.log('[GitGud] No API key configured for selected provider — roasts will use templates only');
  return undefined;
}

export function onConfigChange(callback: (config: GitGudConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitgud')) {
      callback(getConfig());
    }
  });
}
