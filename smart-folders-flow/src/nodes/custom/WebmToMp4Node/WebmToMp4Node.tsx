import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { WebmToMp4NodeData } from './WebmToMp4Node.types';

const WebmToMp4Node: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [editingDir, setEditingDir] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [localDir, setLocalDir] = useState('');
    const [isConverting, setIsConverting] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as WebmToMp4NodeData;
    const customData = nodeData.customData || {
        inputVideoPath: '',
        outputDirectory: '',
    };

    // Handle incoming data from upstream nodes
    useEffect(() => {
        let incomingPath = '';
        let incomingDir = '';

        // Check manual input - but ONLY if it's not JSON (avoid feedback loop)
        const manualInput = nodeData.manualInput || '';
        const isJsonInput = manualInput.startsWith('{') && manualInput.includes('input_video_path');

        // Check all connected inputs from upstream nodes
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            for (const [sourceId, inputData] of sortedInputs) {
                const value = inputData.value || '';
                console.log(`🎬 WebmToMp4 received data from ${inputData.nodeLabel} (${sourceId}): ${value}`);

                // Try to detect if this looks like a directory path or video file path
                if (value.includes('/') && !value.includes('\n') && value.length < 500) {
                    if (value.endsWith('.webm') || value.includes('.webm')) {
                        // Likely a video file path
                        incomingPath = value;
                    } else {
                        // Likely a directory path
                        incomingDir = value;
                    }
                }
            }
        }

        // Update if we have new path or directory
        let updates: any = {};

        if (incomingPath && incomingPath !== customData.inputVideoPath) {
            updates.inputVideoPath = incomingPath;
        }

        if (incomingDir && incomingDir !== customData.outputDirectory) {
            updates.outputDirectory = incomingDir;
        }

        // Only use manual input if it's NOT the JSON we created (avoid feedback loop)
        if (manualInput && !isJsonInput && manualInput !== customData.inputVideoPath) {
            updates.inputVideoPath = manualInput;
        }

        if (Object.keys(updates).length > 0) {
            updateNodeCustomData(id, updates);
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.inputVideoPath, customData.outputDirectory, id, updateNodeCustomData]);

    // Monitor execution completion
    useEffect(() => {
        // When execution completes (isExecuting becomes false and we have output)
        if (!nodeData.isExecuting && nodeData.lastOutput && customData.lastConversionStatus === 'converting') {
            // Check if the output looks like a successful file path
            if (nodeData.lastOutput.includes('.mp4') && !nodeData.lastOutput.includes('Error')) {
                updateNodeCustomData(id, {
                    lastConversionStatus: 'success',
                    lastConversionMessage: `Successfully converted to MP4`,
                    outputFilePath: nodeData.lastOutput,
                    lastConversionTime: Date.now()
                });
            } else {
                // Execution completed but with an error
                updateNodeCustomData(id, {
                    lastConversionStatus: 'error',
                    lastConversionMessage: nodeData.lastOutput || 'Conversion failed',
                    lastConversionTime: Date.now()
                });
            }
            setIsConverting(false);
        }

        // If execution starts, update status
        if (nodeData.isExecuting && customData.lastConversionStatus !== 'converting') {
            updateNodeCustomData(id, {
                lastConversionStatus: 'converting',
                lastConversionMessage: 'Converting WebM to MP4...',
                lastConversionTime: Date.now()
            });
        }
    }, [nodeData.isExecuting, nodeData.lastOutput, customData.lastConversionStatus, id, updateNodeCustomData]);

    const handleConvert = useCallback(async () => {
        if (!customData.inputVideoPath || !customData.outputDirectory) {
            updateNodeCustomData(id, {
                lastConversionStatus: 'error',
                lastConversionMessage: 'Input video path and output directory are required',
                lastConversionTime: Date.now()
            });
            return;
        }

        setIsConverting(true);

        try {
            // Prepare the input for Python function
            const input = {
                input_video_path: customData.inputVideoPath,
                output_dir: customData.outputDirectory
            };

            // Execute the Python function directly with input data
            // DO NOT update manualInput - that's for user input only
            executeSmartFolder(id, input);

        } catch (error) {
            console.error('Convert video error:', error);
            updateNodeCustomData(id, {
                lastConversionStatus: 'error',
                lastConversionMessage: error instanceof Error ? error.message : String(error),
                lastConversionTime: Date.now()
            });
            setIsConverting(false);
        }
    }, [id, customData, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const getStatusColor = () => {
        switch (customData.lastConversionStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'converting': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const getVideoFileName = (path: string) => {
        return path.split('/').pop() || path;
    };

    const canConvert = customData.inputVideoPath && customData.outputDirectory && !isConverting && !nodeData.isExecuting;

    return (
        <div
            className="webm-to-mp4-node"
            style={{
                background: 'linear-gradient(135deg, #ff5722, #d84315)',
                border: '3px solid #bf360c',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(255, 87, 34, 0.4)',
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
                        🎬 {nodeData.label}
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

            {/* Input Video Path */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                    Input WebM File:
                </label>
                {editingPath ? (
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
                        onBlur={() => {
                            setEditingPath(false);
                            updateNodeCustomData(id, {
                                inputVideoPath: localPath
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingPath(false);
                                updateNodeCustomData(id, {
                                    inputVideoPath: localPath
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
                        placeholder="Path to WebM file..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingPath(true);
                            setLocalPath(customData.inputVideoPath);
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
                        {customData.inputVideoPath ? getVideoFileName(customData.inputVideoPath) : 'Click to set WebM file path...'}
                    </div>
                )}
            </div>

            {/* Output Directory */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                    Output Directory:
                </label>
                {editingDir ? (
                    <input
                        type="text"
                        value={localDir}
                        onChange={(e) => setLocalDir(e.target.value)}
                        onBlur={() => {
                            setEditingDir(false);
                            updateNodeCustomData(id, {
                                outputDirectory: localDir
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingDir(false);
                                updateNodeCustomData(id, {
                                    outputDirectory: localDir
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
                        placeholder="Output directory path..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingDir(true);
                            setLocalDir(customData.outputDirectory);
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
                        {customData.outputDirectory || 'Click to set output directory...'}
                    </div>
                )}
            </div>



            {/* Convert Button */}
            <button
                onClick={handleConvert}
                disabled={!canConvert}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: canConvert ? 'rgba(76, 175, 80, 0.9)' : 'rgba(158, 158, 158, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: canConvert ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                {(isConverting || nodeData.isExecuting) ? '🔄 Converting...' : '🎬 Convert to MP4'}
            </button>

            {/* Input Keys Documentation */}
            <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📥 UPSTREAM INPUT KEYS:</div>
                <div>• video_path - WebM file path</div>
                <div>• output_dir - Output directory</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>📤 OUTPUT: MP4 file path string</div>
            </div>

            {/* Status */}
            {customData.lastConversionStatus && (
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
                            {customData.lastConversionStatus === 'success' ? 'Success' :
                                customData.lastConversionStatus === 'error' ? 'Error' : 'Converting'}
                        </span>
                    </div>
                    {customData.lastConversionMessage && (
                        <div style={{ fontSize: '11px', opacity: 0.9, marginLeft: '16px' }}>
                            {customData.lastConversionMessage}
                        </div>
                    )}
                    {customData.outputFilePath && (
                        <div style={{ fontSize: '11px', opacity: 0.9, marginLeft: '16px', marginTop: '4px' }}>
                            Output: {getVideoFileName(customData.outputFilePath)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WebmToMp4Node; 