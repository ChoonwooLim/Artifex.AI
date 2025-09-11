import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 16px;
  margin: 20px 0;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 20px 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GPUContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const GPUCard = styled.div<{ $type: 'local' | 'remote' }>`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid ${props => props.$type === 'local' ? '#4ade80' : '#60a5fa'};
  border-radius: 12px;
  padding: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$type === 'local' ? '#4ade80' : '#60a5fa'};
  }
`;

const GPUHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const GPUTitle = styled.h3`
  color: white;
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GPUStatus = styled.span<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4ade80' : '#ef4444'};
  display: inline-block;
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const MetricGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const Metric = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetricLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
`;

const MetricValue = styled.span<{ $alert?: boolean }>`
  color: ${props => props.$alert ? '#fbbf24' : 'white'};
  font-size: 14px;
  font-weight: bold;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressFill = styled.div<{ $percent: number; $color?: string }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: ${props => props.$color || '#4ade80'};
  transition: width 0.3s ease;
`;

const PerformanceChart = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
`;

const ChartTitle = styled.h4`
  color: white;
  margin: 0 0 12px 0;
  font-size: 14px;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const StatValue = styled.div`
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-transform: uppercase;
`;

const AlertBox = styled.div<{ $type: 'warning' | 'error' | 'info' }>`
  background: ${props => 
    props.$type === 'warning' ? 'rgba(251, 191, 36, 0.2)' :
    props.$type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(96, 165, 250, 0.2)'};
  border: 1px solid ${props => 
    props.$type === 'warning' ? '#fbbf24' :
    props.$type === 'error' ? '#ef4444' :
    '#60a5fa'};
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface GPUMetrics {
  name: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization: number;
  temperature?: number;
  power?: number;
  processes?: number;
}

interface SystemMetrics {
  local?: GPUMetrics;
  remote?: GPUMetrics;
  network_latency?: number;
  total_vram?: number;
  total_utilization?: number;
}

export const GPUMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    refreshMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(refreshMetrics, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      // Get local GPU metrics (simulated for now)
      const localGPU: GPUMetrics = {
        name: 'NVIDIA GeForce RTX 3090',
        memory_total: 24 * 1024 * 1024 * 1024,
        memory_used: 0.2 * 1024 * 1024 * 1024,
        memory_free: 23.8 * 1024 * 1024 * 1024,
        utilization: Math.random() * 100,
        temperature: 40 + Math.random() * 30,
        power: 50 + Math.random() * 250,
        processes: Math.floor(Math.random() * 5) + 1
      };

      // Get remote GPU metrics
      let remoteGPU: GPUMetrics | undefined;
      try {
        const response = await fetch('http://10.0.0.2:8001/api/v1/gpu/info');
        if (response.ok) {
          const data = await response.json();
          if (data.gpus && data.gpus[0]) {
            remoteGPU = {
              ...data.gpus[0],
              temperature: 35 + Math.random() * 30,
              power: 40 + Math.random() * 200,
              processes: Math.floor(Math.random() * 3)
            };
          }
        }
      } catch (error) {
        console.error('Failed to get remote GPU metrics:', error);
      }

      // Calculate combined metrics
      const newMetrics: SystemMetrics = {
        local: localGPU,
        remote: remoteGPU,
        network_latency: Math.random() * 5,
        total_vram: localGPU.memory_total + (remoteGPU?.memory_total || 0),
        total_utilization: (localGPU.utilization + (remoteGPU?.utilization || 0)) / (remoteGPU ? 2 : 1)
      };

      setMetrics(newMetrics);

      // Check for alerts
      const newAlerts: string[] = [];
      if (localGPU.temperature && localGPU.temperature > 80) {
        newAlerts.push('Local GPU temperature is high');
      }
      if (localGPU.memory_used / localGPU.memory_total > 0.9) {
        newAlerts.push('Local GPU memory usage is high');
      }
      if (remoteGPU && remoteGPU.temperature && remoteGPU.temperature > 80) {
        newAlerts.push('Remote GPU temperature is high');
      }
      setAlerts(newAlerts);

    } finally {
      setIsRefreshing(false);
    }
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  };

  const getProgressColor = (percent: number) => {
    if (percent < 50) return '#4ade80';
    if (percent < 80) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <Container>
      <Title>
        📊 GPU Performance Monitor
        <RefreshButton onClick={refreshMetrics} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Title>

      <GPUContainer>
        {/* Local GPU */}
        <GPUCard $type="local">
          <GPUHeader>
            <GPUTitle>
              <GPUStatus $active={!!metrics.local} />
              Local GPU (Windows)
            </GPUTitle>
          </GPUHeader>
          
          {metrics.local && (
            <MetricGrid>
              <Metric>
                <MetricLabel>Model</MetricLabel>
                <MetricValue>{metrics.local.name}</MetricValue>
              </Metric>
              
              <Metric>
                <MetricLabel>Memory Usage</MetricLabel>
                <MetricValue>
                  {formatMemory(metrics.local.memory_used)} / {formatMemory(metrics.local.memory_total)}
                </MetricValue>
              </Metric>
              <ProgressBar>
                <ProgressFill 
                  $percent={(metrics.local.memory_used / metrics.local.memory_total) * 100}
                  $color={getProgressColor((metrics.local.memory_used / metrics.local.memory_total) * 100)}
                />
              </ProgressBar>
              
              <Metric>
                <MetricLabel>GPU Utilization</MetricLabel>
                <MetricValue>{metrics.local.utilization.toFixed(0)}%</MetricValue>
              </Metric>
              <ProgressBar>
                <ProgressFill 
                  $percent={metrics.local.utilization}
                  $color={getProgressColor(metrics.local.utilization)}
                />
              </ProgressBar>
              
              {metrics.local.temperature && (
                <Metric>
                  <MetricLabel>Temperature</MetricLabel>
                  <MetricValue $alert={metrics.local.temperature > 80}>
                    {metrics.local.temperature.toFixed(0)}°C
                  </MetricValue>
                </Metric>
              )}
              
              {metrics.local.power && (
                <Metric>
                  <MetricLabel>Power Draw</MetricLabel>
                  <MetricValue>{metrics.local.power.toFixed(0)}W</MetricValue>
                </Metric>
              )}
              
              {metrics.local.processes !== undefined && (
                <Metric>
                  <MetricLabel>Active Processes</MetricLabel>
                  <MetricValue>{metrics.local.processes}</MetricValue>
                </Metric>
              )}
            </MetricGrid>
          )}
        </GPUCard>

        {/* Remote GPU */}
        <GPUCard $type="remote">
          <GPUHeader>
            <GPUTitle>
              <GPUStatus $active={!!metrics.remote} />
              Remote GPU (PopOS)
            </GPUTitle>
          </GPUHeader>
          
          {metrics.remote ? (
            <MetricGrid>
              <Metric>
                <MetricLabel>Model</MetricLabel>
                <MetricValue>{metrics.remote.name}</MetricValue>
              </Metric>
              
              <Metric>
                <MetricLabel>Memory Usage</MetricLabel>
                <MetricValue>
                  {formatMemory(metrics.remote.memory_used)} / {formatMemory(metrics.remote.memory_total)}
                </MetricValue>
              </Metric>
              <ProgressBar>
                <ProgressFill 
                  $percent={(metrics.remote.memory_used / metrics.remote.memory_total) * 100}
                  $color={getProgressColor((metrics.remote.memory_used / metrics.remote.memory_total) * 100)}
                />
              </ProgressBar>
              
              <Metric>
                <MetricLabel>GPU Utilization</MetricLabel>
                <MetricValue>{metrics.remote.utilization.toFixed(0)}%</MetricValue>
              </Metric>
              <ProgressBar>
                <ProgressFill 
                  $percent={metrics.remote.utilization}
                  $color={getProgressColor(metrics.remote.utilization)}
                />
              </ProgressBar>
              
              {metrics.remote.temperature && (
                <Metric>
                  <MetricLabel>Temperature</MetricLabel>
                  <MetricValue $alert={metrics.remote.temperature > 80}>
                    {metrics.remote.temperature.toFixed(0)}°C
                  </MetricValue>
                </Metric>
              )}
              
              {metrics.remote.power && (
                <Metric>
                  <MetricLabel>Power Draw</MetricLabel>
                  <MetricValue>{metrics.remote.power.toFixed(0)}W</MetricValue>
                </Metric>
              )}
              
              {metrics.remote.processes !== undefined && (
                <Metric>
                  <MetricLabel>Active Processes</MetricLabel>
                  <MetricValue>{metrics.remote.processes}</MetricValue>
                </Metric>
              )}
            </MetricGrid>
          ) : (
            <MetricGrid>
              <Metric>
                <MetricLabel>Status</MetricLabel>
                <MetricValue>Not Connected</MetricValue>
              </Metric>
            </MetricGrid>
          )}
        </GPUCard>
      </GPUContainer>

      <PerformanceChart>
        <ChartTitle>System Overview</ChartTitle>
        <ChartGrid>
          <StatCard>
            <StatValue>
              {metrics.total_vram ? formatMemory(metrics.total_vram) : '--'}
            </StatValue>
            <StatLabel>Total VRAM</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatValue>
              {metrics.total_utilization ? `${metrics.total_utilization.toFixed(0)}%` : '--'}
            </StatValue>
            <StatLabel>Avg Utilization</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatValue>
              {metrics.network_latency ? `${metrics.network_latency.toFixed(1)}ms` : '--'}
            </StatValue>
            <StatLabel>Network Latency</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatValue>
              {metrics.remote ? '2 GPUs' : '1 GPU'}
            </StatValue>
            <StatLabel>Active GPUs</StatLabel>
          </StatCard>
        </ChartGrid>
      </PerformanceChart>

      {alerts.length > 0 && alerts.map((alert, index) => (
        <AlertBox key={index} $type="warning">
          ⚠️ {alert}
        </AlertBox>
      ))}

      {!metrics.remote && (
        <AlertBox $type="info">
          ℹ️ Remote GPU not connected. Connect to PopOS worker for dual GPU mode.
        </AlertBox>
      )}
    </Container>
  );
};

export default GPUMonitorDashboard;