import axios from 'axios';

export interface CloudLLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface';
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export class CloudLLMService {
  private config: CloudLLMConfig;

  constructor(config: CloudLLMConfig) {
    this.config = config;
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
    switch (this.config.provider) {
      case 'openai':
        return this.openAIChat(messages, options);
      case 'anthropic':
        return this.anthropicChat(messages, options);
      case 'google':
        return this.googleChat(messages, options);
      case 'cohere':
        return this.cohereChat(messages, options);
      case 'huggingface':
        return this.huggingfaceChat(messages, options);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async openAIChat(messages: any[], options?: any): Promise<string> {
    try {
      const processedMessages = messages.map(msg => {
        const message: any = {
          role: msg.role,
          content: []
        };

        // Add text content
        if (msg.content) {
          message.content.push({
            type: 'text',
            text: msg.content
          });
        }

        // Add images for vision models
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach((image: string) => {
            message.content.push({
              type: 'image_url',
              image_url: {
                url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
              }
            });
          });
        }

        // If only text, simplify to string
        if (message.content.length === 1 && message.content[0].type === 'text') {
          message.content = message.content[0].text;
        }

        return message;
      });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.config.model,
          messages: processedMessages,
          temperature: options?.temperature || this.config.temperature || 0.7,
          max_tokens: options?.maxTokens || this.config.maxTokens || 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error);
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async anthropicChat(messages: any[], options?: any): Promise<string> {
    try {
      // Convert to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.config.model,
          system: systemMessage,
          messages: conversationMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          max_tokens: options?.maxTokens || this.config.maxTokens || 1000,
          temperature: options?.temperature || this.config.temperature || 0.7
        },
        {
          headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error: any) {
      console.error('Anthropic API error:', error.response?.data || error);
      throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async googleChat(messages: any[], options?: any): Promise<string> {
    try {
      // Convert to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: options?.temperature || this.config.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || this.config.maxTokens || 1000
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('Google AI API error:', error.response?.data || error);
      throw new Error(`Google AI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async cohereChat(messages: any[], options?: any): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: this.config.model,
          message: messages[messages.length - 1].content,
          chat_history: messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'USER' : 'CHATBOT',
            message: msg.content
          })),
          temperature: options?.temperature || this.config.temperature || 0.7,
          max_tokens: options?.maxTokens || this.config.maxTokens || 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.text;
    } catch (error: any) {
      console.error('Cohere API error:', error.response?.data || error);
      throw new Error(`Cohere API error: ${error.response?.data?.message || error.message}`);
    }
  }

  private async huggingfaceChat(messages: any[], options?: any): Promise<string> {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.config.model}`,
        {
          inputs: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          parameters: {
            temperature: options?.temperature || this.config.temperature || 0.7,
            max_new_tokens: options?.maxTokens || this.config.maxTokens || 1000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data[0].generated_text;
    } catch (error: any) {
      console.error('HuggingFace API error:', error.response?.data || error);
      throw new Error(`HuggingFace API error: ${error.response?.data?.error || error.message}`);
    }
  }

  validateApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  getModelList(): string[] {
    switch (this.config.provider) {
      case 'openai':
        return [
          'gpt-4-turbo-preview',
          'gpt-4-vision-preview', 
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k'
        ];
      case 'anthropic':
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-2.1',
          'claude-instant-1.2'
        ];
      case 'google':
        return [
          'gemini-pro',
          'gemini-pro-vision',
          'gemini-1.5-pro',
          'gemini-1.5-flash'
        ];
      case 'cohere':
        return [
          'command',
          'command-light',
          'command-nightly'
        ];
      case 'huggingface':
        return [
          'meta-llama/Llama-2-70b-chat-hf',
          'mistralai/Mixtral-8x7B-Instruct-v0.1',
          'google/flan-t5-xxl'
        ];
      default:
        return [];
    }
  }
}