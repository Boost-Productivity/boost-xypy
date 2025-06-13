import { BaseNodeData } from '../../base/BaseNode.types';

export interface WebhookNodeData extends BaseNodeData {
    nodeType: 'webhook';
    customData: {
        inboxName: string;
        webhookUrl: string;
        lastData?: any;
        lastReceived?: string;
        autoExecute: boolean;
    };
} 