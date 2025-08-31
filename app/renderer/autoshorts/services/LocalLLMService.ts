import axios from 'axios';

export interface LocalLLMConfig {
  provider: 'ollama' | 'llamacpp' | 'lmstudio';
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class LocalLLMService {
  private config: LocalLLMConfig;

  constructor(config?: Partial<LocalLLMConfig>) {
    this.config = {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'qwen2-vl:7b',
      temperature: 0.7,
      maxTokens: 2048,
      ...config
    };
  }

  /**
   * Ollama 서버 상태 확인
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  /**
   * 멀티모달 채팅 (텍스트 + 이미지)
   */
  async chat(
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      images?: string[]; // base64 or URLs
    }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    if (this.config.provider === 'ollama') {
      return this.ollamaChat(messages, options);
    } else if (this.config.provider === 'llamacpp') {
      return this.llamaCppChat(messages, options);
    } else {
      throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Ollama API 호출
   */
  private async ollamaChat(
    messages: any[],
    options?: any
  ): Promise<string> {
    try {
      // 이미지 처리: base64 데이터 URL을 순수 base64로 변환
      const processedMessages = messages.map(msg => {
        const processedMsg: any = {
          role: msg.role,
          content: msg.content
        };
        
        if (msg.images && msg.images.length > 0) {
          // data:image/png;base64, 부분을 제거하고 순수 base64만 추출
          processedMsg.images = msg.images.map((img: string) => {
            if (img.startsWith('data:')) {
              return img.split(',')[1];
            }
            return img;
          });
        }
        
        return processedMsg;
      });
      
      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        {
          model: this.config.model,
          messages: processedMessages,
          stream: false,
          options: {
            temperature: options?.temperature || this.config.temperature,
            num_predict: options?.maxTokens || this.config.maxTokens
          }
        }
      );

      return response.data.message?.content || '';
    } catch (error: any) {
      console.error('Ollama chat error:', error);
      throw new Error(`LLM Error: ${error.message}`);
    }
  }

  /**
   * llama.cpp 서버 API 호출
   */
  private async llamaCppChat(
    messages: any[],
    options?: any
  ): Promise<string> {
    try {
      // llama.cpp 서버는 OpenAI 호환 API 제공
      const response = await axios.post(
        `${this.config.baseUrl}/v1/chat/completions`,
        {
          model: this.config.model,
          messages,
          temperature: options?.temperature || this.config.temperature,
          max_tokens: options?.maxTokens || this.config.maxTokens
        }
      );

      return response.data.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      console.error('llama.cpp chat error:', error);
      throw new Error(`LLM Error: ${error.message}`);
    }
  }

  /**
   * 비디오 분석 (프레임 추출 후 분석)
   */
  async analyzeVideo(
    frames: string[], // base64 encoded frames
    prompt: string
  ): Promise<{
    summary: string;
    keyMoments: Array<{ frameIndex: number; description: string }>;
    suggestions: string[];
  }> {
    const systemPrompt = `You are a video analyst. Analyze the provided video frames and respond in JSON format with:
    1. summary: Overall video summary
    2. keyMoments: Array of important moments with frame indices
    3. suggestions: Recommendations for creating short-form content`;

    const userPrompt = `${prompt}\n\nAnalyze these ${frames.length} video frames.`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt, images: frames.slice(0, 10) } // 최대 10프레임
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: response,
        keyMoments: [],
        suggestions: []
      };
    }
  }

  /**
   * 이미지 캡션 생성
   */
  async generateCaption(
    image: string, // base64
    style: 'descriptive' | 'creative' | 'technical' = 'descriptive'
  ): Promise<string> {
    const prompts = {
      descriptive: 'Describe this image in detail.',
      creative: 'Write a creative and engaging caption for this image.',
      technical: 'Provide technical analysis of this image including composition, lighting, and elements.'
    };

    return await this.chat([
      { role: 'user', content: prompts[style], images: [image] }
    ]);
  }

  /**
   * OCR (텍스트 추출)
   */
  async extractText(image: string): Promise<string> {
    return await this.chat([
      { 
        role: 'user', 
        content: 'Extract all text from this image. Return only the text, no explanations.', 
        images: [image] 
      }
    ]);
  }

  /**
   * 비디오 스크립트 생성 (이미지 참조)
   */
  async generateVideoScript(
    topic: string,
    referenceImages?: string[],
    duration: number = 60
  ): Promise<{
    title: string;
    hook: string;
    script: string;
    visualSuggestions: string[];
  }> {
    let prompt = `Create a ${duration}-second video script about "${topic}".`;
    
    if (referenceImages?.length) {
      prompt += ' Use the provided images as visual references.';
    }

    prompt += ` Format the response as JSON with:
    - title: Catchy video title
    - hook: First 3 seconds hook
    - script: Full narration script
    - visualSuggestions: List of visual elements needed`;

    const response = await this.chat([
      { 
        role: 'user', 
        content: prompt, 
        images: referenceImages?.slice(0, 5) 
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        title: topic,
        hook: '',
        script: response,
        visualSuggestions: []
      };
    }
  }

  /**
   * 스트리밍 응답 (실시간 생성)
   */
  async *streamChat(
    messages: any[]
  ): AsyncGenerator<string, void, unknown> {
    if (this.config.provider !== 'ollama') {
      throw new Error('Streaming only supported with Ollama');
    }

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        {
          model: this.config.model,
          messages,
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield json.message.content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    }
  }
}