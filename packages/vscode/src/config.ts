import * as vscode from 'vscode';
import type { RoastConfig } from '@git-gud/core';

export type RoastIntensity = 'mild' | 'medium' | 'savage';

export interface GitGudConfig {
  enabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  roastIntensity: RoastIntensity;
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
}

export function getConfig(): GitGudConfig {
  const c = vscode.workspace.getConfiguration('gitgud');
  return {
    enabled: c.get<boolean>('enabled', true),
    notificationsEnabled: c.get<boolean>('notificationsEnabled', true),
    soundEnabled: c.get<boolean>('soundEnabled', true),
    roastIntensity: c.get<RoastIntensity>('roastIntensity', 'medium'),
    ollamaApiKey: c.get<string>('ollamaApiKey', ''),
    ollamaModel: c.get<string>('ollamaModel', ''),
    ollamaBaseUrl: c.get<string>('ollamaBaseUrl', ''),
  };
}

export function getRoastConfig(config: GitGudConfig): RoastConfig | undefined {
  if (!config.ollamaApiKey) return undefined;
  return {
    ollamaApiKey: config.ollamaApiKey,
    ollamaModel: config.ollamaModel || undefined,
    ollamaBaseUrl: config.ollamaBaseUrl || undefined,
  };
}

export function onConfigChange(callback: (config: GitGudConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitgud')) {
      callback(getConfig());
    }
  });
}
