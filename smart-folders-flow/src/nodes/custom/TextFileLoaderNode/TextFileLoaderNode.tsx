import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { TextFileLoaderNodeData } from './TextFileLoaderNode.types';

const TextFileLoaderNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as TextFileLoaderNodeData;
    const customData = nodeData.customData || {
        inputPath: '',
        selectedTextFile: '',
        availableTextFiles: [],
        fileContent: '',
        showFullContent: false,
        maxPreviewLength: 500,
    };

    // Load text files from directory or validate single file
    const loadTextFiles = useCallback(async (path: string) => {
        if (!path.trim()) {
            updateNodeCustomData(id, {
                availableTextFiles: [],
                selectedTextFile: '',
                fileContent: '',
                lastLoadStatus: 'error',
                lastLoadMessage: 'No path provided',
                lastLoadTime: Date.now()
            });
            return;
        }

        setIsLoading(true);

        try {
            // Check if it's a single file or directory
            const isDirectoryPath = !path.includes('.') || path.endsWith('/');

            if (isDirectoryPath || path.indexOf('.') === -1) {
                // Directory path - load all text files from directory
                const response = await fetch('http://localhost:8000/api/list-files', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: path.trim(),
                        extensions: ['.txt', '.md', '.text', '.log'],
                        nodeId: id
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to load files: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                const textFiles = result.files || [];

                updateNodeCustomData(id, {
                    availableTextFiles: textFiles,
                    selectedTextFile: textFiles.length > 0 ? textFiles[0] : '',
                    fileContent: '', // Clear previous content
                    lastLoadStatus: 'success',
                    lastLoadMessage: `Found ${textFiles.length} text file(s)`,
                    lastLoadTime: Date.now()
                });

                // DON'T auto-load content - let user select file first
            } else {
                // Single file path
                updateNodeCustomData(id, {
                    availableTextFiles: [path],
                    selectedTextFile: path,
                    fileContent: '', // Clear previous content
                    lastLoadStatus: 'success',
                    lastLoadMessage: 'Single file selected',
                    lastLoadTime: Date.now()
                });
                // DON'T auto-load content here either
            }

        } catch (error) {
            console.error('Load text files error:', error);
            updateNodeCustomData(id, {
                availableTextFiles: [],
                selectedTextFile: '',
                fileContent: '',
                lastLoadStatus: 'error',
                lastLoadMessage: error instanceof Error ? error.message : String(error),
                lastLoadTime: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    }, [id, updateNodeCustomData]);

    // Load content of selected text file
    const loadFileContent = useCallback(async (filePath: string) => {
        if (!filePath) return;

        try {
            const response = await fetch('http://localhost:8000/api/read-text-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_path: filePath
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const content = result.content || '';

            updateNodeCustomData(id, {
                fileContent: content,
                lastLoadStatus: 'success',
                lastLoadMessage: `Loaded ${content.length} characters`,
                lastLoadTime: Date.now()
            });

            // Update manual input with JUST THE FILE PATH, not content
            updateSmartFolderManualInput(id, filePath);

        } catch (error) {
            console.error('Load file content error:', error);
            updateNodeCustomData(id, {
                fileContent: '',
                lastLoadStatus: 'error',
                lastLoadMessage: error instanceof Error ? error.message : String(error),
                lastLoadTime: Date.now()
            });
        }
    }, [id, updateNodeCustomData, updateSmartFolderManualInput]);

    // Handle file selection
    const handleFileSelect = useCallback((filePath: string) => {
        updateNodeCustomData(id, {
            selectedTextFile: filePath
        });
        loadFileContent(filePath);
    }, [id, updateNodeCustomData, loadFileContent]);

    // Auto-load content when a file is selected but no content exists
    useEffect(() => {
        if (customData.selectedTextFile && !customData.fileContent && !isLoading) {
            console.log(`📄 Auto-loading content for selected file: ${customData.selectedTextFile}`);
            loadFileContent(customData.selectedTextFile);
        }
    }, [customData.selectedTextFile, customData.fileContent, isLoading, loadFileContent]);

    // Handle incoming data from upstream nodes
    useEffect(() => {
        let incomingPath = nodeData.manualInput || '';

        // Check connected inputs for file paths
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            if (sortedInputs.length > 0) {
                const [sourceId, inputData] = sortedInputs[0];
                incomingPath = inputData.value || incomingPath;
                console.log(`📄 TextLoader received data from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        // Only reload files if we have a new incoming path
        if (incomingPath &&
            incomingPath !== customData.inputPath &&
            incomingPath !== customData.selectedTextFile) {
            console.log(`📄 TextLoader loading path: ${incomingPath}`);
            updateNodeCustomData(id, {
                inputPath: incomingPath
            });
            loadTextFiles(incomingPath);
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.inputPath, customData.selectedTextFile, id, updateNodeCustomData, loadTextFiles]);

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
            loadTextFiles(value);
        }
    };

    const getFileName = (path: string) => {
        return path.split('/').pop() || path;
    };

    const getPreviewContent = () => {
        if (!customData.fileContent) return '';

        if (customData.showFullContent || customData.fileContent.length <= customData.maxPreviewLength) {
            return customData.fileContent;
        }

        return customData.fileContent.substring(0, customData.maxPreviewLength) + '...';
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(customData.fileContent);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    return (
        <div
            className="text-file-loader-node"
            style={{
                background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                border: '3px solid #2e7d32',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
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
                        📄 {nodeData.label}
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
                <label style={{ display: 'block', marginBottom: '4px' }}>Text File Path/Directory:</label>
                {editingPath ? (
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
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
                        🔄 Loading files...
                    </div>
                )}
            </div>

            {/* File Selection */}
            {customData.availableTextFiles.length > 0 && (
                <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                        Select Text File ({customData.availableTextFiles.length} found):
                    </label>
                    <select
                        value={customData.selectedTextFile}
                        onChange={(e) => handleFileSelect(e.target.value)}
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
                        {customData.availableTextFiles.map((file, index) => (
                            <option key={index} value={file}>
                                {getFileName(file)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* File Content */}
            {customData.fileContent && (
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px' }}>File Content:</label>
                        <button
                            onClick={handleCopyToClipboard}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            {copySuccess ? '✅ Copied' : '📋 Copy All'}
                        </button>
                    </div>

                    <div
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: '#e8f5e8'
                        }}
                    >
                        {customData.fileContent}
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                        📁 {getFileName(customData.selectedTextFile)} ({customData.fileContent.length} chars)
                    </div>
                </div>
            )}

            {/* Process Button */}
            {customData.selectedTextFile && customData.fileContent && (
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
                    🚀 Process Text
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

export default TextFileLoaderNode; 