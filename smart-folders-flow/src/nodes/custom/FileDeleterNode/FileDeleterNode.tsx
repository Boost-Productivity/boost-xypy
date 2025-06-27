import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { FileDeleterNodeData } from './FileDeleterNode.types';

const FileDeleterNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
    } = useStore();

    const nodeData = data as FileDeleterNodeData;
    const customData = nodeData.customData || {
        filePath: '',
    };

    // Handle incoming data from upstream nodes
    useEffect(() => {
        let incomingPath = '';

        // Check manual input first
        const manualInput = nodeData.manualInput || '';

        // Check all connected inputs
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            for (const [sourceId, inputData] of sortedInputs) {
                const value = inputData.value || '';
                console.log(`🗑️ FileDeleter received data from ${inputData.nodeLabel} (${sourceId}): ${value}`);

                // Any path-like string
                if (value.includes('/') || value.includes('\\')) {
                    incomingPath = value;
                    break;
                }
            }
        }

        // Update if we have new path
        if (incomingPath && incomingPath !== customData.filePath) {
            updateNodeCustomData(id, {
                filePath: incomingPath
            });
        }

        if (manualInput && manualInput !== customData.filePath) {
            updateNodeCustomData(id, {
                filePath: manualInput
            });
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.filePath, id, updateNodeCustomData]);

    // Monitor execution completion
    useEffect(() => {
        if (!nodeData.isExecuting && nodeData.lastOutput && customData.lastDeleteStatus === 'deleting') {
            if (nodeData.lastOutput.includes('SUCCESS')) {
                updateNodeCustomData(id, {
                    lastDeleteStatus: 'success',
                    lastDeleteMessage: 'File deleted successfully',
                    lastDeleteTime: Date.now()
                });
            } else {
                updateNodeCustomData(id, {
                    lastDeleteStatus: 'error',
                    lastDeleteMessage: nodeData.lastOutput || 'Delete failed',
                    lastDeleteTime: Date.now()
                });
            }
            setIsDeleting(false);
        }

        if (nodeData.isExecuting && customData.lastDeleteStatus !== 'deleting') {
            updateNodeCustomData(id, {
                lastDeleteStatus: 'deleting',
                lastDeleteMessage: 'Deleting file...',
                lastDeleteTime: Date.now()
            });
        }
    }, [nodeData.isExecuting, nodeData.lastOutput, customData.lastDeleteStatus, id, updateNodeCustomData]);

    const handleDelete = useCallback(async () => {
        if (!customData.filePath) {
            updateNodeCustomData(id, {
                lastDeleteStatus: 'error',
                lastDeleteMessage: 'File path is required',
                lastDeleteTime: Date.now()
            });
            return;
        }

        setIsDeleting(true);

        try {
            const input = {
                file_path: customData.filePath
            };

            executeSmartFolder(id, input);

        } catch (error) {
            console.error('Delete file error:', error);
            updateNodeCustomData(id, {
                lastDeleteStatus: 'error',
                lastDeleteMessage: error instanceof Error ? error.message : String(error),
                lastDeleteTime: Date.now()
            });
            setIsDeleting(false);
        }
    }, [id, customData, updateNodeCustomData, executeSmartFolder]);

    const handleNodeDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const getStatusColor = () => {
        switch (customData.lastDeleteStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'deleting': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const getFileName = (path: string) => {
        return path.split('/').pop() || path.split('\\').pop() || path;
    };

    const canDelete = customData.filePath && !isDeleting && !nodeData.isExecuting;

    return (
        <div
            className="file-deleter-node"
            style={{
                background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                border: '3px solid #c62828',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)',
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
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid white',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '14px',
                            flex: 1
                        }}
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        style={{ margin: 0, cursor: 'pointer', flex: 1 }}
                    >
                        🗑️ {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleNodeDelete}
                    style={{
                        background: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        marginLeft: '8px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* File Path Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                    File to Delete:
                </label>
                {editingPath ? (
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
                        onBlur={() => {
                            setEditingPath(false);
                            updateNodeCustomData(id, {
                                filePath: localPath
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingPath(false);
                                updateNodeCustomData(id, {
                                    filePath: localPath
                                });
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '12px'
                        }}
                        placeholder="Path to file..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingPath(true);
                            setLocalPath(customData.filePath);
                        }}
                        style={{
                            padding: '8px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            minHeight: '16px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {customData.filePath ? getFileName(customData.filePath) : 'Click to set file path...'}
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={handleDelete}
                disabled={!canDelete}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: canDelete ? 'rgba(244, 67, 54, 0.9)' : 'rgba(158, 158, 158, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: canDelete ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                {(isDeleting || nodeData.isExecuting) ? '🗑️ Deleting...' : '🗑️ Delete File'}
            </button>

            {/* Input Keys Documentation */}
            <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📥 UPSTREAM INPUT KEYS:</div>
                <div>• file_path - File path to delete</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>📤 OUTPUT: Success/error message</div>
            </div>

            {/* Status */}
            {customData.lastDeleteStatus && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: getStatusColor()
                            }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {customData.lastDeleteStatus === 'success' ? 'Success' :
                                customData.lastDeleteStatus === 'error' ? 'Error' : 'Deleting'}
                        </span>
                    </div>
                    {customData.lastDeleteMessage && (
                        <div style={{ fontSize: '11px', opacity: 0.9, marginLeft: '16px' }}>
                            {customData.lastDeleteMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileDeleterNode; 