import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { BrainDumpNodeData } from './BrainDumpNode.types';

const BrainDumpNode: React.FC<NodeProps> = ({ id, data }) => {
    const [localCountdown, setLocalCountdown] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const {
        executeSmartFolder,
        cancelExecution,
        updateSmartFolderFunction,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as BrainDumpNodeData;
    const customData = nodeData.customData || { countdownSeconds: 300, isCountingDown: false };

    // Update local countdown when countdown is active
    useEffect(() => {
        if (customData.isCountingDown && customData.startTime) {
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - customData.startTime!) / 1000);
                const remaining = Math.max(0, customData.countdownSeconds - elapsed);
                setLocalCountdown(remaining);

                if (remaining === 0) {
                    // Auto-execute when countdown reaches 0
                    handleStopCountdown();
                    executeSmartFolder(id);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [customData.isCountingDown, customData.startTime, customData.countdownSeconds, id]);

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

    const handleCountdownChange = (newCountdown: number) => {
        updateNodeCustomData(id, {
            countdownSeconds: newCountdown
        });
    };

    const handleExecute = () => {
        executeSmartFolder(id);
    };

    const handleCancel = () => {
        cancelExecution(id);
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

    const progressPercentage = customData.isCountingDown
        ? ((customData.countdownSeconds - localCountdown) / customData.countdownSeconds) * 100
        : 0;

    return (
        <div
            className="brain-dump-node"
            style={{
                background: 'linear-gradient(135deg, #4fc3f7, #1976d2)',
                border: '3px solid #0d47a1',
                borderRadius: '50%',
                width: '200px',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Input handle - top */}
            <Handle type="target" position={Position.Top} />

            {/* Progress ring */}
            {customData.isCountingDown && (
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        transform: 'rotate(-90deg)'
                    }}
                >
                    <circle
                        cx="50%"
                        cy="50%"
                        r="90"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="6"
                    />
                    <circle
                        cx="50%"
                        cy="50%"
                        r="90"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 90}`}
                        strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercentage / 100)}`}
                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                </svg>
            )}

            {/* Delete button */}
            <button
                onClick={handleDelete}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Delete node"
            >
                ×
            </button>

            {/* Content */}
            <div style={{ textAlign: 'center', zIndex: 1 }}>
                {/* Title */}
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
                            padding: '2px 6px',
                            fontSize: '14px',
                            textAlign: 'center',
                            width: '120px'
                        }}
                    />
                ) : (
                    <h4
                        onClick={() => setIsEditing(true)}
                        style={{
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: '2px'
                        }}
                    >
                        {nodeData.label}
                    </h4>
                )}

                {/* Timer Display */}
                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>
                    {customData.isCountingDown ? formatTime(localCountdown) : formatTime(customData.countdownSeconds)}
                </div>

                {/* Timer Controls */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {!customData.isCountingDown ? (
                        <>
                            <button
                                onClick={() => handleCountdownChange(300)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                5m
                            </button>
                            <button
                                onClick={() => handleCountdownChange(600)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                10m
                            </button>
                            <button
                                onClick={handleStartCountdown}
                                style={{
                                    background: 'rgba(76, 175, 80, 0.8)',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
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
                                padding: '2px 6px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            ⏹ Stop
                        </button>
                    )}
                </div>

                {/* Quick Execute */}
                <button
                    onClick={handleExecute}
                    disabled={nodeData.isExecuting}
                    style={{
                        background: nodeData.isExecuting ? 'rgba(255,193,7,0.8)' : 'rgba(33, 150, 243, 0.8)',
                        color: 'white',
                        border: '1px solid white',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: nodeData.isExecuting ? 'not-allowed' : 'pointer',
                        marginTop: '8px'
                    }}
                >
                    {nodeData.isExecuting ? 'Running...' : 'Execute Now'}
                </button>
            </div>

            {/* Output handle - bottom */}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default BrainDumpNode; 