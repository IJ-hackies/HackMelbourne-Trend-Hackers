import * as vscode from 'vscode';
import type { RoastConfig } from '@git-gud/core';

export interface GitGudConfig {
  enabled: boolean;
  aiProvider: 'ollama' | 'gemini';
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  geminiApiKey: string;
  voiceEnabled: boolean;
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
    commitMessageStyle: c.get<'clean' | 'savage'>('commitMessageStyle', 'clean'),
  };
}

export function getRoastConfig(config: GitGudConfig): RoastConfig | undefined {
  if (config.aiProvider === 'gemini' && config.geminiApiKey) {
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey } };
  }
  if (config.ollamaApiKey) {
    return {
      provider: config.aiProvider,
      ollama: { apiKey: config.ollamaApiKey, model: config.ollamaModel || undefined, baseUrl: config.ollamaBaseUrl || undefined },
    };
  }
  if (config.geminiApiKey) {
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey } };
  }
  return undefined;
}

export function onConfigChange(callback: (config: GitGudConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitgud')) {
      callback(getConfig());
    }
  });
}
