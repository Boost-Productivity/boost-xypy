import React, { useState, useCallback, useEffect } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import useStore from '../../../store';
import { WhisperTranscriptionNodeData } from './WhisperTranscriptionNode.types';

const WhisperTranscriptionNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingAudioPath, setEditingAudioPath] = useState(false);
    const [localAudioPath, setLocalAudioPath] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
    } = useStore();

    const nodeData = data as WhisperTranscriptionNodeData;
    const customData = nodeData.customData || {
        audioFilePath: '',
        model: 'base' as const,
        language: undefined,
        temperature: 0.0,
        verbose: false,
    };

    // Handle incoming data from upstream nodes
    useEffect(() => {
        let incomingAudioPath = '';

        // Check manual input first
        const manualInput = nodeData.manualInput || '';

        // Check all connected inputs
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            for (const [sourceId, inputData] of sortedInputs) {
                const value = inputData.value || '';
                console.log(`🎤 WhisperTranscription received data from ${inputData.nodeLabel} (${sourceId}): ${value}`);

                // Try to parse as JSON first (for structured data)
                try {
                    const parsed = JSON.parse(value);
                    if (parsed.audio_path) incomingAudioPath = parsed.audio_path;
                } catch {
                    // Not JSON, treat as direct values
                    // Look for audio file extensions
                    if (value.match(/\.(mp3|wav|aac|flac|m4a|ogg|wma)$/i)) {
                        incomingAudioPath = value;
                    }
                    // Default to audio path if it's a file path
                    else if (value.includes('/') || value.includes('\\')) {
                        incomingAudioPath = value;
                    }
                }
            }
        }

        // Update if we have new data
        if (incomingAudioPath && incomingAudioPath !== customData.audioFilePath) {
            console.log(`🎤 WhisperTranscription updating audio path: ${incomingAudioPath}`);
            updateNodeCustomData(id, {
                audioFilePath: incomingAudioPath
            });
        }

        if (manualInput && manualInput !== customData.audioFilePath && !incomingAudioPath) {
            updateNodeCustomData(id, {
                audioFilePath: manualInput
            });
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.audioFilePath, id, updateNodeCustomData]);

    // Monitor execution completion
    useEffect(() => {
        if (!nodeData.isExecuting && nodeData.lastOutput && customData.lastTranscriptionStatus === 'processing') {
            if (nodeData.lastOutput.includes('Error:')) {
                updateNodeCustomData(id, {
                    lastTranscriptionStatus: 'error',
                    lastTranscriptionMessage: nodeData.lastOutput || 'Transcription failed',
                    lastTranscriptionTime: Date.now()
                });
            } else {
                updateNodeCustomData(id, {
                    lastTranscriptionStatus: 'success',
                    lastTranscriptionMessage: 'Transcription completed successfully',
                    transcriptionResult: nodeData.lastOutput,
                    lastTranscriptionTime: Date.now()
                });
            }
            setIsTranscribing(false);
        }

        if (nodeData.isExecuting && customData.lastTranscriptionStatus !== 'processing') {
            updateNodeCustomData(id, {
                lastTranscriptionStatus: 'processing',
                lastTranscriptionMessage: 'Transcribing audio...',
                lastTranscriptionTime: Date.now()
            });
        }
    }, [nodeData.isExecuting, nodeData.lastOutput, customData.lastTranscriptionStatus, id, updateNodeCustomData]);

    const handleTranscribe = useCallback(async () => {
        if (!customData.audioFilePath) {
            updateNodeCustomData(id, {
                lastTranscriptionStatus: 'error',
                lastTranscriptionMessage: 'Audio file path is required',
                lastTranscriptionTime: Date.now()
            });
            return;
        }

        setIsTranscribing(true);

        try {
            const input = {
                audio_path: customData.audioFilePath,
                model: customData.model,
                language: customData.language,
                temperature: customData.temperature,
                verbose: customData.verbose
            };

            executeSmartFolder(id, input);

        } catch (error) {
            console.error('Transcription error:', error);
            updateNodeCustomData(id, {
                lastTranscriptionStatus: 'error',
                lastTranscriptionMessage: error instanceof Error ? error.message : String(error),
                lastTranscriptionTime: Date.now()
            });
            setIsTranscribing(false);
        }
    }, [id, customData, updateNodeCustomData, executeSmartFolder]);

    const handleNodeDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const getStatusColor = () => {
        switch (customData.lastTranscriptionStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'processing': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const getAudioFileName = (path: string) => {
        return path.split('/').pop() || path.split('\\').pop() || path;
    };

    const canTranscribe = customData.audioFilePath && !isTranscribing && !nodeData.isExecuting;

    return (
        <div
            className="whisper-transcription-node"
            style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: '3px solid #5b21b6',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
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
                        🎤 {nodeData.label}
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

            {/* Audio File Path Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                    Audio File:
                </label>
                {editingAudioPath ? (
                    <input
                        type="text"
                        value={localAudioPath}
                        onChange={(e) => setLocalAudioPath(e.target.value)}
                        onBlur={() => {
                            setEditingAudioPath(false);
                            updateNodeCustomData(id, {
                                audioFilePath: localAudioPath
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setEditingAudioPath(false);
                                updateNodeCustomData(id, {
                                    audioFilePath: localAudioPath
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
                        placeholder="Path to audio file..."
                    />
                ) : (
                    <div
                        onClick={() => {
                            setEditingAudioPath(true);
                            setLocalAudioPath(customData.audioFilePath);
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
                        {customData.audioFilePath ? getAudioFileName(customData.audioFilePath) : 'Click to set audio file path...'}
                    </div>
                )}
            </div>

            {/* Model Selection */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                    Model:
                </label>
                <select
                    value={customData.model}
                    onChange={(e) => updateNodeCustomData(id, { model: e.target.value as any })}
                    style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '12px'
                    }}
                >
                    <option value="tiny">Tiny (fastest)</option>
                    <option value="base">Base (balanced)</option>
                    <option value="small">Small (good quality)</option>
                    <option value="medium">Medium (better quality)</option>
                    <option value="large">Large (best quality)</option>
                </select>
            </div>

            {/* Transcribe Button */}
            <button
                onClick={handleTranscribe}
                disabled={!canTranscribe}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: canTranscribe ? 'rgba(76, 175, 80, 0.9)' : 'rgba(158, 158, 158, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: canTranscribe ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                {(isTranscribing || nodeData.isExecuting) ? '🔄 Transcribing...' : '🎤 Transcribe Audio'}
            </button>

            {/* Input Keys Documentation */}
            <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📥 UPSTREAM INPUT KEYS:</div>
                <div>• audio_path - Audio file path</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>📤 OUTPUT: Transcribed text string</div>
            </div>

            {/* Status */}
            {customData.lastTranscriptionStatus && (
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
                            {customData.lastTranscriptionStatus === 'success' ? 'Success' :
                                customData.lastTranscriptionStatus === 'error' ? 'Error' : 'Processing'}
                        </span>
                    </div>
                    {customData.lastTranscriptionMessage && (
                        <div style={{ fontSize: '11px', opacity: 0.9, marginLeft: '16px' }}>
                            {customData.lastTranscriptionMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Transcription Result Preview */}
            {customData.transcriptionResult && (
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px',
                    maxHeight: '80px',
                    overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                        Transcription Preview:
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                        {customData.transcriptionResult.substring(0, 150)}
                        {customData.transcriptionResult.length > 150 && '...'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhisperTranscriptionNode; 