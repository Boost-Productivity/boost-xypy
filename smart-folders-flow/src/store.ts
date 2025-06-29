import { create } from 'zustand';
import {
    Node,
    Edge,
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
    Connection,
    addEdge,
    OnSelectionChangeFunc,
} from '@xyflow/react';
import { BaseNodeData } from './nodes/base/BaseNode.types';

// Helper function to get API base URL
const getApiBaseUrl = (): string => {
    // If we're running on localhost, use localhost API
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // Otherwise, use the same hostname as the frontend with port 8000
    return `http://${window.location.hostname}:8000`;
};

export interface SmartFolderData extends BaseNodeData {
    // Legacy compatibility - this interface extends BaseNodeData
}

export type SmartFolderNode = Node<SmartFolderData, 'smartFolder'>;

export interface RFState {
    nodes: Node[];
    edges: Edge[];
    selectedNodes: Node[];
    selectedEdges: Edge[];
    copiedNodes: Node[]; // Store for copied nodes
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    onSelectionChange: OnSelectionChangeFunc;
    addSmartFolder: (position: { x: number; y: number }) => void;
    addCustomNode: (type: string, position: { x: number; y: number }, customData?: any) => void;
    deleteSmartFolder: (nodeId: string) => void;
    deleteEdge: (edgeId: string) => void;
    deleteSelectedElements: () => void;
    executeSmartFolder: (nodeId: string, inputs?: Record<string, any>) => void;
    executeSelectedNodes: () => void;
    copySelectedNodes: () => void;
    pasteNodes: (mousePosition?: { x: number; y: number }) => void;
    cancelExecution: (nodeId: string) => void;
    updateSmartFolderFunction: (nodeId: string, pythonFunction: string) => void;
    updateSmartFolderLabel: (nodeId: string, label: string) => void;
    updateSmartFolderManualInput: (nodeId: string, input: string) => void;
    updateNodeInput: (nodeId: string, sourceNodeId: string, value: string, sourceLabel: string) => void;
    updateNodeCustomData: (nodeId: string, customData: Record<string, any>) => void;
    saveFlow: () => Promise<void>;
    loadFlow: () => Promise<void>;
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: string | null;
}

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'smartFolder',
        position: { x: 200, y: 50 },
        data: {
            label: 'Text Generator',
            pythonFunction: 'def process(inputs):\n    # This node generates text that other nodes can use\n    manual = inputs.get("manual", "hello world")\n    return manual.upper()',
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: 'hello world',
            nodeType: 'smartFolder',
        },
    },
    {
        id: '2',
        type: 'smartFolder',
        position: { x: 600, y: 50 },
        data: {
            label: 'Word Counter',
            pythonFunction: 'def process(inputs):\n    # This node counts words and can be combined with other inputs\n    manual = inputs.get("manual", "sample text")\n    count = len(manual.split())\n    return f"Word count: {count}"',
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: 'sample text',
            nodeType: 'smartFolder',
        },
    },
    {
        id: '3',
        type: 'smartFolder',
        position: { x: 400, y: 250 },
        data: {
            label: 'Text Combiner',
            pythonFunction: 'def process(inputs):\n    # This node combines multiple inputs from connected nodes\n    result = "Combined inputs:\\n"\n    for key, value in inputs.items():\n        result += f"- {key}: {value}\\n"\n    return result',
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: '',
            nodeType: 'smartFolder',
        },
    },
];

const initialEdges: Edge[] = [
    {
        id: 'e1-3',
        source: '1',
        target: '3',
        type: 'smoothstep',
    },
    {
        id: 'e2-3',
        source: '2',
        target: '3',
        type: 'smoothstep',
    },
];

