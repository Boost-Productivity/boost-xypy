import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import useStore from '../../../store';
import { LabelNodeData } from './LabelNode.types';

// Import the base SmartFolderNode for function mode
import SmartFolderNode from '../../base/SmartFolderNode';

const LabelNode: React.FC<NodeProps> = ({ id, data, ...props }) => {
    const [isEditing, setIsEditing] = useState(false);

    const {
        updateSmartFolderLabel,
        deleteSmartFolder,
        updateNodeCustomData,
    } = useStore();

    const nodeData = data as LabelNodeData;
    const customData = nodeData.customData || {
        mode: 'label',
        fontSize: 24,
        textColor: '#333333',
        backgroundColor: '#ffffff'
    };

    const handleToggleMode = () => {
        updateNodeCustomData(id, {
            customData: {
                ...customData,
                mode: customData.mode === 'label' ? 'function' : 'label'
            }
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleFontSizeChange = (newSize: number) => {
        updateNodeCustomData(id, {
            customData: {
                ...customData,
                fontSize: newSize
            }
        });
    };

    const handleColorChange = (newColor: string) => {
        updateNodeCustomData(id, {
            customData: {
                ...customData,
                textColor: newColor
            }
        });
    };

    const handleBackgroundChange = (newBg: string) => {
        updateNodeCustomData(id, {
            customData: {
                ...customData,
                backgroundColor: newBg
            }
        });
    };

    // If in function mode, render the base SmartFolderNode
    if (customData.mode === 'function') {
        return <SmartFolderNode id={id} data={data} {...props} />;
    }

    // Label mode rendering
    return (
        <div
            className="label-node"
            style={{
                background: customData.backgroundColor,
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '16px 24px',
                minWidth: '200px',
                maxWidth: '600px',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Invisible handles for connections */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ opacity: 0.3, width: '8px', height: '8px' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ opacity: 0.3, width: '8px', height: '8px' }}
            />

            {/* Controls */}
            <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                display: 'flex',
                gap: '4px',
                opacity: 0.7
            }}>
                {/* Mode toggle */}
                <button
                    onClick={handleToggleMode}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Toggle to function mode"
                >
                    ⚙
                </button>

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
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
            </div>

            {/* Edit controls (when editing) */}
            {isEditing && (
                <div style={{
                    marginBottom: '12px',
                    padding: '8px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Font Size:</label>
                        <input
                            type="range"
                            min="12"
                            max="72"
                            value={customData.fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <span>{customData.fontSize}px</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Text:</label>
                            <input
                                type="color"
                                value={customData.textColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                style={{ width: '40px', height: '24px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Background:</label>
                            <input
                                type="color"
                                value={customData.backgroundColor}
                                onChange={(e) => handleBackgroundChange(e.target.value)}
                                style={{ width: '40px', height: '24px' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditing(false)}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Main label content */}
            <div
                style={{
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => setIsEditing(true)}
            >
                {isEditing ? (
                    <input
                        type="text"
                        defaultValue={nodeData.label}
                        onBlur={(e) => {
                            updateSmartFolderLabel(id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateSmartFolderLabel(id, e.currentTarget.value);
                            }
                        }}
                        autoFocus
                        style={{
                            background: 'transparent',
                            border: '1px dashed #ccc',
                            color: customData.textColor,
                            fontSize: `${customData.fontSize}px`,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            padding: '4px'
                        }}
                    />
                ) : (
                    <h1
                        style={{
                            margin: 0,
                            fontSize: `${customData.fontSize}px`,
                            fontWeight: 'bold',
                            color: customData.textColor,
                            lineHeight: 1.2,
                            userSelect: 'none',
                            wordBreak: 'break-word'
                        }}
                    >
                        {nodeData.label}
                    </h1>
                )}
            </div>

            {/* Subtle mode indicator */}
            <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                fontSize: '10px',
                color: '#999',
                fontStyle: 'italic'
            }}>
                Label Mode
            </div>
        </div>
    );
};

export default LabelNode; 