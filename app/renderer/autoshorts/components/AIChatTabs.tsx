import React, { useState } from 'react';
import styled from 'styled-components';
import { Cloud, HardDrive } from 'lucide-react';
import { OllamaChat } from './OllamaChat';
import { CloudChat } from './CloudChat';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: ${props => props.active ? '2px solid #667eea' : '2px solid transparent'};

  &:hover {
    background: ${props => !props.active && 'rgba(255, 255, 255, 0.05)'};
    color: #fff;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

type TabType = 'local' | 'cloud';

export const AIChatTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('local');

  return (
    <Container>
      <TabHeader>
        <Tab 
          active={activeTab === 'local'}
          onClick={() => setActiveTab('local')}
        >
          <HardDrive />
          로컬 AI
        </Tab>
        <Tab 
          active={activeTab === 'cloud'}
          onClick={() => setActiveTab('cloud')}
        >
          <Cloud />
          클라우드 AI
        </Tab>
      </TabHeader>
      
      <TabContent>
        {activeTab === 'local' ? (
          <OllamaChat />
        ) : (
          <CloudChat />
        )}
      </TabContent>
    </Container>
  );
};