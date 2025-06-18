import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { VideoRecorderNodeData } from './VideoRecorderNode.types';

const VideoRecorderNode: React.FC<NodeProps> = ({ id, data }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [localDuration, setLocalDuration] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDirectory, setEditingDirectory] = useState(false);
    const [localDirectory, setLocalDirectory] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showSavedNotification, setShowSavedNotification] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as VideoRecorderNodeData;
    const customData = nodeData.customData || {
        isRecording: false,
        recordingDuration: 0,
        outputDirectory: './recordings',
        videoQuality: 'medium',
        autoSaveOnStop: true,
        rotation: 0,
        availableVideoSources: [],
        isLoadingDevices: false,
    };

    // Enumerate video devices
    const enumerateVideoDevices = useCallback(async () => {
        try {
            updateNodeCustomData(id, { isLoadingDevices: true });

            // Request permissions first
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            updateNodeCustomData(id, {
                availableVideoSources: videoDevices,
                isLoadingDevices: false,
                selectedVideoSourceId: customData.selectedVideoSourceId || (videoDevices[0]?.deviceId)
            });

        } catch (error) {
            console.error('Error enumerating devices:', error);
            updateNodeCustomData(id, { isLoadingDevices: false });
        }
    }, [id, updateNodeCustomData, customData.selectedVideoSourceId]);

    // Initialize webcam
    const initializeCamera = useCallback(async () => {
        try {
            const constraints = {
                video: {
                    deviceId: customData.selectedVideoSourceId ? { exact: customData.selectedVideoSourceId } : undefined,
                    width: customData.videoQuality === 'high' ? 1920 :
                        customData.videoQuality === 'medium' ? 1280 : 640,
                    height: customData.videoQuality === 'high' ? 1080 :
                        customData.videoQuality === 'medium' ? 720 : 480,
                },
                audio: true
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please ensure camera permissions are granted.');
        }
    }, [customData.videoQuality, customData.selectedVideoSourceId]);

    // Cleanup camera
    const cleanupCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Save video file to server
    const saveVideoFromChunks = useCallback(async (chunks: Blob[]) => {
        if (chunks.length === 0) {
            alert('No recording data available');
            return;
        }

        const blob = new Blob(chunks, { type: 'video/webm' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('video', blob, filename);
        formData.append('directory', customData.outputDirectory);
        formData.append('nodeId', id);

        try {
            // Upload to server
            const response = await fetch('http://localhost:8000/api/upload-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const serverFilePath = result.filePath;

            // Update manual input with server file path for downstream processing
            updateSmartFolderManualInput(id, serverFilePath);

            // Execute downstream processing
            if (customData.autoSaveOnStop) {
                setTimeout(() => executeSmartFolder(id), 500);
            }

            console.log(`📹 Video saved to server: ${serverFilePath}`);

            // Update node with success status
            updateNodeCustomData(id, {
                lastRecordedFile: serverFilePath,
                lastSaveStatus: 'success',
                lastSaveMessage: `Video saved: ${serverFilePath.split('/').pop()}`,
                lastSaveTime: Date.now()
            });

            // Show temporary notification
            setShowSavedNotification(true);
            setTimeout(() => {
                setShowSavedNotification(false);
            }, 3000);

        } catch (error) {
            console.error('Video upload failed:', error);

            // Update node with error status  
            updateNodeCustomData(id, {
                lastSaveStatus: 'error',
                lastSaveMessage: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
                lastSaveTime: Date.now()
            });

            alert(`❌ Upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [customData, id, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    // Start recording
    const startRecording = useCallback(() => {
        if (!stream) {
            initializeCamera();
            return;
        }

        try {
            // Clear previous chunks
            chunksRef.current = [];

            const recorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                    ? 'video/webm;codecs=vp9'
                    : 'video/webm'
            });

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                    console.log(`📹 Chunk received: ${event.data.size} bytes`);
                }
            };

            recorder.onstop = () => {
                console.log(`📹 Recording stopped. Total chunks: ${chunksRef.current.length}`);
                setIsRecording(false);

                if (customData.autoSaveOnStop && chunksRef.current.length > 0) {
                    saveVideoFromChunks([...chunksRef.current]);
                }
            };

            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                alert('Recording error occurred');
                setIsRecording(false);
            };

            // Start recording and request data every second
            recorder.start(1000);
            setMediaRecorder(recorder);
            setIsRecording(true);

            // Update state
            updateNodeCustomData(id, {
                isRecording: true,
                recordingStartTime: Date.now(),
                recordingDuration: 0
            });

            // Start duration timer
            intervalRef.current = setInterval(() => {
                setLocalDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error starting recording. Check browser compatibility.');
        }
    }, [stream, customData, id, updateNodeCustomData, initializeCamera, saveVideoFromChunks]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        updateNodeCustomData(id, {
            isRecording: false,
            recordingDuration: localDuration
        });

        setMediaRecorder(null);
        setLocalDuration(0); // Reset timer for next recording
    }, [mediaRecorder, localDuration, customData, id, updateNodeCustomData]);

    // Initialize devices and camera on mount
    useEffect(() => {
        enumerateVideoDevices();
        return () => {
            cleanupCamera();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enumerateVideoDevices]);

    // Initialize camera when video source changes
    useEffect(() => {
        if (customData.availableVideoSources && customData.availableVideoSources.length > 0) {
            cleanupCamera();
            setTimeout(() => initializeCamera(), 100);
        }
    }, [customData.selectedVideoSourceId, initializeCamera, cleanupCamera]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            cleanupCamera();
            deleteSmartFolder(id);
        }
    };

    const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
        updateNodeCustomData(id, {
            videoQuality: quality
        });
        // Reinitialize camera with new quality
        cleanupCamera();
        setTimeout(initializeCamera, 100);
    };

    const handleDirectoryFocus = () => {
        setEditingDirectory(true);
        setLocalDirectory(customData.outputDirectory);
    };

    const handleDirectoryBlur = (value: string) => {
        setEditingDirectory(false);
        updateNodeCustomData(id, {
            outputDirectory: value
        });
    };

    const handleLocalDirectoryChange = (value: string) => {
        setLocalDirectory(value);
    };

    const handleRotateClockwise = () => {
        const newRotation = ((customData.rotation || 0) + 90) % 360;
        updateNodeCustomData(id, {
            rotation: newRotation
        });
    };

    const handleRotateCounterClockwise = () => {
        const newRotation = ((customData.rotation || 0) - 90 + 360) % 360;
        updateNodeCustomData(id, {
            rotation: newRotation
        });
    };

    const handleVideoSourceChange = (deviceId: string) => {
        updateNodeCustomData(id, {
            selectedVideoSourceId: deviceId
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="video-recorder-node"
            style={{
                background: 'linear-gradient(135deg, #e91e63, #ad1457)',
                border: '3px solid #880e4f',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(233, 30, 99, 0.4)',
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
                        📹 {nodeData.label}
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

            {/* Video Preview */}
            <div style={{ marginBottom: '12px' }}>
                {/* Rotation Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button
                        onClick={handleRotateCounterClockwise}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                        }}
                        title="Rotate counterclockwise"
                    >
                        ↺
                    </button>
                    <button
                        onClick={handleRotateClockwise}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                        }}
                        title="Rotate clockwise"
                    >
                        ↻
                    </button>
                </div>

                {/* Video Container with dynamic sizing */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // Adjust container size based on rotation
                    height: (customData.rotation === 90 || customData.rotation === 270) ? '280px' : '160px',
                    width: '100%',
                    maxWidth: '280px',
                    margin: '0 auto'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '280px',
                            height: '160px',
                            background: '#000',
                            border: isRecording ? '2px solid #ff4444' : '2px solid #666',
                            transform: `rotate(${customData.rotation || 0}deg)`,
                            transition: 'transform 0.3s ease'
                        }}
                    />
                </div>
            </div>

            {/* Recording Controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ● Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        style={{
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ⏹ Stop Recording
                    </button>
                )}
            </div>

            {/* Recording Status */}
            {isRecording && (
                <div style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffeb3b',
                    marginBottom: '12px'
                }}>
                    🔴 REC {formatDuration(localDuration)}
                </div>
            )}

            {/* Settings */}
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                <div style={{ marginBottom: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '2px' }}>Output Directory:</label>
                    {editingDirectory ? (
                        <input
                            type="text"
                            value={localDirectory}
                            onChange={(e) => handleLocalDirectoryChange(e.target.value)}
                            onBlur={(e) => handleDirectoryBlur(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleDirectoryBlur(e.currentTarget.value);
                                }
                            }}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '11px',
                                color: '#000'
                            }}
                            placeholder="./recordings"
                        />
                    ) : (
                        <div
                            onClick={handleDirectoryFocus}
                            style={{
                                width: '100%',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '11px',
                                color: '#000',
                                background: '#fff',
                                cursor: 'text',
                                minHeight: '15px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {customData.outputDirectory || './recordings'}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px' }}>Quality:</label>
                    {(['low', 'medium', 'high'] as const).map(quality => (
                        <button
                            key={quality}
                            onClick={() => handleQualityChange(quality)}
                            style={{
                                background: customData.videoQuality === quality ? '#fff' : 'rgba(255,255,255,0.3)',
                                color: customData.videoQuality === quality ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            {quality}
                        </button>
                    ))}
                </div>

                {/* Video Source Selection */}
                <div style={{ marginTop: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px' }}>Video Source:</label>
                    {customData.isLoadingDevices ? (
                        <div style={{
                            fontSize: '10px',
                            opacity: 0.7,
                            padding: '4px 6px'
                        }}>
                            🔄 Loading devices...
                        </div>
                    ) : customData.availableVideoSources && customData.availableVideoSources.length > 0 ? (
                        <select
                            value={customData.selectedVideoSourceId || ''}
                            onChange={(e) => handleVideoSourceChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '11px',
                                color: '#000',
                                background: '#fff'
                            }}
                        >
                            {customData.availableVideoSources.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{
                            fontSize: '10px',
                            opacity: 0.7,
                            padding: '4px 6px',
                            color: '#ffcdd2'
                        }}>
                            ⚠️ No cameras found
                        </div>
                    )}
                    <button
                        onClick={enumerateVideoDevices}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            marginTop: '2px'
                        }}
                        disabled={customData.isLoadingDevices}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Debug info */}
            {chunksRef.current.length > 0 && (
                <div style={{
                    fontSize: '10px',
                    opacity: 0.7,
                    marginBottom: '4px'
                }}>
                    📊 Chunks: {chunksRef.current.length}
                </div>
            )}

            {/* Status Messages */}
            {customData.lastSaveStatus === 'success' && customData.lastSaveMessage && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#c8e6c9'
                }}>
                    ✅ {customData.lastSaveMessage}
                    {customData.lastSaveTime && (
                        <div style={{
                            fontSize: '9px',
                            opacity: 0.7,
                            marginTop: '2px',
                            fontWeight: 'normal'
                        }}>
                            {new Date(customData.lastSaveTime).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {customData.lastSaveStatus === 'error' && customData.lastSaveMessage && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'rgba(244, 67, 54, 0.2)',
                    border: '1px solid rgba(244, 67, 54, 0.4)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#ffcdd2'
                }}>
                    ❌ {customData.lastSaveMessage}
                    {customData.lastSaveTime && (
                        <div style={{
                            fontSize: '9px',
                            opacity: 0.7,
                            marginTop: '2px',
                            fontWeight: 'normal'
                        }}>
                            {new Date(customData.lastSaveTime).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {/* Temporary Save Notification */}
            {showSavedNotification && (
                <div style={{
                    position: 'absolute',
                    bottom: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#4caf50',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                    animation: 'fadeInOut 3s ease-in-out',
                    zIndex: 1000
                }}>
                    💾 Saved!
                </div>
            )}
        </div>
    );
};

export default VideoRecorderNode; 