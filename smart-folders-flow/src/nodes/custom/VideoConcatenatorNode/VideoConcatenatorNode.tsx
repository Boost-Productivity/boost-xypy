import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { VideoConcatenatorNodeData } from './VideoConcatenatorNode.types';

// Video Icon Component
const VideoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
        <polygon points="23,7 16,12 23,17 23,7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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

const VideoConcatenatorNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const {
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as VideoConcatenatorNodeData;
    const customData = nodeData.customData || {
        inputDirectory: '',
        outputDirectory: '',
    };

    // Extract directory paths from upstream inputs
    const getUpstreamDirectoryPaths = (): { input?: string; output?: string } => {
        const inputValues = Object.values(nodeData.inputs || {});
        const manualInput = nodeData.manualInput || '';

        let inputDir = undefined;
        let outputDir = undefined;

        // Check manual input first
        if (manualInput.trim()) {
            const lines = manualInput.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('/') || trimmed.includes('\\') || trimmed.includes('/')) {
                    if (!inputDir) {
                        inputDir = trimmed;
                    } else if (!outputDir) {
                        outputDir = trimmed;
                    }
                }
            }
        }

        // Check upstream inputs - first one becomes input dir, second becomes output dir
        for (let i = 0; i < inputValues.length && (!inputDir || !outputDir); i++) {
            const value = String(inputValues[i].value || '').trim();
            if (value && (value.startsWith('/') || value.includes('\\') || value.includes('/'))) {
                if (!inputDir) {
                    inputDir = value;
                } else if (!outputDir) {
                    outputDir = value;
                }
            }
        }

        return { input: inputDir, output: outputDir };
    };

    // Monitor upstream inputs and update directory paths
    useEffect(() => {
        const upstreamPaths = getUpstreamDirectoryPaths();
        let updated = false;

        if (upstreamPaths.input && upstreamPaths.input !== customData.inputDirectory) {
            handleFieldChange('inputDirectory', upstreamPaths.input);
            updated = true;
        }

        if (upstreamPaths.output && upstreamPaths.output !== customData.outputDirectory) {
            handleFieldChange('outputDirectory', upstreamPaths.output);
            updated = true;
        }
    }, [nodeData.inputs, nodeData.manualInput]);

    const handleConcatenate = async () => {
        const inputDir = customData.inputDirectory.trim();
        const outputDir = customData.outputDirectory.trim();

        if (!inputDir) {
            alert('Please specify an input directory');
            return;
        }

        if (!outputDir) {
            alert('Please specify an output directory');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch('http://localhost:8000/api/concatenate-recent-videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input_directory: inputDir,
                    output_directory: outputDir,
                    nodeId: id
                })
            });

            const result = await response.json();

            // Store the result in custom data
            updateNodeCustomData(id, {
                lastConcatenationResult: result,
                lastConcatenationTime: Date.now()
            });

            if (result.success) {
                // Update manual input with the output filename for downstream processing
                updateSmartFolderManualInput(id, result.output_filename);
                alert(`Successfully concatenated ${result.files_concatenated} videos!\nOutput: ${result.output_filename}`);
            } else {
                alert(`Concatenation failed: ${result.message}`);
            }

        } catch (error) {
            console.error('Concatenation error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            updateNodeCustomData(id, {
                lastConcatenationResult: {
                    success: false,
                    message: `Error: ${errorMessage}`
                },
                lastConcatenationTime: Date.now()
            });

            alert(`Concatenation failed: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLabelChange = (newLabel: string) => {
        updateSmartFolderLabel(id, newLabel);
        setIsEditing(false);
    };

    const handleFieldChange = (field: string, value: string) => {
        updateNodeCustomData(id, {
            [field]: value
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const upstreamPaths = getUpstreamDirectoryPaths();
    const hasUpstreamInput = !!(upstreamPaths.input || upstreamPaths.output);
    const effectiveInputDir = upstreamPaths.input || customData.inputDirectory;
    const effectiveOutputDir = upstreamPaths.output || customData.outputDirectory;

    const lastResult = customData.lastConcatenationResult;

    return (
        <div
            className="video-concatenator-node"
            style={{
                background: 'linear-gradient(135deg, #f57c00, #ef6c00)',
                border: '3px solid #d84315',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '380px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(245, 124, 0, 0.4)'
            }}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

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
                            fontSize: '16px',
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
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        <VideoIcon size={18} />
                        {nodeData.label}
                    </h3>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'white'
                    }}
                    title="Delete node"
                >
                    <TrashIcon size={14} />
                </button>
            </div>

            {/* Input Directory */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: hasUpstreamInput ? '#FFE082' : 'white'
                }}>
                    Input Directory {hasUpstreamInput && '(from upstream)'}
                </label>
                <input
                    type="text"
                    value={effectiveInputDir}
                    onChange={(e) => handleFieldChange('inputDirectory', e.target.value)}
                    placeholder="/path/to/input/videos"
                    disabled={!!upstreamPaths.input}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: upstreamPaths.input
                            ? 'rgba(255, 224, 130, 0.3)'
                            : 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Output Directory */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: hasUpstreamInput ? '#FFE082' : 'white'
                }}>
                    Output Directory {upstreamPaths.output && '(from upstream)'}
                </label>
                <input
                    type="text"
                    value={effectiveOutputDir}
                    onChange={(e) => handleFieldChange('outputDirectory', e.target.value)}
                    placeholder="/path/to/output/directory"
                    disabled={!!upstreamPaths.output}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: upstreamPaths.output
                            ? 'rgba(255, 224, 130, 0.3)'
                            : 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Action Button */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={handleConcatenate}
                    disabled={isProcessing || !effectiveInputDir || !effectiveOutputDir}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: isProcessing
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isProcessing ? 'Concatenating...' : '🎬 Concatenate Last 5 Min'}
                </button>
            </div>

            {/* Status Display */}
            {lastResult && (
                <div style={{
                    background: lastResult.success
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(244, 67, 54, 0.2)',
                    border: `1px solid ${lastResult.success ? '#4CAF50' : '#F44336'}`,
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                    }}>
                        {lastResult.success ? '✅' : '❌'}
                        {lastResult.success ? 'Concatenation Successful' : 'Concatenation Failed'}
                    </div>

                    {lastResult.success && (
                        <>
                            <div>📁 Output: {lastResult.outputFilename}</div>
                            <div>📊 Files: {lastResult.filesConcatenated}</div>
                            <div>💾 Size: {lastResult.fileSize ? `${(lastResult.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Unknown'}</div>
                        </>
                    )}

                    {lastResult.message && (
                        <div style={{ marginTop: '8px', opacity: 0.9 }}>
                            {lastResult.message}
                        </div>
                    )}
                </div>
            )}

            {/* Help Text */}
            <div style={{
                marginTop: '12px',
                fontSize: '11px',
                opacity: 0.7,
                lineHeight: '1.4'
            }}>
                Finds MP4 files created in the last 5 minutes and concatenates them into a single video with UUID filename.
            </div>
        </div>
    );
};

export default VideoConcatenatorNode; 