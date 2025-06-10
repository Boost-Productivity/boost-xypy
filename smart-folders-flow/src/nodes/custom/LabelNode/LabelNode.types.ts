import { BaseNodeData } from '../../base/BaseNode.types';

export interface LabelNodeData extends BaseNodeData {
    nodeType: 'label';
    customData: {
        mode: 'label' | 'function'; // Toggle between large label and function node
        fontSize: number;
        textColor: string;
        backgroundColor: string;
        maxWidth: number;
    };
} 