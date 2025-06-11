import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { OldFileFinderNodeData } from './OldFileFinderNode.types';

// Search Icon Component
const SearchIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
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

const OldFileFinderNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as OldFileFinderNodeData;
    const customData = nodeData.customData || {
        directory: '',
        olderThan: '30 days',
        filePattern: '*',
        includeSubdirectories: true
    };

    // Extract directory path from upstream inputs (specifically from Directory node)
    const getUpstreamDirectoryPath = (): string | null => {
        const inputValues = Object.values(nodeData.inputs || {});
        const manualInput = nodeData.manualInput || '';

        // Check connected inputs first (higher priority)
        for (const inputValue of inputValues) {
            const value = String(inputValue.value || '').trim();

            // Look for "--- DIRECTORY PATH ---" section (output from Directory node)
            const pathMatch = value.match(/--- DIRECTORY PATH ---\s*\n(.+)/);
            if (pathMatch) {
                return pathMatch[1].trim();
            }

            // Fallback: look for absolute paths
            if (value && (value.startsWith('/') || value.includes('\\') || value.includes(':/'))) {
                return value;
            }
        }

        // Check manual input as fallback
        if (manualInput.trim()) {
            const pathMatch = manualInput.match(/--- DIRECTORY PATH ---\s*\n(.+)/);
            if (pathMatch) {
                return pathMatch[1].trim();
            }

            // Look for directory-like paths in manual input
            const lines = manualInput.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && (trimmed.startsWith('/') || trimmed.includes('\\') || trimmed.includes(':/'))) {
                    return trimmed;
                }
            }
        }

        return null;
    };

    // Monitor upstream inputs and update directory field automatically
    useEffect(() => {
        const upstreamDirectory = getUpstreamDirectoryPath();
        if (upstreamDirectory && upstreamDirectory !== customData.directory) {
            handleFieldChange('directory', upstreamDirectory);
        }
    }, [nodeData.inputs, nodeData.manualInput]);

    const handleExecute = () => {
        const effectiveDirectory = getUpstreamDirectoryPath() || customData.directory.trim();

        if (!effectiveDirectory) {
            alert('Please specify a directory to search');
            return;
        }

        // Prepare input object for the Python function
        const inputObj = {
            directory: effectiveDirectory,
            older_than: customData.olderThan,
            file_pattern: customData.filePattern,
            include_subdirectories: customData.includeSubdirectories
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
    const upstreamDirectory = getUpstreamDirectoryPath();
    const hasUpstreamInput = !!upstreamDirectory;
    const effectiveDirectory = upstreamDirectory || customData.directory;

    return (
        <div
            className="old-file-finder-node"
            style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: '3px solid #b45309',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '350px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
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
                        <SearchIcon size={18} />
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
                    title="Delete Old File Finder"
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
                    📡 Directory from upstream: <strong>{upstreamDirectory}</strong>
                </div>
            )}

            {/* Directory Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Directory to Search:
                </label>
                <input
                    type="text"
                    value={customData.directory}
                    onChange={(e) => handleFieldChange('directory', e.target.value)}
                    placeholder="/path/to/search"
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
                        Directory is controlled by upstream input
                    </div>
                )}
            </div>

            {/* Current Effective Directory Display */}
            {effectiveDirectory && (
                <div style={{
                    marginBottom: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                }}>
                    <strong>Effective Directory:</strong><br />
                    <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{effectiveDirectory}</code>
                </div>
            )}

            {/* Age Threshold */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Older Than:
                </label>
                <select
                    value={customData.olderThan}
                    onChange={(e) => handleFieldChange('olderThan', e.target.value)}
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
                    <option value="1 hour">1 Hour</option>
                    <option value="6 hours">6 Hours</option>
                    <option value="1 day">1 Day</option>
                    <option value="3 days">3 Days</option>
                    <option value="7 days">1 Week</option>
                    <option value="14 days">2 Weeks</option>
                    <option value="30 days">1 Month</option>
                    <option value="90 days">3 Months</option>
                    <option value="180 days">6 Months</option>
                    <option value="365 days">1 Year</option>
                </select>
            </div>

            {/* File Pattern */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    File Pattern:
                </label>
                <input
                    type="text"
                    value={customData.filePattern}
                    onChange={(e) => handleFieldChange('filePattern', e.target.value)}
                    placeholder="* (all files)"
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        padding: '6px',
                        color: 'white',
                        fontSize: '12px'
                    }}
                />
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    Examples: *, *.log, *.tmp, backup_*
                </div>
            </div>

            {/* Include Subdirectories */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                        type="checkbox"
                        checked={customData.includeSubdirectories}
                        onChange={(e) => handleFieldChange('includeSubdirectories', e.target.checked)}
                    />
                    Include Subdirectories
                </label>
            </div>

            {/* Execute Button */}
            <button
                onClick={isExecuting ? handleCancel : handleExecute}
                disabled={!effectiveDirectory?.trim()}
                style={{
                    width: '100%',
                    background: isExecuting
                        ? 'rgba(239,68,68,0.8)'
                        : !effectiveDirectory?.trim()
                            ? 'rgba(107,114,128,0.5)'
                            : 'rgba(34,197,94,0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: !effectiveDirectory?.trim() ? 'not-allowed' : 'pointer',
                    marginBottom: '8px'
                }}
            >
                {isExecuting ? '⏹️ Cancel' : '🔍 Find Old Files'}
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
                    <strong>Found Files:</strong>
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
                    Searching for old files...
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default OldFileFinderNode; 