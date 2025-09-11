import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  margin: 20px 0;
`;

const Title = styled.h3`
  color: white;
  margin: 0 0 15px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const StatusLabel = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
`;

const StatusBadge = styled.span<{ $status: 'running' | 'stopped' | 'checking' }>`
  background: ${props => 
    props.$status === 'running' ? '#4ade80' : 
    props.$status === 'stopped' ? '#f87171' : '#fbbf24'};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const Button = styled.button<{ $variant?: 'start' | 'stop' }>`
  background: ${props => 
    props.$variant === 'start' ? '#4ade80' : 
    props.$variant === 'stop' ? '#f87171' : 'white'};
  color: ${props => props.$variant ? 'white' : '#764ba2'};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: scale(1);
  }
`;

const GPUInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
`;

const LogView = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 10px;
  margin-top: 10px;
  font-size: 11px;
  color: #4ade80;
  max-height: 100px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
`;

const AutoStartToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: white;
  font-size: 13px;
  cursor: pointer;

  input {
    cursor: pointer;
  }
`;

export const PopOSServerControl: React.FC = () => {
  const [status, setStatus] = useState<'running' | 'stopped' | 'checking'>('checking');
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState('');
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    // 초기 상태 확인
    checkServerStatus();
    
    // 자동 시작 설정 확인
    const saved = localStorage.getItem('popos-auto-start');
    if (saved === 'true') {
      setAutoStart(true);
      startServer(); // 자동 시작
    }

    // 주기적 상태 확인 (30초마다)
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      const result = await window.electronAPI.popOSStatus();
      const newStatus = result.running ? 'running' : 'stopped';
      setStatus(newStatus);
      
      // Save status to localStorage for other components
      localStorage.setItem('popos-server-status', newStatus);
      
      if (result.gpuInfo) {
        setGpuInfo(result.gpuInfo);
      }
    } catch (error) {
      setStatus('stopped');
      localStorage.setItem('popos-server-status', 'stopped');
      console.error('Failed to check server status:', error);
    }
  };

  const startServer = async () => {
    setLoading(true);
    setLogs('Starting PopOS server...\n');
    
    try {
      const result = await window.electronAPI.popOSStart();
      if (result.success) {
        setStatus('running');
        localStorage.setItem('popos-server-status', 'running');
        setLogs(logs + result.message + '\n');
        setTimeout(checkServerStatus, 2000);
      } else {
        setLogs(logs + 'Failed: ' + result.message + '\n');
      }
    } catch (error) {
      setLogs(logs + 'Error: ' + error + '\n');
    } finally {
      setLoading(false);
    }
  };

  const stopServer = async () => {
    setLoading(true);
    setLogs('Stopping PopOS server...\n');
    
    try {
      const result = await window.electronAPI.popOSStop();
      if (result.success) {
        setStatus('stopped');
        localStorage.setItem('popos-server-status', 'stopped');
        setGpuInfo(null);
        setLogs(logs + result.message + '\n');
      } else {
        setLogs(logs + 'Failed: ' + result.message + '\n');
      }
    } catch (error) {
      setLogs(logs + 'Error: ' + error + '\n');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoStartToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoStart(checked);
    localStorage.setItem('popos-auto-start', String(checked));
  };

  return (
    <Container>
      <Title>
        🖥️ PopOS GPU Server Control
      </Title>

      <StatusRow>
        <StatusLabel>Server Status:</StatusLabel>
        <StatusBadge $status={status}>
          {status === 'running' ? 'RUNNING' : 
           status === 'stopped' ? 'STOPPED' : 'CHECKING...'}
        </StatusBadge>
      </StatusRow>

      {gpuInfo && (
        <GPUInfo>
          <div>GPU: {gpuInfo.gpus?.[0]?.name}</div>
          <div>Memory: {Math.round(gpuInfo.gpus?.[0]?.memory_free / (1024**3))}GB free</div>
          <div>Utilization: {gpuInfo.gpus?.[0]?.utilization}%</div>
        </GPUInfo>
      )}

      <ButtonGroup>
        <Button 
          $variant="start"
          onClick={startServer}
          disabled={loading || status === 'running'}
        >
          {loading && status !== 'running' ? 'Starting...' : 'Start Server'}
        </Button>
        <Button 
          $variant="stop"
          onClick={stopServer}
          disabled={loading || status === 'stopped'}
        >
          {loading && status !== 'stopped' ? 'Stopping...' : 'Stop Server'}
        </Button>
      </ButtonGroup>

      <AutoStartToggle>
        <input 
          type="checkbox" 
          checked={autoStart}
          onChange={handleAutoStartToggle}
        />
        Auto-start server with app
      </AutoStartToggle>

      {logs && (
        <LogView>{logs}</LogView>
      )}
    </Container>
  );
};

export default PopOSServerControl;