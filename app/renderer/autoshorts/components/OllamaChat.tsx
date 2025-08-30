import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { OllamaService } from '../services/OllamaService';

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

const ModelSelector = styled.select`
  margin-left: auto;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;

  option {
    background: #1a1a2e;
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

export const OllamaChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('qwen2-vl:7b');
  const [ollamaService, setOllamaService] = useState<OllamaService | null>(null);
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
      const service = new OllamaService({
        model: selectedModel
      });
      
      setOllamaService(service);
      
      // Check health
      const healthy = await service.checkHealth();
      if (healthy) {
        setStatus('online');
        
        // Load available models
        const availableModels = await service.listModels();
        setModels(availableModels);
        
        // Add welcome message
        setMessages([{
          role: 'system',
          content: 'Ollama is ready! I can help you with text generation, image analysis, and multimodal tasks.',
          timestamp: new Date()
        }]);
      } else {
        setStatus('offline');
        setMessages([{
          role: 'system',
          content: 'Ollama service is not running. Please start it with: ollama serve',
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
      alert('Ollama service is not available');
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
      const response = await ollamaService.chat([{
        role: 'user',
        content: input,
        images: images.length > 0 ? images : undefined
      }]);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message}`,
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

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    if (ollamaService) {
      const newService = new OllamaService({ model });
      setOllamaService(newService);
    }
  };

  return (
    <ChatContainer>
      <Header>
        <Title>
          Ollama Chat
          <StatusIndicator status={status} />
          {models.length > 0 && (
            <ModelSelector 
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </ModelSelector>
          )}
        </Title>
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
              title="Click to remove"
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
          placeholder="Type your message... (Shift+Enter for new line)"
        />
        <SendButton 
          onClick={handleSend}
          disabled={isLoading || status !== 'online'}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};