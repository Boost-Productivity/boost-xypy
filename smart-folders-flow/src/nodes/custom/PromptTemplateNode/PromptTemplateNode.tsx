import React, { useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { PromptTemplateNodeData } from './PromptTemplateNode.types';

// Template Icon Component
const TemplateIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
);

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

const PromptTemplateNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as PromptTemplateNodeData;
    const customData = nodeData.customData || {
        template: 'Hello {{name}}, please analyze the following: {{content}}',
        variables: {},
        temperature: 0, // Default to 0 for programmatic use
        top_p: 1.0,
        top_k: 40,
        max_tokens: 1000,
        model: 'claude-sonnet-4-20250514',
        system_prompt: '',
        stop_sequences: ''
    };

    // Extract variables from template
    const extractedVariables = useMemo(() => {
        const matches = customData.template.match(/\{\{([^}]+)\}\}/g);
        if (!matches) return [];
        return Array.from(new Set(matches.map(match => match.slice(2, -2).trim())));
    }, [customData.template]);

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

    // Fill template with variables
    const fillTemplate = () => {
        let filledTemplate = customData.template;
        extractedVariables.forEach(variable => {
            const value = customData.variables[variable] || '';
            filledTemplate = filledTemplate.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
        });
        return filledTemplate;
    };

    const handleExecute = () => {
        const storedApiKey = getStoredApiKey();
        console.log('API Key retrieved for execution:', storedApiKey ? 'Key present' : 'No key found');

        // Check if all variables are filled
        const missingVariables = extractedVariables.filter(variable =>
            !customData.variables[variable] || customData.variables[variable].trim() === ''
        );

        if (missingVariables.length > 0) {
            alert(`Please fill in all template variables: ${missingVariables.join(', ')}`);
            return;
        }

        // Fill the template
        const prompt = fillTemplate();

        // Prepare input object with all parameters for the Python function
        const inputObj: any = {
            prompt: prompt,
            api_key: storedApiKey,
            model: customData.model,
            temperature: customData.temperature,
            top_p: customData.top_p,
            top_k: customData.top_k,
            max_tokens: customData.max_tokens
        };

        // Add system prompt if provided
        if (customData.system_prompt.trim()) {
            inputObj.system_prompt = customData.system_prompt;
        }

        // Add stop sequences if provided
        if (customData.stop_sequences.trim()) {
            inputObj.stop_sequences = customData.stop_sequences.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        }

        // Execute with the prepared inputs using the Python function
        executeSmartFolder(id, inputObj);
    };

    const handleCancel = () => {
        cancelExecution(id);
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleTemplateChange = (newTemplate: string) => {
        updateNodeCustomData(id, {
            template: newTemplate
        });
        setEditingTemplate(false);
    };

    const handleVariableChange = (variableName: string, value: string) => {
        updateNodeCustomData(id, {
            variables: {
                ...customData.variables,
                [variableName]: value
            }
        });
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

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(nodeData.lastOutput || '');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const currentApiKey = getStoredApiKey();
    const hasApiKey = !!currentApiKey;
    const isExecuting = nodeData.isExecuting;

    return (
        <div
            className="prompt-template-node"
            style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '3px solid #047857',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '400px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
        >
            <Handle type="target" position={Position.Top} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            flex: 1,
                            marginRight: '8px'
                        }}
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        style={{
                            margin: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        <TemplateIcon size={18} />
                        {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="Delete Template Node"
                >
                    <TrashIcon size={14} />
                </button>
            </div>

            {/* Template Section */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Prompt Template:
                </label>
                {editingTemplate ? (
                    <textarea
                        defaultValue={customData.template}
                        onBlur={(e) => handleTemplateChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setEditingTemplate(false);
                            }
                        }}
                        autoFocus
                        rows={4}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '8px',
                            color: 'white',
                            fontSize: '12px',
                            resize: 'vertical'
                        }}
                        placeholder="Enter template with {{variable}} placeholders..."
                    />
                ) : (
                    <div
                        onClick={() => setEditingTemplate(true)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            minHeight: '60px',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {customData.template || 'Click to enter template...'}
                    </div>
                )}
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                    Use {`{{variable}}`} syntax for placeholders
                </div>
            </div>

            {/* Variables Section */}
            {extractedVariables.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                        Template Variables:
                    </label>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {extractedVariables.map(variable => (
                            <div key={variable}>
                                <label style={{ fontSize: '10px', marginBottom: '2px', display: 'block' }}>
                                    {variable}:
                                </label>
                                <input
                                    type="text"
                                    value={customData.variables[variable] || ''}
                                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                                    placeholder={`Enter ${variable}...`}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        color: 'white',
                                        fontSize: '11px'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Template Preview */}
            {extractedVariables.length > 0 && (
                <details style={{ marginBottom: '16px' }}>
                    <summary style={{ fontSize: '11px', cursor: 'pointer', marginBottom: '4px' }}>
                        Template Preview
                    </summary>
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '10px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '100px',
                        overflow: 'auto'
                    }}>
                        {fillTemplate()}
                    </div>
                </details>
            )}

            {/* API Key Section */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        API Key: {hasApiKey ? '✅ Set' : '❌ Not Set'}
                    </span>
                    <button
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white',
                            fontSize: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        {hasApiKey ? 'Update' : 'Set'} Key
                    </button>
                </div>

                {showApiKeyInput && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            onKeyDown={handleApiKeyInputKeyDown}
                            placeholder="Enter Anthropic API key..."
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                color: 'white',
                                fontSize: '10px'
                            }}
                        />
                        <button
                            onClick={handleApiKeySubmit}
                            style={{
                                background: 'rgba(34,197,94,0.8)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                color: 'white',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                    </div>
                )}
            </div>

            {/* Advanced Settings */}
            <details style={{ marginBottom: '12px' }}>
                <summary style={{ fontSize: '11px', cursor: 'pointer', marginBottom: '8px' }}>
                    Advanced Settings
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '2px' }}>Model:</label>
                        <select
                            value={customData.model}
                            onChange={(e) => updateCustomData({ model: e.target.value })}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '4px',
                                color: 'white',
                                fontSize: '10px'
                            }}
                        >
                            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '2px' }}>Temperature:</label>
                        <input
                            type="number"
                            value={customData.temperature}
                            onChange={(e) => updateCustomData({ temperature: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max="1"
                            step="0.1"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '4px',
                                color: 'white',
                                fontSize: '10px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '2px' }}>Max Tokens:</label>
                        <input
                            type="number"
                            value={customData.max_tokens}
                            onChange={(e) => updateCustomData({ max_tokens: parseInt(e.target.value) || 1000 })}
                            min="1"
                            max="8192"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '4px',
                                color: 'white',
                                fontSize: '10px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '2px' }}>Top P:</label>
                        <input
                            type="number"
                            value={customData.top_p}
                            onChange={(e) => updateCustomData({ top_p: parseFloat(e.target.value) || 1.0 })}
                            min="0"
                            max="1"
                            step="0.1"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                padding: '4px',
                                color: 'white',
                                fontSize: '10px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>System Prompt:</label>
                    <textarea
                        value={customData.system_prompt}
                        onChange={(e) => updateCustomData({ system_prompt: e.target.value })}
                        placeholder="Optional system prompt..."
                        rows={2}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px',
                            color: 'white',
                            fontSize: '10px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>Stop Sequences (comma-separated):</label>
                    <input
                        type="text"
                        value={customData.stop_sequences}
                        onChange={(e) => updateCustomData({ stop_sequences: e.target.value })}
                        placeholder="Optional stop sequences..."
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px',
                            color: 'white',
                            fontSize: '10px'
                        }}
                    />
                </div>
            </details>

            {/* Execute Button */}
            <button
                onClick={isExecuting ? handleCancel : handleExecute}
                disabled={!hasApiKey || extractedVariables.length === 0}
                style={{
                    width: '100%',
                    background: isExecuting
                        ? 'rgba(239,68,68,0.8)'
                        : (!hasApiKey || extractedVariables.length === 0)
                            ? 'rgba(107,114,128,0.5)'
                            : 'rgba(34,197,94,0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: (!hasApiKey || extractedVariables.length === 0) ? 'not-allowed' : 'pointer',
                    marginBottom: '8px'
                }}
            >
                {isExecuting ? '⏹️ Cancel' : '🚀 Execute Template'}
            </button>

            {/* Output */}
            {nodeData.lastOutput && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginBottom: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong>Claude's Response:</strong>
                        <button
                            onClick={handleCopyToClipboard}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            {copySuccess ? '✅ Copied' : '📋 Copy'}
                        </button>
                    </div>
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
                    fontFamily: 'monospace',
                    marginBottom: '8px'
                }}>
                    {nodeData.streamingLogs}
                </div>
            )}

            {/* Loading State */}
            {isExecuting && (
                <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Processing template...
                </div>
            )}

            {/* Status Summary - only show if no detailed output */}
            {!nodeData.lastOutput && !isExecuting && extractedVariables.length > 0 && hasApiKey && (
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
                    Template ready to execute with {extractedVariables.length} variable{extractedVariables.length !== 1 ? 's' : ''}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default PromptTemplateNode; 