import React from 'react';
import styled from 'styled-components';

const GuideContainer = styled.div`
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
  font-size: 28px;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  color: rgba(102, 126, 234, 0.9);
  margin-bottom: 15px;
  font-size: 20px;
`;

const Step = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
`;

const StepNumber = styled.span`
  display: inline-block;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  color: white;
  text-align: center;
  line-height: 30px;
  margin-right: 10px;
  font-weight: bold;
`;

const Code = styled.code`
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  color: #4ade80;
  font-family: 'Consolas', 'Monaco', monospace;
`;

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  color: #4ade80;
  font-family: 'Consolas', 'Monaco', monospace;
  margin: 10px 0;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const Link = styled.a`
  color: #667eea;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span<{ status: 'success' | 'error' | 'warning' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => 
    props.status === 'success' ? 'rgba(74, 222, 128, 0.2)' :
    props.status === 'error' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(251, 191, 36, 0.2)'};
  color: ${props => 
    props.status === 'success' ? '#4ade80' :
    props.status === 'error' ? '#ef4444' :
    '#fbbf24'};
  border: 1px solid ${props => 
    props.status === 'success' ? 'rgba(74, 222, 128, 0.3)' :
    props.status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
    'rgba(251, 191, 36, 0.3)'};
`;

interface Props {
  onClose?: () => void;
  serviceStatus?: boolean;
  modelStatus?: boolean;
}

export const OllamaSetupGuide: React.FC<Props> = ({ 
  onClose, 
  serviceStatus = false, 
  modelStatus = false 
}) => {
  const openOllamaDownload = () => {
    window.open('https://ollama.com/download/windows', '_blank');
  };

  const runCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    alert(`Command copied to clipboard:\n${command}`);
  };

  return (
    <GuideContainer>
      <Title>🤖 Ollama Setup Guide</Title>
      
      <Section>
        <SectionTitle>Status Check</SectionTitle>
        <Step>
          <div style={{ marginBottom: '10px' }}>
            Ollama Service: {' '}
            <StatusBadge status={serviceStatus ? 'success' : 'error'}>
              {serviceStatus ? '✓ Running' : '✗ Not Running'}
            </StatusBadge>
          </div>
          <div>
            Model (qwen2-vl:7b): {' '}
            <StatusBadge status={modelStatus ? 'success' : 'warning'}>
              {modelStatus ? '✓ Installed' : '⚠ Not Installed'}
            </StatusBadge>
          </div>
        </Step>
      </Section>

      {!serviceStatus && (
        <Section>
          <SectionTitle>Step 1: Install Ollama</SectionTitle>
          
          <Step>
            <StepNumber>1</StepNumber>
            <strong>Download Ollama for Windows</strong>
            <div style={{ marginTop: '10px' }}>
              <Button onClick={openOllamaDownload}>
                📥 Download Ollama
              </Button>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                or visit: <Link href="https://ollama.com/download/windows" target="_blank">
                  https://ollama.com/download/windows
                </Link>
              </span>
            </div>
          </Step>

          <Step>
            <StepNumber>2</StepNumber>
            <strong>Run the installer</strong>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '10px 0 0' }}>
              Double-click OllamaSetup.exe and follow the installation wizard
            </p>
          </Step>

          <Step>
            <StepNumber>3</StepNumber>
            <strong>Start Ollama Service</strong>
            <CodeBlock onClick={() => runCommand('ollama serve')}>
              ollama serve
            </CodeBlock>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              Click to copy command
            </p>
          </Step>
        </Section>
      )}

      {serviceStatus && !modelStatus && (
        <Section>
          <SectionTitle>Step 2: Download AI Model</SectionTitle>
          
          <Step>
            <StepNumber>1</StepNumber>
            <strong>Download Qwen2-VL-7B Model (Recommended)</strong>
            <CodeBlock onClick={() => runCommand('ollama pull qwen2-vl:7b')}>
              ollama pull qwen2-vl:7b
            </CodeBlock>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              Size: ~7GB | Best for RTX 3090
            </p>
          </Step>

          <Step>
            <StepNumber>2</StepNumber>
            <strong>Alternative Models</strong>
            <div style={{ marginTop: '10px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Code>ollama pull llava:7b</Code> - Good multimodal alternative
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Code>ollama pull qwen2-vl:2b</Code> - Smaller, faster model
              </div>
              <div>
                <Code>ollama pull bakllava:7b</Code> - Another vision model
              </div>
            </div>
          </Step>
        </Section>
      )}

      <Section>
        <SectionTitle>Quick Commands</SectionTitle>
        <Step>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <Code>ollama list</Code> - Show installed models
            </div>
            <div>
              <Code>ollama run qwen2-vl:7b</Code> - Test the model
            </div>
            <div>
              <Code>ollama ps</Code> - Show running models
            </div>
          </div>
        </Step>
      </Section>

      <Section>
        <SectionTitle>System Requirements</SectionTitle>
        <Step>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Your System:</strong> RTX 3090 (24GB VRAM) ✅
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Minimum:</strong> 8GB RAM, 10GB disk space
            </div>
            <div>
              <strong>Recommended:</strong> 16GB RAM, NVIDIA GPU with 8GB+ VRAM
            </div>
          </div>
        </Step>
      </Section>

      {onClose && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button onClick={onClose}>Close Guide</Button>
        </div>
      )}
    </GuideContainer>
  );
};