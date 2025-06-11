import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { SchedulerNodeData } from './SchedulerNode.types';

// Clock Icon Component
const ClockIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
);

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

// Simple cron parser for basic expressions
const parseCron = (cronExpression: string) => {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
        throw new Error('Invalid cron expression');
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Basic validation
    const isValidPart = (part: string, min: number, max: number): boolean => {
        if (part === '*') return true;
        if (part.includes('/')) {
            const [range, step] = part.split('/');
            return isValidPart(range, min, max) && !isNaN(parseInt(step));
        }
        if (part.includes('-')) {
            const [start, end] = part.split('-');
            return !isNaN(parseInt(start)) && !isNaN(parseInt(end));
        }
        if (part.includes(',')) {
            return part.split(',').every(p => isValidPart(p, min, max));
        }
        const num = parseInt(part);
        return !isNaN(num) && num >= min && num <= max;
    };

    if (!isValidPart(minute, 0, 59) ||
        !isValidPart(hour, 0, 23) ||
        !isValidPart(dayOfMonth, 1, 31) ||
        !isValidPart(month, 1, 12) ||
        !isValidPart(dayOfWeek, 0, 7)) {
        throw new Error('Invalid cron expression');
    }

    return { minute, hour, dayOfMonth, month, dayOfWeek };
};

// Validate cron expression
const isValidCron = (expression: string): boolean => {
    try {
        parseCron(expression);
        return true;
    } catch {
        return false;
    }
};

const getNextTrigger = (cronExpression: string): Date => {
    const cron = parseCron(cronExpression);
    const now = new Date();
    const next = new Date(now);

    // Start from the next minute
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);

    // Helper function to check if a value matches the cron field
    const matches = (value: string, current: number, isMinute: boolean = false): boolean => {
        if (value === '*') return true;

        if (value.includes('/')) {
            const [range, step] = value.split('/');
            const stepNum = parseInt(step);
            if (range === '*') {
                // For */5, we want every 5th minute (0, 5, 10, 15, etc.)
                return current % stepNum === 0;
            }
            return false; // More complex range/step logic would go here
        }

        if (value.includes(',')) {
            return value.split(',').some(v => matches(v, current, isMinute));
        }

        if (value.includes('-')) {
            const [start, end] = value.split('-').map(Number);
            return current >= start && current <= end;
        }

        return parseInt(value) === current;
    };

    // Search for the next valid time (limit to next week)
    for (let i = 0; i < 60 * 24 * 7; i++) {
        if (matches(cron.minute, next.getMinutes(), true) &&
            matches(cron.hour, next.getHours()) &&
            matches(cron.dayOfMonth, next.getDate()) &&
            matches(cron.month, next.getMonth() + 1) &&
            matches(cron.dayOfWeek, next.getDay())) {

            console.log(`📅 Next trigger calculated: ${next.toLocaleString()}`);
            return next;
        }

        // Move to next minute
        next.setMinutes(next.getMinutes() + 1);
    }

    // Fallback: next hour
    const fallback = new Date(now);
    fallback.setHours(fallback.getHours() + 1, 0, 0, 0);
    console.log(`📅 Using fallback trigger: ${fallback.toLocaleString()}`);
    return fallback;
};

const SchedulerNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingCron, setEditingCron] = useState(false);
    const [localCron, setLocalCron] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const nextTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastProcessedInputRef = useRef<string>('');

    const {
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
        executeSmartFolder,
    } = useStore();

    const nodeData = data as SchedulerNodeData;
    const customData = nodeData.customData || {
        cronExpression: '0 9 * * 1-5', // Default: 9 AM weekdays
        isActive: false,
        timezone: 'America/New_York',
        triggerCount: 0,
        includeDate: true,
        includeTime: true,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        customMessage: ''
    };

    // Extract cron expression from input text
    const extractCronFromInput = (text: string): string | null => {
        if (!text) return null;

        // Common cron patterns to look for
        const cronPatterns = [
            // Standard 5-field cron (minute hour day month dow)
            /\b(\d+|\*|(?:\d+,)*\d+|(?:\d+-\d+)|\*\/\d+)\s+(\d+|\*|(?:\d+,)*\d+|(?:\d+-\d+)|\*\/\d+)\s+(\d+|\*|(?:\d+,)*\d+|(?:\d+-\d+)|\*\/\d+)\s+(\d+|\*|(?:\d+,)*\d+|(?:\d+-\d+)|\*\/\d+)\s+(\d+|\*|(?:\d+,)*\d+|(?:\d+-\d+)|\*\/\d+)\b/g,
            // Look for explicit "cron:" prefix
            /cron:\s*([^\n\r]+)/i,
            // Look for "schedule:" prefix
            /schedule:\s*([^\n\r]+)/i
        ];

        for (const pattern of cronPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                let cronCandidate = matches[0];
                // Clean up prefixes
                cronCandidate = cronCandidate.replace(/^(cron|schedule):\s*/i, '').trim();

                // Validate the extracted cron
                if (isValidCron(cronCandidate)) {
                    return cronCandidate;
                }
            }
        }

        return null;
    };

    // Monitor inputs and update cron expression when valid ones are detected
    useEffect(() => {
        const inputValues = Object.values(nodeData.inputs || {});
        const manualInput = nodeData.manualInput || '';

        // Check all inputs for cron expressions (but exclude manual input to avoid loops)
        const upstreamInputText = inputValues.join(' ');

        // Only process upstream inputs (not manual input to avoid loops)
        if (upstreamInputText.trim() && upstreamInputText !== lastProcessedInputRef.current) {
            const extractedCron = extractCronFromInput(upstreamInputText);
            if (extractedCron && extractedCron !== customData.cronExpression) {
                console.log(`📅 Scheduler detected new cron expression from upstream: ${extractedCron}`);
                lastProcessedInputRef.current = upstreamInputText;

                // Update both the cron expression AND the manual input to show what we're using
                updateNodeCustomData(id, {
                    cronExpression: extractedCron,
                    isActive: false // Stop current schedule when updating
                });

                // Update manual input to show the detected expression
                updateSmartFolderManualInput(id, `Received from upstream: ${extractedCron}`);
            }
        }
    }, [nodeData.inputs]); // Only watch upstream inputs, not manual input

    // Format datetime string based on settings
    const formatDateTime = (): string => {
        const now = new Date();
        const parts: string[] = [];

        if (customData.includeDate) {
            // Simple date formatting
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            if (customData.dateFormat === 'MM/DD/YYYY') {
                parts.push(`${month}/${day}/${year}`);
            } else if (customData.dateFormat === 'DD/MM/YYYY') {
                parts.push(`${day}/${month}/${year}`);
            } else { // Default YYYY-MM-DD
                parts.push(`${year}-${month}-${day}`);
            }
        }

        if (customData.includeTime) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            if (customData.timeFormat === '12h') {
                const hour12 = now.getHours() % 12 || 12;
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                parts.push(`${hour12}:${minutes}:${seconds} ${ampm}`);
            } else { // Default 24h
                parts.push(`${hours}:${minutes}:${seconds}`);
            }
        }

        let result = parts.join(' ');
        if (customData.customMessage) {
            result = `${customData.customMessage} - ${result}`;
        }

        return result || 'Scheduled trigger';
    };

    // Handle scheduled trigger
    const handleScheduleTrigger = useCallback(() => {
        const triggerMessage = formatDateTime();
        const timestamp = Date.now();

        updateNodeCustomData(id, {
            lastTriggered: timestamp,
            triggerCount: customData.triggerCount + 1,
            lastTriggerMessage: triggerMessage
        });

        // Send message downstream
        updateSmartFolderManualInput(id, triggerMessage);
        setTimeout(() => executeSmartFolder(id), 100);

        // Schedule next trigger
        scheduleNextTrigger();

    }, [id, customData, updateNodeCustomData, updateSmartFolderManualInput, executeSmartFolder]);

    // Schedule the next trigger
    const scheduleNextTrigger = useCallback(() => {
        if (!customData.isActive || !isValidCron(customData.cronExpression)) {
            console.log(`📅 Scheduler not scheduling: active=${customData.isActive}, validCron=${isValidCron(customData.cronExpression)}`);
            return;
        }

        const nextTime = getNextTrigger(customData.cronExpression);
        if (!nextTime) return;

        const now = new Date();
        const delay = nextTime.getTime() - now.getTime();

        console.log(`📅 Scheduling next trigger: ${nextTime.toLocaleString()}, delay: ${Math.round(delay / 1000)}s`);

        if (delay > 0) {
            // Only update nextTrigger if it's significantly different to avoid constant updates
            const currentNextTrigger = customData.nextTrigger;
            const timeDiff = Math.abs((currentNextTrigger || 0) - nextTime.getTime());
            if (timeDiff > 1000) { // Only update if difference is more than 1 second
                updateNodeCustomData(id, {
                    nextTrigger: nextTime.getTime()
                });
            }

            if (nextTriggerTimeoutRef.current) {
                clearTimeout(nextTriggerTimeoutRef.current);
            }

            nextTriggerTimeoutRef.current = setTimeout(() => {
                console.log(`🔔 Scheduler triggered at: ${new Date().toLocaleString()}`);
                handleScheduleTrigger();
            }, delay);
        } else {
            console.log(`⚠️ Calculated delay is negative: ${delay}ms`);
        }
    }, [customData.isActive, customData.cronExpression, customData.nextTrigger, id, updateNodeCustomData, handleScheduleTrigger]);

    // Start/stop scheduler
    useEffect(() => {
        if (customData.isActive && isValidCron(customData.cronExpression)) {
            // Start scheduler
            scheduleNextTrigger();
        } else {
            // Stop scheduler
            if (nextTriggerTimeoutRef.current) {
                clearTimeout(nextTriggerTimeoutRef.current);
                nextTriggerTimeoutRef.current = null;
            }
        }

        return () => {
            if (nextTriggerTimeoutRef.current) {
                clearTimeout(nextTriggerTimeoutRef.current);
            }
        };
    }, [customData.isActive, customData.cronExpression]);

    const toggleScheduler = () => {
        if (!isValidCron(customData.cronExpression)) {
            alert('Please enter a valid cron expression');
            return;
        }

        updateNodeCustomData(id, {
            isActive: !customData.isActive
        });
    };

    const handleCronFocus = () => {
        setEditingCron(true);
        setLocalCron(customData.cronExpression);
    };

    const handleCronBlur = (value: string) => {
        setEditingCron(false);
        if (isValidCron(value)) {
            updateNodeCustomData(id, {
                cronExpression: value,
                isActive: false // Stop scheduler when changing expression
            });
        }
    };

    const handleFieldChange = (field: string, value: string | boolean) => {
        updateNodeCustomData(id, {
            [field]: value
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const formatLastTriggered = () => {
        if (!customData.lastTriggered) return 'Never';
        return new Date(customData.lastTriggered).toLocaleString();
    };

    const formatNextTrigger = () => {
        if (!customData.nextTrigger) return 'Not scheduled';
        return new Date(customData.nextTrigger).toLocaleString();
    };

    // Cron expression examples
    const cronExamples = [
        { expr: '0 9 * * 1-5', desc: 'Every weekday at 9 AM' },
        { expr: '*/15 * * * *', desc: 'Every 15 minutes' },
        { expr: '0 0 * * 0', desc: 'Every Sunday at midnight' },
        { expr: '0 */6 * * *', desc: 'Every 6 hours' },
        { expr: '0 9,17 * * 1-5', desc: 'Weekdays at 9 AM and 5 PM' }
    ];

    const isActive = customData.isActive;
    const isValidExpression = isValidCron(customData.cronExpression);

    return (
        <div
            className="scheduler-node"
            style={{
                background: isActive
                    ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
                    : 'linear-gradient(135deg, #607d8b, #455a64)',
                border: `3px solid ${isActive ? '#1b5e20' : '#263238'}`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: isActive
                    ? '0 8px 24px rgba(76, 175, 80, 0.4)'
                    : '0 8px 24px rgba(96, 125, 139, 0.4)',
                transition: 'all 0.3s ease'
            }}
        >
            <Handle type="target" position={Position.Top} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            flex: 1,
                            marginRight: '8px'
                        }}
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        style={{
                            margin: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}
                    >
                        <ClockIcon size={20} />
                        {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="Delete Scheduler"
                >
                    <TrashIcon size={14} />
                </button>
            </div>

            {/* Cron Expression */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Cron Expression:
                </label>
                {editingCron ? (
                    <input
                        type="text"
                        value={localCron}
                        onChange={(e) => setLocalCron(e.target.value)}
                        onBlur={(e) => handleCronBlur(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCronBlur(e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '6px',
                            color: 'white',
                            fontSize: '14px',
                            fontFamily: 'monospace'
                        }}
                    />
                ) : (
                    <div
                        onClick={handleCronFocus}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: `1px solid ${isValidExpression ? 'rgba(76,175,80,0.5)' : 'rgba(244,67,54,0.5)'}`,
                            borderRadius: '4px',
                            padding: '6px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{customData.cronExpression}</span>
                        <span style={{ fontSize: '10px', color: isValidExpression ? '#81c784' : '#f48fb1' }}>
                            {isValidExpression ? '✓' : '✗'}
                        </span>
                    </div>
                )}

                {/* Input Status Indicator */}
                {(Object.keys(nodeData.inputs || {}).length > 0 || nodeData.manualInput) && (
                    <div style={{
                        fontSize: '10px',
                        marginTop: '4px',
                        padding: '4px 6px',
                        background: 'rgba(33, 150, 243, 0.2)',
                        border: '1px solid rgba(33, 150, 243, 0.4)',
                        borderRadius: '3px',
                        color: '#90caf9'
                    }}>
                        📡 Receiving input - will auto-update cron if detected
                    </div>
                )}
            </div>

            {/* Quick Cron Examples */}
            <details style={{ marginBottom: '12px' }}>
                <summary style={{ fontSize: '10px', cursor: 'pointer', marginBottom: '4px' }}>
                    Common Examples
                </summary>
                <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                    {cronExamples.map((example, i) => (
                        <div key={i} style={{ marginBottom: '2px' }}>
                            <code
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '1px 3px',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleFieldChange('cronExpression', example.expr)}
                            >
                                {example.expr}
                            </code>
                            <span style={{ marginLeft: '4px', opacity: 0.8 }}>{example.desc}</span>
                        </div>
                    ))}
                </div>
            </details>

            {/* Output Format Settings */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Output Format:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                            type="checkbox"
                            checked={customData.includeDate}
                            onChange={(e) => handleFieldChange('includeDate', e.target.checked)}
                        />
                        Include Date
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                            type="checkbox"
                            checked={customData.includeTime}
                            onChange={(e) => handleFieldChange('includeTime', e.target.checked)}
                        />
                        Include Time
                    </label>
                </div>

                {customData.includeDate && (
                    <select
                        value={customData.dateFormat}
                        onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                        style={{
                            width: '100%',
                            marginTop: '4px',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px',
                            color: 'white',
                            fontSize: '11px'
                        }}
                    >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                )}

                {customData.includeTime && (
                    <select
                        value={customData.timeFormat}
                        onChange={(e) => handleFieldChange('timeFormat', e.target.value)}
                        style={{
                            width: '100%',
                            marginTop: '4px',
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '4px',
                            color: 'white',
                            fontSize: '11px'
                        }}
                    >
                        <option value="HH:mm:ss">24 Hour (HH:mm:ss)</option>
                        <option value="12h">12 Hour (h:mm:ss AM/PM)</option>
                    </select>
                )}
            </div>

            {/* Custom Message */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                    Custom Message (optional):
                </label>
                <input
                    type="text"
                    value={customData.customMessage || ''}
                    onChange={(e) => handleFieldChange('customMessage', e.target.value)}
                    placeholder="Schedule notification..."
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        padding: '6px',
                        color: 'white',
                        fontSize: '12px'
                    }}
                />
            </div>

            {/* Control Button */}
            <button
                onClick={toggleScheduler}
                disabled={!isValidExpression}
                style={{
                    width: '100%',
                    background: isActive
                        ? 'rgba(244,67,54,0.8)'
                        : isValidExpression
                            ? 'rgba(76,175,80,0.8)'
                            : 'rgba(158,158,158,0.5)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isValidExpression ? 'pointer' : 'not-allowed',
                    marginBottom: '12px',
                    transition: 'background 0.3s ease'
                }}
            >
                {isActive ? '⏹️ Stop Scheduler' : '▶️ Start Scheduler'}
            </button>

            {/* Status Information */}
            <div style={{ fontSize: '10px', opacity: 0.9, lineHeight: '1.4' }}>
                <div><strong>Status:</strong> {isActive ? '🟢 Active' : '⚫ Inactive'}</div>
                <div><strong>Triggers:</strong> {customData.triggerCount}</div>
                <div><strong>Last Triggered:</strong> {formatLastTriggered()}</div>
                <div><strong>Next Trigger:</strong> {formatNextTrigger()}</div>
                {customData.lastTriggerMessage && (
                    <div><strong>Last Message:</strong> "{customData.lastTriggerMessage}"</div>
                )}

                {/* Input Activity */}
                {Object.keys(nodeData.inputs || {}).length > 0 && (
                    <details style={{ marginTop: '8px' }}>
                        <summary style={{ fontSize: '9px', cursor: 'pointer' }}>
                            Input Activity ({Object.keys(nodeData.inputs || {}).length} source{Object.keys(nodeData.inputs || {}).length !== 1 ? 's' : ''})
                        </summary>
                        <div style={{
                            marginTop: '4px',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '4px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            maxHeight: '60px',
                            overflow: 'auto'
                        }}>
                            {Object.entries(nodeData.inputs || {}).map(([key, value]) => {
                                const detectedCron = extractCronFromInput(String(value));
                                return (
                                    <div key={key} style={{ marginBottom: '2px' }}>
                                        <strong>{key}:</strong> {String(value).substring(0, 40)}
                                        {String(value).length > 40 ? '...' : ''}
                                        {detectedCron && (
                                            <div style={{ color: '#81c784', fontSize: '7px' }}>
                                                → Detected: {detectedCron}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default SchedulerNode; 