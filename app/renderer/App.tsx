import * as React from 'react';
const { useState, useEffect } = React;
import VideoEditor from './workflow/VideoEditor';
import VideoTimeline from './workflow/VideoTimeline';
import VideoEffects from './workflow/VideoEffects';
import VideoExport from './workflow/VideoExport';
import CinematicControls from './workflow/CinematicControls';
import Flow from './workflow/Flow';
import SimpleFlow from './workflow/SimpleFlow';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'editor' | 'timeline' | 'effects' | 'export' | 'cinematic' | 'flow'>('editor');
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  const navItems = [
    { id: 'editor', label: 'Node Editor', icon: '🎨' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'effects', label: 'Effects', icon: '✨' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎥' },
    { id: 'export', label: 'Export', icon: '📤' },
    { id: 'flow', label: 'WAN Flow', icon: '🌊' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        background: 'linear-gradient(90deg, rgba(30,30,60,0.95) 0%, rgba(40,40,80,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #00ffff, #ff00ff, #ffff00, #00ffff)',
          backgroundSize: '200% 100%',
          animation: 'gradient 3s ease infinite'
        }}/>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.6s ease-out'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            🎬
          </div>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              WAN 2.2 Professional
            </h1>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              marginTop: '2px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Video Creation Suite
            </p>
          </div>
        </div>

        <nav style={{ 
          display: 'flex', 
          gap: '4px',
          background: 'rgba(0,0,0,0.2)',
          padding: '4px',
          borderRadius: '12px'
        }}>
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              style={{
                padding: '10px 20px',
                background: activeView === item.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: activeView === item.id ? '#fff' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? 'translateY(0)' : 'translateY(-10px)',
                transitionDelay: `${index * 0.05}s`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeView === item.id && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #fff, transparent)',
                  animation: 'shimmer 2s ease-in-out infinite'
                }}/>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, rgba(102,126,234,0.03) 0%, transparent 70%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.6s ease-out 0.2s'
        }}>
          {activeView === 'editor' && <SimpleFlow />}
          {activeView === 'timeline' && <VideoTimeline />}
          {activeView === 'effects' && <VideoEffects />}
          {activeView === 'export' && <VideoExport />}
          {activeView === 'cinematic' && <CinematicControls />}
          {activeView === 'flow' && <SimpleFlow />}
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;