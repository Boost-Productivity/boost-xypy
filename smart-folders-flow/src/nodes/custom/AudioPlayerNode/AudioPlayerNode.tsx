import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { AudioPlayerNodeData } from './AudioPlayerNode.types';

const AudioPlayerNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
    } = useStore();

    const nodeData = data as AudioPlayerNodeData;
    const customData = nodeData.customData || {
        audioFilePath: '',
        volume: 0.8,
        autoPlay: false,
        loop: false,
        playOnTrigger: true,
    };

    // Play audio function
    const playAudio = useCallback(async () => {
        if (!customData.audioFilePath) {
            updateNodeCustomData(id, {
                lastPlayStatus: 'error',
                lastPlayMessage: 'No audio file path specified',
                lastPlayTime: Date.now()
            });
            return;
        }

        try {
            if (audioRef.current) {
                audioRef.current.volume = customData.volume;
                audioRef.current.loop = customData.loop;

                setIsPlaying(true);
                await audioRef.current.play();

                updateNodeCustomData(id, {
                    lastPlayStatus: 'success',
                    lastPlayMessage: `Playing: ${customData.audioFilePath.split('/').pop()}`,
                    lastPlayTime: Date.now()
                });
            }
        } catch (error) {
            console.error('Audio play error:', error);
            setIsPlaying(false);
            updateNodeCustomData(id, {
                lastPlayStatus: 'error',
                lastPlayMessage: error instanceof Error ? error.message : String(error),
                lastPlayTime: Date.now()
            });
        }
    }, [customData.audioFilePath, customData.volume, customData.loop, id, updateNodeCustomData]);

    // Handle incoming data from upstream nodes (triggers)
    useEffect(() => {
        // Check if we have any inputs (meaning we were triggered)
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0 && customData.playOnTrigger) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            if (sortedInputs.length > 0) {
                const [sourceId, inputData] = sortedInputs[0];
                console.log(`🔊 AudioPlayer triggered by ${inputData.nodeLabel} (${sourceId})`);
                playAudio();
            }
        }
    }, [nodeData.inputs, customData.playOnTrigger, playAudio]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handlePathFocus = () => {
        setEditingPath(true);
        setLocalPath(customData.audioFilePath);
    };

    const handlePathBlur = (value: string) => {
        setEditingPath(false);
        updateNodeCustomData(id, {
            audioFilePath: value
        });
    };

    const handleLocalPathChange = (value: string) => {
        setLocalPath(value);
    };

    const handleVolumeChange = (volume: number) => {
        updateNodeCustomData(id, {
            volume: volume
        });
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    };

    const handleLoopToggle = () => {
        const newLoop = !customData.loop;
        updateNodeCustomData(id, {
            loop: newLoop
        });
        if (audioRef.current) {
            audioRef.current.loop = newLoop;
        }
    };

    const handlePlayOnTriggerToggle = () => {
        updateNodeCustomData(id, {
            playOnTrigger: !customData.playOnTrigger
        });
    };

    const handleManualPlay = () => {
        playAudio();
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const handleAudioError = () => {
        setIsPlaying(false);
        updateNodeCustomData(id, {
            lastPlayStatus: 'error',
            lastPlayMessage: 'Failed to load or play audio file',
            lastPlayTime: Date.now()
        });
    };

    const getAudioFileName = (path: string) => {
        return path.split('/').pop() || path;
    };

    return (
        <div
            className="audio-player-node"
            style={{
                background: 'linear-gradient(135deg, #9c27b0, #673ab7)',
                border: '3px solid #512da8',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(156, 39, 176, 0.4)',
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
                        🔊 {nodeData.label}
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

            {/* Audio File Path */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Audio File Path:</label>
                {editingPath ? (
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => handleLocalPathChange(e.target.value)}
                        onBlur={(e) => handlePathBlur(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePathBlur(e.currentTarget.value);
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
                        placeholder="Enter audio file path..."
                    />
                ) : (
                    <div
                        onClick={handlePathFocus}
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
                        {customData.audioFilePath || 'Click to enter audio file path...'}
                    </div>
                )}
            </div>

            {/* Settings */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={customData.playOnTrigger}
                            onChange={handlePlayOnTriggerToggle}
                            style={{ marginRight: '4px' }}
                        />
                        Play on Trigger
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={customData.loop}
                            onChange={handleLoopToggle}
                            style={{ marginRight: '4px' }}
                        />
                        Loop
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label>Volume:</label>
                    <input
                        className="nodrag"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={customData.volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span>{Math.round(customData.volume * 100)}%</span>
                </div>
            </div>

            {/* Audio Element */}
            {customData.audioFilePath && (
                <audio
                    ref={audioRef}
                    src={`http://localhost:8000/api/serve-audio?path=${encodeURIComponent(customData.audioFilePath)}`}
                    onEnded={handleAudioEnded}
                    onError={handleAudioError}
                    preload="metadata"
                    style={{ display: 'none' }}
                />
            )}

            {/* Manual Play Button */}
            {customData.audioFilePath && (
                <button
                    onClick={handleManualPlay}
                    disabled={isPlaying}
                    style={{
                        background: isPlaying ? '#9e9e9e' : '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: isPlaying ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        width: '100%',
                        marginBottom: '8px'
                    }}
                >
                    {isPlaying ? '🔊 Playing...' : '▶️ Test Play'}
                </button>
            )}

            {/* Process Button */}
            <button
                onClick={() => executeSmartFolder(id)}
                disabled={nodeData.isExecuting}
                style={{
                    background: nodeData.isExecuting ? '#9e9e9e' : '#673ab7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: nodeData.isExecuting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    width: '100%',
                    marginBottom: '8px'
                }}
            >
                {nodeData.isExecuting ? '⏳ Processing...' : '🚀 Execute'}
            </button>

            {/* Current File Display */}
            {customData.audioFilePath && (
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '8px' }}>
                    🎵 {getAudioFileName(customData.audioFilePath)}
                </div>
            )}

            {/* Status Messages */}
            {customData.lastPlayStatus === 'success' && customData.lastPlayMessage && (
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
                    ✅ {customData.lastPlayMessage}
                </div>
            )}

            {customData.lastPlayStatus === 'error' && customData.lastPlayMessage && (
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
                    ❌ {customData.lastPlayMessage}
                </div>
            )}

            {/* Output Display */}
            {nodeData.lastOutput && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#e1bee7' }}>Output:</div>
                    {nodeData.lastOutput}
                </div>
            )}
        </div>
    );
};

export default AudioPlayerNode; 