import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { LoadVideoNodeData } from './LoadVideoNode.types';

const LoadVideoNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as LoadVideoNodeData;
    const customData = nodeData.customData || {
        inputPath: '',
        selectedVideoFile: '',
        availableVideos: [],
        autoPlay: false,
        volume: 0.8,
        showControls: true,
    };

    // Load videos from directory or validate single file
    const loadVideos = useCallback(async (path: string) => {
        if (!path.trim()) {
            updateNodeCustomData(id, {
                availableVideos: [],
                selectedVideoFile: '',
                lastLoadStatus: 'error',
                lastLoadMessage: 'No path provided',
                lastLoadTime: Date.now()
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/list-videos', {
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
                throw new Error(`Failed to load videos: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const videos = result.videos || [];

            updateNodeCustomData(id, {
                availableVideos: videos,
                selectedVideoFile: videos.length > 0 ? videos[0] : '',
                lastLoadStatus: 'success',
                lastLoadMessage: `Found ${videos.length} video(s)`,
                lastLoadTime: Date.now()
            });

            // If only one video, auto-select it and update manual input
            if (videos.length === 1) {
                updateSmartFolderManualInput(id, videos[0]);
            }

        } catch (error) {
            console.error('Load videos error:', error);
            updateNodeCustomData(id, {
                availableVideos: [],
                selectedVideoFile: '',
                lastLoadStatus: 'error',
                lastLoadMessage: error instanceof Error ? error.message : String(error),
                lastLoadTime: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    }, [id, updateNodeCustomData, updateSmartFolderManualInput]);

    // Handle video selection
    const handleVideoSelect = useCallback((videoPath: string) => {
        updateNodeCustomData(id, {
            selectedVideoFile: videoPath
        });
        // Update manual input for downstream processing
        updateSmartFolderManualInput(id, videoPath);
    }, [id, updateNodeCustomData, updateSmartFolderManualInput]);

    // Handle incoming data from upstream nodes (like VideoRecorder)
    useEffect(() => {
        // Check manual input first
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
                console.log(`📽️ LoadVideo received data from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        if (incomingPath && incomingPath !== customData.inputPath) {
            console.log(`📽️ LoadVideo loading path: ${incomingPath}`);
            updateNodeCustomData(id, {
                inputPath: incomingPath
            });
            loadVideos(incomingPath);
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.inputPath, id, updateNodeCustomData, loadVideos]);

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
            loadVideos(value);
        }
    };

    const handleLocalPathChange = (value: string) => {
        setLocalPath(value);
    };

    const handleVolumeChange = (volume: number) => {
        updateNodeCustomData(id, {
            volume: volume
        });
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    };

    const getVideoFileName = (path: string) => {
        return path.split('/').pop() || path;
    };

    return (
        <div
            className="load-video-node"
            style={{
                background: 'linear-gradient(135deg, #673ab7, #512da8)',
                border: '3px solid #4527a0',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
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
                        📽️ {nodeData.label}
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
                <label style={{ display: 'block', marginBottom: '4px' }}>Video Path/Directory:</label>
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
                        🔄 Loading videos...
                    </div>
                )}
            </div>

            {/* Video Selection */}
            {customData.availableVideos.length > 0 && (
                <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                        Select Video ({customData.availableVideos.length} found):
                    </label>
                    <select
                        value={customData.selectedVideoFile}
                        onChange={(e) => handleVideoSelect(e.target.value)}
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
                        {customData.availableVideos.map((video, index) => (
                            <option key={index} value={video}>
                                {getVideoFileName(video)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Video Player */}
            {customData.selectedVideoFile && (
                <div style={{ marginBottom: '12px' }}>
                    <video
                        ref={videoRef}
                        src={`http://localhost:8000/api/serve-video?path=${encodeURIComponent(customData.selectedVideoFile)}`}
                        controls={customData.showControls}
                        autoPlay={customData.autoPlay}
                        style={{
                            width: '100%',
                            maxHeight: '200px',
                            borderRadius: '6px',
                            backgroundColor: '#000'
                        }}
                        onLoadedMetadata={() => {
                            if (videoRef.current) {
                                videoRef.current.volume = customData.volume;
                            }
                        }}
                    />

                    {/* Video Controls */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', fontSize: '11px' }}>
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

                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                        📁 {getVideoFileName(customData.selectedVideoFile)}
                    </div>
                </div>
            )}

            {/* Process Button */}
            {customData.selectedVideoFile && (
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
                    🚀 Process Video
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

export default LoadVideoNode; 