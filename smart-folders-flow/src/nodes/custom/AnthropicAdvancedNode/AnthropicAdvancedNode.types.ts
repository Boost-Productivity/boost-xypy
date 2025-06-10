import { BaseNodeData } from '../../base/BaseNode.types';

export interface AnthropicAdvancedNodeData extends BaseNodeData {
    nodeType: 'anthropicAdvanced';
    customData?: {
        temperature: number;
        top_p: number;
        top_k: number;
        max_tokens: number;
        model: string;
        system_prompt: string;
        stop_sequences: string;
    };
} 