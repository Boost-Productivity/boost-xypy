import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { DirectoryNodeData } from './DirectoryNode.types';

// Folder Icon Component
const FolderIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
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

const DirectoryNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as DirectoryNodeData;
    const customData = nodeData.customData || {
        directoryPath: '',
        createParents: true,
        permissions: '755'
    };

    // Extract directory paths from upstream inputs
    const getUpstreamDirectoryPath = (): string | null => {
        const inputValues = Object.values(nodeData.inputs || {});
        const manualInput = nodeData.manualInput || '';

        // Check manual input first
        if (manualInput.trim()) {
            // Look for directory-like paths
            const lines = manualInput.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('/') || trimmed.includes('\\') || trimmed.includes('/')) {
                    return trimmed;
                }
            }
        }

        // Check upstream inputs
        for (const inputValue of inputValues) {
            const value = String(inputValue.value || '').trim();
            if (value && (value.startsWith('/') || value.includes('\\') || value.includes('/'))) {
                return value;
            }
        }

        return null;
    };

    // Monitor upstream inputs and update directory path
    useEffect(() => {
        const upstreamPath = getUpstreamDirectoryPath();
        if (upstreamPath && upstreamPath !== customData.directoryPath) {
            handleFieldChange('directoryPath', upstreamPath);
        }
    }, [nodeData.inputs, nodeData.manualInput]);

    const handleExecute = () => {
        const directoryPath = customData.directoryPath.trim();

        if (!directoryPath) {
            alert('Please specify a directory path');
            return;
        }

        // Prepare input object for the Python function
        const inputObj = {
            directory_path: directoryPath,
            create_parents: customData.createParents,
            permissions: customData.permissions || '755'
        };

        executeSmartFolder(id, inputObj);
    };

    const handleCancel = () => {
        cancelExecution(id);
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleFieldChange = (field: string, value: string | boolean) => {
        updateNodeCustomData(id, {
            [field]: value
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const isExecuting = nodeData.isExecuting;
    const upstreamPath = getUpstreamDirectoryPath();
    const hasUpstreamInput = !!upstreamPath;
    const effectivePath = hasUpstreamInput ? upstreamPath : customData.directoryPath;

    return (
        <div
            className="directory-node"
            style={{
                background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)',
                border: '3px solid #4a148c',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '330px',
                maxWidth: '380px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(142, 36, 170, 0.4)'
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
                        <FolderIcon size={18} />
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
                    title="Delete Directory Node"
                >
                    <TrashIcon size={14} />
                </button>
            </div>

            {/* Upstream Input Indicator */}
            {hasUpstreamInput && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px'
                }}>
                    📡 Using upstream path: <strong>{upstreamPath}</strong>
                </div>
            )}

            {/* Directory Path Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Directory Path:
                </label>
                <input
                    type="text"
                    value={customData.directoryPath}
                    onChange={(e) => handleFieldChange('directoryPath', e.target.value)}
                    placeholder="/path/to/directory"
                    disabled={hasUpstreamInput}
                    style={{
                        width: '100%',
                        background: hasUpstreamInput ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        padding: '8px',
                        color: 'white',
                        fontSize: '12px',
                        opacity: hasUpstreamInput ? 0.6 : 1
                    }}
                />
                {hasUpstreamInput && (
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        Path is controlled by upstream input
                    </div>
                )}
            </div>

            {/* Current Effective Path Display */}
            {effectivePath && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                }}>
                    <strong>Effective Path:</strong><br />
                    <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{effectivePath}</code>
                </div>
            )}

            {/* Options */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    Options:
                </label>

                <div style={{ display: 'grid', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                            type="checkbox"
                            checked={customData.createParents}
                            onChange={(e) => handleFieldChange('createParents', e.target.checked)}
                        />
                        Create parent directories if they don't exist
                    </label>
                </div>
            </div>

            {/* Permissions */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Permissions (Unix):
                </label>
                <select
                    value={customData.permissions || '755'}
                    onChange={(e) => handleFieldChange('permissions', e.target.value)}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        padding: '6px',
                        color: 'white',
                        fontSize: '12px'
                    }}
                >
                    <option value="755">755 (rwxr-xr-x)</option>
                    <option value="777">777 (rwxrwxrwx)</option>
                    <option value="644">644 (rw-r--r--)</option>
                    <option value="666">666 (rw-rw-rw-)</option>
                    <option value="700">700 (rwx------)</option>
                </select>
            </div>

            {/* Execute Button */}
            <button
                onClick={isExecuting ? handleCancel : handleExecute}
                disabled={!effectivePath?.trim()}
                style={{
                    width: '100%',
                    background: isExecuting
                        ? 'rgba(239,68,68,0.8)'
                        : !effectivePath?.trim()
                            ? 'rgba(107,114,128,0.5)'
                            : 'rgba(34,197,94,0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: !effectivePath?.trim() ? 'not-allowed' : 'pointer',
                    marginBottom: '8px'
                }}
            >
                {isExecuting ? '⏹️ Cancel' : '📁 Create Directory'}
            </button>

            {/* Last Created Path */}
            {customData.lastCreatedPath && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '10px'
                }}>
                    <strong>✅ Last Created:</strong><br />
                    <code style={{ fontSize: '9px', wordBreak: 'break-all' }}>{customData.lastCreatedPath}</code>
                </div>
            )}

            {/* Output */}
            {nodeData.lastOutput && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginBottom: '8px',
                    overflowX: 'hidden',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    <strong>Result:</strong>
                    <div style={{
                        marginTop: '4px',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                    }}>
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
                    overflowX: 'hidden',
                    fontFamily: 'monospace',
                    marginBottom: '8px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
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
                    Creating directory...
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default DirectoryNode; 