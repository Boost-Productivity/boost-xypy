import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import PromptTemplateNode from './PromptTemplateNode';
import { PromptTemplateNodeData } from './PromptTemplateNode.types';

export const promptTemplateNodeConfig: NodeTypeConfig = {
    type: 'promptTemplate',
    displayName: 'Prompt Template',
    description: 'Execute prompt templates with variables using Anthropic API',
    icon: '📝',
    color: '#10b981',
    component: PromptTemplateNode,
    defaultData: {
        label: 'Prompt Template',
        pythonFunction: `def process(inputs):
    import anthropic
    import os
    import re
    
    # Get API key - check inputs first, then environment variables
    api_key = inputs.get("api_key")
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        return "ERROR: Anthropic API key required. Please set it in the node, provide via inputs, or set ANTHROPIC_API_KEY environment variable."
    
    # Get prompt - could be pre-filled (manual execution) or need template filling (upstream execution)
    prompt = inputs.get("prompt")
    
    if not prompt:
        # No pre-filled prompt, so we need to fill the template with input data
        template = inputs.get("template", "")
        if not template:
            return "ERROR: No prompt template provided. Please set a template in the node."
        
        log_progress(f"🧩 Filling template with input data...")
        
        # Fill template with any input variables
        filled_template = template
        for key, value in inputs.items():
            if key not in ["api_key", "template", "model", "temperature", "top_p", "top_k", "max_tokens", "system_prompt", "stop_sequences"]:
                # Replace {{key}} with value
                pattern = f"{{{{\\s*{re.escape(key)}\\s*}}}}"
                filled_template = re.sub(pattern, str(value), filled_template)
        
        # Check if any variables are still unfilled
        unfilled_vars = re.findall(r'{{\\s*(\\w+)\\s*}}', filled_template)
        if unfilled_vars:
            log_progress(f"⚠️ Some template variables remain unfilled: {unfilled_vars}")
        
        prompt = filled_template
        log_progress(f"✅ Template filled: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    
    if not prompt or prompt.strip() == "":
        return "ERROR: No prompt available after template processing."
    
    # Parameters with defaults optimized for programmatic use
    model = inputs.get("model", "claude-sonnet-4-20250514")
    temperature = inputs.get("temperature", 0)  # Default to 0 for consistency
    top_p = inputs.get("top_p", 1.0)
    top_k = inputs.get("top_k", 40)
    max_tokens = inputs.get("max_tokens", 1000)
    system_prompt = inputs.get("system_prompt", "")
    stop_sequences = inputs.get("stop_sequences", [])
    
    log_progress(f"📝 Executing Prompt Template ({model})")
    log_progress(f"⚙️ Temperature: {temperature} (optimized for consistency)")
    log_progress(f"🎯 Final Prompt: {prompt[:150]}{'...' if len(prompt) > 150 else ''}")
    
    if system_prompt:
        log_progress(f"🎭 System: {system_prompt[:50]}{'...' if len(system_prompt) > 50 else ''}")
    
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
        log_progress(f"✅ Template execution complete ({len(result)} characters)")
        
        return result
        
    except Exception as e:
        error_msg = f"❌ Template Execution Error: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'promptTemplate' as const,
        customData: {
            template: 'Hello {{name}}, please analyze the following: {{content}}',
            variables: {},
            temperature: 0, // Default to 0 for programmatic use
            top_p: 1.0,
            top_k: 40,
            max_tokens: 1000,
            model: 'claude-sonnet-4-20250514',
            system_prompt: '',
            stop_sequences: ''
        }
    } as PromptTemplateNodeData
};

export const promptTemplateNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_promptTemplate',
        type: 'promptTemplate',
        position: {
            x: position.x - 200,
            y: position.y - 150,
        },
        data: {
            label: `Prompt Template ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import anthropic
    import os
    import re
    
    # Get API key - check inputs first, then environment variables
    api_key = inputs.get("api_key")
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        return "ERROR: Anthropic API key required. Please set it in the node, provide via inputs, or set ANTHROPIC_API_KEY environment variable."
    
    # Get prompt - could be pre-filled (manual execution) or need template filling (upstream execution)
    prompt = inputs.get("prompt")
    
    if not prompt:
        # No pre-filled prompt, so we need to fill the template with input data
        template = inputs.get("template", "")
        if not template:
            return "ERROR: No prompt template provided. Please set a template in the node."
        
        log_progress(f"🧩 Filling template with input data...")
        
        # Fill template with any input variables
        filled_template = template
        for key, value in inputs.items():
            if key not in ["api_key", "template", "model", "temperature", "top_p", "top_k", "max_tokens", "system_prompt", "stop_sequences"]:
                # Replace {{key}} with value
                pattern = f"{{{{\\s*{re.escape(key)}\\s*}}}}"
                filled_template = re.sub(pattern, str(value), filled_template)
        
        # Check if any variables are still unfilled
        unfilled_vars = re.findall(r'{{\\s*(\\w+)\\s*}}', filled_template)
        if unfilled_vars:
            log_progress(f"⚠️ Some template variables remain unfilled: {unfilled_vars}")
        
        prompt = filled_template
        log_progress(f"✅ Template filled: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    
    if not prompt or prompt.strip() == "":
        return "ERROR: No prompt available after template processing."
    
    # Parameters with defaults optimized for programmatic use
    model = inputs.get("model", "claude-sonnet-4-20250514")
    temperature = inputs.get("temperature", 0)  # Default to 0 for consistency
    top_p = inputs.get("top_p", 1.0)
    top_k = inputs.get("top_k", 40)
    max_tokens = inputs.get("max_tokens", 1000)
    system_prompt = inputs.get("system_prompt", "")
    stop_sequences = inputs.get("stop_sequences", [])
    
    log_progress(f"📝 Executing Prompt Template ({model})")
    log_progress(f"⚙️ Temperature: {temperature} (optimized for consistency)")
    log_progress(f"🎯 Final Prompt: {prompt[:150]}{'...' if len(prompt) > 150 else ''}")
    
    if system_prompt:
        log_progress(f"🎭 System: {system_prompt[:50]}{'...' if len(system_prompt) > 50 else ''}")
    
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
        log_progress(f"✅ Template execution complete ({len(result)} characters)")
        
        return result
        
    except Exception as e:
        error_msg = f"❌ Template Execution Error: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'promptTemplate' as const,
            customData: {
                template: 'Hello {{name}}, please analyze the following: {{content}}',
                variables: {},
                temperature: 0,
                top_p: 1.0,
                top_k: 40,
                max_tokens: 1000,
                model: 'claude-sonnet-4-20250514',
                system_prompt: '',
                stop_sequences: ''
            }
        } as PromptTemplateNodeData
    };
}; 