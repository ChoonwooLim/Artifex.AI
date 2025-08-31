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

export class LocalOllamaService extends LocalLLMService {
  private client: AxiosInstance;
  private modelLoaded: boolean = false;
  private currentModel: string;
  private ollamaProcess: any = null;
  private ollamaPath: string;
  private isLocalMode: boolean = true;

  constructor(config?: Partial<LocalLLMConfig>) {
    super({
      provider: 'ollama',
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'llava:7b',
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
    
    // 로컬 Ollama 경로 설정 (Electron 환경)
    if (typeof window !== 'undefined' && (window as any).electron) {
      this.ollamaPath = 'ollama-local';
    } else {
      this.ollamaPath = 'ollama-local';
    }
  }

  /**
   * 로컬 Ollama 서버 시작
   */
  async startLocalOllama(): Promise<void> {
    // Electron 환경에서는 main process를 통해 실행해야 함
    if (typeof window !== 'undefined' && (window as any).electron) {
      try {
        // IPC를 통해 main process에 요청
        await (window as any).electron.startOllama();
        console.log('로컬 Ollama 서버 시작 요청됨');
      } catch (error) {
        console.error('Failed to start Ollama:', error);
        throw new Error('로컬 Ollama를 시작할 수 없습니다.');
      }
    } else {
      console.warn('Electron 환경이 아닙니다. Ollama를 수동으로 시작하세요.');
    }
    
    // 서버 시작 대기
    return new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * 로컬 Ollama 서버 중지
   */
  async stopLocalOllama(): Promise<void> {
    if (this.ollamaProcess) {
      this.ollamaProcess.kill();
      this.ollamaProcess = null;
      console.log('로컬 Ollama 서버 중지됨');
    }
  }

  /**
   * Ensure Ollama service is running (로컬 모드 자동 시작)
   */
  async ensureServiceRunning(): Promise<boolean> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy && this.isLocalMode) {
        console.log('Ollama 서비스가 실행중이 아닙니다. 로컬 서버를 시작합니다...');
        await this.startLocalOllama();
        
        // 재시도
        const retryHealthy = await this.checkHealth();
        return retryHealthy;
      }
      return healthy;
    } catch (error) {
      console.error('Ollama 서비스 확인 실패:', error);
      return false;
    }
  }

  /**
   * 사용 가능한 모델 확인 및 자동 다운로드
   */
  async ensureModelAvailable(modelName?: string): Promise<boolean> {
    const model = modelName || this.currentModel;
    
    try {
      const models = await this.listModels();
      if (!models.includes(model)) {
        console.log(`모델 ${model}을 찾을 수 없습니다. 다운로드를 시작합니다...`);
        
        // 로컬 모드에서 자동 다운로드
        if (this.isLocalMode) {
          await this.pullModel(model);
          
          // 다운로드 후 재확인
          const updatedModels = await this.listModels();
          if (!updatedModels.includes(model)) {
            console.error(`모델 ${model} 다운로드 실패`);
            return false;
          }
        } else {
          console.log(`사용 가능한 모델:`, models);
          console.log(`모델 다운로드: ollama pull ${model}`);
          return false;
        }
      }

      // 모델을 메모리에 로드
      if (!this.modelLoaded) {
        await this.loadModel(model);
      }

      return true;
    } catch (error) {
      console.error('모델 가용성 확인 실패:', error);
      return false;
    }
  }

  /**
   * Load model into memory
   */
  async loadModel(modelName: string): Promise<void> {
    try {
      console.log(`모델 ${modelName} 로딩중...`);
      
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
      console.log(`모델 ${modelName} 로드 완료`);
    } catch (error) {
      console.error(`모델 ${modelName} 로드 실패:`, error);
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
      console.error(`모델 정보 조회 실패 ${model}:`, error);
      return null;
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    console.log(`모델 ${modelName} 다운로드중... 몇 분 정도 걸릴 수 있습니다.`);
    
    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false
      }, {
        timeout: 600000 // 10 minutes for large models
      });

      console.log(`모델 ${modelName} 다운로드 완료`);
      return response.data;
    } catch (error) {
      console.error(`모델 ${modelName} 다운로드 실패:`, error);
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
      console.log(`모델 ${modelName} 삭제 완료`);
    } catch (error) {
      console.error(`모델 ${modelName} 삭제 실패:`, error);
      throw error;
    }
  }

  /**
   * Enhanced multimodal chat with auto-start
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
    // 서비스와 모델 준비 확인
    const serviceRunning = await this.ensureServiceRunning();
    if (!serviceRunning) {
      throw new Error('Ollama 서비스를 시작할 수 없습니다.');
    }

    const modelAvailable = await this.ensureModelAvailable();
    if (!modelAvailable) {
      throw new Error(`모델 ${this.currentModel}을 사용할 수 없습니다.`);
    }

    // 기본 시스템 프롬프트 추가 (없을 경우)
    const enhancedMessages = [...messages];
    if (!messages.some(msg => msg.role === 'system')) {
      enhancedMessages.unshift({
        role: 'system',
        content: '당신은 정확하고 도움이 되는 AI 어시스턴트입니다. 사실만을 말하고, 모르는 것은 모른다고 대답합니다. 간결하고 명확하게 답변하며, 불필요한 반복을 피합니다. 사용자의 질문에 직접적으로 답변하세요.'
      });
    }

    return super.chat(enhancedMessages, options);
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
    const analysisPrompt = prompt || `한국어로 답변해주세요. 이 이미지를 분석하고 다음을 제공하세요:
    1. 자세한 설명
    2. 감지된 객체 목록
    3. 이미지에 보이는 텍스트
    4. 주요 색상
    
    한국어 JSON 형식으로 응답하세요.`;

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
    const prompt = `한국어로 답하세요. 이 스크립트를 ${duration}초 비디오의 장면으로 나누세요:

"${script}"

각 장면에 대해 제공:
1. 장면 번호
2. 지속 시간(초)
3. 시각적 설명
4. 필요한 시각 요소
5. 다음 장면으로의 전환

JSON 배열 형식으로.`;

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
        description: `장면 ${i + 1}`,
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
        ? '한국어로 답하세요. 이 프레임들에서 일어나는 일을 요약하세요.'
        : task === 'detect-changes'
        ? '한국어로 답하세요. 이 프레임들 사이의 주요 변화를 감지하세요.'
        : '한국어로 답하세요. 가장 흥미롭거나 중요한 순간을 식별하세요.';

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
      console.error('상태 확인 실패:', error);
    }

    return status;
  }

  /**
   * 로컬 모드 설정
   */
  setLocalMode(enabled: boolean): void {
    this.isLocalMode = enabled;
  }

  /**
   * Cleanup on service destroy
   */
  async destroy(): Promise<void> {
    await this.stopLocalOllama();
  }
}