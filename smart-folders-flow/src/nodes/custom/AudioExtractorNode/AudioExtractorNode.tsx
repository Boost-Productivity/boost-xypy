import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { AudioExtractorNodeData } from './AudioExtractorNode.types';

const AudioExtractorNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingVideoPath, setEditingVideoPath] = useState(false);
    const [editingOutputDir, setEditingOutputDir] = useState(false);
    const [localVideoPath, setLocalVideoPath] = useState('');
    const [localOutputDir, setLocalOutputDir] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as AudioExtractorNodeData;
    const customData = nodeData.customData || {
        videoFilePath: '',
        outputDirectory: '',
        audioFormat: 'mp3' as const,
        audioQuality: 'medium' as const,
    };

    // Handle incoming data from upstream nodes
    useEffect(() => {
        // Check manual input first (only for actual user input, not our JSON)
        let incomingPath = nodeData.manualInput || '';

        // Then check all connected inputs for video file paths
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            // Get the most recent input (highest timestamp)
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            if (sortedInputs.length > 0) {
                const [sourceId, inputData] = sortedInputs[0];
                incomingPath = inputData.value || incomingPath;
                console.log(`🎵 AudioExtractor received data from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        if (incomingPath && incomingPath !== customData.videoFilePath) {
            console.log(`🎵 AudioExtractor updating video path: ${incomingPath}`);
            updateNodeCustomData(id, {
                videoFilePath: incomingPath
            });
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.videoFilePath, id, updateNodeCustomData]);

    const handleExtractAudio = useCallback(async () => {
        if (!customData.videoFilePath || !customData.outputDirectory) {
            updateNodeCustomData(id, {
                lastExtractionStatus: 'error',
                lastExtractionMessage: 'Both video file path and output directory are required'
            });
            return;
        }

        setIsExtracting(true);
        updateNodeCustomData(id, {
            lastExtractionStatus: 'processing',
            lastExtractionMessage: 'Starting audio extraction...'
        });

        try {
            // Create JSON payload with all settings like Anthropic node does
            const extractionData = {
                videoFilePath: customData.videoFilePath,
                outputDirectory: customData.outputDirectory,
                audioFormat: customData.audioFormat,
                audioQuality: customData.audioQuality
            };

            // Set manualInput to JSON payload
            updateSmartFolderManualInput(id, JSON.stringify(extractionData));

            // Execute the node
            await executeSmartFolder(id);

        } catch (error) {
            console.error('Audio extraction error:', error);
            updateNodeCustomData(id, {
                lastExtractionStatus: 'error',
                lastExtractionMessage: error instanceof Error ? error.message : String(error)
            });
        } finally {
            setIsExtracting(false);
        }
    }, [id, customData, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleVideoPathFocus = () => {
        setEditingVideoPath(true);
        setLocalVideoPath(customData.videoFilePath);
    };

    const handleVideoPathBlur = (value: string) => {
        setEditingVideoPath(false);
        updateNodeCustomData(id, {
            videoFilePath: value
        });
    };

    const handleOutputDirFocus = () => {
        setEditingOutputDir(true);
        setLocalOutputDir(customData.outputDirectory);
    };

    const handleOutputDirBlur = (value: string) => {
        setEditingOutputDir(false);
        updateNodeCustomData(id, {
            outputDirectory: value
        });
    };

    const handleFormatChange = (format: 'mp3' | 'wav' | 'aac' | 'flac') => {
        updateNodeCustomData(id, {
            audioFormat: format
        });
    };

    const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
        updateNodeCustomData(id, {
            audioQuality: quality
        });
    };

    const getStatusColor = () => {
        switch (customData.lastExtractionStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'processing': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const formatFileSize = (bytes: number | undefined) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div
            className="audio-extractor-node"
            style={{
                background: 'linear-gradient(135deg, #673ab7, #512da8)',
                border: '3px solid #4527a0',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '350px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(103, 58, 183, 0.4)',
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
                            setIsEditing(false);
                            updateSmartFolderLabel(id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setIsEditing(false);
                                updateSmartFolderLabel(id, e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            width: '200px'
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
                        🎵 {nodeData.label}
                    </h3>
                )}
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(244, 67, 54, 0.8)',
                        border: 'none',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Video File Path Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Video File Path:
                </label>
                {editingVideoPath ? (
                    <input
                        type="text"
                        value={localVideoPath}
                        onChange={(e) => setLocalVideoPath(e.target.value)}
                        onBlur={() => handleVideoPathBlur(localVideoPath)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleVideoPathBlur(localVideoPath);
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    />
                ) : (
                    <div
                        onClick={handleVideoPathFocus}
                        style={{
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            cursor: 'text',
                            fontSize: '12px',
                            minHeight: '20px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {customData.videoFilePath || 'Click to set video file path...'}
                    </div>
                )}
            </div>

            {/* Output Directory Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Output Directory:
                </label>
                {editingOutputDir ? (
                    <input
                        type="text"
                        value={localOutputDir}
                        onChange={(e) => setLocalOutputDir(e.target.value)}
                        onBlur={() => handleOutputDirBlur(localOutputDir)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleOutputDirBlur(localOutputDir);
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    />
                ) : (
                    <div
                        onClick={handleOutputDirFocus}
                        style={{
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            cursor: 'text',
                            fontSize: '12px',
                            minHeight: '20px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {customData.outputDirectory || 'Click to set output directory...'}
                    </div>
                )}
            </div>

            {/* Audio Format Selection */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Audio Format:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['mp3', 'wav', 'aac', 'flac'] as const).map((format) => (
                        <button
                            key={format}
                            onClick={() => handleFormatChange(format)}
                            style={{
                                background: customData.audioFormat === format
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textTransform: 'uppercase'
                            }}
                        >
                            {format}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio Quality Selection */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Quality:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                        <button
                            key={quality}
                            onClick={() => handleQualityChange(quality)}
                            style={{
                                background: customData.audioQuality === quality
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textTransform: 'capitalize'
                            }}
                        >
                            {quality}
                        </button>
                    ))}
                </div>
            </div>

            {/* Extract Button */}
            <button
                onClick={handleExtractAudio}
                disabled={isExtracting || !customData.videoFilePath || !customData.outputDirectory}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: isExtracting
                        ? 'rgba(255, 152, 0, 0.8)'
                        : 'rgba(76, 175, 80, 0.8)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: isExtracting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    opacity: (!customData.videoFilePath || !customData.outputDirectory) ? 0.5 : 1
                }}
            >
                {isExtracting ? '🔄 Extracting...' : '🎵 Extract Audio'}
            </button>

            {/* Status Display */}
            {(customData.lastExtractionStatus || customData.lastExtractionMessage) && (
                <div style={{
                    padding: '8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                    }}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: getStatusColor()
                            }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {customData.lastExtractionStatus?.toUpperCase()}
                        </span>
                    </div>
                    {customData.lastExtractionMessage && (
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>
                            {customData.lastExtractionMessage}
                        </div>
                    )}
                    {customData.extractedAudioPath && (
                        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                            📁 {customData.extractedAudioPath.split('/').pop()}
                            {customData.outputFileSize && (
                                <span> ({formatFileSize(customData.outputFileSize)})</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Execution Status */}
            {nodeData.isExecuting && (
                <div style={{
                    padding: '6px 10px',
                    background: 'rgba(255, 152, 0, 0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    marginBottom: '8px'
                }}>
                    🔄 Executing...
                </div>
            )}

            {/* Streaming Logs Display */}
            {(nodeData.isExecuting || nodeData.streamingLogs) && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    lineHeight: '1.3'
                }}>
                    <div style={{
                        color: '#FFE082',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        📊 Live Progress
                        {nodeData.isExecuting && (
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#ff9800',
                                opacity: 0.8
                            }} />
                        )}
                    </div>
                    <div style={{
                        color: '#E1F5FE',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {nodeData.streamingLogs || 'Waiting for execution to start...'}
                    </div>
                </div>
            )}

            {/* Output Display */}
            {nodeData.lastOutput && !nodeData.isExecuting && (
                <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    lineHeight: '1.3',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        color: '#4CAF50',
                        fontWeight: 'bold',
                        marginBottom: '4px'
                    }}>
                        📄 Output Result
                    </div>
                    <div style={{
                        color: '#C8E6C9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {nodeData.lastOutput}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioExtractorNode; 