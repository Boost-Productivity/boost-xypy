import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { TimerNodeData } from './TimerNode.types';

const TimerNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingMinutes, setEditingMinutes] = useState(false);
    const [localMinutes, setLocalMinutes] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const {
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        executeSmartFolder,
    } = useStore();

    const nodeData = data as TimerNodeData;
    const customData = nodeData.customData || {
        minutes: 5,
        isRunning: false,
        remainingSeconds: 300,
        originalSeconds: 300,
    };

    // Create audio context for ding sound
    useEffect(() => {
        // Create a simple beep sound using Web Audio API
        const createBeepSound = () => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        };

        audioRef.current = { play: createBeepSound } as any;
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (customData.isRunning && customData.remainingSeconds > 0) {
            intervalRef.current = setInterval(() => {
                updateNodeCustomData(id, {
                    remainingSeconds: Math.max(0, customData.remainingSeconds - 1)
                });
            }, 1000);
        } else if (customData.remainingSeconds === 0 && customData.isRunning) {
            // Timer finished!
            updateNodeCustomData(id, {
                isRunning: false,
                completedAt: Date.now()
            });

            // Play ding sound
            if (audioRef.current) {
                try {
                    audioRef.current.play();
                } catch (error) {
                    console.log('Could not play sound:', error);
                }
            }

            // Update output and execute
            const completionMessage = `Timer completed! ${customData.minutes} minutes elapsed.`;
            updateSmartFolderManualInput(id, completionMessage);
            setTimeout(() => executeSmartFolder(id), 100);

            // Show notification
            alert(`⏰ Timer finished! ${customData.minutes} minutes elapsed.`);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [customData.isRunning, customData.remainingSeconds, customData.minutes, id, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    const startTimer = () => {
        updateNodeCustomData(id, {
            isRunning: true,
            startTime: Date.now()
        });
    };

    const pauseTimer = () => {
        updateNodeCustomData(id, {
            isRunning: false
        });
    };

    const resetTimer = () => {
        updateNodeCustomData(id, {
            isRunning: false,
            remainingSeconds: customData.originalSeconds,
            startTime: undefined,
            completedAt: undefined
        });
    };

    const handleMinutesFocus = () => {
        setEditingMinutes(true);
        setLocalMinutes(customData.minutes.toString());
    };

    const handleMinutesBlur = (value: string) => {
        setEditingMinutes(false);
        const minutes = Number(value) || 1;
        const seconds = minutes * 60;
        updateNodeCustomData(id, {
            minutes,
            remainingSeconds: seconds,
            originalSeconds: seconds,
            isRunning: false
        });
    };

    const handleLocalMinutesChange = (value: string) => {
        setLocalMinutes(value);
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

    const getProgressPercentage = () => {
        if (customData.originalSeconds === 0) return 0;
        return ((customData.originalSeconds - customData.remainingSeconds) / customData.originalSeconds) * 100;
    };

    const isCompleted = customData.remainingSeconds === 0 && customData.completedAt;
    const isActive = customData.isRunning;

    return (
        <div
            className="timer-node"
            style={{
                background: isCompleted
                    ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
                    : isActive
                        ? 'linear-gradient(135deg, #ff9800, #f57c00)'
                        : 'linear-gradient(135deg, #2196f3, #1976d2)',
                border: `3px solid ${isCompleted ? '#1b5e20' : isActive ? '#e65100' : '#0d47a1'}`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '280px',
                color: 'white',
                position: 'relative',
                boxShadow: isCompleted
                    ? '0 8px 24px rgba(76, 175, 80, 0.4)'
                    : isActive
                        ? '0 8px 24px rgba(255, 152, 0, 0.4)'
                        : '0 8px 24px rgba(33, 150, 243, 0.4)',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Handles */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                        ⏰ {nodeData.label}
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

            {/* Timer Display */}
            <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: isCompleted ? '#c8e6c9' : isActive ? '#fff3e0' : '#e3f2fd'
            }}>
                {formatTime(customData.remainingSeconds)}
            </div>

            {/* Progress Bar */}
            <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                marginBottom: '16px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${getProgressPercentage()}%`,
                    height: '100%',
                    background: isCompleted
                        ? '#4caf50'
                        : isActive
                            ? '#ff9800'
                            : '#2196f3',
                    transition: 'width 1s ease'
                }} />
            </div>

            {/* Minutes Input */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                    Minutes:
                </label>
                {editingMinutes ? (
                    <input
                        type="number"
                        value={localMinutes}
                        onChange={(e) => handleLocalMinutesChange(e.target.value)}
                        onBlur={(e) => handleMinutesBlur(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleMinutesBlur(e.currentTarget.value);
                            }
                        }}
                        min="1"
                        max="180"
                        disabled={customData.isRunning}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '14px',
                            color: '#000',
                            opacity: customData.isRunning ? 0.6 : 1
                        }}
                    />
                ) : (
                    <div
                        onClick={handleMinutesFocus}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '14px',
                            color: '#000',
                            background: '#fff',
                            cursor: customData.isRunning ? 'not-allowed' : 'text',
                            opacity: customData.isRunning ? 0.6 : 1,
                            minHeight: '20px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {customData.minutes}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {!customData.isRunning ? (
                    <button
                        onClick={startTimer}
                        disabled={customData.remainingSeconds === 0}
                        style={{
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: customData.remainingSeconds === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: customData.remainingSeconds === 0 ? 0.6 : 1
                        }}
                    >
                        ▶ Start
                    </button>
                ) : (
                    <button
                        onClick={pauseTimer}
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
                        ⏸ Pause
                    </button>
                )}

                <button
                    onClick={resetTimer}
                    style={{
                        background: '#757575',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🔄 Reset
                </button>
            </div>

            {/* Status Messages */}
            {isCompleted && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    🎉 Timer Completed!
                </div>
            )}

            {isActive && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    🔥 Timer Running...
                </div>
            )}
        </div>
    );
};

export default TimerNode; 