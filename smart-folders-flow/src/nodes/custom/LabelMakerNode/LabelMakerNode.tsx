import React, { useEffect, useRef, useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { LabelMakerNodeData } from './LabelMakerNode.types';
import useStore from '../../../store';

// Import the base SmartFolderNode
import SmartFolderNode from '../../base/SmartFolderNode';

const LabelMakerNode: React.FC<NodeProps> = ({ id, data, ...props }) => {
    const nodeData = data as LabelMakerNodeData;
    const { addCustomNode, nodes, updateNodeCustomData, executeSmartFolder, updateSmartFolderManualInput, deleteSmartFolder } = useStore();
    const lastProcessedOutput = useRef<string>('');
    const [isEditing, setIsEditing] = useState(false);

    // Get custom data with defaults
    const customData = nodeData.customData || {
        mode: 'form',
        spacing: 80,
        startOffset: 150,
        labelWidth: 300,
        labelInputs: [''],
        labelFontSize: 24,
        labelTextColor: '#333333',
        labelBackgroundColor: '#ffffff',
        labelMaxWidth: 300,
    };

    // Watch for output changes and create Label nodes (for function mode)
    useEffect(() => {
        // Only process if in function mode and output has changed
        if (customData.mode === 'function' &&
            nodeData.lastOutput &&
            nodeData.lastOutput.trim() &&
            nodeData.lastOutput !== lastProcessedOutput.current &&
            !nodeData.isExecuting) {

            const lines = nodeData.lastOutput.split('\n').filter(line => line.trim());

            if (lines.length > 0) {
                createLabelNodes(lines);
                lastProcessedOutput.current = nodeData.lastOutput;
            }
        }
    }, [nodeData.lastOutput, nodeData.isExecuting, customData.mode]);

    const createLabelNodes = (labels: string[]) => {
        const currentNode = nodes.find(n => n.id === id);
        if (!currentNode) return;

        const spacing = customData.spacing || 80;
        const startOffset = customData.startOffset || 150;
        const labelWidth = customData.labelWidth || 300;

        // Create Label nodes for each line, positioned like post-it notes
        labels.forEach((line, index) => {
            const labelPosition = {
                x: currentNode.position.x + (index % 2 === 0 ? 0 : 20), // Slight offset for variety
                y: currentNode.position.y + startOffset + (index * spacing)
            };

            // Create Label node with the actual line text
            setTimeout(() => {
                const timestamp = Date.now() + index; // Ensure unique IDs
                const newLabelNode = {
                    id: `label_${timestamp}`,
                    type: 'label',
                    position: labelPosition,
                    data: {
                        nodeType: 'label',
                        label: line, // Use the actual line text
                        pythonFunction: 'def process(inputs):\n    # Label processing function\n    manual = inputs.get("manual", "")\n    return f"Label: {manual}"',
                        isExecuting: false,
                        lastOutput: '',
                        streamingLogs: '',
                        inputs: {},
                        manualInput: '',
                        customData: {
                            mode: 'label',
                            fontSize: customData.labelFontSize || 24,
                            textColor: customData.labelTextColor || '#333333',
                            backgroundColor: customData.labelBackgroundColor || '#ffffff',
                            maxWidth: customData.labelMaxWidth || labelWidth
                        }
                    }
                };

                // Add the node to the store
                const currentNodes = useStore.getState().nodes;
                useStore.setState({ nodes: [...currentNodes, newLabelNode] });
            }, index * 100); // Stagger creation for visual effect
        });

        console.log(`🏷️ Created ${labels.length} Label nodes from LabelMaker "${nodeData.label}"`);
    };

    const handleToggleMode = () => {
        updateNodeCustomData(id, {
            mode: customData.mode === 'form' ? 'function' : 'form'
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${nodeData.label}"?`)) {
            deleteSmartFolder(id);
        }
    };

    const handleAddLabelInput = () => {
        const currentInputs = customData.labelInputs || [''];
        updateNodeCustomData(id, {
            labelInputs: [...currentInputs, '']
        });
    };

    const handleUpdateLabelInput = (index: number, value: string) => {
        const currentInputs = customData.labelInputs || [''];
        const newInputs = [...currentInputs];
        newInputs[index] = value;
        updateNodeCustomData(id, {
            labelInputs: newInputs
        });
    };

    const handleRemoveLabelInput = (index: number) => {
        const currentInputs = customData.labelInputs || [''];
        if (currentInputs.length > 1) {
            const newInputs = currentInputs.filter((_, i) => i !== index);
            updateNodeCustomData(id, {
                labelInputs: newInputs
            });
        }
    };

    const handleCreateLabels = () => {
        const labels = (customData.labelInputs || []).filter(label => label.trim());
        if (labels.length > 0) {
            createLabelNodes(labels);
        }
    };

    const handleCreateFromFunction = () => {
        // Update manual input with current form inputs and execute
        const inputText = (customData.labelInputs || []).join('\n');
        updateSmartFolderManualInput(id, inputText);
        setTimeout(() => {
            executeSmartFolder(id);
        }, 100);
    };

    // Form Mode UI
    if (customData.mode === 'form') {
        return (
            <div className="label-maker-node" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #5a67d8',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                minWidth: '300px',
                color: 'white',
                padding: '16px'
            }}>
                <Handle type="target" position={Position.Top} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    {isEditing ? (
                        <input
                            type="text"
                            defaultValue={nodeData.label}
                            onBlur={(e) => {
                                updateNodeCustomData(id, { label: e.target.value });
                                setIsEditing(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateNodeCustomData(id, { label: e.currentTarget.value });
                                    setIsEditing(false);
                                }
                            }}
                            autoFocus
                            style={{
                                background: 'rgba(255,255,255,0.9)',
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                flex: 1,
                                marginRight: '8px'
                            }}
                        />
                    ) : (
                        <h3 onClick={() => setIsEditing(true)} style={{
                            flex: 1,
                            margin: 0,
                            cursor: 'pointer',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}>
                            🏷️ {nodeData.label}
                        </h3>
                    )}

                    <div style={{ display: 'flex', gap: '4px' }}>
                        {/* Mode toggle button */}
                        <button
                            onClick={handleToggleMode}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Switch to function mode"
                        >
                            ⚙️
                        </button>

                        {/* Delete button */}
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
                            title="Delete node"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Form inputs */}
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                        Label Texts:
                    </label>
                    {(customData.labelInputs || ['']).map((labelInput, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
                            <input
                                type="text"
                                value={labelInput}
                                onChange={(e) => handleUpdateLabelInput(index, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLabelInput();
                                        // Focus the new input after a brief delay
                                        setTimeout(() => {
                                            const inputs = document.querySelectorAll('.label-input');
                                            const nextInput = inputs[index + 1] as HTMLInputElement;
                                            if (nextInput) nextInput.focus();
                                        }, 50);
                                    }
                                }}
                                placeholder={`Label ${index + 1}`}
                                style={{
                                    flex: 1,
                                    padding: '6px 8px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.95)',
                                    color: '#333',
                                    fontSize: '12px'
                                }}
                                className="nodrag label-input"
                            />
                            {(customData.labelInputs || []).length > 1 && (
                                <button
                                    onClick={() => handleRemoveLabelInput(index)}
                                    style={{
                                        background: '#dc3545',
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
                                    title="Remove this input"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add button */}
                    <button
                        onClick={handleAddLabelInput}
                        style={{
                            background: 'rgba(72, 187, 120, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '12px'
                        }}
                        title="Add another label input"
                    >
                        + Add Label
                    </button>
                </div>

                {/* Label Styling Controls */}
                <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                        Label Styling:
                    </label>

                    {/* Font Size */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                            Font Size: {customData.labelFontSize || 24}px
                        </label>
                        <input
                            type="range"
                            min="12"
                            max="800"
                            value={customData.labelFontSize || 24}
                            onChange={(e) => updateNodeCustomData(id, { labelFontSize: parseInt(e.target.value) })}
                            style={{ width: '100%' }}
                            className="nodrag"
                        />
                    </div>

                    {/* Max Width */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                            Max Width: {customData.labelMaxWidth || 300}px
                        </label>
                        <input
                            type="range"
                            min="150"
                            max="600"
                            value={customData.labelMaxWidth || 300}
                            onChange={(e) => updateNodeCustomData(id, { labelMaxWidth: parseInt(e.target.value) })}
                            style={{ width: '100%' }}
                            className="nodrag"
                        />
                    </div>

                    {/* Colors */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                                Text Color:
                            </label>
                            <input
                                type="color"
                                value={customData.labelTextColor || '#333333'}
                                onChange={(e) => updateNodeCustomData(id, { labelTextColor: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '32px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                className="nodrag"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                                Background:
                            </label>
                            <input
                                type="color"
                                value={customData.labelBackgroundColor || '#ffffff'}
                                onChange={(e) => updateNodeCustomData(id, { labelBackgroundColor: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '32px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                className="nodrag"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: `${customData.labelFontSize || 24}px`,
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        color: customData.labelTextColor || '#333333',
                        backgroundColor: customData.labelBackgroundColor || '#ffffff',
                        maxWidth: `${Math.min(customData.labelMaxWidth || 300, 250)}px`,
                        textAlign: 'center',
                        border: '1px solid rgba(0,0,0,0.1)',
                        wordBreak: 'break-word'
                    }}>
                        Preview Label
                    </div>
                </div>

                {/* Create button */}
                <button
                    onClick={handleCreateLabels}
                    style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        width: '100%',
                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                    }}
                    title="Create label nodes from inputs"
                >
                    🏷️ Create Labels
                </button>

                <Handle type="source" position={Position.Bottom} />
            </div>
        );
    }

    // Function Mode UI - use the base SmartFolderNode
    const customStyles = `
        .label-maker-node-${id} .node-header h3 {
            color: white !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .label-maker-node-${id} .node-content {
            color: white;
        }
        .label-maker-node-${id} .function-display,
        .label-maker-node-${id} .input-textarea,
        .label-maker-node-${id} textarea {
            background: rgba(255,255,255,0.95) !important;
            color: #333 !important;
            border-radius: 6px;
        }
        .label-maker-node-${id} .execute-btn {
            background: #48bb78 !important;
            color: white !important;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
        }
        .label-maker-node-${id} .execute-btn:hover {
            background: #38a169 !important;
            transform: translateY(-1px);
        }
        .label-maker-node-${id} .output-display {
            background: rgba(255,255,255,0.1) !important;
            color: #e2e8f0 !important;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .label-maker-node-${id} .mode-toggle-btn {
            background: #007bff !important;
        }
    `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className={`label-maker-node label-maker-node-${id} smart-folder-node`} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #5a67d8',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            }}>
                <SmartFolderNode
                    id={id}
                    data={{
                        ...nodeData,
                        label: `🏷️ ${nodeData.label}` // Add icon to distinguish it
                    }}
                    {...props}
                />

                {/* Custom mode toggle button overlay */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '40px',
                    zIndex: 10
                }}>
                    <button
                        onClick={handleToggleMode}
                        style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Switch to form mode"
                    >
                        📝
                    </button>
                </div>
            </div>
        </>
    );
};

export default LabelMakerNode; 