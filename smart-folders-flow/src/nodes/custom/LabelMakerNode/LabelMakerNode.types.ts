import { BaseNodeData } from '../../base/BaseNode.types';

export interface LabelMakerNodeData extends BaseNodeData {
    nodeType: 'labelMaker';
    customData?: {
        mode?: 'form' | 'function'; // Add mode switching like LabelNode
        spacing?: number; // Vertical spacing between created labels
        startOffset?: number; // How far below to start placing labels
        labelWidth?: number; // Width of created label nodes
        autoExecute?: boolean; // Whether to auto-execute when input changes
        labelInputs?: string[]; // Array of label text inputs for form mode
        // Label styling properties
        labelFontSize?: number; // Font size for created labels
        labelTextColor?: string; // Text color for created labels
        labelBackgroundColor?: string; // Background color for created labels
        labelMaxWidth?: number; // Max width for created labels
    };
} 