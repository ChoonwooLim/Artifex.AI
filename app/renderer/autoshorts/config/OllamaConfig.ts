export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  streamResponse: boolean;
  timeout: number;
  gpuLayers?: number;
  contextSize?: number;
}

export const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'qwen2-vl:7b',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  topK: 40,
  streamResponse: false,
  timeout: 120000,
  gpuLayers: -1, // Use all GPU layers
  contextSize: 4096
};

export const MODEL_CONFIGS: Record<string, Partial<OllamaConfig>> = {
  'qwen2-vl:7b': {
    temperature: 0.7,
    maxTokens: 2048,
    contextSize: 4096
  },
  'qwen2-vl:2b': {
    temperature: 0.8,
    maxTokens: 1024,
    contextSize: 2048
  },
  'llava:7b': {
    temperature: 0.7,
    maxTokens: 2048,
    contextSize: 4096
  },
  'llava:13b': {
    temperature: 0.6,
    maxTokens: 4096,
    contextSize: 8192
  },
  'bakllava:7b': {
    temperature: 0.7,
    maxTokens: 2048,
    contextSize: 4096
  }
};

export const TASK_PRESETS = {
  videoAnalysis: {
    temperature: 0.5,
    maxTokens: 2048,
    topP: 0.85
  },
  scriptGeneration: {
    temperature: 0.8,
    maxTokens: 4096,
    topP: 0.95
  },
  imageCaption: {
    temperature: 0.3,
    maxTokens: 256,
    topP: 0.8
  },
  ocr: {
    temperature: 0.1,
    maxTokens: 1024,
    topP: 0.9
  }
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: OllamaConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  loadConfig(): OllamaConfig {
    const stored = localStorage.getItem('ollamaConfig');
    if (stored) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }

  saveConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('ollamaConfig', JSON.stringify(this.config));
  }

  getConfig(): OllamaConfig {
    return this.config;
  }

  applyPreset(preset: keyof typeof TASK_PRESETS): void {
    const presetConfig = TASK_PRESETS[preset];
    this.saveConfig(presetConfig);
  }

  applyModelConfig(model: string): void {
    const modelConfig = MODEL_CONFIGS[model];
    if (modelConfig) {
      this.saveConfig({ model, ...modelConfig });
    }
  }

  resetToDefault(): void {
    this.config = DEFAULT_CONFIG;
    localStorage.removeItem('ollamaConfig');
  }
}