import * as React from 'react';
const { useState } = React;
import VideoEditor from './workflow/VideoEditor';
import VideoTimeline from './workflow/VideoTimeline';
import VideoEffects from './workflow/VideoEffects';
import VideoExport from './workflow/VideoExport';
import CinematicControls from './workflow/CinematicControls';
import Flow from './workflow/Flow';
import SimpleFlow from './workflow/SimpleFlow';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'editor' | 'timeline' | 'effects' | 'export' | 'cinematic' | 'flow'>('editor');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#0a0a0a'
    }}>
      <div style={{
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        padding: '12px 20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          🎬 WAN 2.2 Professional Video Suite
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('editor')}
            style={{
              padding: '8px 16px',
              background: activeView === 'editor' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'editor' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Node Editor
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            style={{
              padding: '8px 16px',
              background: activeView === 'timeline' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'timeline' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveView('effects')}
            style={{
              padding: '8px 16px',
              background: activeView === 'effects' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'effects' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Effects
          </button>
          <button
            onClick={() => setActiveView('cinematic')}
            style={{
              padding: '8px 16px',
              background: activeView === 'cinematic' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'cinematic' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cinematic
          </button>
          <button
            onClick={() => setActiveView('export')}
            style={{
              padding: '8px 16px',
              background: activeView === 'export' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'export' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Export
          </button>
          <button
            onClick={() => setActiveView('flow')}
            style={{
              padding: '8px 16px',
              background: activeView === 'flow' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: activeView === 'flow' ? '#667eea' : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            WAN Flow
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeView === 'editor' && <SimpleFlow />}
        {activeView === 'timeline' && <VideoTimeline />}
        {activeView === 'effects' && <VideoEffects />}
        {activeView === 'export' && <VideoExport />}
        {activeView === 'cinematic' && <CinematicControls />}
        {activeView === 'flow' && <SimpleFlow />}
      </div>
    </div>
  );
};

export default App;