// Enhanced execution function with cancellation support
const executePythonFunctionWithLogging = async (
    pythonCode: string,
    input: string,
    onUpdate: (logs: string, output?: string) => void,
    onSessionStart?: (sessionId: string) => void
): Promise<string> => {
    try {
        // Start execution with logging (now returns immediately)
        const response = await fetch(`${getApiBaseUrl()}/api/execute/logging`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function_code: pythonCode,
                input_value: input,
                timeout: 600,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.log_file_id) {
            // Notify caller of session ID for cancellation
            if (onSessionStart) {
                onSessionStart(result.log_file_id);
            }

            let position = 0;
            let fullLogs = '';
            let finalOutput = '';
            let isComplete = false;

            // Start polling immediately and continuously
            const startPolling = () => {
                const pollLogs = async () => {
                    try {
                        const logResponse = await fetch(`${getApiBaseUrl()}/api/logs/${result.log_file_id}?last_position=${position}`);
                        const logData = await logResponse.json();

                        if (logData.content) {
                            fullLogs += logData.content;
                            position = logData.position;

                            // Check if we have final output
                            if (fullLogs.includes('--- FINAL RESULT ---')) {
                                const parts = fullLogs.split('--- FINAL RESULT ---');
                                const logs = parts[0];
                                finalOutput = parts[1]?.replace('✅ EXECUTION COMPLETE\n', '').replace('🚫 EXECUTION CANCELLED\n', '').trim() || '';
                                onUpdate(logs, finalOutput);
                                isComplete = true;
                                return finalOutput;
                            } else if (fullLogs.includes('--- ERROR ---')) {
                                const parts = fullLogs.split('--- ERROR ---');
                                const logs = parts[0];
                                finalOutput = `Error: ${parts[1]?.replace('❌ EXECUTION FAILED\n', '').trim() || 'Unknown error'}`;
                                onUpdate(logs, finalOutput);
                                isComplete = true;
                                return finalOutput;
                            } else {
                                // Just update logs, no final output yet
                                onUpdate(fullLogs);
                            }
                        }

                        // Continue polling if not complete
                        if (!isComplete) {
                            setTimeout(pollLogs, 500); // Poll every 500ms
                        }

                    } catch (error) {
                        console.error('Failed to poll logs:', error);
                        isComplete = true;
                    }
                };

                pollLogs();
            };

            // Start polling immediately
            startPolling();

            // Wait for completion
            return new Promise((resolve) => {
                const checkComplete = () => {
                    if (isComplete) {
                        resolve(finalOutput);
                    } else {
                        setTimeout(checkComplete, 100);
                    }
                };
                checkComplete();
            });
        }

        // Fallback if no log file ID
        return result.message || 'Execution started';

    } catch (error) {
        console.error('Logging execution failed:', error);
        throw error;
    }
};

// Cancel execution function
const cancelPythonExecution = async (sessionId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/cancel/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to cancel execution:', response.status);
            return false;
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error cancelling execution:', error);
        return false;
    }
};

// Auto-save with debouncing
let saveTimeout: NodeJS.Timeout | null = null;

