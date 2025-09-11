import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { popOSService, GenerationRequest, JobStatus } from '../services/PopOSModelService';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  color: white;
  margin: 0 0 10px 0;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 15px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  color: white;
  font-size: 13px;
`;

const StatusLight = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4ade80' : '#ef4444'};
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const GenerationForm = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const QualityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
`;

const QualityCard = styled.button<{ $selected: boolean }>`
  background: ${props => props.$selected ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'white'};
  color: ${props => props.$selected ? 'white' : '#666'};
  border: 2px solid ${props => props.$selected ? '#667eea' : '#e0e0e0'};
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .quality-name {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .quality-specs {
    font-size: 11px;
    opacity: 0.8;
  }
`;

const GenerateButton = styled.button<{ $loading?: boolean }>`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props => props.$loading && `
    animation: shimmer 2s infinite;
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `}
`;

const ProgressSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 12px 0;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  width: ${props => props.$progress * 100}%;
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const PreviewContainer = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
`;

const VideoPlayer = styled.video`
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
`;

const ErrorMessage = styled.div`
  background: #fee;
  border: 2px solid #fcc;
  color: #c00;
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
`;

const InfoMessage = styled.div`
  background: #e3f2fd;
  border: 2px solid #90caf9;
  color: #1565c0;
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
`;

export const EnhancedWANView: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<GenerationRequest['model']>('T2V-A14B');
  const [quality, setQuality] = useState<GenerationRequest['quality']>('standard');
  
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check server connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await popOSService.checkHealth();
        setConnected(health);
        
        if (health) {
          const [gpuInfo, flashStatus] = await Promise.all([
            popOSService.getGPUInfo(),
            popOSService.getFlashStatus()
          ]);
          
          setServerStatus(gpuInfo);
          setFlashEnabled(flashStatus.flash_attn || flashStatus.xformers);
        }
      } catch (err) {
        console.error('Connection check failed:', err);
        setConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !connected) return;
    
    setGenerating(true);
    setError(null);
    setOutputUrl(null);
    setJobStatus(null);
    
    try {
      const request: GenerationRequest = {
        prompt,
        negative_prompt: negativePrompt,
        model,
        quality,
        options: {
          seed: Math.floor(Math.random() * 1000000),
        }
      };
      
      // Submit generation request
      const response = await popOSService.generate(request, (status) => {
        setJobStatus(status);
        
        if (status.status === 'completed' && status.output_url) {
          setOutputUrl(status.output_url);
          setGenerating(false);
        } else if (status.status === 'failed') {
          setError(status.error || 'Generation failed');
          setGenerating(false);
        }
      });
      
      setCurrentJob(response.job_id);
      
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
      setGenerating(false);
    }
  }, [prompt, negativePrompt, model, quality, connected]);

  // Cancel generation
  const handleCancel = useCallback(async () => {
    if (currentJob) {
      try {
        await popOSService.cancelJob(currentJob);
        setGenerating(false);
        setCurrentJob(null);
        setJobStatus(null);
      } catch (err) {
        console.error('Failed to cancel job:', err);
      }
    }
  }, [currentJob]);

  // Get quality details
  const getQualityDetails = (q: string) => {
    const preset = popOSService.getQualityPreset(q);
    return preset;
  };

  return (
    <Container>
      <Header>
        <Title>
          🚀 Enhanced WAN Generation (PopOS Powered)
        </Title>
        <StatusBar>
          <StatusItem>
            <StatusLight $active={connected} />
            {connected ? 'Connected to PopOS' : 'Disconnected'}
          </StatusItem>
          <StatusItem>
            <StatusLight $active={flashEnabled} />
            {flashEnabled ? 'Flash Attention Active' : 'Flash Attention Disabled'}
          </StatusItem>
          {serverStatus && (
            <StatusItem>
              GPU: {serverStatus.total_free}GB free
            </StatusItem>
          )}
        </StatusBar>
      </Header>

      {!connected && (
        <ErrorMessage>
          PopOS server is not connected. Please start the server from the Dual GPU System menu.
        </ErrorMessage>
      )}

      <GenerationForm>
        <FormSection>
          <Label>Model</Label>
          <Select 
            value={model} 
            onChange={(e) => setModel(e.target.value as GenerationRequest['model'])}
            disabled={generating}
          >
            <option value="T2V-A14B">Text to Video (14B)</option>
            <option value="I2V-A14B">Image to Video (14B)</option>
            <option value="TI2V-5B">Text+Image to Video (5B)</option>
            <option value="S2V-14B">Speech to Video (14B)</option>
          </Select>
        </FormSection>

        <FormSection>
          <Label>Prompt</Label>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            disabled={generating}
          />
        </FormSection>

        <FormSection>
          <Label>Negative Prompt (Optional)</Label>
          <TextArea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid in the generation..."
            disabled={generating}
            style={{ minHeight: '60px' }}
          />
        </FormSection>

        <FormSection>
          <Label>Quality Preset</Label>
          <QualityGrid>
            {(['draft', 'standard', 'pro', 'cinema', 'ultimate'] as const).map(q => {
              const details = getQualityDetails(q);
              return (
                <QualityCard
                  key={q}
                  $selected={quality === q}
                  onClick={() => setQuality(q)}
                  disabled={generating}
                >
                  <div className="quality-name">{details.name}</div>
                  <div className="quality-specs">
                    {details.resolution} • {details.steps} steps
                  </div>
                </QualityCard>
              );
            })}
          </QualityGrid>
        </FormSection>

        {generating ? (
          <GenerateButton onClick={handleCancel} $loading>
            Cancel Generation
          </GenerateButton>
        ) : (
          <GenerateButton onClick={handleGenerate} disabled={!connected || !prompt.trim()}>
            Generate with PopOS Power 🚀
          </GenerateButton>
        )}
      </GenerationForm>

      {jobStatus && (
        <ProgressSection>
          <h3>Generation Progress</h3>
          <ProgressBar>
            <ProgressFill $progress={jobStatus.progress}>
              {Math.round(jobStatus.progress * 100)}%
            </ProgressFill>
          </ProgressBar>
          <ProgressInfo>
            <span>Status: {jobStatus.status}</span>
            {jobStatus.current_step && (
              <span>Step {jobStatus.current_step} of {jobStatus.total_steps}</span>
            )}
            {jobStatus.eta > 0 && (
              <span>ETA: {jobStatus.eta}s</span>
            )}
          </ProgressInfo>
        </ProgressSection>
      )}

      {error && (
        <ErrorMessage>
          Error: {error}
        </ErrorMessage>
      )}

      {(jobStatus?.preview_url || outputUrl) && (
        <PreviewContainer>
          {outputUrl ? (
            <VideoPlayer controls autoPlay>
              <source src={outputUrl} type="video/mp4" />
            </VideoPlayer>
          ) : jobStatus?.preview_url ? (
            <PreviewImage src={jobStatus.preview_url} alt="Preview" />
          ) : null}
        </PreviewContainer>
      )}

      {flashEnabled && (
        <InfoMessage>
          ⚡ Flash Attention is enabled - Enjoying 3-4x faster generation speeds!
        </InfoMessage>
      )}
    </Container>
  );
};

export default EnhancedWANView;