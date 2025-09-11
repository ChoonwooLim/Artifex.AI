import React, { useState } from 'react';
import styled from 'styled-components';
import DualGPUToggle from './DualGPUToggle';
import FlashAttentionToggle from './FlashAttentionToggle';
import GPUMonitorDashboard from './GPUMonitorDashboard';

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
  font-size: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 16px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? '#764ba2' : 'white'};
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;

  &:hover {
    background: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const ContentArea = styled.div`
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const QuickActions = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ActionTitle = styled.h3`
  color: white;
  margin: 0 0 16px 0;
  font-size: 18px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: white;
  color: #f5576c;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
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

const InfoCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const InfoItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
`;

const InfoLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  margin-top: 16px;
`;

const StatusLight = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

type TabType = 'overview' | 'settings' | 'monitor' | 'advanced';

export const DualSystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [systemStatus, setSystemStatus] = useState({
    dualGPU: false,
    flashAttention: false,
    workerConnected: false,
    performanceMode: 'balanced'
  });

  const handleBenchmark = async () => {
    try {
      const response = await fetch('http://10.0.0.2:8000/flash/benchmark');
      if (response.ok) {
        const data = await response.json();
        alert(`Benchmark Complete!\n\nResults saved to console.`);
        console.log('Benchmark Results:', data);
      }
    } catch (error) {
      alert('Benchmark failed. Please check worker connection.');
    }
  };

  const handleRestartWorker = async () => {
    if (window.electronAPI?.restartWorker) {
      const result = await window.electronAPI.restartWorker();
      alert(result.success ? 'Worker restarted successfully' : 'Failed to restart worker');
    }
  };

  const handleOptimizeSettings = () => {
    // Auto-optimize settings based on current system
    setSystemStatus({
      ...systemStatus,
      performanceMode: 'maximum',
      dualGPU: true,
      flashAttention: true
    });
    alert('Settings optimized for maximum performance!');
  };

  return (
    <Container>
      <Header>
        <Title>
          🚀 Dual GPU System Control Center
        </Title>
        <Subtitle>
          Manage your dual GPU setup, Flash Attention, and performance optimization
        </Subtitle>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </Tab>
        <Tab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          Settings
        </Tab>
        <Tab $active={activeTab === 'monitor'} onClick={() => setActiveTab('monitor')}>
          Monitor
        </Tab>
        <Tab $active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')}>
          Advanced
        </Tab>
      </TabContainer>

      <ContentArea key={activeTab}>
        {activeTab === 'overview' && (
          <>
            <InfoCard>
              <ActionTitle>System Status</ActionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Configuration</InfoLabel>
                  <InfoValue>Dual RTX 3090 (48GB)</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Network</InfoLabel>
                  <InfoValue>10Gbps Direct</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Flash Attention</InfoLabel>
                  <InfoValue>{systemStatus.flashAttention ? 'Enabled' : 'Disabled'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Performance Mode</InfoLabel>
                  <InfoValue>{systemStatus.performanceMode}</InfoValue>
                </InfoItem>
              </InfoGrid>
              
              <StatusIndicator>
                <StatusLight $color={systemStatus.workerConnected ? '#4ade80' : '#ef4444'} />
                {systemStatus.workerConnected ? 'PopOS Worker Connected' : 'Worker Disconnected'}
              </StatusIndicator>
            </InfoCard>

            <QuickActions>
              <ActionTitle>Quick Actions</ActionTitle>
              <ActionButtons>
                <ActionButton onClick={handleBenchmark}>
                  Run Benchmark
                </ActionButton>
                <ActionButton onClick={handleRestartWorker}>
                  Restart Worker
                </ActionButton>
                <ActionButton onClick={handleOptimizeSettings}>
                  Auto-Optimize
                </ActionButton>
                <ActionButton onClick={() => setActiveTab('monitor')}>
                  View Monitors
                </ActionButton>
              </ActionButtons>
            </QuickActions>
          </>
        )}

        {activeTab === 'settings' && (
          <SettingsGrid>
            <DualGPUToggle />
            <FlashAttentionToggle />
          </SettingsGrid>
        )}

        {activeTab === 'monitor' && (
          <GPUMonitorDashboard />
        )}

        {activeTab === 'advanced' && (
          <InfoCard>
            <ActionTitle>Advanced Configuration</ActionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Worker URL</InfoLabel>
                <InfoValue>http://10.0.0.2:8000</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Max Batch Size</InfoLabel>
                <InfoValue>32</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Memory Allocation</InfoLabel>
                <InfoValue>Dynamic</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Load Balancing</InfoLabel>
                <InfoValue>Round Robin</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Fallback Mode</InfoLabel>
                <InfoValue>Local GPU</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Cache Size</InfoLabel>
                <InfoValue>8GB</InfoValue>
              </InfoItem>
            </InfoGrid>
            
            <ActionButtons style={{ marginTop: '20px' }}>
              <ActionButton>Export Config</ActionButton>
              <ActionButton>Import Config</ActionButton>
              <ActionButton>Reset to Default</ActionButton>
            </ActionButtons>
          </InfoCard>
        )}
      </ContentArea>
    </Container>
  );
};

export default DualSystemSettings;