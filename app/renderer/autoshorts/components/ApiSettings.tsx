import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Key, Save, Eye, EyeOff, ExternalLink, Check, X } from 'lucide-react';

const Container = styled.div`
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: white;
  font-size: 28px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #667eea;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: white;
  font-size: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ApiKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  min-width: 120px;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 40px 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(255, 255, 255, 0.12);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;

  &:hover {
    color: white;
  }
`;

const StatusIcon = styled.div<{ valid?: boolean }>`
  display: flex;
  align-items: center;
  color: ${props => props.valid ? '#4ade80' : '#ef4444'};
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #667eea;
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    color: #764ba2;
    text-decoration: underline;
  }
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-top: 10px;
  line-height: 1.5;
`;

const ProviderCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
`;

interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  cohere?: string;
  huggingface?: string;
}

export const ApiSettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [savedStatus, setSavedStatus] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Load saved API keys
    const saved = localStorage.getItem('llm_api_keys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('llm_api_keys', JSON.stringify(apiKeys));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const validateKey = async (provider: string) => {
    // Simple validation - just check if key exists and has reasonable length
    const key = apiKeys[provider as keyof ApiKeys];
    const isValid = !!key && key.length > 20;
    
    setValidationStatus(prev => ({
      ...prev,
      [provider]: isValid
    }));
  };

  const providerInfo = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5, DALL-E 등',
      url: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3 Opus, Sonnet, Haiku',
      url: 'https://console.anthropic.com/account/keys',
      placeholder: 'sk-ant-...'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini Pro, Gemini Vision',
      url: 'https://makersuite.google.com/app/apikey',
      placeholder: 'AIza...'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Command, Command-Light',
      url: 'https://dashboard.cohere.com/api-keys',
      placeholder: '...'
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      description: 'Llama 2, Mixtral, Falcon',
      url: 'https://huggingface.co/settings/tokens',
      placeholder: 'hf_...'
    }
  ];

  return (
    <Container>
      <Title>
        <Key size={28} />
        API 키 관리
      </Title>

      <Section>
        <SectionTitle>
          클라우드 AI 서비스 API 키
          {savedStatus && (
            <span style={{ color: '#4ade80', fontSize: '14px' }}>
              ✓ 저장됨
            </span>
          )}
        </SectionTitle>

        <InfoText>
          각 AI 서비스의 API 키를 입력하세요. 키는 브라우저 로컬 저장소에 안전하게 보관됩니다.
        </InfoText>

        {providerInfo.map(provider => (
          <ProviderCard key={provider.id}>
            <ApiKeyRow>
              <Label>{provider.name}</Label>
              <InputWrapper>
                <Input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={apiKeys[provider.id as keyof ApiKeys] || ''}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                />
                <ToggleButton onClick={() => toggleShowKey(provider.id)}>
                  {showKeys[provider.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </ToggleButton>
              </InputWrapper>
              <StatusIcon valid={validationStatus[provider.id]}>
                {validationStatus[provider.id] ? <Check size={20} /> : <X size={20} />}
              </StatusIcon>
            </ApiKeyRow>
            <div style={{ marginLeft: '135px' }}>
              <InfoText>{provider.description}</InfoText>
              <LinkButton href={provider.url} target="_blank">
                API 키 발급받기 <ExternalLink size={14} />
              </LinkButton>
            </div>
          </ProviderCard>
        ))}

        <SaveButton onClick={handleSave}>
          <Save size={18} />
          저장
        </SaveButton>
      </Section>

      <Section>
        <SectionTitle>사용 안내</SectionTitle>
        <InfoText>
          • API 키는 각 서비스 제공업체의 웹사이트에서 발급받을 수 있습니다.<br />
          • 무료 티어가 있는 서비스도 있지만, 대부분 사용량에 따라 요금이 부과됩니다.<br />
          • API 키는 절대 타인과 공유하지 마세요.<br />
          • 로컬 AI는 API 키 없이 무료로 사용할 수 있습니다.
        </InfoText>
      </Section>
    </Container>
  );
};