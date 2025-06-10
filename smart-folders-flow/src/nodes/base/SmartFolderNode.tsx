import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../store';
import { BaseNodeData } from './BaseNode.types';

// Trash Icon Component
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

const SmartFolderNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingFunction, setEditingFunction] = useState(false);
    const [editingInput, setEditingInput] = useState(false);
    const [localInputValue, setLocalInputValue] = useState('');
    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderFunction,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        deleteSmartFolder,
    } = useStore();

    const nodeData = data as BaseNodeData;

    // Calculate dynamic columns based on content
    const calculateDynamicCols = (content: string): number => {
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        // Use at least 30 cols, but expand based on content (with a reasonable max)
        return Math.min(Math.max(maxLineLength + 5, 30), 120);
    };

    // Calculate dynamic rows based on content
    const calculateDynamicRows = (content: string): number => {
        const lines = content.split('\n');
        // Use at least 4 rows, but expand based on content (with a reasonable max)
        return Math.min(Math.max(lines.length, 4), 30);
    };

    const handleExecute = () => {
        executeSmartFolder(id);
    };

    const handleCancel = () => {
        cancelExecution(id);
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleFunctionChange = (newFunction: string) => {
        updateSmartFolderFunction(id, newFunction);
        setEditingFunction(false);
    };

    const handleManualInputChange = (newInput: string) => {
        updateSmartFolderManualInput(id, newInput);
    };

    const handleInputFocus = () => {
        setEditingInput(true);
        setLocalInputValue(nodeData.manualInput);
    };

    const handleInputBlur = (newInput: string) => {
        setEditingInput(false);
        updateSmartFolderManualInput(id, newInput);
    };

    const handleLocalInputChange = (newInput: string) => {
        setLocalInputValue(newInput);
    };

    const handleDelete = () => {
        const confirmMessage = `Are you sure you want to delete "${nodeData.label}"?\n\nThis will also remove all connections to and from this node.`;

        if (window.confirm(confirmMessage)) {
            deleteSmartFolder(id);
        }
    };

    return (
        <div className="smart-folder-node">
            {/* Input handle - top */}
            <Handle type="target" position={Position.Top} />

            <div className="node-content">
                {/* Title and Delete Button */}
                <div className="node-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditing ? (
                            <input
                                type="text"
                                defaultValue={nodeData.label}
                                onBlur={(e) => handleLabelChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLabelChange(e.currentTarget.value);
                                    }
                                }}
                                autoFocus
                                style={{ flex: 1, marginRight: '8px' }}
                            />
                        ) : (
                            <h3 onClick={() => setIsEditing(true)} style={{ flex: 1, margin: 0 }}>
                                {nodeData.label}
                            </h3>
                        )}

                        <button
                            onClick={handleDelete}
                            className="delete-btn"
                            title={`Delete ${nodeData.label}`}
                        >
                            <TrashIcon size={14} />
                        </button>
                    </div>
                </div>

                {/* Python Function */}
                <div className="function-section">
                    <label>Python Function:</label>
                    {editingFunction ? (
                        <textarea
                            defaultValue={nodeData.pythonFunction}
                            onBlur={(e) => handleFunctionChange(e.target.value)}
                            rows={calculateDynamicRows(nodeData.pythonFunction)}
                            cols={calculateDynamicCols(nodeData.pythonFunction)}
                            autoFocus
                            className="nodrag nowheel"
                        />
                    ) : (
                        <pre
                            className="function-display nodrag nowheel"
                            onClick={() => setEditingFunction(true)}
                        >
                            {nodeData.pythonFunction}
                        </pre>
                    )}
                </div>

                {/* Connected Inputs */}
                {Object.keys(nodeData.inputs || {}).length > 0 && (
                    <div className="connected-inputs-section">
                        <label>Connected Inputs:</label>
                        <div className="connected-inputs-list">
                            {Object.entries(nodeData.inputs || {}).map(([sourceId, inputData]) => (
                                <div key={sourceId} className="connected-input-item">
                                    <div className="input-source-label">
                                        <strong>{inputData.nodeLabel}</strong>
                                        <span className="input-timestamp">
                                            {new Date(inputData.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="input-value">
                                        {inputData.value || "(empty)"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Input */}
                <div className="input-section">
                    <label>Manual Input:</label>
                    <textarea
                        value={editingInput ? localInputValue : nodeData.manualInput}
                        onChange={(e) => editingInput ? handleLocalInputChange(e.target.value) : handleManualInputChange(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={(e) => editingInput ? handleInputBlur(e.target.value) : undefined}
                        placeholder="Enter input text..."
                        rows={calculateDynamicRows(nodeData.manualInput)}
                        className="input-textarea nodrag nowheel"
                    />
                </div>

                {/* Execute/Cancel Buttons */}
                <div className="button-section" style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleExecute}
                        disabled={nodeData.isExecuting}
                        className={`execute-btn ${nodeData.isExecuting ? 'executing' : ''}`}
                        style={{ flex: nodeData.isExecuting ? '0 0 auto' : '1' }}
                    >
                        {nodeData.isExecuting ? 'Executing...' : 'Execute'}
                    </button>

                    {nodeData.isExecuting && (
                        <button
                            onClick={handleCancel}
                            className="cancel-btn"
                            title="Cancel execution"
                            style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Streaming Logs */}
                {(nodeData.streamingLogs || nodeData.isExecuting) && (
                    <div className="logs-section">
                        <div className="logs-header">
                            <label>Execution Logs:</label>
                            {nodeData.streamingLogs && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(nodeData.streamingLogs)}
                                    className="copy-btn"
                                    title="Copy logs to clipboard"
                                >
                                    📋
                                </button>
                            )}
                        </div>
                        <div className="logs-display selectable-text nodrag nowheel">
                            {nodeData.streamingLogs || (nodeData.isExecuting ? 'Starting execution...' : '')}
                        </div>
                    </div>
                )}

                {/* Final Output */}
                {nodeData.lastOutput && (
                    <div className="output-section">
                        <div className="output-header">
                            <label>Function Output:</label>
                            <button
                                onClick={() => navigator.clipboard.writeText(nodeData.lastOutput)}
                                className="copy-btn"
                                title="Copy output to clipboard"
                            >
                                📋
                            </button>
                        </div>
                        <div className="output-display selectable-text nodrag nowheel">{nodeData.lastOutput}</div>
                    </div>
                )}

                {/* Execution Status */}
                {nodeData.isExecuting && (
                    <div className="status-indicator">
                        <div className="spinner"></div>
                        Processing...
                    </div>
                )}
            </div>

            {/* Output handle - bottom */}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default SmartFolderNode; 