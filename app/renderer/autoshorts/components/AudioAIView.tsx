import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Music, Mic, Volume2, Play, Pause, Download, Upload, 
  Settings, Activity, Radio, Headphones, File,
  Sliders, Clock, Zap, Sparkles, ChevronDown
} from 'lucide-react';
import { AudioAIService, AudioConfig, TTSRequest } from '../services/AudioAIService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
`;

const Header = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 10px 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
`;

const Description = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 15px;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.active ? 
    'transparent' : 
    'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
      'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-2px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(102, 126, 234, 0.5);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
  }
`;

const FeatureIcon = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;

  svg {
    width: 25px;
    height: 25px;
    color: white;
  }
`;

const FeatureTitle = styled.h3`
  margin: 0 0 8px 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

const FeatureDesc = styled.p`
  margin: 0 0 15px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  line-height: 1.5;
`;

const Badge = styled.span<{ type: 'free' | 'pro' | 'local' }>`
  padding: 4px 10px;
  background: ${props => 
    props.type === 'free' ? 'rgba(76, 175, 80, 0.2)' :
    props.type === 'pro' ? 'rgba(255, 152, 0, 0.2)' :
    'rgba(156, 39, 176, 0.2)'};
  color: ${props => 
    props.type === 'free' ? '#4caf50' :
    props.type === 'pro' ? '#ff9800' :
    '#9c27b0'};
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const GenerationPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
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
    color: rgba(255, 255, 255, 0.5);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(255, 255, 255, 0.12);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
  }

  option {
    background: #1a1a2e;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const AudioPlayer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const WaveformContainer = styled.div`
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const PlayButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
`;

const Progress = styled.div<{ progress: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const TimeDisplay = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  min-width: 80px;
  text-align: center;
`;

type AudioTabType = 'music' | 'voice' | 'effects' | 'enhance';

interface AudioModel {
  id: string;
  name: string;
  description: string;
  type: 'music' | 'voice' | 'effects' | 'enhance';
  badge: 'free' | 'pro' | 'local';
  icon: React.ReactNode;
}

export const AudioAIView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AudioTabType>('music');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('30');
  const [style, setStyle] = useState('ambient');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [audioService, setAudioService] = useState<AudioAIService | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const musicModels: AudioModel[] = [
    {
      id: 'musicgen',
      name: 'MusicGen',
      description: 'Meta의 텍스트-음악 생성 모델. 고품질 음악 생성',
      type: 'music',
      badge: 'local',
      icon: <Music />
    },
    {
      id: 'audiocraft',
      name: 'AudioCraft',
      description: 'Meta의 오디오 생성 프레임워크. 음악과 사운드 생성',
      type: 'music',
      badge: 'local',
      icon: <Radio />
    },
    {
      id: 'riffusion',
      name: 'Riffusion',
      description: 'Stable Diffusion 기반 실시간 음악 생성',
      type: 'music',
      badge: 'free',
      icon: <Activity />
    },
    {
      id: 'mubert',
      name: 'Mubert',
      description: 'AI 기반 로열티 프리 음악 생성',
      type: 'music',
      badge: 'pro',
      icon: <Headphones />
    }
  ];

  const voiceModels: AudioModel[] = [
    {
      id: 'bark',
      name: 'Bark',
      description: 'Suno AI의 텍스트-음성 변환. 감정 표현 지원',
      type: 'voice',
      badge: 'local',
      icon: <Mic />
    },
    {
      id: 'tortoise',
      name: 'Tortoise TTS',
      description: '고품질 다중 화자 음성 합성',
      type: 'voice',
      badge: 'local',
      icon: <Mic />
    },
    {
      id: 'coqui',
      name: 'Coqui TTS',
      description: '오픈소스 다국어 음성 합성 엔진',
      type: 'voice',
      badge: 'free',
      icon: <Mic />
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: '초현실적인 AI 음성 생성 및 복제',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'clova',
      name: 'CLOVA Voice',
      description: '네이버 한국어 최적화 TTS. 다양한 한국인 성우 목소리',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'kakao',
      name: 'Kakao 음성 합성',
      description: '카카오 자연스러운 한국어 TTS. 4가지 목소리 제공',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'openai-tts',
      name: 'OpenAI TTS',
      description: 'GPT 음성 버전. 6가지 고품질 음성',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'azure-tts',
      name: 'Azure Speech',
      description: 'Microsoft 400+ 신경망 음성. 한국어 지원',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'google-tts',
      name: 'Google Cloud TTS',
      description: 'WaveNet 기술. 한국어 4개 음성',
      type: 'voice',
      badge: 'pro',
      icon: <Mic />
    },
    {
      id: 'piper',
      name: 'Piper TTS',
      description: '초경량 고속 TTS. 라즈베리파이 지원',
      type: 'voice',
      badge: 'local',
      icon: <Mic />
    }
  ];

  const effectsModels: AudioModel[] = [
    {
      id: 'audioldm',
      name: 'AudioLDM',
      description: '텍스트로 사운드 이펙트 생성',
      type: 'effects',
      badge: 'local',
      icon: <Volume2 />
    },
    {
      id: 'audiogen',
      name: 'AudioGen',
      description: 'Meta의 환경음 및 효과음 생성',
      type: 'effects',
      badge: 'local',
      icon: <Volume2 />
    },
    {
      id: 'soundraw',
      name: 'Soundraw',
      description: 'AI 기반 사운드 이펙트 라이브러리',
      type: 'effects',
      badge: 'pro',
      icon: <Volume2 />
    }
  ];

  const enhanceModels: AudioModel[] = [
    {
      id: 'demucs',
      name: 'Demucs',
      description: 'Facebook의 음원 분리 AI. 보컬, 드럼, 베이스 분리',
      type: 'enhance',
      badge: 'local',
      icon: <Sliders />
    },
    {
      id: 'spleeter',
      name: 'Spleeter',
      description: 'Deezer의 음원 분리 도구',
      type: 'enhance',
      badge: 'free',
      icon: <Sliders />
    },
    {
      id: 'resemble',
      name: 'Resemble Enhance',
      description: 'AI 기반 오디오 향상 및 노이즈 제거',
      type: 'enhance',
      badge: 'pro',
      icon: <Sparkles />
    }
  ];

  const getModelsForTab = () => {
    switch (activeTab) {
      case 'music': return musicModels;
      case 'voice': return voiceModels;
      case 'effects': return effectsModels;
      case 'enhance': return enhanceModels;
      default: return [];
    }
  };

  const handleGenerate = async () => {
    if (!selectedModel || !prompt) {
      alert('모델을 선택하고 프롬프트를 입력해주세요.');
      return;
    }

    // API 키가 필요한 서비스 체크
    const needsApiKey = ['clova', 'kakao', 'openai-tts', 'elevenlabs', 'azure-tts', 'google-tts'];
    if (needsApiKey.includes(selectedModel) && !apiKey) {
      alert('선택한 서비스를 사용하려면 API 키가 필요합니다.\n설정에서 API 키를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // AudioAIService 초기화
      const config: AudioConfig = {
        provider: selectedModel,
        apiKey: apiKey,
        language: 'ko-KR'
      };
      
      const service = new AudioAIService(config);
      
      // TTS 요청 생성
      const request: TTSRequest = {
        text: prompt,
        language: 'ko-KR',
        format: 'mp3'
      };
      
      // 오디오 생성
      const audioBlob = await service.generateTTS(request);
      
      // Blob을 URL로 변환
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // 자동 재생 (선택사항)
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert(`오디오 생성 실패: ${error.message}\n\n로컬 서비스의 경우 서버가 실행 중인지 확인하세요.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderModelCards = () => {
    const models = getModelsForTab();
    
    return (
      <FeatureGrid>
        {models.map(model => (
          <FeatureCard 
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            style={{
              border: selectedModel === model.id ? 
                '2px solid #667eea' : 
                '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedModel === model.id ?
                'rgba(102, 126, 234, 0.15)' :
                'rgba(255, 255, 255, 0.05)',
              transform: selectedModel === model.id ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <FeatureIcon>{model.icon}</FeatureIcon>
            <FeatureTitle>{model.name}</FeatureTitle>
            <FeatureDesc>{model.description}</FeatureDesc>
            <Badge type={model.badge}>
              {model.badge === 'local' ? '로컬' : 
               model.badge === 'free' ? '무료' : 'PRO'}
            </Badge>
          </FeatureCard>
        ))}
      </FeatureGrid>
    );
  };

  const renderGenerationPanel = () => {
    return (
      <GenerationPanel>
        <InputGroup>
          <Label>프롬프트</Label>
          <TextArea 
            placeholder={
              activeTab === 'music' ? '편안한 피아노 멜로디, 느린 템포, 감성적인 분위기...' :
              activeTab === 'voice' ? '안녕하세요, 오늘은 좋은 날씨입니다...' :
              activeTab === 'effects' ? '천둥 소리, 빗소리, 자연의 소리...' :
              '오디오 향상 설정...'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </InputGroup>

        {activeTab === 'music' && (
          <>
            <InputGroup>
              <Label>스타일</Label>
              <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="ambient">Ambient</option>
                <option value="classical">Classical</option>
                <option value="electronic">Electronic</option>
                <option value="jazz">Jazz</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="hiphop">Hip-Hop</option>
                <option value="cinematic">Cinematic</option>
              </Select>
            </InputGroup>
            <InputGroup>
              <Label>길이 (초)</Label>
              <Input 
                type="number" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                max="300"
              />
            </InputGroup>
          </>
        )}

        {activeTab === 'voice' && (
          <>
            <InputGroup>
              <Label>음성 스타일</Label>
              <Select>
                <optgroup label="한국어 성우">
                  <option>차분한 남성 (한국어)</option>
                  <option>활발한 여성 (한국어)</option>
                  <option>전문 나레이션 (한국어)</option>
                  <option>뉴스 앵커 (한국어)</option>
                  <option>젊은 남성 (한국어)</option>
                  <option>중년 여성 (한국어)</option>
                  <option>어린이 (한국어)</option>
                </optgroup>
                <optgroup label="감정 표현">
                  <option>기쁨/활기찬</option>
                  <option>차분한/진지한</option>
                  <option>친근한/대화체</option>
                  <option>공식적/비즈니스</option>
                </optgroup>
                <optgroup label="특수 효과">
                  <option>속삭임</option>
                  <option>강조/열정적</option>
                  <option>로봇/AI</option>
                </optgroup>
              </Select>
            </InputGroup>
            <InputGroup>
              <Label>말하기 속도</Label>
              <Select defaultValue="보통 (1.0x)">
                <option>매우 느림 (0.5x)</option>
                <option>느림 (0.75x)</option>
                <option>보통 (1.0x)</option>
                <option>빠름 (1.25x)</option>
                <option>매우 빠름 (1.5x)</option>
              </Select>
            </InputGroup>
          </>
        )}

        {/* API 키 입력 (필요한 서비스만) */}
        {selectedModel && ['clova', 'kakao', 'openai-tts', 'elevenlabs'].includes(selectedModel) && (
          <InputGroup>
            <Label>API 키</Label>
            <Input 
              type="password"
              placeholder={
                selectedModel === 'clova' ? 'Client ID:Client Secret 형식으로 입력' :
                selectedModel === 'kakao' ? 'Kakao REST API 키 입력' :
                'API 키를 입력하세요'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </InputGroup>
        )}

        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Clock /> 생성 중...
            </>
          ) : (
            <>
              <Zap /> 생성하기
            </>
          )}
        </Button>

        {audioUrl && (
          <AudioPlayer>
            <audio 
              ref={audioRef}
              controls
              style={{ width: '100%', marginBottom: '10px' }}
              src={audioUrl}
            />
            <PlayerControls>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.href = audioUrl;
                link.download = `audio_${Date.now()}.mp3`;
                link.click();
              }}>
                <Download /> 다운로드
              </Button>
            </PlayerControls>
          </AudioPlayer>
        )}
      </GenerationPanel>
    );
  };

  return (
    <Container>
      <Header>
        <Title>AI Audio Studio</Title>
        <Description>
          오픈소스 AI 모델을 활용한 음악, 음성, 사운드 이펙트 생성 및 오디오 향상
        </Description>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'music'}
          onClick={() => setActiveTab('music')}
        >
          <Music /> 음악 생성
        </Tab>
        <Tab 
          active={activeTab === 'voice'}
          onClick={() => setActiveTab('voice')}
        >
          <Mic /> 음성 생성
        </Tab>
        <Tab 
          active={activeTab === 'effects'}
          onClick={() => setActiveTab('effects')}
        >
          <Volume2 /> 사운드 이펙트
        </Tab>
        <Tab 
          active={activeTab === 'enhance'}
          onClick={() => setActiveTab('enhance')}
        >
          <Sliders /> 오디오 향상
        </Tab>
      </TabContainer>

      <ContentArea>
        {!selectedModel && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            marginBottom: '20px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.3)'
          }}>
            👆 아래 AI 모델 중 하나를 선택하면 텍스트 입력창이 나타납니다
          </div>
        )}
        {renderModelCards()}
        {selectedModel && renderGenerationPanel()}
      </ContentArea>
    </Container>
  );
};