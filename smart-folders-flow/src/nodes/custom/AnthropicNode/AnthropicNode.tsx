import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { AnthropicNodeData } from './AnthropicNode.types';

const AnthropicNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingFunction, setEditingFunction] = useState(false);
    const [editingInput, setEditingInput] = useState(false);
    const [localInputValue, setLocalInputValue] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderFunction,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        deleteSmartFolder,
    } = useStore();

    const nodeData = data as AnthropicNodeData;

    // Get stored API key from localStorage
    const getStoredApiKey = () => {
        return localStorage.getItem('anthropic_api_key') || '';
    };

    // Save API key to localStorage
    const saveApiKey = (key: string) => {
        if (key.trim()) {
            localStorage.setItem('anthropic_api_key', key.trim());
        } else {
            localStorage.removeItem('anthropic_api_key');
        }
    };

    const handleExecute = () => {
        // Get stored API key and prepare inputs
        const storedApiKey = getStoredApiKey();

        // Parse existing manual input
        let inputObj: any = {};
        try {
            if (nodeData.manualInput.trim()) {
                inputObj = JSON.parse(nodeData.manualInput);
            }
        } catch (e) {
            // If not valid JSON, treat as prompt
            if (nodeData.manualInput.trim()) {
                inputObj = { prompt: nodeData.manualInput };
            }
        }

        // Add API key from localStorage if not already present
        if (storedApiKey && !inputObj.api_key) {
            inputObj.api_key = storedApiKey;
        }

        // Execute with the prepared inputs
        executeSmartFolder(id, inputObj);
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
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleApiKeySubmit = () => {
        saveApiKey(apiKeyInput);
        setApiKeyInput('');
        setShowApiKeyInput(false);
    };

    const handleApiKeyInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApiKeySubmit();
        } else if (e.key === 'Escape') {
            setApiKeyInput('');
            setShowApiKeyInput(false);
        }
    };

    const currentApiKey = getStoredApiKey();
    const hasApiKey = !!currentApiKey;

    return (
        <div className="anthropic-node" style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: '2px solid #c2410c',
            borderRadius: '12px',
            minWidth: '320px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
        }}>
            {/* Input handle - top */}
            <Handle type="target" position={Position.Top} />

            <div className="node-content" style={{ padding: '12px' }}>
                {/* Header with title and delete button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        />
                    ) : (
                        <h4
                            onClick={() => setIsEditing(true)}
                            style={{
                                margin: 0,
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            🤖 {nodeData.label}
                        </h4>
                    )}

                    <button
                        onClick={handleDelete}
                        style={{
                            background: 'rgba(220, 53, 69, 0.8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                        title="Delete node"
                    >
                        ×
                    </button>
                </div>

                {/* API Key Status and Management */}
                <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>API Key: {hasApiKey ? '✅ Set' : '❌ Not Set'}</span>
                        <button
                            onClick={() => {
                                setShowApiKeyInput(!showApiKeyInput);
                                setApiKeyInput(currentApiKey);
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            {hasApiKey ? 'Update' : 'Set'}
                        </button>
                    </div>

                    {showApiKeyInput && (
                        <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                onKeyDown={handleApiKeyInputKeyDown}
                                placeholder="sk-ant-..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white',
                                    borderRadius: '3px',
                                    padding: '4px 6px',
                                    fontSize: '11px'
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleApiKeySubmit}
                                style={{
                                    background: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {/* Python Function */}
                {editingFunction ? (
                    <textarea
                        defaultValue={nodeData.pythonFunction}
                        onBlur={(e) => handleFunctionChange(e.target.value)}
                        rows={6}
                        cols={40}
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '8px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            width: '100%',
                            resize: 'vertical'
                        }}
                        autoFocus
                    />
                ) : (
                    <pre
                        onClick={() => setEditingFunction(true)}
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            margin: '8px 0',
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            maxHeight: '100px'
                        }}
                    >
                        {nodeData.pythonFunction}
                    </pre>
                )}

                {/* Manual Input */}
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>
                        Input (JSON or text):
                    </label>
                    {editingInput ? (
                        <textarea
                            value={localInputValue}
                            onChange={(e) => handleLocalInputChange(e.target.value)}
                            onBlur={(e) => handleInputBlur(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '6px',
                                fontSize: '11px',
                                fontFamily: 'monospace'
                            }}
                            autoFocus
                        />
                    ) : (
                        <div
                            onClick={handleInputFocus}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '6px',
                                minHeight: '24px',
                                cursor: 'text',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {nodeData.manualInput || 'Click to add input...'}
                        </div>
                    )}
                </div>

                {/* Execute Button */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleExecute}
                        disabled={nodeData.isExecuting}
                        style={{
                            flex: 1,
                            background: nodeData.isExecuting ? '#6b7280' : '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: nodeData.isExecuting ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        {nodeData.isExecuting ? 'Processing...' : 'Ask Claude'}
                    </button>

                    {nodeData.isExecuting && (
                        <button
                            onClick={handleCancel}
                            style={{
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Output */}
                {nodeData.lastOutput && (
                    <div style={{
                        marginTop: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        maxHeight: '120px',
                        overflowY: 'auto'
                    }}>
                        <strong>Claude's Response:</strong>
                        <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                            {nodeData.lastOutput}
                        </div>
                    </div>
                )}

                {/* Streaming Logs */}
                {nodeData.streamingLogs && (
                    <div style={{
                        marginTop: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        maxHeight: '80px',
                        overflowY: 'auto',
                        fontFamily: 'monospace'
                    }}>
                        {nodeData.streamingLogs}
                    </div>
                )}

                {nodeData.isExecuting && (
                    <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px'
                    }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        Thinking...
                    </div>
                )}
            </div>

            {/* Output handle - bottom */}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default AnthropicNode; 