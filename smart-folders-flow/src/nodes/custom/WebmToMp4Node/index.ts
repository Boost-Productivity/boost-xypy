import WebmToMp4Node from './WebmToMp4Node';
import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { WebmToMp4NodeData } from './WebmToMp4Node.types';

export const webmToMp4NodeConfig: NodeTypeConfig = {
    type: 'webmToMp4',
    displayName: 'WebM to MP4 Converter',
    description: 'Convert WebM video files to MP4 format using FFmpeg',
    component: WebmToMp4Node,
    defaultData: {
        nodeType: 'webmToMp4',
        label: 'WebM to MP4',
        pythonFunction: `def process(inputs):
    import os
    import subprocess
    import logging
    from pathlib import Path
    
    # Get inputs from custom data (UI settings)
    input_video_path = inputs.get('input_video_path', '')
    output_dir = inputs.get('output_dir', '')
    
    # Also check for inputs from upstream nodes
    # Common keys that upstream nodes might use:
    if not input_video_path:
        # Try common upstream node output keys
        input_video_path = inputs.get('manual', '')  # From manual input
        if not input_video_path:
            input_video_path = inputs.get('file_path', '')  # Generic file path
        if not input_video_path:
            input_video_path = inputs.get('video_path', '')  # Video specific
        if not input_video_path:
            input_video_path = inputs.get('output_file_path', '')  # From other converters
    
    if not output_dir:
        # Try common directory keys from upstream nodes
        output_dir = inputs.get('directory', '')
        if not output_dir:
            output_dir = inputs.get('output_dir', '')
    
    logging.info(f"WebM to MP4 Converter inputs: {inputs}")
    logging.info(f"Using input_video_path: {input_video_path}")
    logging.info(f"Using output_dir: {output_dir}")
    
    if not input_video_path or not output_dir:
        raise ValueError("Input video path and output directory are required. Available keys: " + str(list(inputs.keys())))
    
    # Validate input file exists and is WebM
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Input video file not found: {input_video_path}")
    
    if not input_video_path.lower().endswith('.webm'):
        raise ValueError("Input file must be a WebM file (.webm extension)")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate output filename
    input_name = Path(input_video_path).stem
    output_filename = f"{input_name}_converted"
    output_path = os.path.join(output_dir, f"{output_filename}.mp4")
    
    # High quality settings for FFmpeg (hardcoded)
    quality_settings = ['-crf', '18', '-preset', 'slow']
    
    # Build FFmpeg command
    cmd = [
        'ffmpeg', 
        '-i', input_video_path,
        '-c:v', 'libx264',  # H.264 video codec
        '-c:a', 'aac',      # AAC audio codec
        '-movflags', '+faststart',  # Optimize for web streaming
        *quality_settings,
        '-y',  # Overwrite output file if it exists
        output_path
    ]
    
    try:
        logging.info(f"Converting WebM to MP4: {input_video_path} -> {output_path}")
        logging.info(f"FFmpeg command: {' '.join(cmd)}")
        
        # Run FFmpeg conversion
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode != 0:
            raise subprocess.CalledProcessError(
                result.returncode, 
                cmd, 
                output=result.stdout, 
                stderr=result.stderr
            )
        
        # Verify output file was created
        if not os.path.exists(output_path):
            raise FileNotFoundError(f"Output file was not created: {output_path}")
        
        file_size = os.path.getsize(output_path)
        logging.info(f"Conversion successful! Output file: {output_path} ({file_size} bytes)")
        
        # Return only the file path string for downstream nodes
        return output_path
        
    except subprocess.TimeoutExpired:
        raise TimeoutError("FFmpeg conversion timed out after 1 hour")
    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg conversion failed: {e.stderr}"
        logging.error(error_msg)
        raise RuntimeError(error_msg)
    except Exception as e:
        logging.error(f"Conversion error: {str(e)}")
        raise`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            inputVideoPath: '',
            outputDirectory: '',
        },
    } as WebmToMp4NodeData,
    icon: '🎬',
    color: '#ff5722'
};

export const webmToMp4NodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString(),
        type: 'webmToMp4',
        position: {
            x: position.x - 160,
            y: position.y - 100,
        },
        data: {
            nodeType: 'webmToMp4',
            label: `WebM to MP4 ${Date.now()}`,
            pythonFunction: webmToMp4NodeConfig.defaultData.pythonFunction,
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: '',
            customData: {
                inputVideoPath: '',
                outputDirectory: '',
            },
        } as WebmToMp4NodeData,
    };
}; 