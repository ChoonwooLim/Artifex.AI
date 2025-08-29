import * as React from 'react';

const SimpleFlow: React.FC = () => {
  const [count, setCount] = React.useState(0);
  const [hoveredFeature, setHoveredFeature] = React.useState<number | null>(null);
  
  const features = [
    { icon: '🎨', title: 'Node-based video editing', desc: 'Visual workflow creation' },
    { icon: '⏱️', title: 'Timeline editor', desc: 'Precise timing control' },
    { icon: '🤖', title: 'AI-powered effects', desc: 'Intelligent enhancements' },
    { icon: '🎬', title: 'Cinematic controls', desc: 'Professional cinematography' },
    { icon: '📤', title: 'Export capabilities', desc: 'Multiple format support' }
  ];
  
  return (
    <div style={{ 
      padding: '32px', 
      background: 'transparent', 
      color: '#fff', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
        borderRadius: '16px',
        padding: '32px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          WAN 2.2 Flow Engine
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Advanced video creation with AI-powered workflows
        </p>
        
        <div style={{ 
          marginTop: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,126,234,0.3)';
            }}
          >
            <span style={{ marginRight: '8px' }}>🚀</span>
            Interactions: {count}
          </button>
          
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>
            System Ready
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              background: '#4ade80',
              borderRadius: '50%',
              marginLeft: '8px',
              animation: 'pulse 2s ease-in-out infinite'
            }}/>
          </div>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          Core Features
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                padding: '20px',
                background: hoveredFeature === index 
                  ? 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)'
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: hoveredFeature === index 
                  ? 'rgba(102,126,234,0.3)' 
                  : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: hoveredFeature === index ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredFeature === index 
                  ? '0 8px 24px rgba(102,126,234,0.2)' 
                  : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                fontSize: '28px', 
                marginBottom: '12px',
                filter: hoveredFeature === index ? 'brightness(1.2)' : 'brightness(1)'
              }}>
                {feature.icon}
              </div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '4px',
                color: 'rgba(255,255,255,0.9)'
              }}>
                {feature.title}
              </h4>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                margin: 0
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleFlow;