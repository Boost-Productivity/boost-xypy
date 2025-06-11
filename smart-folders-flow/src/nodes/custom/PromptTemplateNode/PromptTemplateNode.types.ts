import { BaseNodeData } from '../../base/BaseNode.types';

export interface PromptTemplateNodeData extends BaseNodeData {
    nodeType: 'promptTemplate';
    customData: {
        template: string; // Prompt template with {{variable}} placeholders
        variables: { [key: string]: string }; // Variable values
        temperature: number;
        top_p: number;
        top_k: number;
        max_tokens: number;
        model: string;
        system_prompt: string;
        stop_sequences: string;
    };
} 