import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { WebhookNodeData } from './WebhookNode.types';

const WebhookNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingInboxName, setEditingInboxName] = useState(false);

    const {
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
    } = useStore();

    const nodeData = data as WebhookNodeData;
    const customData = nodeData.customData || {
        inboxName: '',
        webhookUrl: '',
        autoExecute: true
    };

    // Generate webhook URL when inbox name changes
    useEffect(() => {
        if (customData.inboxName) {
            const baseUrl = window.location.origin.replace(':3000', ':8000');
            const webhookUrl = `${baseUrl}/api/webhook/${customData.inboxName}`;

            if (customData.webhookUrl !== webhookUrl) {
                updateNodeCustomData(id, { webhookUrl });
            }
        }
    }, [customData.inboxName, customData.webhookUrl, id, updateNodeCustomData]);

    const copyWebhookUrl = () => {
        if (customData.webhookUrl) {
            navigator.clipboard.writeText(customData.webhookUrl);
            alert('Webhook URL copied to clipboard!');
        }
    };

    const testWebhook = async () => {
        if (!customData.webhookUrl) return;

        try {
            const testData = {
                test: true,
                message: "Test from webhook node",
                timestamp: new Date().toISOString(),
                source: "manual_test"
            };

            const response = await fetch(customData.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                alert('✅ Test webhook sent successfully!');
            } else {
                alert('❌ Failed to send test webhook');
            }
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    };

    const handleInboxNameSubmit = (name: string) => {
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        updateNodeCustomData(id, { inboxName: cleanName });
        setEditingInboxName(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const hasInboxName = customData.inboxName && customData.inboxName.length > 0;

    return (
        <div
            className="webhook-node"
            style={{
                background: hasInboxName
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    : 'linear-gradient(135deg, #6b7280, #4b5563)',
                border: `3px solid ${hasInboxName ? '#1e40af' : '#374151'}`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '300px',
                color: 'white',
                position: 'relative',
                boxShadow: hasInboxName
                    ? '0 8px 24px rgba(59, 130, 246, 0.4)'
                    : '0 8px 24px rgba(107, 114, 128, 0.4)',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Handles */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                {isEditing ? (
                    <input
                        type="text"
                        defaultValue={nodeData.label}
                        onBlur={(e) => {
                            updateSmartFolderLabel(id, e.target.value);
                            setIsEditing(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateSmartFolderLabel(id, e.currentTarget.value);
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        style={{
                            margin: 0,
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        📨 {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(239, 68, 68, 0.8)',
                        border: 'none',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    🗑️
                </button>
            </div>

            {/* Inbox Name */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                    Inbox Name:
                </div>
                {editingInboxName ? (
                    <input
                        type="text"
                        defaultValue={customData.inboxName}
                        placeholder="e.g., jakes_inbox"
                        onBlur={(e) => handleInboxNameSubmit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleInboxNameSubmit(e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            width: '100%'
                        }}
                    />
                ) : (
                    <div
                        onClick={() => setEditingInboxName(true)}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            minHeight: '20px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {customData.inboxName || 'Click to set inbox name...'}
                    </div>
                )}
            </div>

            {/* Webhook URL */}
            {hasInboxName && (
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                        Webhook URL:
                    </div>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        marginBottom: '8px'
                    }}>
                        {customData.webhookUrl}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={copyWebhookUrl}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                flex: 1
                            }}
                        >
                            📋 Copy
                        </button>
                        <button
                            onClick={testWebhook}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                flex: 1
                            }}
                        >
                            🧪 Test
                        </button>
                    </div>
                </div>
            )}

            {/* Status */}
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                <span>
                    {hasInboxName ? '🟢 Ready to receive' : '🔴 Need inbox name'}
                </span>
            </div>
        </div>
    );
};

export default WebhookNode; 