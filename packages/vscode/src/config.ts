import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { RoastConfig, ReactionImageEntry } from '@git-gud/core';

export interface GitGudConfig {
  enabled: boolean;
  aiProvider: 'ollama' | 'gemini';
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  geminiApiKey: string;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  commitMessageStyle: 'clean' | 'savage';
}

export function getConfig(): GitGudConfig {
  const c = vscode.workspace.getConfiguration('gitgud');
  return {
    enabled: c.get<boolean>('enabled', true),
    aiProvider: c.get<'ollama' | 'gemini'>('aiProvider', 'ollama'),
    ollamaApiKey: c.get<string>('ollamaApiKey', ''),
    ollamaModel: c.get<string>('ollamaModel', ''),
    ollamaBaseUrl: c.get<string>('ollamaBaseUrl', ''),
    geminiApiKey: c.get<string>('geminiApiKey', ''),
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
  return cachedReactionImages;
}

export function getRoastConfig(config: GitGudConfig, extensionPath?: string): RoastConfig | undefined {
  console.log(`[GitGud] getRoastConfig: provider=${config.aiProvider}, ollamaKey=${config.ollamaApiKey ? 'SET(' + config.ollamaApiKey.slice(0, 4) + '...)' : 'EMPTY'}, geminiKey=${config.geminiApiKey ? 'SET(' + config.geminiApiKey.slice(0, 4) + '...)' : 'EMPTY'}`);

  const reactionImages = extensionPath ? loadReactionImages(extensionPath) : [];

  if (config.aiProvider === 'gemini' && config.geminiApiKey) {
    console.log('[GitGud] Using Gemini provider');
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey }, reactionImages };
  }
  if (config.ollamaApiKey) {
    console.log(`[GitGud] Using Ollama provider (model=${config.ollamaModel || 'default'}, url=${config.ollamaBaseUrl || 'default'})`);
    return {
      provider: config.aiProvider,
      ollama: { apiKey: config.ollamaApiKey, model: config.ollamaModel || undefined, baseUrl: config.ollamaBaseUrl || undefined },
      reactionImages,
    };
  }
  if (config.geminiApiKey) {
    console.log('[GitGud] Falling back to Gemini provider');
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey }, reactionImages };
  }
  console.log('[GitGud] No API keys configured — roasts will use templates only');
  return undefined;
}

export function onConfigChange(callback: (config: GitGudConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitgud')) {
      callback(getConfig());
    }
  });
}
