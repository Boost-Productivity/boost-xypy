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
import whisper
import os
import time
import json

def process(inputs):
    """
    Transcribe audio file using Whisper
    """
    # Get audio file path from manual input or upstream nodes
    audio_path = ""
    
    # First check manual input
    manual_input = inputs.get("manual", "").strip()
    if manual_input:
        audio_path = manual_input
    
    # If no manual input, check connected inputs
    if not audio_path:
        for key, value in inputs.items():
            if key != "manual" and value:
                audio_path = str(value).strip()
                break
    
    if not audio_path:
        return "Error: No audio file path provided"
    
    # Check if file exists
    if not os.path.exists(audio_path):
        return f"Error: Audio file not found: {audio_path}"
    
    try:
        # Get node custom data for configuration
        import json
        import sys
        
        # Default settings
        model_size = "base"
        language = None
        temperature = 0.0
        verbose = False
        
        # Load Whisper model
        print(f"Loading Whisper model: {model_size}")
        model = whisper.load_model(model_size)
        
        # Transcribe audio
        print(f"Transcribing audio file: {audio_path}")
        start_time = time.time()
        
        # Set up transcription options
        options = {
            "temperature": temperature,
            "verbose": verbose
        }
        
        if language:
            options["language"] = language
        
        # Perform transcription
        result = model.transcribe(audio_path, **options)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Extract transcript text
        transcript = result["text"].strip()
        
        print(f"Transcription completed in {processing_time:.2f} seconds")
        print(f"Transcript preview: {transcript[:100]}...")
        
        # Return the transcript for downstream nodes
        return transcript
        
    except Exception as e:
        error_msg = f"Transcription error: {str(e)}"
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
            pythonFunction: `# Whisper Audio Transcription
# Transcribes audio files using OpenAI Whisper
import whisper
import os
import time
import json

def process(inputs):
    """
    Transcribe audio file using Whisper
    """
    # Get audio file path from manual input or upstream nodes
    audio_path = ""
    
    # First check manual input
    manual_input = inputs.get("manual", "").strip()
    if manual_input:
        audio_path = manual_input
    
    # If no manual input, check connected inputs
    if not audio_path:
        for key, value in inputs.items():
            if key != "manual" and value:
                audio_path = str(value).strip()
                break
    
    if not audio_path:
        return "Error: No audio file path provided"
    
    # Check if file exists
    if not os.path.exists(audio_path):
        return f"Error: Audio file not found: {audio_path}"
    
    try:
        # Get node custom data for configuration
        import json
        import sys
        
        # Default settings
        model_size = "base"
        language = None
        temperature = 0.0
        verbose = False
        
        # Load Whisper model
        print(f"Loading Whisper model: {model_size}")
        model = whisper.load_model(model_size)
        
        # Transcribe audio
        print(f"Transcribing audio file: {audio_path}")
        start_time = time.time()
        
        # Set up transcription options
        options = {
            "temperature": temperature,
            "verbose": verbose
        }
        
        if language:
            options["language"] = language
        
        # Perform transcription
        result = model.transcribe(audio_path, **options)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Extract transcript text
        transcript = result["text"].strip()
        
        print(f"Transcription completed in {processing_time:.2f} seconds")
        print(f"Transcript preview: {transcript[:100]}...")
        
        # Return the transcript for downstream nodes
        return transcript
        
    except Exception as e:
        error_msg = f"Transcription error: {str(e)}"
        print(error_msg)
        return error_msg`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'whisperTranscription',
            customData: {
                audioFilePath: '',
                model: 'base',
                language: undefined,
                temperature: 0.0,
                verbose: false,
            }
        } as BaseNodeData,
    };
}; 