import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MiniMap,
} from '@xyflow/react';
import { useShallow } from 'zustand/shallow';

import useStore, { RFState } from './store';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

// Import the node registry system
import './nodes/custom'; // This initializes all node registrations
import nodeRegistry from './nodes/NodeRegistry';

import '@xyflow/react/dist/style.css';
import './App.css';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  selectedNodes: state.selectedNodes,
  selectedEdges: state.selectedEdges,
  copiedNodes: state.copiedNodes,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onSelectionChange: state.onSelectionChange,
  addSmartFolder: state.addSmartFolder,
  addCustomNode: state.addCustomNode,
  deleteEdge: state.deleteEdge,
  deleteSelectedElements: state.deleteSelectedElements,
  executeSelectedNodes: state.executeSelectedNodes,
  copySelectedNodes: state.copySelectedNodes,
  pasteNodes: state.pasteNodes,
  isLoading: state.isLoading,
  isSaving: state.isSaving,
  lastSaved: state.lastSaved,
  saveFlow: state.saveFlow,
});

// Get all node types from registry
const nodeTypes = nodeRegistry.getNodeComponents();

// Trash Icon Component for edge deletion
const TrashIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

function FlowComponent() {
  const {
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    copiedNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    addSmartFolder,
    addCustomNode,
    deleteEdge,
    deleteSelectedElements,
    executeSelectedNodes,
    copySelectedNodes,
    pasteNodes,
    isLoading,
    isSaving,
    lastSaved,
    saveFlow
  } = useStore(useShallow(selector));

  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [edgeMenuPosition, setEdgeMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { screenToFlowPosition } = useReactFlow();

  // Keyboard event handling for copy-paste
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlCmd = event.ctrlKey || event.metaKey;

      // Check if the user is currently interacting with a text input
      const activeElement = document.activeElement;
      const isTextInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // Only handle node-level copy/paste if not in a text input context
      if (isCtrlCmd && event.key === 'c' && !isTextInput) {
        // Only prevent default and handle node copy if nodes are actually selected
        if (selectedNodes.length > 0) {
          event.preventDefault();
          copySelectedNodes();
        }
        // If no nodes selected, let the browser handle normal text copy
      } else if (isCtrlCmd && event.key === 'v' && !isTextInput) {
        // Only prevent default and handle node paste if we have nodes to paste
        if (copiedNodes.length > 0) {
          event.preventDefault();
          const pastePosition = screenToFlowPosition(lastMousePosition);
          pasteNodes(pastePosition);
        }
        // If no nodes to paste, let the browser handle normal text paste
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      setLastMousePosition({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [copySelectedNodes, pasteNodes, screenToFlowPosition, lastMousePosition, selectedNodes.length, copiedNodes.length]);

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Hide edge menu when clicking on pane
      setSelectedEdge(null);
      setEdgeMenuPosition(null);

      // Add new smart folder when double-clicking on the pane
      if (event.detail === 2) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        addSmartFolder(position);
      }
    },
    [addSmartFolder, screenToFlowPosition],
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation();
      setSelectedEdge(edge.id);

      // Use absolute client coordinates for positioning
      setEdgeMenuPosition({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const handleDeleteEdge = useCallback(() => {
    if (selectedEdge) {
      deleteEdge(selectedEdge);
      setSelectedEdge(null);
      setEdgeMenuPosition(null);
    }
  }, [selectedEdge, deleteEdge]);

  const handleAddCustomNode = useCallback((nodeType: string, event: React.MouseEvent) => {
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    addCustomNode(nodeType, position);
    setShowNodePalette(false);
  }, [addCustomNode, screenToFlowPosition]);

  const formatLastSaved = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  const handleDeleteSelectedWithConfirmation = useCallback(() => {
    const nodeCount = selectedNodes.length;
    const edgeCount = selectedEdges.length;

    if (nodeCount === 0 && edgeCount === 0) {
      return;
    }

    let confirmMessage = '';
    if (nodeCount > 0 && edgeCount > 0) {
      confirmMessage = `Delete ${nodeCount} node${nodeCount > 1 ? 's' : ''} and ${edgeCount} edge${edgeCount > 1 ? 's' : ''}?`;
    } else if (nodeCount > 0) {
      confirmMessage = `Delete ${nodeCount} node${nodeCount > 1 ? 's' : ''}?`;
    } else {
      confirmMessage = `Delete ${edgeCount} edge${edgeCount > 1 ? 's' : ''}?`;
    }

    if (window.confirm(confirmMessage + '\n\nThis action cannot be undone.')) {
      deleteSelectedElements();
    }
  }, [selectedNodes.length, selectedEdges.length, deleteSelectedElements]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <h2>Loading your smart folders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}

        // Multi-selection configuration
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Meta', 'Control']}
        deleteKeyCode={['Delete', 'Backspace']}

        // Selection behavior
        selectionOnDrag={false}
        selectNodesOnDrag={true}
        elevateNodesOnSelect={true}

        // Viewport controls
        zoomOnDoubleClick={false}
        minZoom={0.001}
        fitView

        defaultEdgeOptions={{
          type: 'bezier',
          animated: true,
          style: { stroke: '#0066cc', strokeWidth: 2 },
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          position="bottom-right"
          zoomable
          pannable
          style={{
            backgroundColor: '#f8f9fa',
          }}
        />

        {/* Selection Toolbar - appears when nodes are selected */}
        {selectedNodes.length > 0 && (
          <Panel position="bottom-left" className="panel" style={{ backgroundColor: '#e3f2fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                🔍 {selectedNodes.length} node{selectedNodes.length > 1 ? 's' : ''} selected
                {selectedEdges.length > 0 && `, ${selectedEdges.length} edge${selectedEdges.length > 1 ? 's' : ''}`}
              </div>

              <button
                onClick={copySelectedNodes}
                style={{
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Copy selected nodes (Ctrl+C / Cmd+C)"
              >
                📋 Copy
              </button>

              <button
                onClick={executeSelectedNodes}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Execute all selected nodes"
              >
                🚀 Execute Selected
              </button>

              <button
                onClick={handleDeleteSelectedWithConfirmation}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Delete selected nodes and edges"
              >
                🗑️ Delete Selected
              </button>

              {copiedNodes.length > 0 && (
                <button
                  onClick={() => {
                    const pastePosition = screenToFlowPosition(lastMousePosition);
                    pasteNodes(pastePosition);
                  }}
                  style={{
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={`Paste ${copiedNodes.length} node${copiedNodes.length > 1 ? 's' : ''} (Ctrl+V / Cmd+V)`}
                >
                  📌 Paste ({copiedNodes.length})
                </button>
              )}
            </div>
          </Panel>
        )}

        {/* Main Control Panel */}
        <Panel position="top-left" className="panel">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: isCollapsed ? '0' : '12px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Boost Smart Notes</h2>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                height: '24px',
                width: '24px',
                justifyContent: 'center'
              }}
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isSaving ? '#ffc107' : '#28a745',
              fontSize: '12px'
            }}>
              {isSaving ? (
                <>
                  <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 {formatLastSaved(lastSaved)}
                </>
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <ThemeToggle />
            </div>
          </div>

          {!isCollapsed && (
            <>
              <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '12px' }}>
                <p><strong>Multi-Selection:</strong></p>
                <p>• <kbd>Shift</kbd> + drag for selection box</p>
                <p>• <kbd>Cmd/Ctrl</kbd> + click for individual selection</p>
                <p>• Drag any selected node to move the group</p>
                <p>• <kbd>Del/Backspace</kbd> to delete selected</p>
                <p><strong>Copy-Paste:</strong></p>
                <p>• <kbd>Ctrl/Cmd+C</kbd> to copy selected nodes</p>
                <p>• <kbd>Ctrl/Cmd+V</kbd> to paste at cursor position</p>
              </div>
              <p>Double-click to add a basic smart folder</p>
              <p>Connect folders to create subscriptions</p>
              <p>Multiple inputs: Connect multiple sources to one target</p>
              <p>Execute ANY connected node to trigger its subscribers</p>
              <p>Click on a connection to delete it</p>
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Multi-Input System Active!</p>

              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={saveFlow}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isSaving}
                >
                  💾 Save Now
                </button>
              </div>
            </>
          )}
        </Panel>

        {/* Node Palette Panel */}
        <Panel position="top-right" className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Custom Nodes</h3>
            <button
              onClick={() => setShowNodePalette(!showNodePalette)}
              style={{
                background: showNodePalette ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showNodePalette ? 'Hide' : 'Show'}
            </button>
          </div>

          {showNodePalette && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {nodeRegistry.getNodeTypes().map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={(e) => handleAddCustomNode(nodeType.type, e)}
                  style={{
                    background: nodeType.color || '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={nodeType.description}
                >
                  <span style={{ fontSize: '16px' }}>{nodeType.icon}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{nodeType.displayName}</div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>{nodeType.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </ReactFlow>

      {/* Floating edge delete button */}
      {selectedEdge && edgeMenuPosition && (
        <div
          className="edge-delete-menu"
          style={{
            position: 'fixed',
            left: edgeMenuPosition.x,
            top: edgeMenuPosition.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <button
            onClick={handleDeleteEdge}
            className="edge-delete-btn"
            title="Delete connection"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <FlowComponent />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default App;
