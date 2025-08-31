import { LocalLLMService, LocalLLMConfig } from './LocalLLMService';

export class MockOllamaService extends LocalLLMService {
  private isHealthy = false;
  
  constructor(config?: Partial<LocalLLMConfig>) {
    super({
      provider: 'ollama',
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'mock-model',
      ...config
    });
  }

  async checkHealth(): Promise<boolean> {
    // Simulate Ollama not being installed
    return this.isHealthy;
  }

  async listModels(): Promise<string[]> {
    // Return empty array when not healthy
    if (!this.isHealthy) return [];
    return ['mock-model'];
  }

  async chat(
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      images?: string[];
    }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    if (!this.isHealthy) {
      throw new Error('Ollama is not installed. Please install Ollama from https://ollama.com/download/windows');
    }
    
    // Return mock response
    return `This is a mock response. Please install Ollama to use real AI features.
    
To install:
1. Download from https://ollama.com/download/windows
2. Run the installer
3. Start Ollama: ollama serve
4. Download model: ollama pull qwen2-vl:7b`;
  }

  // Enable mock service for testing
  enableMock() {
    this.isHealthy = true;
  }
  
  // Disable mock service
  disableMock() {
    this.isHealthy = false;
  }
}