import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { LocalOllamaService } from '../services/LocalOllamaService';
import { OllamaSetupGuide } from './OllamaSetupGuide';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  overflow: visible;
`;

const Title = styled.h2`
  margin: 0;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'offline' | 'loading' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => 
    props.status === 'online' ? '#4ade80' : 
    props.status === 'loading' ? '#fbbf24' : '#ef4444'};
  animation: ${props => props.status === 'loading' ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ModelSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  max-width: 100%;
`;

const ModelCard = styled.div<{ selected: boolean; available: boolean }>`
  padding: 10px 12px;
  background: ${props => 
    props.selected ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => 
    props.selected ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  cursor: ${props => props.available ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.available ? 1 : 0.5};
  transition: all 0.3s ease;
  position: relative;
  min-width: 120px;
  flex: 0 0 auto;

  &:hover {
    background: ${props => 
      props.available && !props.selected && 'rgba(255, 255, 255, 0.08)'};
    transform: ${props => props.available && 'translateY(-2px)'};
  }
`;

const ModelName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ModelDesc = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
`;

const ModelBadge = styled.span<{ type: 'multimodal' | 'text' | 'vision' }>`
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px 6px;
  background: ${props => 
    props.type === 'multimodal' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    props.type === 'vision' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  color: white;
  font-size: 9px;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
`;

const InstallButton = styled.button`
  margin-left: auto;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div<{ role: 'user' | 'assistant' | 'system' }>`
  max-width: 70%;
  padding: 15px;
  border-radius: 12px;
  background: ${props => 
    props.role === 'user' ? 'rgba(102, 126, 234, 0.2)' : 
    props.role === 'system' ? 'rgba(255, 193, 7, 0.15)' :
    'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.role === 'user' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)'};
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  backdrop-filter: blur(10px);
  border: 1px solid ${props => 
    props.role === 'user' ? 'rgba(102, 126, 234, 0.3)' : 
    props.role === 'system' ? 'rgba(255, 193, 7, 0.3)' :
    'rgba(255, 255, 255, 0.1)'};
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 10px;
`;

const Input = styled.textarea`
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  color: rgba(255, 255, 255, 0.95);

  &:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(255, 255, 255, 0.12);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ImageUploadButton = styled.label`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
  }

  input {
    display: none;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  overflow-x: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  img {
    height: 80px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.1);

  span {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: typing 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
}

interface ModelInfo {
  value: string;
  label: string;
  description: string;
  type: 'multimodal' | 'text' | 'vision';
  size: string;
}

const availableModels: ModelInfo[] = [
  {
    value: 'llama3.2-vision:11b',
    label: 'Llama 3.2 Vision',
    description: '멀티모달 최신',
    type: 'multimodal',
    size: '7.8GB'
  },
  {
    value: 'llava:7b',
    label: 'LLaVA',
    description: '멀티모달 (영어)',
    type: 'multimodal',
    size: '4.7GB'
  },
  {
    value: 'qwen2.5:7b',
    label: 'Qwen 2.5',
    description: '한국어 지원',
    type: 'text',
    size: '4.7GB'
  },
  {
    value: 'gemma2:9b',
    label: 'Gemma 2',
    description: '한국어 최적화',
    type: 'text',
    size: '5.4GB'
  },
  {
    value: 'mistral:7b',
    label: 'Mistral',
    description: '빠른 추론',
    type: 'text',
    size: '4.4GB'
  },
  {
    value: 'gpt-oss:20b',
    label: 'GPT-OSS',
    description: '고성능 대용량',
    type: 'text',
    size: '13GB'
  }
];

export const OllamaChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2-vision:11b');
  const [ollamaService, setOllamaService] = useState<LocalOllamaService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeService = async () => {
    try {
      const service = new LocalOllamaService({
        model: selectedModel
      });
      
      setOllamaService(service);
      
      // Check health and auto-start if needed
      const healthy = await service.ensureServiceRunning();
      if (healthy) {
        setStatus('online');
        
        // Load available models
        const models = await service.listModels();
        setInstalledModels(models);
        
        // Add welcome message
        if (models.length > 0) {
          setMessages([{
            role: 'system',
            content: `로컬 AI가 준비되었습니다! 설치된 모델: ${models.join(', ')}\n이미지 분석, 텍스트 생성 등 다양한 작업을 도와드릴 수 있습니다.`,
            timestamp: new Date()
          }]);
        } else {
          setMessages([{
            role: 'system',
            content: '로컬 AI 서버가 실행중입니다. 모델을 설치하려면 "모든 모델 설치" 버튼을 클릭하세요.',
            timestamp: new Date()
          }]);
        }
      } else {
        setStatus('offline');
        setMessages([{
          role: 'system',
          content: 'Ollama 서비스를 시작할 수 없습니다. ollama-local 폴더를 확인하세요.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to initialize Ollama:', error);
      setStatus('offline');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;
    if (!ollamaService || status !== 'online') {
      alert('Ollama 서비스가 준비되지 않았습니다');
      return;
    }

    // Check if selected model is installed
    if (!installedModels.includes(selectedModel)) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `모델 ${selectedModel}이 설치되지 않았습니다. 먼저 설치해주세요.`,
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      images: images.length > 0 ? [...images] : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setIsLoading(true);

    try {
      // 시스템 프롬프트 추가하여 더 나은 응답 유도
      const systemPrompt = {
        role: 'system' as const,
        content: '당신은 유용하고 정확한 AI 어시스턴트입니다. 간결하고 명확하게 답변하며, 반복을 피하고 사용자의 질문에 직접적으로 답합니다. 한국어로 자연스럽게 대화하세요.'
      };

      const chatMessages = [
        systemPrompt,
        {
          role: 'user' as const,
          content: input,
          images: images.length > 0 ? images : undefined
        }
      ];

      const response = await ollamaService.chat(chatMessages, {
        temperature: 0.8,
        maxTokens: 1024
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `오류: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelSelect = async (model: string) => {
    if (!installedModels.includes(model)) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `모델 ${model}을 다운로드하려면 "모든 모델 설치" 버튼을 클릭하세요.`,
        timestamp: new Date()
      }]);
      return;
    }

    setSelectedModel(model);
    if (ollamaService) {
      const newService = new LocalOllamaService({ model });
      setOllamaService(newService);
      await newService.ensureServiceRunning();
    }
  };

  const installAllModels = () => {
    // Use IPC to request model installation
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.installModels().then((result: any) => {
        if (result.success) {
          setMessages(prev => [...prev, {
            role: 'system',
            content: '모델 설치가 시작되었습니다. 설치 창을 확인하세요.',
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'system',
            content: '모델 설치를 시작할 수 없습니다. 수동으로 scripts/install-all-models.bat을 실행하세요.',
            timestamp: new Date()
          }]);
        }
      });
    } else {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '모델 설치는 수동으로 scripts/install-all-models.bat을 실행하세요.',
        timestamp: new Date()
      }]);
    }
  };

  // Show setup guide if Ollama is not available
  if (status === 'offline' && installedModels.length === 0) {
    return (
      <ChatContainer>
        <OllamaSetupGuide 
          serviceStatus={false}
          modelStatus={false}
        />
      </ChatContainer>
    );
  }

  // 디버깅을 위한 로그
  console.log('Available models count:', availableModels.length);
  console.log('Available models:', availableModels);
  
  return (
    <ChatContainer>
      <Header>
        <Title>
          로컬 AI 챗
          <StatusIndicator status={status} />
        </Title>
        
        <ModelSelectorContainer>
          {availableModels.map((model, index) => {
            console.log(`Rendering model ${index}:`, model.label);
            return (
              <ModelCard
                key={model.value}
                selected={selectedModel === model.value}
                available={installedModels.includes(model.value)}
                onClick={() => handleModelSelect(model.value)}
              >
                <ModelBadge type={model.type}>
                  {model.type === 'multimodal' ? '멀티' : 
                   model.type === 'vision' ? '비전' : '텍스트'}
                </ModelBadge>
                <ModelName>{model.label}</ModelName>
                <ModelDesc>
                  {model.description} • {model.size}
                  {!installedModels.includes(model.value) && ' • 미설치'}
                </ModelDesc>
              </ModelCard>
            );
          })}
          
          {installedModels.length === 0 && (
            <InstallButton onClick={installAllModels}>
              모든 모델 설치
            </InstallButton>
          )}
        </ModelSelectorContainer>
      </Header>

      <MessagesContainer>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role}>
            {msg.content}
            {msg.images && msg.images.map((img, i) => (
              <img 
                key={i} 
                src={img} 
                alt={`Upload ${i}`}
                style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '8px' }}
              />
            ))}
          </Message>
        ))}
        {isLoading && (
          <TypingIndicator>
            <span />
            <span />
            <span />
          </TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {images.length > 0 && (
        <ImagePreview>
          {images.map((img, index) => (
            <img 
              key={index}
              src={img}
              alt={`Preview ${index}`}
              onClick={() => removeImage(index)}
              title="클릭하여 제거"
            />
          ))}
        </ImagePreview>
      )}

      <InputContainer>
        <ImageUploadButton>
          📷
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
        </ImageUploadButton>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
        />
        <SendButton 
          onClick={handleSend}
          disabled={isLoading || status !== 'online'}
        >
          전송
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};