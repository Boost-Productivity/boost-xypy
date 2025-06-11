import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { IPWebcamNodeData } from './IPWebcamNode.types';

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

// Eye/Hide Icon for Python function toggle
const EyeIcon: React.FC<{ isVisible: boolean; size?: number }> = ({ isVisible, size = 16 }) => (
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
        {isVisible ? (
            <>
                <path d="m1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </>
        ) : (
            <>
                <path d="m1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <path d="m9 9 6 6"></path>
                <path d="m15 9-6 6"></path>
            </>
        )}
    </svg>
);

const IPWebcamNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingFunction, setEditingFunction] = useState(false);
    const [localDuration, setLocalDuration] = useState(0);
    const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
    const [durationTimer, setDurationTimer] = useState<NodeJS.Timeout | null>(null);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderFunction,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as IPWebcamNodeData;
    const customData = nodeData.customData || {
        ipAddress: '192.168.1.100',
        port: '8080',
        username: '',
        password: '',
        isRecording: false,
        recordingDuration: 0,
        outputDirectory: './webcam_recordings',
        videoQuality: 'medium',
        recordingLength: 60,
        connectionStatus: 'disconnected',
        showPythonFunction: false,
        isContinuousMode: false,
        currentChunkNumber: 0,
        chunkHistory: [],
        totalRecordingTime: 0,
    };

    // Listen for chunk completion notifications via polling
    useEffect(() => {
        let pollInterval: NodeJS.Timeout | null = null;

        if (customData.isRecording && customData.isContinuousMode) {
            // Poll backend for chunk completions every 2 seconds
            pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/check-chunks/${id}`);
                    if (response.ok) {
                        const { newChunks } = await response.json();

                        newChunks.forEach((chunk: any) => {
                            // Add chunk to history
                            const newChunk = {
                                chunkNumber: chunk.chunk_number,
                                filePath: chunk.file_path,
                                timestamp: Date.now(),
                                fileSize: chunk.file_size
                            };

                            updateNodeCustomData(id, {
                                chunkHistory: [...(customData.chunkHistory || []), newChunk],
                                currentChunkNumber: chunk.chunk_number + 1,
                                lastRecordedFile: chunk.file_path,
                                lastSaveStatus: 'success',
                                lastSaveMessage: `Chunk ${chunk.chunk_number} completed`
                            });

                            // Trigger downstream processing with this chunk's file path
                            updateSmartFolderManualInput(id, chunk.file_path);
                            setTimeout(() => executeSmartFolder(id), 500);
                        });
                    }
                } catch (error) {
                    console.warn('Error checking for new chunks:', error);
                }
            }, 2000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [customData.isRecording, customData.isContinuousMode, id, customData.chunkHistory, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    // Test IP camera connection
    const testConnection = useCallback(async () => {
        if (!customData.ipAddress || !customData.port) {
            updateNodeCustomData(id, {
                connectionStatus: 'error',
                lastSaveMessage: 'IP address and port required'
            });
            return;
        }

        updateNodeCustomData(id, {
            connectionStatus: 'connecting',
            lastSaveMessage: 'Testing connection...'
        });

        try {
            // Construct the IP camera URL
            const protocol = customData.port === '443' ? 'https' : 'http';
            const auth = customData.username && customData.password
                ? `${customData.username}:${customData.password}@`
                : '';
            const streamUrl = `${protocol}://${auth}${customData.ipAddress}:${customData.port}/video`;

            // Test connection by trying to fetch a frame
            const response = await fetch(`http://localhost:8000/api/test-ip-camera`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: streamUrl,
                    timeout: 10
                })
            });

            if (response.ok) {
                updateNodeCustomData(id, {
                    connectionStatus: 'connected',
                    lastSaveMessage: 'Connection successful!'
                });
            } else {
                const error = await response.text();
                updateNodeCustomData(id, {
                    connectionStatus: 'error',
                    lastSaveMessage: `Connection failed: ${error}`
                });
            }
        } catch (error) {
            updateNodeCustomData(id, {
                connectionStatus: 'error',
                lastSaveMessage: `Connection error: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }, [customData, id, updateNodeCustomData]);

    // Start recording (modified for continuous mode)
    const startRecording = useCallback(async () => {
        if (customData.connectionStatus !== 'connected') {
            alert('Please test connection first');
            return;
        }

        updateNodeCustomData(id, {
            isRecording: true,
            recordingStartTime: Date.now(),
            recordingDuration: 0,
            lastSaveStatus: 'recording',
            lastSaveMessage: customData.isContinuousMode ? 'Starting continuous recording...' : 'Recording started...',
            currentChunkNumber: 1,
            chunkHistory: [], // Reset history on new recording session
            totalRecordingTime: 0
        });

        setLocalDuration(0);

        // Start duration counter
        const timer = setInterval(() => {
            setLocalDuration(prev => prev + 1);
        }, 1000);
        setDurationTimer(timer);

        try {
            // Construct the IP camera URL
            const protocol = customData.port === '443' ? 'https' : 'http';
            const auth = customData.username && customData.password
                ? `${customData.username}:${customData.password}@`
                : '';
            const streamUrl = `${protocol}://${auth}${customData.ipAddress}:${customData.port}/video`;

            // Start recording via backend
            const response = await fetch(`http://localhost:8000/api/record-ip-camera`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: streamUrl,
                    duration: customData.recordingLength,
                    output_dir: customData.outputDirectory,
                    quality: customData.videoQuality,
                    node_id: id,
                    continuous: customData.isContinuousMode
                })
            });

            if (response.ok) {
                // In continuous mode, don't set auto-stop timer since backend handles it
                if (!customData.isContinuousMode) {
                    const autoStopTimer = setTimeout(() => {
                        stopRecording();
                    }, customData.recordingLength * 1000);
                    setRecordingTimer(autoStopTimer);
                }
            } else {
                const error = await response.text();
                throw new Error(error);
            }

        } catch (error) {
            console.error('Recording start failed:', error);
            updateNodeCustomData(id, {
                isRecording: false,
                lastSaveStatus: 'error',
                lastSaveMessage: `Recording failed: ${error instanceof Error ? error.message : String(error)}`
            });

            if (durationTimer) {
                clearInterval(durationTimer);
                setDurationTimer(null);
            }
        }
    }, [customData, id, updateNodeCustomData]);

    // Stop recording
    const stopRecording = useCallback(async () => {
        if (recordingTimer) {
            clearTimeout(recordingTimer);
            setRecordingTimer(null);
        }

        if (durationTimer) {
            clearInterval(durationTimer);
            setDurationTimer(null);
        }

        try {
            // Stop recording via backend
            const response = await fetch(`http://localhost:8000/api/stop-ip-camera-recording/${id}`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                const filePath = result.filePath;

                updateNodeCustomData(id, {
                    isRecording: false,
                    recordingDuration: localDuration,
                    lastRecordedFile: filePath,
                    lastSaveStatus: 'success',
                    lastSaveMessage: `Recording saved: ${filePath.split('/').pop()}`,
                    lastSaveTime: Date.now()
                });

                // Execute downstream processing
                setTimeout(() => executeSmartFolder(id), 500);

            } else {
                throw new Error('Failed to stop recording');
            }
        } catch (error) {
            updateNodeCustomData(id, {
                isRecording: false,
                lastSaveStatus: 'error',
                lastSaveMessage: `Stop recording failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }

        setLocalDuration(0);
    }, [recordingTimer, durationTimer, localDuration, id, updateNodeCustomData, executeSmartFolder]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimer) clearTimeout(recordingTimer);
            if (durationTimer) clearInterval(durationTimer);
        };
    }, [recordingTimer, durationTimer]);

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            if (customData.isRecording) {
                stopRecording();
            }
            deleteSmartFolder(id);
        }
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleFunctionChange = (newFunction: string) => {
        updateSmartFolderFunction(id, newFunction);
        setEditingFunction(false);
    };

    const handleFieldChange = (field: string, value: string | number | boolean) => {
        updateNodeCustomData(id, {
            [field]: value
        });
    };

    const togglePythonFunction = () => {
        updateNodeCustomData(id, {
            showPythonFunction: !customData.showPythonFunction
        });
    };

    const toggleContinuousMode = () => {
        updateNodeCustomData(id, {
            isContinuousMode: !customData.isContinuousMode
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getConnectionStatusColor = () => {
        switch (customData.connectionStatus) {
            case 'connected': return '#4CAF50';
            case 'connecting': return '#FF9800';
            case 'error': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    // Calculate dynamic columns and rows for textarea
    const calculateDynamicCols = (content: string): number => {
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        return Math.min(Math.max(maxLineLength + 5, 30), 120);
    };

    const calculateDynamicRows = (content: string): number => {
        const lines = content.split('\n');
        return Math.min(Math.max(lines.length, 4), 30);
    };

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatTotalTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="smart-folder-node" style={{ minWidth: '350px' }}>
            <Handle type="target" position={Position.Top} />

            <div className="node-content">
                {/* Title and Controls */}
                <div className="node-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                style={{ flex: 1, marginRight: '8px' }}
                            />
                        ) : (
                            <h3 onClick={() => setIsEditing(true)} style={{ flex: 1, margin: 0 }}>
                                {nodeData.label}
                            </h3>
                        )}

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={togglePythonFunction}
                                className="toggle-btn"
                                title={customData.showPythonFunction ? 'Hide Python Function' : 'Show Python Function'}
                                style={{
                                    padding: '4px',
                                    background: customData.showPythonFunction ? '#0066cc' : '#666',
                                    border: 'none',
                                    borderRadius: '3px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <EyeIcon isVisible={customData.showPythonFunction} size={12} />
                            </button>

                            <button
                                onClick={handleDelete}
                                className="delete-btn"
                                title={`Delete ${nodeData.label}`}
                            >
                                <TrashIcon size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Connection Settings */}
                <div className="connection-section" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>IP Address:</label>
                            <input
                                type="text"
                                value={customData.ipAddress}
                                onChange={(e) => handleFieldChange('ipAddress', e.target.value)}
                                placeholder="192.168.1.100"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Port:</label>
                            <input
                                type="text"
                                value={customData.port}
                                onChange={(e) => handleFieldChange('port', e.target.value)}
                                placeholder="8080"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Username:</label>
                            <input
                                type="text"
                                value={customData.username}
                                onChange={(e) => handleFieldChange('username', e.target.value)}
                                placeholder="admin"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Password:</label>
                            <input
                                type="password"
                                value={customData.password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                placeholder="password"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                    </div>

                    {/* Connection Test */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button
                            onClick={testConnection}
                            disabled={customData.isRecording || !customData.ipAddress || !customData.port}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: '#0066cc',
                                color: 'white',
                                cursor: 'pointer',
                                opacity: (customData.isRecording || !customData.ipAddress || !customData.port) ? 0.5 : 1
                            }}
                        >
                            Test Connection
                        </button>

                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getConnectionStatusColor()
                        }} />

                        <span style={{ fontSize: '11px', color: '#666' }}>
                            {customData.connectionStatus}
                        </span>
                    </div>
                </div>

                {/* Recording Mode Toggle */}
                <div className="recording-mode-section" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>
                            <input
                                type="checkbox"
                                checked={customData.isContinuousMode}
                                onChange={toggleContinuousMode}
                                disabled={customData.isRecording}
                                style={{ marginRight: '4px' }}
                            />
                            Continuous Mode
                        </label>
                        {customData.isContinuousMode && (
                            <span style={{ fontSize: '10px', color: '#888' }}>
                                (Records {customData.recordingLength}s chunks)
                            </span>
                        )}
                    </div>
                </div>

                {/* Recording Settings */}
                <div className="recording-settings" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Quality:</label>
                            <select
                                value={customData.videoQuality}
                                onChange={(e) => handleFieldChange('videoQuality', e.target.value)}
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Directory:</label>
                            <input
                                type="text"
                                value={customData.outputDirectory}
                                onChange={(e) => handleFieldChange('outputDirectory', e.target.value)}
                                placeholder="./recordings"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#666' }}>Length (s):</label>
                            <input
                                type="number"
                                value={customData.recordingLength}
                                onChange={(e) => handleFieldChange('recordingLength', parseInt(e.target.value) || 60)}
                                min="10"
                                max="600"
                                style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Recording Controls */}
                <div className="recording-controls" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {!customData.isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={customData.connectionStatus !== 'connected'}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: customData.connectionStatus === 'connected' ? '#4CAF50' : '#ccc',
                                    color: 'white',
                                    cursor: customData.connectionStatus === 'connected' ? 'pointer' : 'not-allowed'
                                }}
                            >
                                🎥 Start {customData.isContinuousMode ? 'Continuous ' : ''}Recording
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: '#F44336',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹️ Stop Recording
                            </button>
                        )}

                        {customData.isRecording && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#ffebee',
                                border: '1px solid #ffcdd2',
                                borderRadius: '4px',
                                color: '#c62828'
                            }}>
                                {customData.isContinuousMode ? (
                                    <>🔴 Chunk #{customData.currentChunkNumber} ({formatDuration(localDuration % customData.recordingLength)} / {formatDuration(customData.recordingLength)}) | Total: {formatTotalTime(customData.totalRecordingTime + localDuration)}</>
                                ) : (
                                    <>🔴 {formatDuration(localDuration)} / {formatDuration(customData.recordingLength)}</>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chunk History (for continuous mode) */}
                {customData.isContinuousMode && customData.chunkHistory.length > 0 && (
                    <div className="chunk-history" style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                            Recent Chunks ({customData.chunkHistory.length}):
                        </label>
                        <div style={{
                            maxHeight: '80px',
                            overflowY: 'auto',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px'
                        }}>
                            {customData.chunkHistory.slice(-3).map((chunk) => (
                                <div key={chunk.chunkNumber} style={{
                                    fontSize: '10px',
                                    color: '#666',
                                    padding: '2px',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    ✅ Chunk {chunk.chunkNumber}: {chunk.filePath.split('/').pop()} ({formatFileSize(chunk.fileSize)})
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {customData.lastSaveMessage && (
                    <div style={{
                        padding: '6px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        backgroundColor: customData.lastSaveStatus === 'success' ? '#e8f5e8' :
                            customData.lastSaveStatus === 'error' ? '#ffebee' : '#fff3e0',
                        border: `1px solid ${customData.lastSaveStatus === 'success' ? '#c8e6c9' :
                            customData.lastSaveStatus === 'error' ? '#ffcdd2' : '#ffcc02'}`,
                        color: customData.lastSaveStatus === 'success' ? '#2e7d32' :
                            customData.lastSaveStatus === 'error' ? '#c62828' : '#f57c00'
                    }}>
                        {customData.lastSaveMessage}
                    </div>
                )}

                {/* Python Function (toggleable) */}
                {customData.showPythonFunction && (
                    <div className="function-section" style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>Python Function:</label>
                        {editingFunction ? (
                            <textarea
                                defaultValue={nodeData.pythonFunction}
                                onBlur={(e) => handleFunctionChange(e.target.value)}
                                rows={calculateDynamicRows(nodeData.pythonFunction)}
                                cols={calculateDynamicCols(nodeData.pythonFunction)}
                                autoFocus
                                className="nodrag nowheel"
                                style={{ fontSize: '11px', fontFamily: 'monospace' }}
                            />
                        ) : (
                            <pre
                                className="function-display nodrag nowheel"
                                onClick={() => setEditingFunction(true)}
                                style={{
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    maxHeight: '150px',
                                    overflow: 'auto',
                                    cursor: 'pointer'
                                }}
                            >
                                {nodeData.pythonFunction}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default IPWebcamNode; 