import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { LabelNodeData } from './LabelNode.types';

// Import the base SmartFolderNode for function mode
import SmartFolderNode from '../../base/SmartFolderNode';

const LabelNode: React.FC<NodeProps> = ({ id, data, ...props }) => {
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
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as LabelNodeData;
    const customData = nodeData.customData || {
        mode: 'label',
        fontSize: 24,
        textColor: '#333333',
        backgroundColor: '#ffffff',
        maxWidth: 1200
    };

    const handleToggleMode = () => {
        updateNodeCustomData(id, {
            mode: customData.mode === 'label' ? 'function' : 'label'
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleFontSizeChange = (newSize: number) => {
        updateNodeCustomData(id, {
            fontSize: newSize
        });
    };

    const handleColorChange = (newColor: string) => {
        updateNodeCustomData(id, {
            textColor: newColor
        });
    };

    const handleBackgroundChange = (newBg: string) => {
        updateNodeCustomData(id, {
            backgroundColor: newBg
        });
    };

    // Function mode handlers
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

    // Calculate dynamic columns based on content
    const calculateDynamicCols = (content: string): number => {
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        return Math.min(Math.max(maxLineLength + 5, 30), 120);
    };

    // Calculate dynamic rows based on content
    const calculateDynamicRows = (content: string): number => {
        const lines = content.split('\n');
        return Math.min(Math.max(lines.length, 4), 30);
    };

    // If in function mode, render the base SmartFolderNode
    if (customData.mode === 'function') {
        return (
            <div className="label-node-function smart-folder-node">
                {/* Input handle - top */}
                <Handle type="target" position={Position.Top} />

                <div className="node-content">
                    {/* Title, Mode Toggle, and Delete Button */}
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
                                    🏷️ {nodeData.label}
                                </h3>
                            )}

                            <div style={{ display: 'flex', gap: '4px' }}>
                                {/* Mode toggle button */}
                                <button
                                    onClick={handleToggleMode}
                                    className="mode-toggle-btn"
                                    title="Switch to label mode"
                                    style={{
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    🏷️
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="delete-btn"
                                    title={`Delete ${nodeData.label}`}
                                    style={{
                                        background: 'rgba(220, 53, 69, 0.9)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
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
    }

    // Label mode rendering
    return (
        <div
            className="label-node"
            style={{
                background: customData.backgroundColor,
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '16px 24px',
                minWidth: '200px',
                maxWidth: `${customData.maxWidth}px`,
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Invisible handles for connections */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ opacity: 0.3, width: '8px', height: '8px' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ opacity: 0.3, width: '8px', height: '8px' }}
            />

            {/* Controls */}
            <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                display: 'flex',
                gap: '4px',
                opacity: 0.7
            }}>
                {/* Mode toggle */}
                <button
                    onClick={handleToggleMode}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Toggle to function mode"
                >
                    ⚙
                </button>

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Delete node"
                >
                    ×
                </button>
            </div>

            {/* Edit controls (when editing) */}
            {isEditing && (
                <div style={{
                    marginBottom: '12px',
                    padding: '8px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Font Size:</label>
                        <input
                            className="nodrag"
                            type="range"
                            min="12"
                            max="800"
                            value={customData.fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <span>{customData.fontSize}px</span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Max Width:</label>
                        <input
                            className="nodrag"
                            type="range"
                            min="200"
                            max="2000"
                            value={customData.maxWidth || 1200}
                            onChange={(e) => updateNodeCustomData(id, { maxWidth: parseInt(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                        <span>{customData.maxWidth || 1200}px</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Text:</label>
                            <input
                                type="color"
                                value={customData.textColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                style={{ width: '40px', height: '24px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Background:</label>
                            <input
                                type="color"
                                value={customData.backgroundColor}
                                onChange={(e) => handleBackgroundChange(e.target.value)}
                                style={{ width: '40px', height: '24px' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditing(false)}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Main label content */}
            <div
                style={{
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => setIsEditing(true)}
            >
                {isEditing ? (
                    <input
                        type="text"
                        defaultValue={nodeData.label}
                        onBlur={(e) => {
                            updateSmartFolderLabel(id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateSmartFolderLabel(id, e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'transparent',
                            border: '1px dashed #ccc',
                            color: customData.textColor,
                            fontSize: `${customData.fontSize}px`,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            padding: '4px'
                        }}
                    />
                ) : (
                    <h1
                        style={{
                            margin: 0,
                            fontSize: `${customData.fontSize}px`,
                            fontWeight: 'bold',
                            color: customData.textColor,
                            lineHeight: 1.2,
                            userSelect: 'none',
                            wordBreak: 'break-word'
                        }}
                    >
                        {nodeData.label}
                    </h1>
                )}
            </div>

            {/* Subtle mode indicator */}
            <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                fontSize: '10px',
                color: '#999',
                fontStyle: 'italic'
            }}>
                Label Mode
            </div>
        </div>
    );
};

export default LabelNode; 