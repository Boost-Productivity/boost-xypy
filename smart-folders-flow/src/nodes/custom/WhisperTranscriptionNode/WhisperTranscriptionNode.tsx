import React, { useState, useCallback, useEffect } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import useStore from '../../../store';
import { WhisperTranscriptionNodeData } from './WhisperTranscriptionNode.types';

const WhisperTranscriptionNode: React.FC<NodeProps> = ({ id, data }) => {
    const { executeSmartFolder, updateNodeCustomData, updateSmartFolderManualInput } = useStore();
    const [isConfigExpanded, setIsConfigExpanded] = useState(false);

    // Cast data to our node type
    const nodeData = data as WhisperTranscriptionNodeData;
    const customData = nodeData.customData || {
        audioFilePath: '',
        model: 'base' as const,
        language: undefined,
        temperature: 0.0,
        verbose: false,
    };

    // Update node data helper
    const updateCustomData = useCallback((updates: Partial<WhisperTranscriptionNodeData['customData']>) => {
        updateNodeCustomData(id, {
            ...customData,
            ...updates
        });
    }, [id, customData, updateNodeCustomData]);

    // Handle audio file path input
    const handleAudioPathChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateCustomData({ audioFilePath: event.target.value });
    }, [updateCustomData]);

    // Handle model selection
    const handleModelChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        updateCustomData({ model: event.target.value as WhisperTranscriptionNodeData['customData']['model'] });
    }, [updateCustomData]);

    // Handle language input
    const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateCustomData({ language: event.target.value || undefined });
    }, [updateCustomData]);

    // Handle temperature change
    const handleTemperatureChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateCustomData({ temperature: parseFloat(event.target.value) });
    }, [updateCustomData]);

    // Handle verbose toggle
    const handleVerboseChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateCustomData({ verbose: event.target.checked });
    }, [updateCustomData]);

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
                console.log(`🎤 WhisperTranscription received data from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        if (incomingPath && incomingPath !== customData.audioFilePath) {
            console.log(`🎤 WhisperTranscription setting audio path: ${incomingPath}`);
            updateCustomData({ audioFilePath: incomingPath });
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.audioFilePath, updateCustomData]);

    // Execute transcription
    const handleTranscribe = useCallback(() => {
        if (!customData.audioFilePath.trim()) {
            alert('Please specify an audio file path');
            return;
        }

        updateCustomData({
            lastTranscriptionStatus: 'processing',
            lastTranscriptionMessage: 'Starting transcription...',
            lastTranscriptionTime: Date.now()
        });

        executeSmartFolder(id);
    }, [id, customData.audioFilePath, executeSmartFolder, updateCustomData]);

    // Status indicator color
    const getStatusColor = () => {
        switch (customData.lastTranscriptionStatus) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'processing': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return (
        <div className="smart-folder-node whisper-transcription-node" style={{ minWidth: '320px' }}>
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                style={{ background: '#10b981', width: '12px', height: '12px' }}
            />

            <div className="node-header" style={{ background: '#7c3aed', color: 'white' }}>
                <div className="node-title">
                    <span className="node-icon">🎤</span>
                    <span>{nodeData.label}</span>
                </div>
                <div className="node-status" style={{ color: getStatusColor() }}>
                    {customData.lastTranscriptionStatus === 'processing' ? '⏳' :
                        customData.lastTranscriptionStatus === 'success' ? '✅' :
                            customData.lastTranscriptionStatus === 'error' ? '❌' : '⚪'}
                </div>
            </div>

            <div className="node-content">
                {/* Audio File Path Input */}
                <div className="input-group">
                    <label>Audio File Path:</label>
                    <input
                        type="text"
                        value={customData.audioFilePath}
                        onChange={handleAudioPathChange}
                        placeholder="Enter path to audio file or use upstream input"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                </div>

                {/* Configuration Toggle */}
                <button
                    onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                    style={{
                        background: 'none',
                        border: '1px solid #7c3aed',
                        color: '#7c3aed',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        fontSize: '12px'
                    }}
                >
                    {isConfigExpanded ? '▼' : '▶'} Configuration
                </button>

                {/* Expanded Configuration */}
                {isConfigExpanded && (
                    <div className="config-section" style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                        <div className="input-group">
                            <label>Model Size:</label>
                            <select value={customData.model} onChange={handleModelChange} style={{ width: '100%', marginBottom: '8px' }}>
                                <option value="tiny">Tiny (fastest, least accurate)</option>
                                <option value="base">Base (balanced)</option>
                                <option value="small">Small (good quality)</option>
                                <option value="medium">Medium (better quality)</option>
                                <option value="large">Large (best quality, slowest)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Language (optional):</label>
                            <input
                                type="text"
                                value={customData.language || ''}
                                onChange={handleLanguageChange}
                                placeholder="e.g., en, es, fr (auto-detect if empty)"
                                style={{ width: '100%', marginBottom: '8px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>Temperature: {customData.temperature.toFixed(1)}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={customData.temperature}
                                onChange={handleTemperatureChange}
                                style={{ width: '100%', marginBottom: '8px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={customData.verbose}
                                    onChange={handleVerboseChange}
                                    style={{ marginRight: '8px' }}
                                />
                                Verbose Output
                            </label>
                        </div>
                    </div>
                )}

                {/* Transcribe Button */}
                <button
                    onClick={handleTranscribe}
                    disabled={nodeData.isExecuting || !customData.audioFilePath.trim()}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: nodeData.isExecuting ? '#6b7280' : '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: nodeData.isExecuting ? 'not-allowed' : 'pointer',
                        marginBottom: '8px'
                    }}
                >
                    {nodeData.isExecuting ? 'Transcribing...' : 'Transcribe Audio'}
                </button>

                {/* Status Message */}
                {customData.lastTranscriptionMessage && (
                    <div
                        className="status-message"
                        style={{
                            fontSize: '12px',
                            color: getStatusColor(),
                            marginBottom: '8px',
                            padding: '4px',
                            background: '#f8f9fa',
                            borderRadius: '4px'
                        }}
                    >
                        {customData.lastTranscriptionMessage}
                        {customData.processingTime && (
                            <span style={{ float: 'right' }}>
                                {(customData.processingTime / 1000).toFixed(1)}s
                            </span>
                        )}
                    </div>
                )}

                {/* Transcription Result Preview */}
                {customData.transcriptionResult && (
                    <div className="result-preview" style={{
                        background: '#f0f9ff',
                        border: '1px solid #7c3aed',
                        borderRadius: '4px',
                        padding: '8px',
                        marginBottom: '8px',
                        maxHeight: '100px',
                        overflowY: 'auto'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#7c3aed' }}>
                            Transcription:
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            {customData.transcriptionResult.substring(0, 200)}
                            {customData.transcriptionResult.length > 200 && '...'}
                        </div>
                    </div>
                )}

                {/* Output Preview */}
                {nodeData.lastOutput && (
                    <div className="output-preview">
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Output:</div>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxHeight: '60px',
                            overflowY: 'auto'
                        }}>
                            {nodeData.lastOutput}
                        </div>
                    </div>
                )}

                {/* Streaming Logs */}
                {nodeData.streamingLogs && (
                    <div className="streaming-logs" style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Logs:</div>
                        <div style={{
                            background: '#1f2937',
                            color: '#10b981',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            maxHeight: '100px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {nodeData.streamingLogs}
                        </div>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="output"
                style={{ background: '#7c3aed', width: '12px', height: '12px' }}
            />
        </div>
    );
};

export default WhisperTranscriptionNode; 