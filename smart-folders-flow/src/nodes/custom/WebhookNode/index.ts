import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import WebhookNode from './WebhookNode';
import { WebhookNodeData } from './WebhookNode.types';

export const webhookNodeConfig: NodeTypeConfig = {
    type: 'webhook',
    displayName: 'Webhook Inbox',
    description: 'Receives data from external webhooks (Supabase, etc.)',
    icon: '📨',
    color: '#3b82f6',
    component: WebhookNode,
    defaultData: {
        label: 'Webhook',
        pythonFunction: `def process(inputs):
    # Process webhook data from Supabase or other sources
    import json
    
    # Get webhook data from manual input (JSON string)
    webhook_data_str = inputs.get("manual", "{}")
    
    try:
        # Parse the webhook data
        webhook_data = json.loads(webhook_data_str) if webhook_data_str else {}
        
        # Example processing - customize for your needs
        if isinstance(webhook_data, dict):
            # Extract common webhook fields
            result = {
                "received_at": webhook_data.get("timestamp", "unknown"),
                "data_keys": list(webhook_data.keys()),
                "processed_data": webhook_data
            }
            
            # Custom processing examples:
            if "record" in webhook_data:
                # Supabase webhook format
                result["supabase_record"] = webhook_data["record"]
                result["table"] = webhook_data.get("table", "unknown")
                result["event_type"] = webhook_data.get("type", "unknown")
            
            if "user" in webhook_data:
                # User-related webhook
                result["user_info"] = webhook_data["user"]
            
            return json.dumps(result, indent=2)
        else:
            return f"Raw webhook data: {webhook_data}"
            
    except json.JSONDecodeError:
        return f"Non-JSON webhook data: {webhook_data_str}"`,
        manualInput: '{}',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'webhook' as const,
        customData: {
            inboxName: '',
            webhookUrl: '',
            autoExecute: true
        }
    } as WebhookNodeData
};

export const webhookNodeFactory: NodeFactory = (position) => {
    return {
        id: `${Date.now()}_webhook`,
        type: 'webhook',
        position: {
            x: position.x - 150,
            y: position.y - 100,
        },
        data: {
            label: `Webhook ${Date.now()}`,
            pythonFunction: `def process(inputs):
    # Process webhook data from Supabase or other sources
    import json
    
    # Get webhook data from manual input (JSON string)
    webhook_data_str = inputs.get("manual", "{}")
    
    try:
        # Parse the webhook data
        webhook_data = json.loads(webhook_data_str) if webhook_data_str else {}
        
        # Example processing - customize for your needs
        if isinstance(webhook_data, dict):
            # Extract common webhook fields
            result = {
                "received_at": webhook_data.get("timestamp", "unknown"),
                "data_keys": list(webhook_data.keys()),
                "processed_data": webhook_data
            }
            
            # Custom processing examples:
            if "record" in webhook_data:
                # Supabase webhook format
                result["supabase_record"] = webhook_data["record"]
                result["table"] = webhook_data.get("table", "unknown")
                result["event_type"] = webhook_data.get("type", "unknown")
            
            if "user" in webhook_data:
                # User-related webhook
                result["user_info"] = webhook_data["user"]
            
            return json.dumps(result, indent=2)
        else:
            return f"Raw webhook data: {webhook_data}"
            
    except json.JSONDecodeError:
        return f"Non-JSON webhook data: {webhook_data_str}"`,
            manualInput: '{}',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'webhook',
            customData: {
                inboxName: '',
                webhookUrl: '',
                autoExecute: true
            }
        } as BaseNodeData,
    };
}; 