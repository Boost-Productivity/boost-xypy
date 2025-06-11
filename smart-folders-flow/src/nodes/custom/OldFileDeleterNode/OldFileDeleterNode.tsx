import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { OldFileDeleterNodeData } from './OldFileDeleterNode.types';

// Delete Icon Component
const DeleteIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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

// Warning Icon Component
const WarningIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <path d="M12 9v4"></path>
        <path d="m12 17 .01 0"></path>
    </svg>
);

const OldFileDeleterNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [confirmationStep, setConfirmationStep] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as OldFileDeleterNodeData;
    const customData = nodeData.customData || {
        confirmBeforeDelete: true,
        dryRun: false,
        moveToTrash: true,
        requireManualConfirmation: true
    };

    // Extract file paths from inputs
    const getFilePaths = (): string[] => {
        const inputValues = Object.values(nodeData.inputs || {});
        const manualInput = nodeData.manualInput || '';

        const allInputText = [...inputValues, manualInput].join('\n');

        // Try to parse JSON first (from Old File Finder)
        try {
            const jsonMatch = allInputText.match(/--- FILE PATHS \(JSON\) ---\s*([\s\S]*?)(?:\n---|\n\n|$)/);
            if (jsonMatch) {
                const jsonPaths = JSON.parse(jsonMatch[1].trim());
                if (Array.isArray(jsonPaths)) {
                    return jsonPaths;
                }
            }
        } catch (e) {
            // Fall back to line-by-line parsing
        }

        // Parse line by line for file paths
        const lines = allInputText.split('\n');
        const filePaths: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            // Look for lines that start with • or are valid file paths
            if (trimmed.startsWith('• ')) {
                filePaths.push(trimmed.substring(2));
            } else if (trimmed.startsWith('/') || trimmed.includes('\\')) {
                filePaths.push(trimmed);
            }
        }

        return filePaths;
    };

    const handleExecute = () => {
        const filePaths = getFilePaths();

        if (filePaths.length === 0) {
            alert('No file paths found in input. Connect to Old File Finder or provide file paths manually.');
            return;
        }

        if (customData.requireManualConfirmation && !confirmationStep) {
            setConfirmationStep(true);
            return;
        }

        // Prepare input object for the Python function
        const inputObj = {
            file_paths: filePaths,
            confirm_before_delete: customData.confirmBeforeDelete,
            dry_run: customData.dryRun,
            move_to_trash: customData.moveToTrash,
            manual_confirmation: true // Already confirmed in UI
        };

        executeSmartFolder(id, inputObj);
        setConfirmationStep(false);
    };

    const handleCancel = () => {
        cancelExecution(id);
        setConfirmationStep(false);
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleFieldChange = (field: string, value: boolean) => {
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
    const filePaths = getFilePaths();
    const hasFiles = filePaths.length > 0;

    return (
        <div
            className="old-file-deleter-node"
            style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '3px solid #b91c1c',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '350px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
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
                        <DeleteIcon size={18} />
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
                    title="Delete Old File Deleter"
                >
                    <DeleteIcon size={14} />
                </button>
            </div>

            {/* File Count Display */}
            {hasFiles && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    📁 Ready to process <strong>{filePaths.length}</strong> file{filePaths.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Safety Options */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    Safety Options:
                </label>

                <div style={{ display: 'grid', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                            type="checkbox"
                            checked={customData.dryRun}
                            onChange={(e) => handleFieldChange('dryRun', e.target.checked)}
                        />
                        <strong>Dry Run</strong> (Preview only, don't actually delete)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                            type="checkbox"
                            checked={customData.moveToTrash}
                            onChange={(e) => handleFieldChange('moveToTrash', e.target.checked)}
                            disabled={customData.dryRun}
                        />
                        Move to Trash (instead of permanent delete)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                            type="checkbox"
                            checked={customData.confirmBeforeDelete}
                            onChange={(e) => handleFieldChange('confirmBeforeDelete', e.target.checked)}
                            disabled={customData.dryRun}
                        />
                        Show confirmation for each file
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <input
                            type="checkbox"
                            checked={customData.requireManualConfirmation}
                            onChange={(e) => handleFieldChange('requireManualConfirmation', e.target.checked)}
                        />
                        Require manual confirmation before execution
                    </label>
                </div>
            </div>

            {/* Warning for dangerous operations */}
            {!customData.dryRun && !customData.moveToTrash && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(245, 101, 101, 0.3)',
                    border: '1px solid rgba(245, 101, 101, 0.5)',
                    borderRadius: '4px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px'
                }}>
                    <WarningIcon size={14} />
                    <span>⚠️ PERMANENT DELETE - Files will be unrecoverable!</span>
                </div>
            )}

            {/* Confirmation Step */}
            {confirmationStep && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(245, 158, 11, 0.3)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    borderRadius: '4px',
                    padding: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                        ⚠️ CONFIRM DELETION
                    </div>
                    <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                        About to {customData.dryRun ? 'preview' : customData.moveToTrash ? 'move to trash' : 'permanently delete'} {filePaths.length} file{filePaths.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            onClick={handleExecute}
                            style={{
                                background: 'rgba(34,197,94,0.8)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                color: 'white',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            ✓ Confirm
                        </button>
                        <button
                            onClick={() => setConfirmationStep(false)}
                            style={{
                                background: 'rgba(107,114,128,0.8)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                color: 'white',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            ✗ Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Execute Button */}
            <button
                onClick={isExecuting ? handleCancel : handleExecute}
                disabled={!hasFiles}
                style={{
                    width: '100%',
                    background: isExecuting
                        ? 'rgba(239,68,68,0.8)'
                        : !hasFiles
                            ? 'rgba(107,114,128,0.5)'
                            : confirmationStep
                                ? 'rgba(245,158,11,0.8)'
                                : customData.dryRun
                                    ? 'rgba(59,130,246,0.8)'
                                    : 'rgba(239,68,68,0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: !hasFiles ? 'not-allowed' : 'pointer',
                    marginBottom: '8px'
                }}
            >
                {isExecuting ? '⏹️ Cancel' :
                    confirmationStep ? '⚠️ Confirm Deletion' :
                        customData.dryRun ? '👁️ Preview Deletion' :
                            customData.moveToTrash ? '🗑️ Move to Trash' :
                                '💥 Delete Files'}
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
                    <strong>Deletion Results:</strong>
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
                    {customData.dryRun ? 'Previewing deletions...' : 'Deleting files...'}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default OldFileDeleterNode; 