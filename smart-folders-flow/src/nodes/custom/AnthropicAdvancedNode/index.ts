import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { AnthropicAdvancedNodeData } from './AnthropicAdvancedNode.types';
import AnthropicAdvancedNode from './AnthropicAdvancedNode';

export const anthropicAdvancedNodeConfig: NodeTypeConfig = {
    type: 'anthropicAdvanced',
    displayName: 'Claude Pro',
    description: 'Advanced Anthropic Claude with full configuration',
    component: AnthropicAdvancedNode,
    defaultData: {
        nodeType: 'anthropicAdvanced',
        label: 'Claude Pro',
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
    
    # Advanced parameters with defaults
    model = inputs.get("model", "claude-sonnet-4-20250514")
    temperature = inputs.get("temperature", 0.7)
    top_p = inputs.get("top_p", 1.0)
    top_k = inputs.get("top_k", 40)
    max_tokens = inputs.get("max_tokens", 1000)
    system_prompt = inputs.get("system_prompt", "")
    stop_sequences = inputs.get("stop_sequences", [])
    
    log_progress(f"🧠 Asking Claude Pro ({model})")
    log_progress(f"⚙️ Temperature: {temperature}, Top P: {top_p}, Top K: {top_k}")
    log_progress(f"📝 Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    
    if system_prompt:
        log_progress(f"🎯 System: {system_prompt[:50]}{'...' if len(system_prompt) > 50 else ''}")
    
    try:
        # Create Anthropic client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Prepare message parameters
        message_params = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        # Add optional parameters
        if system_prompt:
            message_params["system"] = system_prompt
            
        if stop_sequences and len(stop_sequences) > 0:
            message_params["stop_sequences"] = stop_sequences
        
        log_progress("🚀 Making API call...")
        
        # Make API call
        response = client.messages.create(**message_params)
        
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
        manualInput: '{"prompt": "Write a creative story about a robot learning to paint"}',
        customData: {
            temperature: 0.7,
            top_p: 1.0,
            top_k: 40,
            max_tokens: 1000,
            model: 'claude-sonnet-4-20250514',
            system_prompt: 'You are a creative and helpful AI assistant.',
            stop_sequences: ''
        }
    },
    icon: '🧠',
    color: '#8b5cf6'
};

export const anthropicAdvancedNodeFactory: NodeFactory = (position, customData) => {
    return {
        id: Date.now().toString(),
        type: 'anthropicAdvanced',
        position: {
            x: position.x - 190, // Center the wider node
            y: position.y - 120,
        },
        data: {
            ...anthropicAdvancedNodeConfig.defaultData,
            label: `Claude Pro ${Date.now()}`, // Unique label
            ...customData
        } as AnthropicAdvancedNodeData,
    };
};

export default AnthropicAdvancedNode; 