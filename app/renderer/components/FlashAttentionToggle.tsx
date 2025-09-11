import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h3`
  color: white;
  margin: 0 0 12px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{ $available: boolean }>`
  background: ${props => props.$available ? '#4ade80' : '#f87171'};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
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

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 13px;
  margin: 4px 0;
`;

const BenchmarkButton = styled.button`
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

const SpeedupBadge = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
  margin-top: 8px;
`;

interface FlashAttentionStatus {
  available: boolean;
  method: 'flash_attn' | 'xformers' | 'standard';
  gpuSupport: boolean;
  expectedSpeedup: string;
  memoryReduction: string;
}

interface BenchmarkResult {
  standardTime: number;
  flashTime: number;
  speedup: number;
  memoryReduction: number;
}

export const FlashAttentionToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<FlashAttentionStatus>({
    available: false,
    method: 'standard',
    gpuSupport: false,
    expectedSpeedup: '1x',
    memoryReduction: '1x'
  });
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [poposServerRunning, setPoposServerRunning] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initial check
    checkFlashAttentionStatus();
    
    // Check PopOS server status from localStorage
    const checkServerStatus = () => {
      const serverStatus = localStorage.getItem('popos-server-status');
      const wasRunning = poposServerRunning;
      const isRunning = serverStatus === 'running';
      setPoposServerRunning(isRunning);
      
      // If server just started, recheck Flash Attention
      if (!wasRunning && isRunning) {
        setTimeout(() => checkFlashAttentionStatus(), 2000);
      }
    };
    
    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkServerStatus();
      // Recheck Flash Attention every 30 seconds if server is running
      if (poposServerRunning) {
        checkFlashAttentionStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [poposServerRunning]);

  const checkFlashAttentionStatus = async () => {
    setIsChecking(true);
    setLastCheckTime(new Date());
    
    // First check if PopOS server is running
    const serverStatus = localStorage.getItem('popos-server-status');
    if (serverStatus !== 'running') {
      console.log('PopOS server not running, Flash Attention unavailable');
      setStatus({
        available: false,
        method: 'standard',
        gpuSupport: false,
        expectedSpeedup: '1x',
        memoryReduction: '1x'
      });
      setIsChecking(false);
      return;
    }
    
    try {
      // Check PopOS worker Flash Attention status with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch('http://10.0.0.2:8000/flash/status', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          const available = data.flash_attn || data.xformers;
          let method: 'flash_attn' | 'xformers' | 'standard' = 'standard';
          
          if (data.flash_attn) {
            method = 'flash_attn';
          } else if (data.xformers) {
            method = 'xformers';
          }
          
          setStatus({
            available,
            method,
            gpuSupport: data.cuda_available,
            expectedSpeedup: method === 'flash_attn' ? '2-4x' : method === 'xformers' ? '1.5-3x' : '1x',
            memoryReduction: method === 'flash_attn' ? '10-20x' : method === 'xformers' ? '5-10x' : '1x'
          });
          
          // Auto-enable if available
          if (available) {
            setEnabled(true);
          }
        } else {
          // Remote server responded but with error
          console.log('Flash Attention check failed, using standard attention');
          setStatus({
            available: false,
            method: 'standard',
            gpuSupport: false,
            expectedSpeedup: '1x',
            memoryReduction: '1x'
          });
        }
      } catch (fetchError) {
        // Connection failed or timeout
        console.log('PopOS worker not available for Flash Attention, using standard mode');
        setStatus({
          available: false,
          method: 'standard',
          gpuSupport: false,
          expectedSpeedup: '1x',
          memoryReduction: '1x'
        });
      }
    } catch (error) {
      console.error('Failed to check Flash Attention status:', error);
      setStatus({
        available: false,
        method: 'standard',
        gpuSupport: false,
        expectedSpeedup: '1x',
        memoryReduction: '1x'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const runBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const response = await fetch('http://10.0.0.2:8000/flash/benchmark');
      if (response.ok) {
        const data = await response.json();
        
        if (data.benchmarks) {
          const standard = data.benchmarks.standard_attention;
          const flash = data.benchmarks.flash_attention || data.benchmarks.xformers;
          
          if (standard && flash && !flash.error) {
            setBenchmarkResult({
              standardTime: standard.time_ms,
              flashTime: flash.time_ms,
              speedup: flash.speedup || standard.time_ms / flash.time_ms,
              memoryReduction: flash.memory_reduction || standard.memory_gb / flash.memory_gb
            });
          }
        }
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    
    // Notify main process about Flash Attention preference
    if (window.electronAPI) {
      window.electronAPI.setFlashAttention(checked);
    }
  };

  return (
    <Container>
      <Title>
        ⚡ Flash Attention Optimization
        <StatusBadge $available={status.available}>
          {status.available ? 'Available' : 'Not Available'}
        </StatusBadge>
      </Title>

      <ToggleContainer>
        <Toggle>
          <ToggleInput
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={!status.available || isChecking}
          />
          <Slider />
        </Toggle>
        <Label>
          {enabled ? 'Enabled' : 'Disabled'}
          {status.method !== 'standard' && enabled && ` (${status.method})`}
        </Label>
      </ToggleContainer>

      {status.available && (
        <InfoBox>
          <InfoRow>
            <span>Method:</span>
            <span>{status.method === 'flash_attn' ? 'Flash Attention 2' : 
                   status.method === 'xformers' ? 'xFormers' : 'Standard'}</span>
          </InfoRow>
          <InfoRow>
            <span>Expected Speedup:</span>
            <span>{status.expectedSpeedup}</span>
          </InfoRow>
          <InfoRow>
            <span>Memory Reduction:</span>
            <span>{status.memoryReduction}</span>
          </InfoRow>
          <InfoRow>
            <span>GPU Support:</span>
            <span>{status.gpuSupport ? 'RTX 3090 (PopOS)' : 'Not Available'}</span>
          </InfoRow>
        </InfoBox>
      )}

      {!status.available && (
        <InfoBox>
          <InfoRow>
            <span style={{ color: '#fbbf24' }}>
              {!poposServerRunning ? 
                '⚠️ PopOS server is not running. Start the server from PopOS Server tab.' :
                '⚠️ Flash Attention requires PopOS worker with RTX 30-series or newer GPU'}
            </span>
          </InfoRow>
          <InfoRow>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {!poposServerRunning ?
                'Flash Attention is only available through the PopOS GPU worker' :
                'Windows does not support Flash Attention due to compiler limitations'}
            </span>
          </InfoRow>
          {lastCheckTime && (
            <InfoRow>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>
                Last checked: {lastCheckTime.toLocaleTimeString()}
              </span>
            </InfoRow>
          )}
        </InfoBox>
      )}

      {benchmarkResult && (
        <SpeedupBadge>
          🚀 {benchmarkResult.speedup.toFixed(1)}x faster, 
          {' '}{benchmarkResult.memoryReduction.toFixed(1)}x less memory
        </SpeedupBadge>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <BenchmarkButton
          onClick={runBenchmark}
          disabled={!status.available || isBenchmarking}
        >
          {isBenchmarking ? 'Running Benchmark...' : 'Run Benchmark'}
        </BenchmarkButton>
        <BenchmarkButton
          onClick={checkFlashAttentionStatus}
          disabled={isChecking}
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          {isChecking ? 'Checking...' : '🔄 Refresh Status'}
        </BenchmarkButton>
      </div>
    </Container>
  );
};

export default FlashAttentionToggle;