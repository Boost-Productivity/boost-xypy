import React, { useEffect, useRef, useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { WebhookMakerNodeData } from './WebhookMakerNode.types';
import useStore from '../../../store';

// Import the base SmartFolderNode
import SmartFolderNode from '../../base/SmartFolderNode';

const WebhookMakerNode: React.FC<NodeProps> = ({ id, data, ...props }) => {
    const nodeData = data as WebhookMakerNodeData;
    const { addCustomNode, nodes, updateNodeCustomData, executeSmartFolder, updateSmartFolderManualInput, deleteSmartFolder } = useStore();
    const lastProcessedOutput = useRef<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [showBaseUrlInput, setShowBaseUrlInput] = useState(false);
    const [baseUrlInput, setBaseUrlInput] = useState('');

    // Get custom data with defaults
    const customData = nodeData.customData || {
        mode: 'form',
        spacing: 120,
        startOffset: 150,
        webhookWidth: 350,
        webhookInputs: [''],
        baseUrl: '',
    };

    // Get stored base URL from localStorage
    const getStoredBaseUrl = () => {
        return localStorage.getItem('webhook_base_url') || '';
    };

    // Save base URL to localStorage
    const saveBaseUrl = (url: string) => {
        if (url.trim()) {
            localStorage.setItem('webhook_base_url', url.trim());
        } else {
            localStorage.removeItem('webhook_base_url');
        }
    };

    // Use stored base URL if customData doesn't have one
    const effectiveBaseUrl = customData.baseUrl || getStoredBaseUrl();

    // Watch for output changes and create Webhook nodes (for function mode)
    useEffect(() => {
        if (customData.mode === 'function' &&
            nodeData.lastOutput &&
            nodeData.lastOutput.trim() &&
            nodeData.lastOutput !== lastProcessedOutput.current &&
            !nodeData.isExecuting) {

            const lines = nodeData.lastOutput.split('\n').filter(line => line.trim());

            if (lines.length > 0) {
                createWebhookNodes(lines);
                lastProcessedOutput.current = nodeData.lastOutput;
            }
        }
    }, [nodeData.lastOutput, nodeData.isExecuting, customData.mode]);

    const createWebhookNodes = (webhookNames: string[]) => {
        const currentNode = nodes.find(n => n.id === id);
        if (!currentNode) return;

        const spacing = customData.spacing || 120;
        const startOffset = customData.startOffset || 150;
        const webhookWidth = customData.webhookWidth || 350;

        // Create Webhook nodes for each name
        webhookNames.forEach((webhookName, index) => {
            const cleanName = webhookName.trim();
            if (!cleanName) return;

            const webhookPosition = {
                x: currentNode.position.x + (index % 3 === 0 ? 0 : index % 3 === 1 ? 400 : 800), // 3 columns
                y: currentNode.position.y + startOffset + (Math.floor(index / 3) * spacing)
            };

            setTimeout(() => {
                const timestamp = Date.now() + index;
                const newWebhookNode = {
                    id: `webhook_${timestamp}`,
                    type: 'webhook',
                    position: webhookPosition,
                    data: {
                        nodeType: 'webhook',
                        label: `Webhook ${cleanName}`,
                        pythonFunction: `def process(inputs):
    # Process webhook data from ${cleanName}
    import json
    
    # Get webhook data from manual input (JSON string)
    webhook_data_str = inputs.get("manual", "{}")
    
    try:
        # Parse the webhook data
        webhook_data = json.loads(webhook_data_str)
        
        # Extract timestamp if available
        received_at = webhook_data.get("timestamp", "unknown")
        
        # Get all data keys for summary
        data_keys = list(webhook_data.keys())
        
        # Process the webhook data
        result = {
            "received_at": received_at,
            "data_keys": data_keys,
            "processed_data": webhook_data
        }
        
        return json.dumps(result, indent=2)
        
    except json.JSONDecodeError:
        return f"Error: Invalid JSON data received: {webhook_data_str}"
    except Exception as e:
        return f"Processing error: {str(e)}"`,
                        isExecuting: false,
                        lastOutput: '',
                        streamingLogs: '',
                        inputs: {},
                        manualInput: '',
                        customData: {
                            inboxName: cleanName,
                            webhookUrl: `${effectiveBaseUrl}${cleanName}`,
                            autoExecute: true
                        }
                    }
                };

                // Add the node to the store
                const currentNodes = useStore.getState().nodes;
                useStore.setState({ nodes: [...currentNodes, newWebhookNode] });
            }, index * 100); // Stagger creation for visual effect
        });

        console.log(`📨 Created ${webhookNames.length} Webhook nodes from WebhookMaker "${nodeData.label}"`);
    };

    const handleToggleMode = () => {
        updateNodeCustomData(id, {
            mode: customData.mode === 'form' ? 'function' : 'form'
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleAddWebhookInput = () => {
        const currentInputs = customData.webhookInputs || [''];
        updateNodeCustomData(id, {
            webhookInputs: [...currentInputs, '']
        });
    };

    const handleUpdateWebhookInput = (index: number, value: string) => {
        const currentInputs = customData.webhookInputs || [''];
        const newInputs = [...currentInputs];
        newInputs[index] = value;
        updateNodeCustomData(id, {
            webhookInputs: newInputs
        });
    };

    const handleRemoveWebhookInput = (index: number) => {
        const currentInputs = customData.webhookInputs || [''];
        if (currentInputs.length > 1) {
            const newInputs = currentInputs.filter((_, i) => i !== index);
            updateNodeCustomData(id, {
                webhookInputs: newInputs
            });
        }
    };

    const handleCreateWebhooks = () => {
        const webhookNames = (customData.webhookInputs || []).filter(name => name.trim());
        if (webhookNames.length > 0) {
            createWebhookNodes(webhookNames);
        }
    };

    const handleUpdateBaseUrl = (value: string) => {
        updateNodeCustomData(id, {
            baseUrl: value
        });
    };

    const handleBaseUrlSubmit = () => {
        saveBaseUrl(baseUrlInput);
        setBaseUrlInput('');
        setShowBaseUrlInput(false);
    };

    const handleBaseUrlInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBaseUrlSubmit();
        } else if (e.key === 'Escape') {
            setBaseUrlInput('');
            setShowBaseUrlInput(false);
        }
    };

    const currentStoredUrl = getStoredBaseUrl();
    const hasStoredUrl = !!currentStoredUrl;

    // Form Mode UI
    if (customData.mode === 'form') {
        return (
            <div className="webhook-maker-node" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                border: '2px solid #2563eb',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                minWidth: '350px',
                color: 'white',
                padding: '16px'
            }}>
                <Handle type="target" position={Position.Top} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📨</span>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Webhook Maker</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={handleToggleMode}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                            title="Switch to function mode"
                        >
                            ⚙️
                        </button>
                        <button
                            onClick={handleDelete}
                            style={{
                                background: 'rgba(239, 68, 68, 0.8)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                            title="Delete node"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Base URL Configuration */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            Base URL: {hasStoredUrl ? '✅ Set' : '❌ Not Set'}
                        </span>
                        <button
                            onClick={() => {
                                setShowBaseUrlInput(!showBaseUrlInput);
                                setBaseUrlInput(currentStoredUrl);
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
                            {hasStoredUrl ? 'Update' : 'Set'}
                        </button>
                    </div>

                    {showBaseUrlInput && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                                type="text"
                                value={baseUrlInput}
                                onChange={(e) => setBaseUrlInput(e.target.value)}
                                onKeyDown={handleBaseUrlInputKeyDown}
                                placeholder="https://your-server.com/api/webhook/"
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontFamily: 'monospace'
                                }}
                                className="nodrag"
                                autoFocus
                            />
                            <button
                                onClick={handleBaseUrlSubmit}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    )}

                    {hasStoredUrl && (
                        <div style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.8)',
                            fontFamily: 'monospace',
                            marginTop: '4px',
                            wordBreak: 'break-all'
                        }}>
                            {currentStoredUrl}
                        </div>
                    )}
                </div>

                {/* Webhook Name Inputs */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            Webhook Names:
                        </label>
                        <button
                            onClick={handleAddWebhookInput}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                            title="Add webhook input"
                        >
                            ➕
                        </button>
                    </div>

                    {(customData.webhookInputs || ['']).map((webhookName, index) => (
                        <div key={index} style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            <input
                                type="text"
                                value={webhookName}
                                onChange={(e) => handleUpdateWebhookInput(index, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddWebhookInput();
                                        // Focus the new input after a brief delay
                                        setTimeout(() => {
                                            const inputs = document.querySelectorAll('.webhook-input');
                                            const nextInput = inputs[index + 1] as HTMLInputElement;
                                            if (nextInput) nextInput.focus();
                                        }, 50);
                                    }
                                }}
                                placeholder="boost_vision_board_goal_created"
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                }}
                                className="nodrag webhook-input"
                            />
                            {(customData.webhookInputs || []).length > 1 && (
                                <button
                                    onClick={() => handleRemoveWebhookInput(index)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.8)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                    title="Remove this webhook"
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Preview URLs */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        Preview URLs:
                    </label>
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        padding: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                    }}>
                        {(customData.webhookInputs || ['']).filter(name => name.trim()).map((name, index) => (
                            <div key={index} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                {effectiveBaseUrl}{name.trim()}
                            </div>
                        ))}
                        {(customData.webhookInputs || ['']).filter(name => name.trim()).length === 0 && (
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Enter webhook names to see URLs
                            </div>
                        )}
                    </div>
                </div>

                {/* Create button */}
                <button
                    onClick={handleCreateWebhooks}
                    disabled={!effectiveBaseUrl || (customData.webhookInputs || ['']).filter(name => name.trim()).length === 0}
                    style={{
                        background: (!effectiveBaseUrl || (customData.webhookInputs || ['']).filter(name => name.trim()).length === 0)
                            ? 'rgba(255,255,255,0.3)'
                            : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        cursor: (!effectiveBaseUrl || (customData.webhookInputs || ['']).filter(name => name.trim()).length === 0)
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        width: '100%',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                    title={!effectiveBaseUrl ? "Set base URL first" : "Create webhook nodes from inputs"}
                >
                    📨 Create {(customData.webhookInputs || ['']).filter(name => name.trim()).length} Webhooks
                </button>

                <Handle type="source" position={Position.Bottom} />
            </div>
        );
    }

    // Function Mode UI (similar to SmartFolderNode)
    return (
        <div style={{ minWidth: '350px' }}>
            {/* Use the base SmartFolderNode for function mode */}
            <div style={{ position: 'relative' }}>
                {React.createElement(SmartFolderNode as any, { id, data, ...props })}

                {/* Mode toggle overlay */}
                <button
                    onClick={handleToggleMode}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '40px',
                        background: 'rgba(59, 130, 246, 0.9)',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        zIndex: 10
                    }}
                    title="Switch to form mode"
                >
                    📝
                </button>
            </div>
        </div>
    );
};

export default WebhookMakerNode; 