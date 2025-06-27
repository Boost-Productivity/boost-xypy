import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import WhisperTranscriptionNode from './WhisperTranscriptionNode';
import { WhisperTranscriptionNodeData } from './WhisperTranscriptionNode.types';

export const whisperTranscriptionNodeConfig: NodeTypeConfig = {
    type: 'whisperTranscription',
    displayName: 'Whisper Transcription',
    description: 'Transcribe audio files using OpenAI Whisper',
    component: WhisperTranscriptionNode,
    defaultData: {
        label: 'Whisper Transcription',
        pythonFunction: `# Whisper Audio Transcription
# Transcribes audio files using OpenAI Whisper
def process(inputs):
    """
    Transcribe audio file using Whisper
    """
    import whisper
    import os
    import time
    import json
    import logging
    
    logging.info(f"WhisperTranscription inputs: {inputs}")
    
    # Get audio file path from direct upstream inputs first
    audio_path = inputs.get("audio_path", "").strip()
    
    # Get configuration from inputs
    model_size = inputs.get("model", "base")
    language = inputs.get("language")
    temperature = inputs.get("temperature", 0.0)
    verbose = inputs.get("verbose", False)
    
    # If no direct inputs, check manual input
    if not audio_path:
        manual_input = inputs.get("manual", "").strip()
        if manual_input:
            audio_path = manual_input
    
    # If still no audio path, check other inputs
    if not audio_path:
        for key, value in inputs.items():
            if key not in ["manual", "model", "language", "temperature", "verbose"] and value:
                audio_path = str(value).strip()
                break
    
    logging.info(f"WhisperTranscription resolved - audio_path: {audio_path}, model: {model_size}")
    
    if not audio_path:
        return f"Error: No audio file path provided. Available keys: {list(inputs.keys())}"
    
    # Check if file exists
    if not os.path.exists(audio_path):
        return f"Error: Audio file not found: {audio_path}"
    
    try:
        # Load Whisper model
        print(f"Loading Whisper model: {model_size}")
        model = whisper.load_model(model_size)
        
        # Transcribe audio
        print(f"Transcribing audio file: {audio_path}")
        start_time = time.time()
        
        # Set up transcription options
        options = {
            "temperature": float(temperature),
            "verbose": bool(verbose)
        }
        
        if language:
            options["language"] = str(language)
        
        # Perform transcription
        result = model.transcribe(audio_path, **options)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Extract transcript text
        transcript = result["text"].strip()
        
        print(f"Transcription completed in {processing_time:.2f} seconds")
        print(f"Transcript preview: {transcript[:100]}...")
        
        # Return just the transcript text for downstream nodes
        return transcript
        
    except Exception as e:
        error_msg = f"Error: Transcription failed - {str(e)}"
        print(error_msg)
        return error_msg`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'whisperTranscription' as const,
        customData: {
            audioFilePath: '',
            model: 'base',
            language: undefined,
            temperature: 0.0,
            verbose: false,
        }
    } as WhisperTranscriptionNodeData,
    icon: '🎤',
    color: '#7c3aed'
};

export const whisperTranscriptionNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_whisperTranscription',
        type: 'whisperTranscription',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Whisper Transcription ${Date.now()}`,
            pythonFunction: whisperTranscriptionNodeConfig.defaultData.pythonFunction,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'whisperTranscription' as const,
            customData: {
                audioFilePath: '',
                model: 'base',
                language: undefined,
                temperature: 0.0,
                verbose: false,
            }
        } as WhisperTranscriptionNodeData,
    };
}; 