import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { AnthropicAdvancedNodeData } from './AnthropicAdvancedNode.types';

const AnthropicAdvancedNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingFunction, setEditingFunction] = useState(false);
    const [editingInput, setEditingInput] = useState(false);
    const [localInputValue, setLocalInputValue] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderFunction,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as AnthropicAdvancedNodeData;
    const customData = nodeData.customData || {
        temperature: 0.7,
        top_p: 1.0,
        top_k: 40,
        max_tokens: 1000,
        model: 'claude-sonnet-4-20250514',
        system_prompt: '',
        stop_sequences: ''
    };

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

        // Add advanced settings to inputs
        inputObj.model = customData.model;
        inputObj.temperature = customData.temperature;
        inputObj.top_p = customData.top_p;
        inputObj.top_k = customData.top_k;
        inputObj.max_tokens = customData.max_tokens;

        if (customData.system_prompt.trim()) {
            inputObj.system_prompt = customData.system_prompt;
        }

        if (customData.stop_sequences.trim()) {
            inputObj.stop_sequences = customData.stop_sequences.split(',').map((s: string) => s.trim()).filter((s: string) => s);
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

    const updateCustomData = (updates: Partial<typeof customData>) => {
        updateNodeCustomData(id, updates);
    };

    const currentApiKey = getStoredApiKey();
    const hasApiKey = !!currentApiKey;

    return (
        <div className="anthropic-advanced-node" style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '2px solid #6d28d9',
            borderRadius: '12px',
            minWidth: '380px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
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
                            🧠 {nodeData.label}
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

                {/* Model Selection */}
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>
                        Model:
                    </label>
                    <select
                        value={customData.model}
                        onChange={(e) => updateCustomData({ model: e.target.value })}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            fontSize: '11px'
                        }}
                    >
                        <optgroup label="Claude 4 (Latest)">
                            <option value="claude-opus-4-20250514">Claude Opus 4</option>
                            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                        </optgroup>
                        <optgroup label="Claude 3.7">
                            <option value="claude-3-7-sonnet-20250219">Claude Sonnet 3.7</option>
                        </optgroup>
                        <optgroup label="Claude 3.5">
                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet v2</option>
                            <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet v1</option>
                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                        </optgroup>
                        <optgroup label="Claude 3">
                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        </optgroup>
                    </select>
                </div>

                {/* Advanced Settings Toggle */}
                <div style={{ marginBottom: '8px' }}>
                    <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        {showAdvancedSettings ? '▼' : '▶'} Advanced Settings
                    </button>
                </div>

                {/* Advanced Settings Panel */}
                {showAdvancedSettings && (
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        marginBottom: '8px',
                        fontSize: '11px'
                    }}>
                        {/* Temperature */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                Temperature: {customData.temperature}
                            </label>
                            <input
                                className="nodrag"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={customData.temperature}
                                onChange={(e) => updateCustomData({ temperature: parseFloat(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>
                                0 = focused, 1 = creative
                            </div>
                        </div>

                        {/* Top P */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                Top P: {customData.top_p}
                            </label>
                            <input
                                className="nodrag"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={customData.top_p}
                                onChange={(e) => updateCustomData({ top_p: parseFloat(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Top K */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                Top K: {customData.top_k}
                            </label>
                            <input
                                className="nodrag"
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={customData.top_k}
                                onChange={(e) => updateCustomData({ top_k: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Max Tokens */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                Max Tokens: {customData.max_tokens}
                            </label>
                            <input
                                className="nodrag"
                                type="range"
                                min="100"
                                max="4000"
                                step="100"
                                value={customData.max_tokens}
                                onChange={(e) => updateCustomData({ max_tokens: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* System Prompt */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                System Prompt:
                            </label>
                            <textarea
                                value={customData.system_prompt}
                                onChange={(e) => updateCustomData({ system_prompt: e.target.value })}
                                placeholder="You are a helpful assistant..."
                                rows={2}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    fontSize: '10px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Stop Sequences */}
                        <div style={{ marginBottom: '6px' }}>
                            <label style={{ display: 'block', marginBottom: '2px' }}>
                                Stop Sequences (comma-separated):
                            </label>
                            <input
                                type="text"
                                value={customData.stop_sequences}
                                onChange={(e) => updateCustomData({ stop_sequences: e.target.value })}
                                placeholder="Human:, Assistant:, END"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    fontSize: '10px'
                                }}
                            />
                        </div>
                    </div>
                )}

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
                        {nodeData.isExecuting ? 'Processing...' : 'Ask Claude Pro'}
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

export default AnthropicAdvancedNode; 