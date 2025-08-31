import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Send, Image as ImageIcon, Settings, ChevronDown, Key, AlertCircle } from 'lucide-react';
import { CloudLLMService, CloudLLMConfig } from '../services/CloudLLMService';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProviderSelector = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ProviderDropdown = styled.div`
  position: relative;
`;

const ProviderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  min-width: 200px;
  background: rgba(20, 20, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const ProviderOption = styled.div<{ selected: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  transition: all 0.2s ease;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModelDropdown = styled(ProviderDropdown)``;

const ModelButton = styled(ProviderButton)`
  min-width: 180px;
`;

const ApiKeyWarning = styled.div`
  padding: 15px 20px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  margin: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ff9800;

  a {
    color: #667eea;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
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
  color: rgba(255, 255, 255, 0.95);
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

const SettingsButton = styled.button`
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
}

interface ProviderInfo {
  id: 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface';
  name: string;
  models: string[];
}

const providers: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4-turbo-preview', 'gpt-4-vision-preview', 'gpt-4', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  {
    id: 'google',
    name: 'Google AI',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']
  },
  {
    id: 'cohere',
    name: 'Cohere',
    models: ['command', 'command-light', 'command-nightly']
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    models: ['meta-llama/Llama-2-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1']
  }
];

export const CloudChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo>(providers[0]);
  const [selectedModel, setSelectedModel] = useState(providers[0].models[0]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [cloudService, setCloudService] = useState<CloudLLMService | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load API keys from localStorage
    const savedApiKeys = localStorage.getItem('llm_api_keys');
    if (savedApiKeys) {
      const keys = JSON.parse(savedApiKeys);
      const key = keys[selectedProvider.id];
      if (key) {
        setApiKey(key);
        initializeService(selectedProvider.id, key, selectedModel);
      }
    }

    // Welcome message
    setMessages([{
      role: 'system',
      content: '클라우드 AI 서비스에 오신 것을 환영합니다! Settings에서 API 키를 설정해주세요.',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeService = (providerId: string, apiKey: string, model: string) => {
    const config: CloudLLMConfig = {
      provider: providerId as any,
      apiKey,
      model,
      temperature: 0.7,
      maxTokens: 1000
    };
    
    const service = new CloudLLMService(config);
    setCloudService(service);
  };

  const handleProviderChange = (provider: ProviderInfo) => {
    setSelectedProvider(provider);
    setSelectedModel(provider.models[0]);
    setShowProviderDropdown(false);

    // Load API key for this provider
    const savedApiKeys = localStorage.getItem('llm_api_keys');
    if (savedApiKeys) {
      const keys = JSON.parse(savedApiKeys);
      const key = keys[provider.id];
      if (key) {
        setApiKey(key);
        initializeService(provider.id, key, provider.models[0]);
      } else {
        setApiKey('');
        setCloudService(null);
      }
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setShowModelDropdown(false);
    
    if (apiKey) {
      initializeService(selectedProvider.id, apiKey, model);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!cloudService || !apiKey) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'API 키가 설정되지 않았습니다. Settings에서 API 키를 입력해주세요.',
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await cloudService.chat([{
        role: 'user',
        content: input
      }]);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error: any) {
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

  const openSettings = () => {
    // Navigate to settings
    const event = new CustomEvent('navigate-to-settings', { detail: 'api-keys' });
    window.dispatchEvent(event);
  };

  return (
    <ChatContainer>
      <Header>
        <Title>클라우드 AI</Title>
        
        <ProviderSelector>
          <ProviderDropdown>
            <ProviderButton onClick={() => setShowProviderDropdown(!showProviderDropdown)}>
              {selectedProvider.name}
              <ChevronDown size={16} />
            </ProviderButton>
            {showProviderDropdown && (
              <DropdownMenu>
                {providers.map(provider => (
                  <ProviderOption
                    key={provider.id}
                    selected={provider.id === selectedProvider.id}
                    onClick={() => handleProviderChange(provider)}
                  >
                    {provider.name}
                    {!apiKey && provider.id === selectedProvider.id && (
                      <Key size={14} style={{ color: '#ff9800' }} />
                    )}
                  </ProviderOption>
                ))}
              </DropdownMenu>
            )}
          </ProviderDropdown>

          <ModelDropdown>
            <ModelButton onClick={() => setShowModelDropdown(!showModelDropdown)}>
              {selectedModel.split('/').pop()}
              <ChevronDown size={16} />
            </ModelButton>
            {showModelDropdown && (
              <DropdownMenu>
                {selectedProvider.models.map(model => (
                  <ProviderOption
                    key={model}
                    selected={model === selectedModel}
                    onClick={() => handleModelChange(model)}
                  >
                    {model.split('/').pop()}
                  </ProviderOption>
                ))}
              </DropdownMenu>
            )}
          </ModelDropdown>

          <SettingsButton onClick={openSettings}>
            <Settings size={20} />
          </SettingsButton>
        </ProviderSelector>
      </Header>

      {!apiKey && (
        <ApiKeyWarning>
          <AlertCircle size={20} />
          <span>
            API 키가 설정되지 않았습니다. 
            <a href="#" onClick={(e) => { e.preventDefault(); openSettings(); }}> Settings에서 설정</a>해주세요.
          </span>
        </ApiKeyWarning>
      )}

      <MessagesContainer>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role}>
            {msg.content}
          </Message>
        ))}
        {isLoading && (
          <Message role="assistant">
            생각중...
          </Message>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
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
          disabled={isLoading || !apiKey}
        >
          전송
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};