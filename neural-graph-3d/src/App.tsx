import React, { useState, useEffect } from 'react';
import { NeuralNetwork3D } from './components/NeuralNetwork3D';
import { FlowData } from './types';
import './App.css';

// Minimal fallback data when API is unavailable
const fallbackData: FlowData = {
  flow_id: "fallback",
  saved_at: new Date().toISOString(),
  nodes: [],
  edges: []
};

function App() {
  const [data, setData] = useState<FlowData>(fallbackData);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/flow-data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const liveData = await response.json();
      setData(liveData);
      setIsLive(true);
      console.log('✅ Live data loaded successfully');
    } catch (err) {
      console.warn('⚠️ Failed to fetch live data, using fallback:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(fallbackData);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to fetch live data on mount
    fetchLiveData();

    // Set up interval to refresh live data every 5 seconds
    const interval = setInterval(() => {
      if (isLive) {
        fetchLiveData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="App">
      <NeuralNetwork3D data={data} />

      {/* Data source indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: isLive ? 'rgba(0, 200, 0, 0.8)' : 'rgba(200, 100, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isLive ? '#00ff00' : '#ffa500',
          animation: isLive ? 'pulse 2s infinite' : 'none'
        }} />
        {isLoading ? 'Connecting...' :
          isLive ? 'LIVE DATA' : 'NO DATA - START API'}
        {error && (
          <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.8 }}>
            ({error})
          </span>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchLiveData}
        disabled={isLoading}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '1px solid #4dabf7',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '11px',
          cursor: isLoading ? 'wait' : 'pointer',
          zIndex: 1000
        }}
      >
        {isLoading ? '⟳ Refreshing...' : '🔄 Refresh Data'}
      </button>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