const useStore = create<RFState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodes: [],
    selectedEdges: [],
    copiedNodes: [],
    isLoading: false,
    isSaving: false,
    lastSaved: null,

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    onSelectionChange: ({ nodes, edges }) => {
        set({
            selectedNodes: nodes,
            selectedEdges: edges,
        });
        console.log(`🔍 Selection: ${nodes.length} nodes, ${edges.length} edges`);
    },

    deleteSelectedElements: () => {
        const { selectedNodes, selectedEdges, nodes, edges } = get();

        if (selectedNodes.length === 0 && selectedEdges.length === 0) {
            console.log('No elements selected for deletion');
            return;
        }

        const selectedNodeIds = selectedNodes.map(n => n.id);
        const selectedEdgeIds = selectedEdges.map(e => e.id);

        // Remove selected nodes
        const updatedNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));

        // Remove selected edges and edges connected to deleted nodes
        const updatedEdges = edges.filter(e =>
            !selectedEdgeIds.includes(e.id) &&
            !selectedNodeIds.includes(e.source) &&
            !selectedNodeIds.includes(e.target)
        );

        set({
            nodes: updatedNodes,
            edges: updatedEdges,
            selectedNodes: [],
            selectedEdges: [],
        });

        console.log(`🗑️ Deleted ${selectedNodes.length} nodes and ${edges.length - updatedEdges.length} edges`);

        // Auto-save after deletion
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    executeSelectedNodes: async () => {
        const { selectedNodes } = get();

        if (selectedNodes.length === 0) {
            console.log('No nodes selected for execution');
            return;
        }

        console.log(`🚀 Executing ${selectedNodes.length} selected nodes`);

        // Execute all selected nodes in parallel
        const executions = selectedNodes.map(node =>
            get().executeSmartFolder(node.id)
        );

        try {
            await Promise.all(executions);
            console.log('✅ All selected nodes executed successfully');
        } catch (error) {
            console.error('❌ Error executing selected nodes:', error);
        }
    },

    addSmartFolder: (position) => {
        const newNode: Node = {
            id: Date.now().toString(),
            type: 'smartFolder',
            position: {
                x: position.x - 150, // Center the node horizontally (half of node width ~300px)
                y: position.y - 75,  // Center the node vertically (half of node height ~150px)
            },
            data: {
                label: `Smart Folder ${get().nodes.length + 1}`,
                pythonFunction: 'def process(inputs):\n    # Access inputs with inputs.get("key", "default")\n    manual = inputs.get("manual", "")\n    return f"Processed: {manual}"',
                isExecuting: false,
                lastOutput: '',
                streamingLogs: '',
                inputs: {},
                manualInput: '',
                nodeType: 'smartFolder',
            },
        };
        set({
            nodes: [...get().nodes, newNode],
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    addCustomNode: (type, position, customData) => {
        const { nodeRegistry } = require('./nodes/NodeRegistry');
        const newNode = nodeRegistry.createNode(type, position, customData);

        if (newNode) {
            set({
                nodes: [...get().nodes, newNode],
            });

            // Auto-save after 2 seconds of no changes
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                get().saveFlow();
            }, 2000);
        }
    },

    deleteSmartFolder: async (nodeId) => {
        const { nodes, edges } = get();

        // Find the node to get its label for logging
        const nodeToDelete = nodes.find(n => n.id === nodeId);
        const nodeLabel = nodeToDelete ? (nodeToDelete.data as SmartFolderData).label : 'Unknown';

        // Remove the node
        const updatedNodes = nodes.filter(n => n.id !== nodeId);

        // Remove all edges connected to this node
        const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);

        // Count removed connections
        const removedEdgesCount = edges.length - updatedEdges.length;

        set({
            nodes: updatedNodes,
            edges: updatedEdges,
        });

        console.log(`🗑️ Deleted "${nodeLabel}" and ${removedEdgesCount} connections`);

        // Auto-save after deletion
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    executeSmartFolder: async (nodeId, inputs) => {
        const { nodes, edges } = get();

        // Find the node
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Set executing state
        set({
            nodes: nodes.map(n =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: true, lastOutput: 'Starting...', sessionId: undefined } }
                    : n
            ),
        });

        try {
            // Execute with file-based logging and polling
            const nodeData = node.data as SmartFolderData;

            // Prepare inputs for execution
            let executionInputs: Record<string, any> = {};

            // Add manual input if present
            if (nodeData.manualInput) {
                executionInputs['manual'] = nodeData.manualInput;
            }

            // Add all connected inputs
            Object.entries(nodeData.inputs || {}).forEach(([sourceId, inputData]) => {
                executionInputs[inputData.nodeLabel || sourceId] = inputData.value;
            });

            // Merge node's own customData into execution inputs
            executionInputs = { ...executionInputs, ...nodeData.customData };

            // If inputs parameter provided, use that instead
            if (inputs) {
                executionInputs = inputs;
                console.log('Executing with provided inputs:', inputs);
            } else {
                console.log('Executing without provided inputs - using gathered inputs:', executionInputs);
            }

            const output = await executePythonFunctionWithLogging(
                nodeData.pythonFunction,
                JSON.stringify(executionInputs),
                (logs, output) => {
                    // Update UI with progressive output
                    set({
                        nodes: get().nodes.map(n =>
                            n.id === nodeId
                                ? { ...n, data: { ...n.data as SmartFolderData, streamingLogs: logs, lastOutput: output } }
                                : n
                        ),
                    });
                },
                (sessionId) => {
                    // Store session ID for cancellation
                    set({
                        nodes: get().nodes.map(n =>
                            n.id === nodeId
                                ? { ...n, data: { ...n.data as SmartFolderData, sessionId } }
                                : n
                        ),
                    });
                }
            );

            // Update the node with final output
            set({
                nodes: get().nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: output, sessionId: undefined } }
                        : n
                ),
            });

        } catch (error) {
            console.error('Execution failed:', error);
            // Set error state
            set({
                nodes: get().nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, sessionId: undefined } }
                        : n
                ),
            });
        }

        // Find all subscribers and continue with the chain...
        const subscriberEdges = edges.filter(e => e.source === nodeId);
        const currentNode = get().nodes.find(n => n.id === nodeId);
        const currentNodeData = currentNode?.data as SmartFolderData;

        for (const edge of subscriberEdges) {
            const subscriberNode = nodes.find(n => n.id === edge.target);
            if (subscriberNode && currentNodeData) {
                const finalOutput = currentNodeData.lastOutput || '';

                // Update the subscriber's input with the output from this node
                get().updateNodeInput(edge.target, nodeId, finalOutput, currentNodeData.label);

                // Execute the subscriber after a short delay
                setTimeout(() => {
                    get().executeSmartFolder(edge.target);
                }, 500);
            }
        }

        // Auto-save after execution
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    updateSmartFolderFunction: (nodeId, pythonFunction) => {
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data as SmartFolderData, pythonFunction } }
                    : n
            ),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    updateSmartFolderLabel: (nodeId, label) => {
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data as SmartFolderData, label } }
                    : n
            ),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    updateSmartFolderManualInput: (nodeId, input) => {
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data as SmartFolderData, manualInput: input } }
                    : n
            ),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    updateNodeInput: (nodeId, sourceNodeId, value, sourceLabel) => {
        set({
            nodes: get().nodes.map(n => {
                if (n.id === nodeId) {
                    const nodeData = n.data as SmartFolderData;
                    const currentInputs = nodeData.inputs || {};
                    return {
                        ...n,
                        data: {
                            ...nodeData,
                            inputs: {
                                ...currentInputs,
                                [sourceNodeId]: {
                                    value,
                                    timestamp: Date.now(),
                                    nodeLabel: sourceLabel
                                }
                            }
                        }
                    };
                }
                return n;
            }),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    updateNodeCustomData: (nodeId, customData) => {
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId
                    ? {
                        ...n,
                        data: {
                            ...n.data as SmartFolderData,
                            customData: {
                                ...(n.data as SmartFolderData).customData,
                                ...customData
                            }
                        }
                    }
                    : n
            ),
        });

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    saveFlow: async () => {
        const { nodes, edges } = get();
        set({ isSaving: true });

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/flows/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    flow_data: {
                        nodes,
                        edges,
                    },
                    flow_id: 'default',
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                set({
                    lastSaved: new Date().toISOString(),
                    isSaving: false
                });
                console.log('✅ Flow saved successfully');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to save flow:', error);
            set({ isSaving: false });
        }
    },

    loadFlow: async () => {
        set({ isLoading: true });

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/flows/load/default?t=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.nodes.length > 0) {
                set({
                    nodes: result.nodes,
                    edges: result.edges,
                    lastSaved: result.saved_at,
                    isLoading: false,
                });
                console.log('✅ Flow loaded successfully');
            } else {
                // No saved flow found, use initial data
                set({
                    nodes: initialNodes,
                    edges: initialEdges,
                    isLoading: false,
                });
                console.log('ℹ️ No saved flow found, using default');
            }
        } catch (error) {
            console.error('❌ Failed to load flow:', error);
            // Fallback to initial data
            set({
                nodes: initialNodes,
                edges: initialEdges,
                isLoading: false,
            });
        }
    },

    deleteEdge: (edgeId) => {
        const { edges } = get();

        // Remove the edge
        const updatedEdges = edges.filter(e => e.id !== edgeId);

        set({
            edges: updatedEdges,
        });

        console.log(`🗑️ Deleted connection: ${edgeId}`);

        // Auto-save after deletion
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },

    cancelExecution: async (nodeId) => {
        const { nodes } = get();

        // Find the node
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const nodeData = node.data as SmartFolderData;

        // If no session ID, just reset UI state (soft cancel)
        if (!nodeData.sessionId) {
            set({
                nodes: nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: 'Execution reset', sessionId: undefined } }
                        : n
                ),
            });
            return;
        }

        // Set cancelling state
        set({
            nodes: nodes.map(n =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data as SmartFolderData, lastOutput: 'Cancelling...' } }
                    : n
            ),
        });

        try {
            // Try to cancel execution on backend
            const success = await cancelPythonExecution(nodeData.sessionId);

            if (success) {
                // Update the node with cancellation status
                set({
                    nodes: get().nodes.map(n =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: 'Execution cancelled', sessionId: undefined } }
                            : n
                    ),
                });
            } else {
                // Fallback to soft cancel
                set({
                    nodes: get().nodes.map(n =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: 'Execution reset (cancel failed)', sessionId: undefined } }
                            : n
                    ),
                });
            }
        } catch (error) {
            console.error('Error cancelling execution:', error);
            // Fallback to soft cancel
            set({
                nodes: get().nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data as SmartFolderData, isExecuting: false, lastOutput: 'Execution reset (cancel error)', sessionId: undefined } }
                        : n
                ),
            });
        }
    },

    copySelectedNodes: () => {
        const { selectedNodes } = get();

        if (selectedNodes.length === 0) {
            console.log('No nodes selected to copy');
            return;
        }

        set({
            copiedNodes: [...selectedNodes], // Deep copy
        });

        console.log(`📋 Copied ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`);
    },

    pasteNodes: (mousePosition) => {
        const { copiedNodes, nodes } = get();

        if (copiedNodes.length === 0) {
            console.log('No nodes to paste');
            return;
        }

        // Calculate center of copied nodes for relative positioning
        const minX = Math.min(...copiedNodes.map(n => n.position.x));
        const minY = Math.min(...copiedNodes.map(n => n.position.y));

        // Default offset position if no mouse position provided
        const pasteOffset = { x: minX + 50, y: minY + 50 };
        const targetPosition = mousePosition || pasteOffset;

        // Generate new nodes with unique IDs and relative positioning
        const timestamp = Date.now();
        const newNodes = copiedNodes.map((node, index) => {
            const relativeX = node.position.x - minX;
            const relativeY = node.position.y - minY;

            return {
                ...node,
                id: `${timestamp}_${index}`, // Unique ID for each pasted node
                position: {
                    x: targetPosition.x + relativeX,
                    y: targetPosition.y + relativeY,
                },
                data: {
                    ...node.data,
                    // Update label to indicate it's a copy
                    label: `${node.data.label} (Copy)`,
                    // Reset execution state for pasted nodes
                    isExecuting: false,
                    lastOutput: '',
                    streamingLogs: '',
                    inputs: {}, // Clear connected inputs for pasted nodes
                },
            };
        });

        set({
            nodes: [...nodes, ...newNodes],
            selectedNodes: newNodes, // Select the newly pasted nodes
        });

        console.log(`📌 Pasted ${newNodes.length} node${newNodes.length > 1 ? 's' : ''}`);

        // Auto-save after 2 seconds of no changes
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            get().saveFlow();
        }, 2000);
    },
}));

// Load flow on app startup
useStore.getState().loadFlow();

export default useStore;
