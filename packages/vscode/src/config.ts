import * as vscode from 'vscode';
import type { RoastConfig, Provider } from '@git-gud/core';

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
    commitMessageStyle: c.get<'clean' | 'savage'>('commitMessageStyle', 'clean'),
  };
}

export function getRoastConfig(config: GitGudConfig): RoastConfig | undefined {
  const p = config.aiProvider;
  console.log(`[GitGud] getRoastConfig: provider=${p}`);

  if (p === 'gemini' && config.geminiApiKey) {
    return { provider: 'gemini', gemini: { apiKey: config.geminiApiKey, model: config.geminiModel || undefined } };
  }
  if (p === 'claude' && config.claudeApiKey) {
    return { provider: 'claude', claude: { apiKey: config.claudeApiKey, model: config.claudeModel || undefined } };
  }
  if (p === 'openai' && config.openaiApiKey) {
    return { provider: 'openai', openai: { apiKey: config.openaiApiKey, model: config.openaiModel || undefined } };
  }
  if (p === 'xai' && config.xaiApiKey) {
    return { provider: 'xai', xai: { apiKey: config.xaiApiKey, model: config.xaiModel || undefined } };
  }
  if (p === 'ollama' && config.ollamaApiKey) {
    return { provider: 'ollama', ollama: { apiKey: config.ollamaApiKey, model: config.ollamaModel || undefined, baseUrl: config.ollamaBaseUrl || undefined } };
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
