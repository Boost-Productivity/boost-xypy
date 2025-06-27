import AudioExtractorNode from './AudioExtractorNode';
import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { AudioExtractorNodeData } from './AudioExtractorNode.types';

export const audioExtractorNodeConfig: NodeTypeConfig = {
    type: 'audioExtractor',
    displayName: 'Audio Extractor',
    description: 'Extract audio from video files using FFmpeg',
    component: AudioExtractorNode,
    defaultData: {
        label: 'Audio Extractor',
        pythonFunction: `def process(inputs):
    import os
    import subprocess
    import uuid
    import json
    import logging
    
    logging.info(f"AudioExtractor inputs: {inputs}")
    
    # First try to get from direct upstream inputs
    video_path = inputs.get("video_path", "").strip()
    output_directory = inputs.get("output_dir", "").strip()
    if not output_directory:
        output_directory = inputs.get("output_directory", "").strip()
    
    audio_format = "mp3"
    audio_quality = "medium"
    
    # If no direct inputs, try parsing JSON from manual input
    if not video_path or not output_directory:
        manual_input = inputs.get("manual", "")
        if manual_input:
            try:
                data = json.loads(manual_input)
                if not video_path:
                    video_path = data.get("videoFilePath", "").strip()
                if not output_directory:
                    output_directory = data.get("outputDirectory", "").strip()
                audio_format = data.get("audioFormat", "mp3")
                audio_quality = data.get("audioQuality", "medium")
            except (json.JSONDecodeError, KeyError):
                pass
    
    logging.info(f"AudioExtractor resolved - video_path: {video_path}, output_dir: {output_directory}")
    
    if not video_path:
        return f"ERROR: No video file path provided. Available keys: {list(inputs.keys())}"
    
    if not output_directory:
        return f"ERROR: No output directory specified. Available keys: {list(inputs.keys())}"
    
    try:
        # Validate video file exists
        if not os.path.exists(video_path):
            return "ERROR: Video file not found: " + video_path
        
        # Create output directory if it doesn't exist
        os.makedirs(output_directory, exist_ok=True)
        
        # Generate UUID filename
        audio_uuid = str(uuid.uuid4())
        output_filename = audio_uuid + "." + audio_format
        output_path = os.path.join(output_directory, output_filename)
        
        # Set quality parameters
        if audio_format == "mp3":
            if audio_quality == "low":
                quality_params = ["-b:a", "96k"]
            elif audio_quality == "high":
                quality_params = ["-b:a", "192k"]
            else:
                quality_params = ["-b:a", "128k"]
            codec = "libmp3lame"
        elif audio_format == "aac":
            if audio_quality == "low":
                quality_params = ["-b:a", "96k"]
            elif audio_quality == "high":
                quality_params = ["-b:a", "256k"]
            else:
                quality_params = ["-b:a", "128k"]
            codec = "aac"
        elif audio_format == "flac":
            if audio_quality == "low":
                quality_params = ["-compression_level", "0"]
            elif audio_quality == "high":
                quality_params = ["-compression_level", "8"]
            else:
                quality_params = ["-compression_level", "5"]
            codec = "flac"
        else:
            if audio_quality == "low":
                quality_params = ["-ar", "22050"]
            elif audio_quality == "high":
                quality_params = ["-ar", "48000"]
            else:
                quality_params = ["-ar", "44100"]
            codec = "pcm_s16le"
            
        # Build ffmpeg command
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", video_path, "-vn",
            "-acodec", codec
        ] + quality_params + [output_path]
        
        # Execute ffmpeg command
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            return "ERROR: Audio extraction failed - " + str(result.stderr)
        
        if not os.path.exists(output_path):
            return "ERROR: Output audio file was not created"
        
        file_size = os.path.getsize(output_path)
        
        # Return just the output file path for downstream nodes
        return output_path
        
    except subprocess.TimeoutExpired:
        return "ERROR: Audio extraction timed out"
    except Exception as e:
        return "ERROR: " + str(e)`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'audioExtractor' as const,
        customData: {
            videoFilePath: '',
            outputDirectory: '',
            audioFormat: 'mp3',
            audioQuality: 'medium',
        }
    } as AudioExtractorNodeData,
    icon: '🎵',
    color: '#673ab7'
};

export const audioExtractorNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_audioExtractor',
        type: 'audioExtractor',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: 'Audio Extractor ' + Date.now(),
            pythonFunction: audioExtractorNodeConfig.defaultData.pythonFunction,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'audioExtractor' as const,
            customData: {
                videoFilePath: '',
                outputDirectory: '',
                audioFormat: 'mp3',
                audioQuality: 'medium',
            }
        } as AudioExtractorNodeData,
    };
}; 