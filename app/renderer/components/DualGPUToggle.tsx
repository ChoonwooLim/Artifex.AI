import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  color: white;
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{ $status: 'connected' | 'disconnected' | 'checking' }>`
  background: ${props => 
    props.$status === 'connected' ? '#4ade80' : 
    props.$status === 'checking' ? '#fbbf24' : '#f87171'};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 28px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #4ade80;
  }

  &:checked + span:before {
    transform: translateX(32px);
  }

  &:disabled + span {
    background-color: #6b7280;
    cursor: not-allowed;
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.4s;
  border-radius: 28px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Label = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

const GPUGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
`;

const GPUCard = styled.div<{ $active: boolean }>`
  background: rgba(255, 255, 255, ${props => props.$active ? 0.2 : 0.1});
  border: 2px solid ${props => props.$active ? '#4ade80' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
`;

const GPUName = styled.div`
  color: white;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
`;

const GPUInfo = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  margin: 4px 0;
`;

const GPUMetric = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
`;

const MetricLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
`;

const MetricValue = styled.span`
  color: white;
  font-size: 11px;
  font-weight: bold;
`;

const ConnectionInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
`;

const ConnectionRow = styled.div`
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 13px;
  margin: 4px 0;
`;

const TestButton = styled.button`
  background: white;
  color: #764ba2;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface GPUStatus {
  name: string;
  memory_total: number;
  memory_free: number;
  memory_used: number;
  utilization: number;
  temperature?: number;
  power_draw?: number;
}

interface DualGPUStatus {
  local?: GPUStatus;
  remote?: GPUStatus;
  connected: boolean;
  dualMode: boolean;
}

export const DualGPUToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [gpuStatus, setGpuStatus] = useState<DualGPUStatus>({
    connected: false,
    dualMode: false
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      // Try to get local GPU info first
      let localGPU = null;
      if (window.electronAPI?.getLocalGPUInfo) {
        try {
          localGPU = await window.electronAPI.getLocalGPUInfo();
        } catch (localError) {
          console.warn('Failed to get local GPU info:', localError);
        }
      }

      // Check PopOS worker connection with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch('http://10.0.0.2:8001/api/v1/gpu/info', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          setGpuStatus({
            local: localGPU,
            remote: data.gpus?.[0],
            connected: true,
            dualMode: localGPU && data.gpus?.length > 0
          });
          
          setStatus('connected');
        } else {
          // Remote connection failed but local GPU may still work
          setStatus('disconnected');
          setGpuStatus({ 
            local: localGPU,
            connected: false, 
            remote: undefined,
            dualMode: false
          });
        }
      } catch (fetchError) {
        // Remote connection failed (timeout or network error)
        console.log('PopOS worker not available, running in local mode');
        setStatus('disconnected');
        setGpuStatus({ 
          local: localGPU,
          connected: false, 
          remote: undefined,
          dualMode: false
        });
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
      setStatus('disconnected');
      setGpuStatus({ 
        connected: false, 
        remote: undefined,
        dualMode: false
      });
    }
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    
    // Notify main process about dual GPU mode
    if (window.electronAPI?.setDualGPUMode) {
      window.electronAPI.setDualGPUMode(checked);
    }
    
    // Save preference
    localStorage.setItem('dualGPUMode', String(checked));
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // Test worker connection with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('http://10.0.0.2:8001/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        alert(`Connection successful!\n\nWorker: ${data.worker}\nStatus: ${data.status}`);
      } else {
        alert('Connection failed! Please check PopOS worker.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('Connection timeout! PopOS worker is not responding.');
      } else {
        alert('PopOS worker is not available. Running in local GPU mode only.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / (1024 ** 3)).toFixed(1)}GB`;
  };

  return (
    <Container>
      <Header>
        <Title>
          🖥️ Dual GPU System
        </Title>
        <StatusBadge $status={status}>
          {status === 'connected' ? 'Connected' : 
           status === 'checking' ? 'Checking...' : 'Disconnected'}
        </StatusBadge>
      </Header>

      <ToggleContainer>
        <Toggle>
          <ToggleInput
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={!gpuStatus.connected}
          />
          <Slider />
        </Toggle>
        <Label>
          {enabled ? 'Dual GPU Mode Active' : 'Single GPU Mode'}
        </Label>
      </ToggleContainer>

      <GPUGrid>
        <GPUCard $active={true}>
          <GPUName>💻 Local GPU (Windows)</GPUName>
          {gpuStatus.local ? (
            <>
              <GPUInfo>{gpuStatus.local.name}</GPUInfo>
              <GPUMetric>
                <MetricLabel>Memory:</MetricLabel>
                <MetricValue>
                  {formatMemory(gpuStatus.local.memory_free)} / {formatMemory(gpuStatus.local.memory_total)}
                </MetricValue>
              </GPUMetric>
              <GPUMetric>
                <MetricLabel>Utilization:</MetricLabel>
                <MetricValue>{gpuStatus.local.utilization}%</MetricValue>
              </GPUMetric>
            </>
          ) : (
            <GPUInfo>Checking...</GPUInfo>
          )}
        </GPUCard>

        <GPUCard $active={enabled && gpuStatus.connected}>
          <GPUName>🐧 Remote GPU (PopOS)</GPUName>
          {gpuStatus.remote ? (
            <>
              <GPUInfo>{gpuStatus.remote.name}</GPUInfo>
              <GPUMetric>
                <MetricLabel>Memory:</MetricLabel>
                <MetricValue>
                  {formatMemory(gpuStatus.remote.memory_free)} / {formatMemory(gpuStatus.remote.memory_total)}
                </MetricValue>
              </GPUMetric>
              <GPUMetric>
                <MetricLabel>Utilization:</MetricLabel>
                <MetricValue>{gpuStatus.remote.utilization}%</MetricValue>
              </GPUMetric>
            </>
          ) : (
            <GPUInfo>{gpuStatus.connected ? 'Ready' : 'Not connected'}</GPUInfo>
          )}
        </GPUCard>
      </GPUGrid>

      {gpuStatus.connected && (
        <ConnectionInfo>
          <ConnectionRow>
            <span>Network:</span>
            <span>10Gbps Direct (10.0.0.2)</span>
          </ConnectionRow>
          <ConnectionRow>
            <span>Total VRAM:</span>
            <span>
              {gpuStatus.local && gpuStatus.remote ? 
                formatMemory(gpuStatus.local.memory_total + gpuStatus.remote.memory_total) :
                'Calculating...'}
            </span>
          </ConnectionRow>
          <ConnectionRow>
            <span>Processing Mode:</span>
            <span>{enabled ? 'Distributed' : 'Local Only'}</span>
          </ConnectionRow>
        </ConnectionInfo>
      )}

      <TestButton onClick={testConnection} disabled={isTesting}>
        {isTesting ? 'Testing...' : 'Test Connection'}
      </TestButton>
    </Container>
  );
};

export default DualGPUToggle;