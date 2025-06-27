import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { BrainDumpNodeData } from './BrainDumpNode.types';

const BrainDumpNode: React.FC<NodeProps> = ({ id, data }) => {
    const [localCountdown, setLocalCountdown] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingOutputDir, setEditingOutputDir] = useState(false);
    const [localOutputDir, setLocalOutputDir] = useState('');

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as BrainDumpNodeData;
    const defaultCustomData = {
        countdownSeconds: 300, // 5 minutes default
        isCountingDown: false,
        brainDumpText: '',
        outputDirectory: '/tmp/brain_dumps',
        lastSavedFile: '',
        lastSaveTime: undefined
    };

    const customData = {
        ...defaultCustomData,
        ...nodeData.customData // Override with actual data if it exists
    };

    // Timer countdown effect
    useEffect(() => {
        if (customData.isCountingDown && customData.startTime) {
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - customData.startTime!) / 1000);
                const remaining = Math.max(0, customData.countdownSeconds - elapsed);
                setLocalCountdown(remaining);

                if (remaining === 0) {
                    // Play ding sound and stop countdown
                    handleStopCountdown();
                    playDingSound();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [customData.isCountingDown, customData.startTime, customData.countdownSeconds]);

    const playDingSound = () => {
        try {
            // Create a simple ding sound using Web Audio API
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play ding sound:', error);
        }
    };

    const handleStartCountdown = useCallback(() => {
        updateNodeCustomData(id, {
            isCountingDown: true,
            startTime: Date.now()
        });
    }, [id, updateNodeCustomData]);

    const handleStopCountdown = useCallback(() => {
        updateNodeCustomData(id, {
            isCountingDown: false,
            startTime: undefined
        });
        setLocalCountdown(0);
    }, [id, updateNodeCustomData]);

    const handleTimerChange = (minutes: number) => {
        updateNodeCustomData(id, {
            countdownSeconds: minutes * 60
        });
    };

    const handleTextChange = (text: string) => {
        updateNodeCustomData(id, {
            brainDumpText: text
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

    const handleSubmit = () => {
        if (!customData.brainDumpText.trim()) {
            alert('Please enter some text for your brain dump!');
            return;
        }
        if (!customData.outputDirectory.trim()) {
            alert('Please specify an output directory!');
            return;
        }

        // Prepare inputs for the Python function
        const inputs = {
            brainDumpText: customData.brainDumpText,
            outputDirectory: customData.outputDirectory
        };

        // Execute the Python function to save the brain dump
        executeSmartFolder(id, inputs);

        // Update last save time
        updateNodeCustomData(id, {
            lastSaveTime: Date.now()
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayTime = customData.isCountingDown ? localCountdown : customData.countdownSeconds;
    const progressPercentage = customData.isCountingDown
        ? ((customData.countdownSeconds - localCountdown) / customData.countdownSeconds) * 100
        : 0;

    return (
        <div
            className="brain-dump-node"
            style={{
                background: 'linear-gradient(135deg, #9c27b0, #673ab7)',
                border: '3px solid #4a148c',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '350px',
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
                        🧠 {nodeData.label}
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

            {/* Timer Section */}
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: customData.isCountingDown ? (localCountdown < 60 ? '#ff5722' : 'white') : 'white'
                }}>
                    {formatTime(displayTime)}
                </div>

                {/* Progress bar */}
                {customData.isCountingDown && (
                    <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        marginBottom: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            backgroundColor: localCountdown < 60 ? '#ff5722' : '#4caf50',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                )}

                {/* Timer Controls */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {!customData.isCountingDown ? (
                        <>
                            <button
                                onClick={() => handleTimerChange(5)}
                                style={{
                                    background: customData.countdownSeconds === 300 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                5m
                            </button>
                            <button
                                onClick={() => handleTimerChange(10)}
                                style={{
                                    background: customData.countdownSeconds === 600 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                10m
                            </button>
                            <button
                                onClick={() => handleTimerChange(15)}
                                style={{
                                    background: customData.countdownSeconds === 900 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                15m
                            </button>
                            <button
                                onClick={handleStartCountdown}
                                style={{
                                    background: 'rgba(76, 175, 80, 0.8)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                ▶ Start
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleStopCountdown}
                            style={{
                                background: 'rgba(244, 67, 54, 0.8)',
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            ⏹ Stop
                        </button>
                    )}
                </div>
            </div>

            {/* Brain Dump Text Area */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                    Brain Dump Text:
                </label>
                <textarea
                    value={customData.brainDumpText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Start typing your thoughts here..."
                    rows={6}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: 'white',
                        fontSize: '12px',
                        resize: 'vertical',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                />
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                    {(customData.brainDumpText || '').length} characters
                </div>
            </div>

            {/* Output Directory */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                    Output Directory:
                </label>
                {editingOutputDir ? (
                    <input
                        type="text"
                        value={localOutputDir}
                        onChange={(e) => setLocalOutputDir(e.target.value)}
                        onBlur={(e) => handleOutputDirBlur(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleOutputDirBlur(e.currentTarget.value);
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
                        placeholder="Enter output directory path..."
                    />
                ) : (
                    <div
                        onClick={handleOutputDirFocus}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            fontSize: '11px',
                            color: 'white',
                            background: 'rgba(255,255,255,0.1)',
                            cursor: 'text',
                            minHeight: '17px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {customData.outputDirectory || 'Click to set output directory...'}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={nodeData.isExecuting || !customData.brainDumpText.trim() || !customData.outputDirectory.trim()}
                style={{
                    width: '100%',
                    background: nodeData.isExecuting
                        ? 'rgba(255,193,7,0.8)'
                        : (!customData.brainDumpText.trim() || !customData.outputDirectory.trim())
                            ? 'rgba(107,114,128,0.5)'
                            : 'rgba(76, 175, 80, 0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: (!customData.brainDumpText.trim() || !customData.outputDirectory.trim()) ? 'not-allowed' : 'pointer',
                    marginBottom: '8px'
                }}
            >
                {nodeData.isExecuting ? '💾 Saving...' : '💾 Submit Brain Dump'}
            </button>

            {/* Last saved info */}
            {customData.lastSavedFile && (
                <div style={{ fontSize: '10px', opacity: 0.7, textAlign: 'center' }}>
                    Last saved: {new Date(customData.lastSaveTime || 0).toLocaleTimeString()}
                    <br />
                    {customData.lastSavedFile.split('/').pop()}
                </div>
            )}

            {/* Output */}
            {nodeData.lastOutput && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}>
                    <strong>Saved to:</strong>
                    <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>
                        {nodeData.lastOutput}
                    </div>
                </div>
            )}

            {/* Streaming Logs */}
            {nodeData.streamingLogs && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    maxHeight: '60px',
                    overflowY: 'auto',
                    fontFamily: 'monospace'
                }}>
                    {nodeData.streamingLogs}
                </div>
            )}
        </div>
    );
};

export default BrainDumpNode; 