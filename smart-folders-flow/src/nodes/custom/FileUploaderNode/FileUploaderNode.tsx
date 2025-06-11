import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { FileUploaderNodeData } from './FileUploaderNode.types';

const FileUploaderNode: React.FC<NodeProps> = ({ id, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingPath, setEditingPath] = useState(false);
    const [localPath, setLocalPath] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        executeSmartFolder,
        deleteSmartFolder,
        updateNodeCustomData,
        updateSmartFolderLabel,
        updateSmartFolderManualInput,
    } = useStore();

    const nodeData = data as FileUploaderNodeData;
    const customData = nodeData.customData || {
        targetDirectory: '',
        allowedExtensions: [],
        maxFileSize: 5000, // 5GB default
        uploadedFiles: [],
        overwriteExisting: false,
    };

    // Handle incoming data from upstream nodes (directory paths)
    useEffect(() => {
        let incomingPath = nodeData.manualInput || '';

        // Check connected inputs for directory paths
        if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
            const sortedInputs = Object.entries(nodeData.inputs).sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
            );

            if (sortedInputs.length > 0) {
                const [sourceId, inputData] = sortedInputs[0];
                incomingPath = inputData.value || incomingPath;
                console.log(`📁 FileUploader received directory from ${inputData.nodeLabel} (${sourceId}): ${incomingPath}`);
            }
        }

        if (incomingPath && incomingPath !== customData.targetDirectory) {
            console.log(`📁 FileUploader updating target directory: ${incomingPath}`);
            updateNodeCustomData(id, {
                targetDirectory: incomingPath
            });
        }
    }, [nodeData.manualInput, nodeData.inputs, customData.targetDirectory, id, updateNodeCustomData]);

    const handleFileUpload = useCallback(async (files: FileList) => {
        if (!customData.targetDirectory) {
            updateNodeCustomData(id, {
                lastUploadStatus: 'error',
                lastUploadMessage: 'Target directory is required',
                lastUploadTime: Date.now()
            });
            return;
        }

        setIsUploading(true);
        updateNodeCustomData(id, {
            lastUploadStatus: 'uploading',
            lastUploadMessage: `Uploading ${files.length} file(s)...`,
            lastUploadTime: Date.now()
        });

        try {
            const uploadedFiles: string[] = [];
            let totalSize = 0;

            // Upload each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('directory', customData.targetDirectory);
                formData.append('nodeId', id);
                formData.append('allowedExtensions', customData.allowedExtensions.join(','));
                formData.append('maxFileSize', customData.maxFileSize.toString());
                formData.append('overwriteExisting', customData.overwriteExisting.toString());

                // Upload to server
                const response = await fetch('http://localhost:8000/api/upload-file', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(`Upload failed for ${file.name}: ${errorData.detail || response.statusText}`);
                }

                const result = await response.json();
                uploadedFiles.push(result.filePath);
                totalSize += result.fileSize;

                // Update progress
                updateNodeCustomData(id, {
                    lastUploadMessage: `Uploaded ${i + 1}/${files.length} files...`,
                });
            }

            // Update node with success status
            updateNodeCustomData(id, {
                uploadedFiles: [...(customData.uploadedFiles || []), ...uploadedFiles],
                totalUploaded: (customData.totalUploaded || 0) + uploadedFiles.length,
                lastUploadStatus: 'success',
                lastUploadMessage: `Successfully uploaded ${uploadedFiles.length} file(s) (${Math.round(totalSize / 1024)} KB)`,
                lastUploadTime: Date.now()
            });

            // Update manual input with the uploaded file paths for downstream processing
            const uploadSummary = {
                uploadedFiles,
                targetDirectory: customData.targetDirectory,
                totalFiles: uploadedFiles.length,
                totalSize,
                timestamp: Date.now()
            };
            updateSmartFolderManualInput(id, JSON.stringify(uploadSummary));

            console.log(`📁 Files uploaded successfully:`, uploadedFiles);

        } catch (error) {
            console.error('File upload error:', error);
            updateNodeCustomData(id, {
                lastUploadStatus: 'error',
                lastUploadMessage: error instanceof Error ? error.message : String(error),
                lastUploadTime: Date.now()
            });
        } finally {
            setIsUploading(false);
        }
    }, [id, customData, updateNodeCustomData, updateSmartFolderManualInput]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);

        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handlePathFocus = () => {
        setEditingPath(true);
        setLocalPath(customData.targetDirectory);
    };

    const handlePathBlur = (value: string) => {
        setEditingPath(false);
        updateNodeCustomData(id, {
            targetDirectory: value
        });
    };

    const handleExtensionToggle = (ext: string) => {
        const current = customData.allowedExtensions || [];
        const updated = current.includes(ext)
            ? current.filter(e => e !== ext)
            : [...current, ext];

        updateNodeCustomData(id, {
            allowedExtensions: updated
        });
    };

    const handleMaxSizeChange = (size: number) => {
        updateNodeCustomData(id, {
            maxFileSize: size
        });
    };

    const getStatusColor = () => {
        switch (customData.lastUploadStatus) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'uploading': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const formatFileSize = (sizeInMB: number) => {
        if (sizeInMB >= 1000) {
            return `${(sizeInMB / 1000).toFixed(1)}GB`;
        }
        return `${sizeInMB}MB`;
    };

    const commonExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mp3'];

    return (
        <div
            className="file-uploader-node"
            style={{
                background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                border: '3px solid #1565c0',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '350px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
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
                            setIsEditing(false);
                            updateSmartFolderLabel(id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setIsEditing(false);
                                updateSmartFolderLabel(id, e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            width: '200px'
                        }}
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        style={{
                            margin: 0,
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        📁 {nodeData.label}
                    </h3>
                )}
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(244, 67, 54, 0.8)',
                        border: 'none',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Target Directory Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Target Directory:
                </label>
                {editingPath ? (
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
                        onBlur={() => handlePathBlur(localPath)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePathBlur(localPath);
                            }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    />
                ) : (
                    <div
                        onClick={handlePathFocus}
                        style={{
                            padding: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            cursor: 'text',
                            fontSize: '12px',
                            minHeight: '20px',
                            wordBreak: 'break-all'
                        }}
                    >
                        {customData.targetDirectory || 'Click to set target directory...'}
                    </div>
                )}
            </div>

            {/* File Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragOver ? '#4caf50' : 'rgba(255, 255, 255, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    marginBottom: '12px',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                    {isUploading ? '⏳' : '📤'}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    Max size: {formatFileSize(customData.maxFileSize)}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isUploading || !customData.targetDirectory}
            />

            {/* File Extensions Filter */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Allowed Extensions (empty = all):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {commonExtensions.map((ext) => (
                        <button
                            key={ext}
                            onClick={() => handleExtensionToggle(ext)}
                            style={{
                                background: (customData.allowedExtensions || []).includes(ext)
                                    ? 'rgba(76, 175, 80, 0.8)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px'
                            }}
                        >
                            {ext}
                        </button>
                    ))}
                </div>
            </div>

            {/* Max File Size */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    Max File Size: {formatFileSize(customData.maxFileSize)}
                </label>
                <input
                    className="nodrag"
                    type="range"
                    min="1"
                    max="50000"
                    step="100"
                    value={customData.maxFileSize}
                    onChange={(e) => handleMaxSizeChange(parseInt(e.target.value))}
                    style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px'
                    }}
                />
            </div>

            {/* Overwrite Toggle */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={customData.overwriteExisting}
                        onChange={(e) => updateNodeCustomData(id, { overwriteExisting: e.target.checked })}
                        style={{ transform: 'scale(1.2)' }}
                    />
                    Overwrite existing files
                </label>
            </div>

            {/* Status Display */}
            {(customData.lastUploadStatus || customData.lastUploadMessage) && (
                <div style={{
                    padding: '8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                    }}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: getStatusColor()
                            }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {customData.lastUploadStatus?.toUpperCase()}
                        </span>
                    </div>
                    {customData.lastUploadMessage && (
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>
                            {customData.lastUploadMessage}
                        </div>
                    )}
                    {customData.totalUploaded && (
                        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                            📊 Total uploaded: {customData.totalUploaded} files
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded Files List */}
            {customData.uploadedFiles && customData.uploadedFiles.length > 0 && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                        📁 Recent Uploads:
                    </div>
                    {customData.uploadedFiles.slice(-5).map((file, index) => (
                        <div key={index} style={{ fontSize: '10px', opacity: 0.8 }}>
                            • {file.split('/').pop()}
                        </div>
                    ))}
                </div>
            )}

            {/* Output Display */}
            {nodeData.lastOutput && !nodeData.isExecuting && (
                <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    lineHeight: '1.3',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        color: '#4CAF50',
                        fontWeight: 'bold',
                        marginBottom: '4px'
                    }}>
                        📄 Upload Result
                    </div>
                    <div style={{
                        color: '#C8E6C9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {nodeData.lastOutput}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploaderNode; 