import React from 'react';
import { NeuralNetwork3D } from './components/NeuralNetwork3D';
import { FlowData } from './types';
import flowData from './data.json';
import './App.css';

function App() {
  return (
    <div className="App">
      <NeuralNetwork3D data={flowData as FlowData} />
    </div>
  );
}

export default App;
