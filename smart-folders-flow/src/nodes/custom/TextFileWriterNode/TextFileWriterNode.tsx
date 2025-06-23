import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { TextFileWriterNodeData } from './TextFileWriterNode.types';

const TextFileWriterNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(false);
    const [editingDir, setEditingDir] = useState(false);
    const [editingFilename, setEditingFilename] = useState(false);
    const [localContent, setLocalContent] = useState('');
    const [localDir, setLocalDir] = useState('');
    const [localFilename, setLocalFilename] = useState('');
    const [isWriting, setIsWriting] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as TextFileWriterNodeData;
    const customData = nodeData.customData || {
        textContent: '',
        outputDirectory: '',
        filename: 'output',
        overwriteExisting: true,
    };

    // Handle incoming data from upstream nodes
    useEffect(() => {
        let incomingContent = '';
        let incomingDir = '';

        // Check manual input first
        const manualInput = nodeData.manualInput || '';

        // Check all connected inputs
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            for (const [sourceId, inputData] of sortedInputs) {
                const value = inputData.value || '';
                console.log(`📝 TextWriter received data from ${inputData.nodeLabel} (${sourceId}): ${value.substring(0, 100)}...`);

                // Try to detect if this looks like a directory path or content
                if (value.includes('/') && !value.includes('\n') && value.length < 500) {
                    // Likely a directory path
                    incomingDir = value;
                } else {
                    // Likely text content
                    incomingContent = value;
                }
            }
        }

        // Update if we have new content or directory
        let updates: any = {};

        if (incomingContent && incomingContent !== customData.textContent) {
            updates.textContent = incomingContent;
        }

        if (incomingDir && incomingDir !== customData.outputDirectory) {
            updates.outputDirectory = incomingDir;
        }

        if (manualInput && manualInput !== customData.textContent) {
            updates.textContent = manualInput;
        }

        if (Object.keys(updates).length > 0) {
            updateNodeCustomData(id, updates);
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.textContent, customData.outputDirectory, id, updateNodeCustomData]);

    const handleWriteFile = useCallback(async () => {
        if (!customData.textContent || !customData.outputDirectory) {
            updateNodeCustomData(id, {
                lastWriteStatus: 'error',
                lastWriteMessage: 'Text content and output directory are required',
                lastWriteTime: Date.now()
            });
            return;
        }

        setIsWriting(true);
        updateNodeCustomData(id, {
            lastWriteStatus: 'success', // Optimistic update
            lastWriteMessage: 'Writing file...',
            lastWriteTime: Date.now()
        });

        try {
            // Prepare the input for Python function
            const input = {
                text_content: customData.textContent,
                output_dir: customData.outputDirectory,
                filename: customData.filename || 'output'
            };

            updateSmartFolderManualInput(id, JSON.stringify(input));

            // Execute the Python function
            executeSmartFolder(id, input);

        } catch (error) {
            console.error('Write file error:', error);
            updateNodeCustomData(id, {
                lastWriteStatus: 'error',
                lastWriteMessage: error instanceof Error ? error.message : String(error),
                lastWriteTime: Date.now()
            });
        } finally {
            setIsWriting(false);
        }
    }, [id, customData, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const getStatusColor = () => {
        switch (customData.lastWriteStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            default: return '#ff9800';
        }
    };

    const canWrite = customData.textContent && customData.outputDirectory && !isWriting;

    return (
        <div
            className="text-file-writer-node"
            style={{
                background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                border: '3px solid #1565c0',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
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
                        📝 {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleDelete}
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

            {/* Text Content Input */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Text Content:</label>
                {editingContent ? (
                    <textarea
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        onBlur={() => {
                            setEditingContent(false);
                            updateNodeCustomData(id, { textContent: localContent });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setEditingContent(false);
                                setLocalContent(customData.textContent);
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000',
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                        placeholder="Enter text content to write..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingContent(true);
                            setLocalContent(customData.textContent);
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000',
                            background: '#fff',
                            cursor: 'text',
                            minHeight: '60px',
                            maxHeight: '120px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {customData.textContent || 'Click to enter text content...'}
                    </div>
                )}
            </div>

            {/* Output Directory */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Output Directory:</label>
                {editingDir ? (
                    <input
                        type="text"
                        value={localDir}
                        onChange={(e) => setLocalDir(e.target.value)}
                        onBlur={() => {
                            setEditingDir(false);
                            updateNodeCustomData(id, { outputDirectory: localDir });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingDir(false);
                                updateNodeCustomData(id, { outputDirectory: localDir });
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000'
                        }}
                        placeholder="Enter output directory..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingDir(true);
                            setLocalDir(customData.outputDirectory);
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000',
                            background: '#fff',
                            cursor: 'text',
                            minHeight: '17px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {customData.outputDirectory || 'Click to enter directory...'}
                    </div>
                )}
            </div>

            {/* Filename */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Filename (without extension):</label>
                {editingFilename ? (
                    <input
                        type="text"
                        value={localFilename}
                        onChange={(e) => setLocalFilename(e.target.value)}
                        onBlur={() => {
                            setEditingFilename(false);
                            updateNodeCustomData(id, { filename: localFilename });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingFilename(false);
                                updateNodeCustomData(id, { filename: localFilename });
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000'
                        }}
                        placeholder="Enter filename..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingFilename(true);
                            setLocalFilename(customData.filename);
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000',
                            background: '#fff',
                            cursor: 'text',
                            minHeight: '17px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {customData.filename || 'output'}
                    </div>
                )}
            </div>

            {/* Options */}
            <div style={{ marginBottom: '12px', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={customData.overwriteExisting}
                        onChange={(e) => updateNodeCustomData(id, { overwriteExisting: e.target.checked })}
                        style={{ marginRight: '6px' }}
                    />
                    Overwrite existing files
                </label>
            </div>

            {/* Write Button */}
            <button
                onClick={handleWriteFile}
                disabled={!canWrite}
                style={{
                    background: canWrite ? '#4caf50' : '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: canWrite ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    width: '100%',
                    marginBottom: '8px'
                }}
            >
                {isWriting ? '⏳ Writing...' : '💾 Write Text File'}
            </button>

            {/* Status Messages */}
            {customData.lastWriteStatus === 'success' && customData.lastWriteMessage && (
                <div style={{
                    marginTop: '8px',
                    padding: '6px',
                    background: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#c8e6c9'
                }}>
                    ✅ {customData.lastWriteMessage}
                </div>
            )}

            {customData.lastWriteStatus === 'error' && customData.lastWriteMessage && (
                <div style={{
                    marginTop: '8px',
                    padding: '6px',
                    background: 'rgba(244, 67, 54, 0.2)',
                    border: '1px solid rgba(244, 67, 54, 0.4)',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#ffcdd2'
                }}>
                    ❌ {customData.lastWriteMessage}
                </div>
            )}

            {/* File Info */}
            {customData.savedFilePath && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '10px',
                    opacity: 0.8,
                    wordBreak: 'break-all'
                }}>
                    📁 Last saved: {customData.savedFilePath}
                </div>
            )}
        </div>
    );
};

export default TextFileWriterNode; 