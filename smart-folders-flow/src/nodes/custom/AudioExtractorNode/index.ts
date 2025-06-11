import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import AudioExtractorNode from './AudioExtractorNode';
import { AudioExtractorNodeData } from './AudioExtractorNode.types';

export const audioExtractorNodeConfig: NodeTypeConfig = {
    type: 'audioExtractor',
    displayName: 'Audio Extractor',
    description: 'Extract audio from video files using ffmpeg with UUID filenames',
    component: AudioExtractorNode,
    defaultData: {
        label: 'Audio Extractor',
        pythonFunction: `def process(inputs):
    import os
    import subprocess
    import uuid
    import json
    
    # Parse JSON from manual input like Anthropic node does
    manual_input = inputs.get("manual", "")
    if manual_input:
        try:
            data = json.loads(manual_input)
            video_path = data.get("videoFilePath", "").strip()
            output_directory = data.get("outputDirectory", "").strip()
            audio_format = data.get("audioFormat", "mp3")
            audio_quality = data.get("audioQuality", "medium")
        except (json.JSONDecodeError, KeyError):
            return "ERROR: Invalid input format"
    else:
        return "ERROR: No input data provided"
    
    if not video_path:
        return "ERROR: No video file path provided"
    
    if not output_directory:
        return "ERROR: No output directory specified"
    
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
        
        # Return simple result
        result_lines = [
            "Audio extracted successfully!",
            "Source: " + os.path.basename(video_path),
            "Output: " + output_filename,
            "Format: " + audio_format.upper(),
            "Quality: " + audio_quality,
            "Size: " + str(round(file_size / (1024 * 1024), 1)) + " MB",
            "Path: " + output_path,
            "",
            "--- OUTPUT AUDIO PATH ---",
            output_path
        ]
        
        return "\\n".join(result_lines)
        
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
            pythonFunction: `def process(inputs):
    import os
    import subprocess
    import uuid
    import json
    
    # Parse JSON from manual input like Anthropic node does
    manual_input = inputs.get("manual", "")
    if manual_input:
        try:
            data = json.loads(manual_input)
            video_path = data.get("videoFilePath", "").strip()
            output_directory = data.get("outputDirectory", "").strip()
            audio_format = data.get("audioFormat", "mp3")
            audio_quality = data.get("audioQuality", "medium")
        except (json.JSONDecodeError, KeyError):
            return "ERROR: Invalid input format"
    else:
        return "ERROR: No input data provided"
    
    if not video_path:
        return "ERROR: No video file path provided"
    
    if not output_directory:
        return "ERROR: No output directory specified"
    
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
        
        # Return simple result
        result_lines = [
            "Audio extracted successfully!",
            "Source: " + os.path.basename(video_path),
            "Output: " + output_filename,
            "Format: " + audio_format.upper(),
            "Quality: " + audio_quality,
            "Size: " + str(round(file_size / (1024 * 1024), 1)) + " MB",
            "Path: " + output_path,
            "",
            "--- OUTPUT AUDIO PATH ---",
            output_path
        ]
        
        return "\\n".join(result_lines)
        
    except subprocess.TimeoutExpired:
        return "ERROR: Audio extraction timed out"
    except Exception as e:
        return "ERROR: " + str(e)`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'audioExtractor',
            customData: {
                videoFilePath: '',
                outputDirectory: '',
                audioFormat: 'mp3',
                audioQuality: 'medium',
            }
        } as BaseNodeData,
    };
}; 