import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { OllamaChat } from '../autoshorts/components/OllamaChat';
import { OllamaService } from '../autoshorts/services/OllamaService';

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%);
`;

const Header = styled.div`
  padding: 20px 30px;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const SubTitle = styled.p`
  margin: 5px 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px 30px 0;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  color: ${props => props.active ? '#667eea' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.active ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 30px;
  overflow: hidden;
`;

const TabContent = styled.div`
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VideoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  height: 100%;
`;

const VideoContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 8px;
  object-fit: contain;
`;

const VideoUpload = styled.div`
  width: 100%;
  height: 400px;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(102, 126, 234, 0.5);
  }

  input {
    display: none;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
`;

const UploadText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  margin: 0;
`;

const Controls = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
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

const SidePanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateX(5px);
  }
`;

const FeatureTitle = styled.h3`
  margin: 0 0 5px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
`;

const FeatureDescription = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const ProcessingStatus = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 10px;
  font-size: 14px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const Progress = styled.div<{ percent: number }>`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
`;

type TabType = 'video' | 'chat' | 'analysis' | 'settings';

export const AutoShortsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const extractFrames = async (): Promise<string[]> => {
    if (!videoRef.current) return [];
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];
    const frameCount = 10; // Extract 10 frames
    const duration = video.duration;
    
    for (let i = 0; i < frameCount; i++) {
      const time = (duration / frameCount) * i;
      video.currentTime = time;
      
      await new Promise(resolve => {
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          resolve(null);
        };
      });
    }

    return frames;
  };

  const analyzeWithOllama = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const ollamaService = new OllamaService();
      
      // Check if service is running
      const healthy = await ollamaService.checkHealth();
      if (!healthy) {
        alert('Ollama service is not running. Please start it with: ollama serve');
        return;
      }

      setProgress(20);

      // Extract frames
      const frames = await extractFrames();
      setProgress(40);

      // Analyze video
      const analysis = await ollamaService.analyzeVideo(
        frames,
        'Analyze this video and identify key moments for creating shorts'
      );
      
      setProgress(60);

      // Generate script suggestions
      const script = await ollamaService.generateVideoScript(
        'Create engaging short-form content from this video',
        frames.slice(0, 3),
        30
      );

      setProgress(80);

      // Generate scenes
      const scenes = await ollamaService.generateVideoScenes(
        script.script,
        30
      );

      setProgress(100);

      setAnalysisResults({
        analysis,
        script,
        scenes,
        frames: frames.length
      });

      // Switch to analysis tab
      setActiveTab('analysis');

    } catch (error) {
      console.error('Analysis failed:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      title: '🎬 Video Analysis',
      description: 'AI-powered scene detection and highlight extraction',
      action: analyzeWithOllama
    },
    {
      title: '✂️ Auto Clip',
      description: 'Generate viral shorts automatically',
      action: () => console.log('Auto clip')
    },
    {
      title: '📝 Smart Subtitles',
      description: 'AI transcription with style templates',
      action: () => console.log('Subtitles')
    },
    {
      title: '👤 Face Tracking',
      description: 'Detect and track faces for perfect framing',
      action: () => console.log('Face tracking')
    },
    {
      title: '🎵 Audio Sync',
      description: 'Match cuts to beat and music',
      action: () => console.log('Audio sync')
    },
    {
      title: '🎨 Effects Library',
      description: 'Professional transitions and effects',
      action: () => console.log('Effects')
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return (
          <VideoSection>
            <VideoContainer>
              {videoUrl ? (
                <VideoPlayer 
                  ref={videoRef}
                  src={videoUrl} 
                  controls 
                />
              ) : (
                <VideoUpload
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <UploadIcon>📹</UploadIcon>
                  <UploadText>Click or drag video to upload</UploadText>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                  />
                </VideoUpload>
              )}
              
              <Controls>
                <Button 
                  onClick={analyzeWithOllama}
                  disabled={!videoFile || isProcessing}
                >
                  {isProcessing ? 'Analyzing...' : 'Analyze Video'}
                </Button>
                <Button disabled={!videoFile || isProcessing}>
                  Generate Shorts
                </Button>
                <Button disabled={!videoFile || isProcessing}>
                  Add Subtitles
                </Button>
              </Controls>

              {isProcessing && (
                <ProcessingStatus>
                  <StatusText>Processing video with Ollama AI...</StatusText>
                  <ProgressBar>
                    <Progress percent={progress} />
                  </ProgressBar>
                </ProcessingStatus>
              )}
            </VideoContainer>

            <SidePanel>
              <h3 style={{ color: 'white', marginTop: 0 }}>AI Features</h3>
              {features.map((feature, index) => (
                <FeatureCard key={index} onClick={feature.action}>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </FeatureCard>
              ))}
            </SidePanel>
          </VideoSection>
        );

      case 'chat':
        return <OllamaChat />;

      case 'analysis':
        return (
          <div style={{ color: 'white', overflow: 'auto', height: '100%' }}>
            <h2>Analysis Results</h2>
            {analysisResults && (
              <pre style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '20px', 
                borderRadius: '8px',
                overflow: 'auto'
              }}>
                {JSON.stringify(analysisResults, null, 2)}
              </pre>
            )}
          </div>
        );

      case 'settings':
        return (
          <div style={{ color: 'white' }}>
            <h2>Ollama Settings</h2>
            <FeatureCard>
              <FeatureTitle>Model Configuration</FeatureTitle>
              <FeatureDescription>
                Current model: qwen2-vl:7b<br />
                Base URL: http://localhost:11434
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureTitle>Performance</FeatureTitle>
              <FeatureDescription>
                GPU: RTX 3090 (24GB VRAM)<br />
                Max tokens: 2048<br />
                Temperature: 0.7
              </FeatureDescription>
            </FeatureCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>AutoShorts AI Studio</Title>
        <SubTitle>Powered by Ollama + Qwen2-VL-7B Multimodal AI</SubTitle>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'video'} 
          onClick={() => setActiveTab('video')}
        >
          📹 Video Editor
        </Tab>
        <Tab 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')}
        >
          💬 AI Chat
        </Tab>
        <Tab 
          active={activeTab === 'analysis'} 
          onClick={() => setActiveTab('analysis')}
        >
          📊 Analysis
        </Tab>
        <Tab 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </Tab>
      </TabContainer>

      <Content>
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </Content>
    </Container>
  );
};