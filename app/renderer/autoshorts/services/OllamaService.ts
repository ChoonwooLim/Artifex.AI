import axios, { AxiosInstance } from 'axios';
import { LocalLLMService, LocalLLMConfig } from './LocalLLMService';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

export class OllamaService extends LocalLLMService {
  private client: AxiosInstance;
  private modelLoaded: boolean = false;
  private currentModel: string;

  constructor(config?: Partial<LocalLLMConfig>) {
    super({
      provider: 'ollama',
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'qwen2-vl:7b',
      ...config
    });

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 120000, // 2 minutes timeout for long operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.currentModel = this.config.model;
  }

  /**
   * Ensure Ollama service is running
   */
  async ensureServiceRunning(): Promise<boolean> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) {
        console.log('Ollama service not running. Please start it with: ollama serve');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to check Ollama service:', error);
      return false;
    }
  }

  /**
   * Ensure model is available and loaded
   */
  async ensureModelAvailable(modelName?: string): Promise<boolean> {
    const model = modelName || this.currentModel;
    
    try {
      const models = await this.listModels();
      if (!models.includes(model)) {
        console.log(`Model ${model} not found. Available models:`, models);
        console.log(`Pull the model with: ollama pull ${model}`);
        return false;
      }

      // Load model into memory
      if (!this.modelLoaded) {
        await this.loadModel(model);
      }

      return true;
    } catch (error) {
      console.error('Failed to ensure model availability:', error);
      return false;
    }
  }

  /**
   * Load model into memory
   */
  async loadModel(modelName: string): Promise<void> {
    try {
      console.log(`Loading model ${modelName}...`);
      
      // Send a simple request to load the model
      await this.client.post('/api/generate', {
        model: modelName,
        prompt: 'Hello',
        stream: false,
        options: {
          num_predict: 1
        }
      });

      this.modelLoaded = true;
      this.currentModel = modelName;
      console.log(`Model ${modelName} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed model information
   */
  async getModelInfo(modelName?: string): Promise<any> {
    const model = modelName || this.currentModel;
    
    try {
      const response = await this.client.post('/api/show', {
        name: model
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get model info for ${model}:`, error);
      return null;
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    console.log(`Pulling model ${modelName}... This may take several minutes.`);
    
    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false
      }, {
        timeout: 600000 // 10 minutes for large models
      });

      console.log(`Model ${modelName} pulled successfully`);
      return response.data;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.client.delete('/api/delete', {
        data: { name: modelName }
      });
      console.log(`Model ${modelName} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced multimodal chat with better error handling
   */
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
    // Ensure service and model are ready
    const serviceRunning = await this.ensureServiceRunning();
    if (!serviceRunning) {
      throw new Error('Ollama service is not running. Start it with: ollama serve');
    }

    const modelAvailable = await this.ensureModelAvailable();
    if (!modelAvailable) {
      throw new Error(`Model ${this.currentModel} is not available`);
    }

    return super.chat(messages, options);
  }

  /**
   * Analyze image with enhanced capabilities
   */
  async analyzeImage(
    image: string,
    prompt?: string
  ): Promise<{
    description: string;
    objects: Array<{ name: string; confidence: number }>;
    text?: string;
    colors?: string[];
  }> {
    const analysisPrompt = prompt || `Analyze this image and provide:
    1. A detailed description
    2. List of objects detected
    3. Any text visible in the image
    4. Dominant colors
    
    Respond in JSON format.`;

    const response = await this.chat([
      {
        role: 'user',
        content: analysisPrompt,
        images: [image]
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        description: response,
        objects: [],
        text: undefined,
        colors: undefined
      };
    }
  }

  /**
   * Generate video scenes from script
   */
  async generateVideoScenes(
    script: string,
    duration: number = 60
  ): Promise<Array<{
    sceneNumber: number;
    duration: number;
    description: string;
    visualElements: string[];
    transitions: string;
  }>> {
    const prompt = `Break down this script into video scenes for a ${duration}-second video:

"${script}"

For each scene provide:
1. Scene number
2. Duration in seconds
3. Visual description
4. Required visual elements
5. Transition to next scene

Format as JSON array.`;

    const response = await this.chat([
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      // Fallback to basic scene generation
      const scenes = Math.ceil(duration / 10);
      return Array.from({ length: scenes }, (_, i) => ({
        sceneNumber: i + 1,
        duration: 10,
        description: `Scene ${i + 1}`,
        visualElements: [],
        transitions: 'cut'
      }));
    }
  }

  /**
   * Process video frames with batch optimization
   */
  async processVideoFrames(
    frames: string[],
    task: 'summarize' | 'detect-changes' | 'extract-highlights'
  ): Promise<any> {
    const batchSize = 5; // Process 5 frames at a time
    const results = [];

    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      
      const prompt = task === 'summarize' 
        ? 'Summarize what happens in these frames'
        : task === 'detect-changes'
        ? 'Detect major changes between these frames'
        : 'Identify the most interesting or important moments';

      const response = await this.chat([
        {
          role: 'user',
          content: prompt,
          images: batch
        }
      ]);

      results.push({
        frameRange: [i, Math.min(i + batchSize - 1, frames.length - 1)],
        analysis: response
      });
    }

    return results;
  }

  /**
   * Health check with detailed status
   */
  async getHealthStatus(): Promise<{
    service: boolean;
    model: boolean;
    memory: number;
    gpu: boolean;
    details?: any;
  }> {
    const status = {
      service: false,
      model: false,
      memory: 0,
      gpu: false,
      details: null
    };

    try {
      // Check service
      status.service = await this.checkHealth();
      
      if (status.service) {
        // Check model
        const models = await this.listModels();
        status.model = models.includes(this.currentModel);
        
        // Get model info for memory usage
        if (status.model) {
          const info = await this.getModelInfo();
          status.details = info;
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return status;
  }
}