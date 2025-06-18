import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { AnthropicNodeData } from './AnthropicNode.types';
import AnthropicNode from './AnthropicNode';

export const anthropicNodeConfig: NodeTypeConfig = {
    type: 'anthropic',
    displayName: 'Anthropic Claude',
    description: 'AI Assistant powered by Anthropic Claude',
    component: AnthropicNode,
    defaultData: {
        nodeType: 'anthropic',
        label: 'Claude AI',
        pythonFunction: `def process(inputs):
    import anthropic
    import os
    
    # Get API key - check inputs first, then environment variables
    api_key = inputs.get("api_key")
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        return "ERROR: Anthropic API key required. Please set it in the node, provide via inputs, or set ANTHROPIC_API_KEY environment variable."
    
    prompt = inputs.get("prompt", inputs.get("manual", ""))
    if not prompt:
        return "ERROR: No prompt provided. Please add 'prompt' to inputs."
    
    model = inputs.get("model", "claude-3-5-sonnet-20241022")
    max_tokens = inputs.get("max_tokens", 1000)
    
    log_progress(f"🤖 Asking Claude ({model})...")
    log_progress(f"📝 Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    
    try:
        # Create Anthropic client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Make API call
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extract response text
        result = response.content[0].text
        log_progress(f"✅ Response received ({len(result)} characters)")
        
        return result
        
    except Exception as e:
        error_msg = f"❌ Anthropic API Error: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '{"prompt": "Hello! How can you help me today?"}',
    },
    icon: '🤖',
    color: '#f97316'
};

export const anthropicNodeFactory: NodeFactory = (position, customData) => {
    return {
        id: Date.now().toString(),
        type: 'anthropic',
        position: {
            x: position.x - 160, // Center the node
            y: position.y - 100,
        },
        data: {
            ...anthropicNodeConfig.defaultData,
            label: `Claude ${Date.now()}`, // Unique label
            ...customData
        } as AnthropicNodeData,
    };
};

export default AnthropicNode; 