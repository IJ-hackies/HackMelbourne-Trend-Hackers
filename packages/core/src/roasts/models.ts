export type Provider = 'ollama' | 'gemini' | 'claude' | 'openai' | 'xai';

export const PROVIDER_MODELS = {
  ollama: ['deepseek-v4-flash:cloud', 'deepseek-v4-pro:cloud', 'kimi-k2.6:cloud', 'glm-5.1:cloud', 'gemma4:cloud', 'qwen3.5:cloud'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
  claude: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  openai: ['gpt-5', 'gpt-4o', 'gpt-4o-mini', 'o1-mini'],
  xai: ['grok-4', 'grok-3', 'grok-3-mini'],
} as const;

export const DEFAULT_MODELS: Record<Provider, string> = {
  ollama: 'deepseek-v4-flash:cloud',
  gemini: 'gemini-2.5-flash',
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  xai: 'grok-3-mini',
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  ollama: 'Ollama',
  gemini: 'Gemini',
  claude: 'Claude',
  openai: 'ChatGPT',
  xai: 'Grok',
};
