import * as React from 'react';

const SimpleFlow: React.FC = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: '#fff', height: '100%' }}>
      <h2>Simple WAN 2.2 Flow Component</h2>
      <p>This is a test component to verify React is working properly.</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Count: {count}
        </button>
      </div>
      <div style={{ marginTop: '20px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        <h3>Available Features:</h3>
        <ul>
          <li>Node-based video editing</li>
          <li>Timeline editor</li>
          <li>AI-powered effects</li>
          <li>Cinematic controls</li>
          <li>Export capabilities</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleFlow;