import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { LoadAudioNodeData } from './LoadAudioNode.types';

const LoadAudioNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as LoadAudioNodeData;
    const customData = nodeData.customData || {
        inputPath: '',
        selectedAudioFile: '',
        availableAudios: [],
        autoPlay: false,
        volume: 0.8,
        showControls: true,
        loop: false,
    };

    // Load audios from directory or validate single file
    const loadAudios = useCallback(async (path: string) => {
        if (!path.trim()) {
            updateNodeCustomData(id, {
                availableAudios: [],
                selectedAudioFile: '',
                lastLoadStatus: 'error',
                lastLoadMessage: 'No path provided',
                lastLoadTime: Date.now()
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/list-audios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: path.trim(),
                    nodeId: id
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to load audios: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const audios = result.audios || [];

            updateNodeCustomData(id, {
                availableAudios: audios,
                selectedAudioFile: audios.length > 0 ? audios[0] : '',
                lastLoadStatus: 'success',
                lastLoadMessage: `Found ${audios.length} audio file(s)`,
                lastLoadTime: Date.now()
            });

            // If only one audio, auto-select it and update manual input
            if (audios.length === 1) {
                updateSmartFolderManualInput(id, audios[0]);
            }

        } catch (error) {
            console.error('Load audios error:', error);
            updateNodeCustomData(id, {
                availableAudios: [],
                selectedAudioFile: '',
                lastLoadStatus: 'error',
                lastLoadMessage: error instanceof Error ? error.message : String(error),
                lastLoadTime: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    }, [id, updateNodeCustomData, updateSmartFolderManualInput]);

    // Handle audio selection
    const handleAudioSelect = useCallback((audioPath: string) => {
        updateNodeCustomData(id, {
            selectedAudioFile: audioPath
        });
        // Update manual input for downstream processing
        updateSmartFolderManualInput(id, audioPath);
    }, [id, updateNodeCustomData, updateSmartFolderManualInput]);

    // Handle incoming data from upstream nodes
    useEffect(() => {
        // Check manual input first
        let incomingPath = nodeData.manualInput || '';

        // Then check all connected inputs for audio file paths
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            // Get the most recent input (highest timestamp)
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            if (sortedInputs.length > 0) {
                const [sourceId, inputData] = sortedInputs[0];
                incomingPath = inputData.value || incomingPath;
                console.log(`🎵 LoadAudio received data from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        if (incomingPath && incomingPath !== customData.inputPath) {
            console.log(`🎵 LoadAudio loading path: ${incomingPath}`);
            updateNodeCustomData(id, {
                inputPath: incomingPath
            });
            loadAudios(incomingPath);
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.inputPath, id, updateNodeCustomData, loadAudios]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handlePathFocus = () => {
        setEditingPath(true);
        setLocalPath(customData.inputPath);
    };

    const handlePathBlur = (value: string) => {
        setEditingPath(false);
        updateNodeCustomData(id, {
            inputPath: value
        });
        if (value.trim()) {
            loadAudios(value);
        }
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

    const getAudioFileName = (path: string) => {
        return path.split('/').pop() || path;
    };

    return (
        <div
            className="load-audio-node"
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
                        🎵 {nodeData.label}
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

            {/* Input Path */}
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Audio Path/Directory:</label>
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
                        placeholder="Enter path or directory..."
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
                        {customData.inputPath || 'Click to enter path...'}
                    </div>
                )}

                {isLoading && (
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                        🔄 Loading audio files...
                    </div>
                )}
            </div>

            {/* Audio Selection */}
            {customData.availableAudios.length > 0 && (
                <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                        Select Audio ({customData.availableAudios.length} found):
                    </label>
                    <select
                        value={customData.selectedAudioFile}
                        onChange={(e) => handleAudioSelect(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '11px',
                            color: '#000',
                            background: '#fff'
                        }}
                    >
                        {customData.availableAudios.map((audio, index) => (
                            <option key={index} value={audio}>
                                {getAudioFileName(audio)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Audio Player */}
            {customData.selectedAudioFile && (
                <div style={{ marginBottom: '12px' }}>
                    <audio
                        ref={audioRef}
                        src={`http://localhost:8000/api/serve-audio?path=${encodeURIComponent(customData.selectedAudioFile)}`}
                        controls={customData.showControls}
                        autoPlay={customData.autoPlay}
                        loop={customData.loop}
                        style={{
                            width: '100%',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0,0,0,0.3)'
                        }}
                        onLoadedMetadata={() => {
                            if (audioRef.current) {
                                audioRef.current.volume = customData.volume;
                                audioRef.current.loop = customData.loop;
                            }
                        }}
                    />

                    {/* Audio Controls */}
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', fontSize: '11px' }}>
                            <label>Volume:</label>
                            <input
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

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
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
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                        🎵 {getAudioFileName(customData.selectedAudioFile)}
                    </div>
                </div>
            )}

            {/* Process Button */}
            {customData.selectedAudioFile && (
                <button
                    onClick={() => executeSmartFolder(id)}
                    style={{
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%',
                        marginBottom: '8px'
                    }}
                >
                    🚀 Process Audio
                </button>
            )}

            {/* Status Messages */}
            {customData.lastLoadStatus === 'success' && customData.lastLoadMessage && (
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
                    ✅ {customData.lastLoadMessage}
                </div>
            )}

            {customData.lastLoadStatus === 'error' && customData.lastLoadMessage && (
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
                    ❌ {customData.lastLoadMessage}
                </div>
            )}
        </div>
    );
};

export default LoadAudioNode; 