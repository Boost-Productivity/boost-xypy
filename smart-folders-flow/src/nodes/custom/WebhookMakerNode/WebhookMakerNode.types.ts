import { BaseNodeData } from '../../base/BaseNode.types';

export interface WebhookMakerNodeData extends BaseNodeData {
    nodeType: 'webhookMaker';
    customData?: {
        mode?: 'form' | 'function'; // Form mode for manual input, function mode for processing
        spacing?: number; // Vertical spacing between created webhook nodes
        startOffset?: number; // How far below to start placing webhook nodes
        webhookWidth?: number; // Width of created webhook nodes
        autoExecute?: boolean; // Whether to auto-execute when input changes
        webhookInputs?: string[]; // Array of webhook name inputs for form mode
        baseUrl?: string; // Base URL for webhook endpoints
    };
} 