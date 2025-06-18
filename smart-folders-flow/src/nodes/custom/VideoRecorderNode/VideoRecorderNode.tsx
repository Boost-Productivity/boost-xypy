import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { VideoRecorderNodeData } from './VideoRecorderNode.types';
import useStore from '../../../store';

const VideoRecorderNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as VideoRecorderNodeData;
    const [stream, setStream] = useState<MediaStream | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const {
        updateNodeCustomData,
        updateSmartFolderManualInput,
        executeSmartFolder,
    } = useStore();

    const customData = nodeData.customData || {
        isRecording: false,
        outputDirectory: './recordings',
    };

    // Initialize webcam
    const initializeCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions.');
        }
    };

    // Cleanup camera
    const cleanupCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Start recording
    const startRecording = () => {
        if (!stream) {
            alert('Camera not available');
            return;
        }

        try {
            chunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                await uploadVideo(blob);
            };

            mediaRecorder.start();

            updateNodeCustomData(id, {
                isRecording: true
            });

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && customData.isRecording) {
            mediaRecorderRef.current.stop();

            updateNodeCustomData(id, {
                isRecording: false
            });
        }
    };

    // Upload video to server
    const uploadVideo = async (blob: Blob) => {
        try {
            const formData = new FormData();
            const filename = `recording_${Date.now()}.webm`;
            formData.append('video', blob, filename);
            formData.append('directory', customData.outputDirectory);
            formData.append('nodeId', id);

            const response = await fetch('http://localhost:8000/api/upload-video', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                const filePath = result.filePath;

                updateNodeCustomData(id, {
                    lastRecordedFile: filePath
                });

                // Update manual input with file path for downstream nodes
                updateSmartFolderManualInput(id, filePath);

                // Execute this node to trigger downstream nodes
                executeSmartFolder(id);

                alert(`Video saved: ${result.filename}`);
            } else {
                alert('Failed to save video');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            alert('Failed to upload video');
        }
    };

    // Handle directory change
    const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeCustomData(id, {
            outputDirectory: e.target.value
        });
    };

    // Initialize camera on mount
    useEffect(() => {
        initializeCamera();
        return () => cleanupCamera();
    }, []);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '2px solid #4a5568',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '320px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#22c55e', width: '12px', height: '12px' }}
            />

            <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                📹 {nodeData.label}
            </div>

            {/* Webcam Preview */}
            <div style={{ marginBottom: '12px' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    style={{
                        width: '100%',
                        height: '180px',
                        borderRadius: '8px',
                        backgroundColor: '#000'
                    }}
                />
            </div>

            {/* Directory Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                    Output Directory:
                </label>
                <input
                    type="text"
                    value={customData.outputDirectory}
                    onChange={handleDirectoryChange}
                    style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '11px'
                    }}
                />
            </div>

            {/* Recording Controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {!customData.isRecording ? (
                    <button
                        onClick={startRecording}
                        style={{
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        🔴 Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        ⏹️ Stop Recording
                    </button>
                )}
            </div>

            {/* Status */}
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {customData.isRecording ? (
                    <span style={{ color: '#22c55e' }}>🔴 Recording...</span>
                ) : (
                    <span>Ready to record</span>
                )}
                {customData.lastRecordedFile && (
                    <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                        Last: {customData.lastRecordedFile.split('/').pop()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoRecorderNode; 