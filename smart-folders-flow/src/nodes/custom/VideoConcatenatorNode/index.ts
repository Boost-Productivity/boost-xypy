import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import VideoConcatenatorNode from './VideoConcatenatorNode';
import { VideoConcatenatorNodeData } from './VideoConcatenatorNode.types';

export const videoConcatenatorNodeConfig: NodeTypeConfig = {
    type: 'videoConcatenator',
    displayName: 'Video Concatenator',
    description: 'Concatenate MP4 files from the last 5 minutes into a single video',
    icon: '🎬',
    color: '#f57c00',
    component: VideoConcatenatorNode,
    defaultData: {
        label: 'Video Concatenator',
        pythonFunction: `def process(inputs):
    import os
    import time
    import uuid
    import subprocess
    import tempfile
    
    input_directory = inputs.get("input_directory", "").strip()
    output_directory = inputs.get("output_directory", "").strip()
    
    if not input_directory:
        return "ERROR: No input directory specified"
    
    if not output_directory:
        return "ERROR: No output directory specified"
    
    log_progress(f"🎬 Video Concatenator starting...")
    log_progress(f"📁 Input directory: {input_directory}")
    log_progress(f"📁 Output directory: {output_directory}")
    
    try:
        if not os.path.exists(input_directory):
            error_msg = f"❌ Input directory not found: {input_directory}"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
        
        # Create output directory if it doesn't exist
        os.makedirs(output_directory, exist_ok=True)
        log_progress(f"✅ Output directory ready: {output_directory}")
        
        # Find MP4 files created in the last 5 minutes
        current_time = time.time()
        five_minutes_ago = current_time - (5 * 60)  # 5 minutes in seconds
        
        mp4_files = []
        log_progress(f"🔍 Searching for MP4 files created after {time.ctime(five_minutes_ago)}")
        
        for root, dirs, files in os.walk(input_directory):
            for file in files:
                if file.lower().endswith('.mp4'):
                    file_path = os.path.join(root, file)
                    try:
                        file_stat = os.stat(file_path)
                        creation_time = file_stat.st_ctime
                        
                        if creation_time >= five_minutes_ago:
                            mp4_files.append({
                                'path': file_path,
                                'creation_time': creation_time
                            })
                            log_progress(f"📹 Found: {file} (created {time.ctime(creation_time)})")
                    except OSError:
                        continue
        
        if not mp4_files:
            error_msg = "❌ No MP4 files found created in the last 5 minutes"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
        
        # Sort files by creation time (oldest first)
        mp4_files.sort(key=lambda x: x['creation_time'])
        log_progress(f"📊 Found {len(mp4_files)} MP4 files to concatenate")
        
        # Generate UUID filename for output
        output_filename = f"{str(uuid.uuid4())}.mp4"
        output_path = os.path.join(output_directory, output_filename)
        log_progress(f"🎯 Output file: {output_filename}")
        
        # Create temporary file list for ffmpeg concat
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as concat_file:
            for file_info in mp4_files:
                # Escape single quotes and wrap in single quotes for ffmpeg
                escaped_path = file_info['path'].replace("'", "'\"'\"'")
                concat_file.write(f"file '{escaped_path}'\\n")
            concat_file_path = concat_file.name
        
        log_progress(f"📝 Created concat file: {concat_file_path}")
        
        try:
            # Build ffmpeg concat command
            ffmpeg_cmd = [
                "ffmpeg",
                "-y",  # Overwrite output file
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file_path,
                "-c", "copy",  # Copy streams without re-encoding for speed
                output_path
            ]
            
            log_progress(f"🚀 Running ffmpeg concatenation...")
            
            # Execute ffmpeg command
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                error_msg = f"❌ ffmpeg failed: {result.stderr}"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
            
            # Verify output file was created
            if not os.path.exists(output_path):
                error_msg = "❌ Output file was not created"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
            
            file_size = os.path.getsize(output_path)
            log_progress(f"✅ Concatenation successful!")
            log_progress(f"📊 Output file size: {file_size / (1024 * 1024):.1f} MB")
            
            # Return formatted result
            result_lines = []
            result_lines.append(f"✅ Successfully concatenated {len(mp4_files)} MP4 files!")
            result_lines.append(f"")
            result_lines.append(f"📁 Output: {output_filename}")
            result_lines.append(f"📊 Files concatenated: {len(mp4_files)}")
            result_lines.append(f"💾 File size: {file_size / (1024 * 1024):.1f} MB")
            result_lines.append(f"")
            result_lines.append(f"📹 Source files:")
            for file_info in mp4_files:
                filename = os.path.basename(file_info['path'])
                result_lines.append(f"  • {filename}")
            result_lines.append(f"")
            result_lines.append(f"--- OUTPUT FILENAME ---")
            result_lines.append(f"{output_filename}")
            
            return "\\n".join(result_lines)
            
        finally:
            # Clean up temporary concat file
            try:
                os.unlink(concat_file_path)
                log_progress(f"🧹 Cleaned up temp file: {concat_file_path}")
            except:
                pass
                
    except subprocess.TimeoutExpired:
        error_msg = "❌ Video concatenation timed out"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except Exception as e:
        error_msg = f"❌ Unexpected error: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'videoConcatenator' as const,
        customData: {
            inputDirectory: '',
            outputDirectory: ''
        }
    } as VideoConcatenatorNodeData
};

export const videoConcatenatorNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_videoConcatenator',
        type: 'videoConcatenator',
        position: {
            x: position.x - 190,
            y: position.y - 150,
        },
        data: {
            label: `Video Concatenator ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    import time
    import uuid
    import subprocess
    import tempfile
    
    input_directory = inputs.get("input_directory", "").strip()
    output_directory = inputs.get("output_directory", "").strip()
    
    if not input_directory:
        return "ERROR: No input directory specified"
    
    if not output_directory:
        return "ERROR: No output directory specified"
    
    log_progress(f"🎬 Video Concatenator starting...")
    log_progress(f"📁 Input directory: {input_directory}")
    log_progress(f"📁 Output directory: {output_directory}")
    
    try:
        if not os.path.exists(input_directory):
            error_msg = f"❌ Input directory not found: {input_directory}"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
        
        # Create output directory if it doesn't exist
        os.makedirs(output_directory, exist_ok=True)
        log_progress(f"✅ Output directory ready: {output_directory}")
        
        # Find MP4 files created in the last 5 minutes
        current_time = time.time()
        five_minutes_ago = current_time - (5 * 60)  # 5 minutes in seconds
        
        mp4_files = []
        log_progress(f"🔍 Searching for MP4 files created after {time.ctime(five_minutes_ago)}")
        
        for root, dirs, files in os.walk(input_directory):
            for file in files:
                if file.lower().endswith('.mp4'):
                    file_path = os.path.join(root, file)
                    try:
                        file_stat = os.stat(file_path)
                        creation_time = file_stat.st_ctime
                        
                        if creation_time >= five_minutes_ago:
                            mp4_files.append({
                                'path': file_path,
                                'creation_time': creation_time
                            })
                            log_progress(f"📹 Found: {file} (created {time.ctime(creation_time)})")
                    except OSError:
                        continue
        
        if not mp4_files:
            error_msg = "❌ No MP4 files found created in the last 5 minutes"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
        
        # Sort files by creation time (oldest first)
        mp4_files.sort(key=lambda x: x['creation_time'])
        log_progress(f"📊 Found {len(mp4_files)} MP4 files to concatenate")
        
        # Generate UUID filename for output
        output_filename = f"{str(uuid.uuid4())}.mp4"
        output_path = os.path.join(output_directory, output_filename)
        log_progress(f"🎯 Output file: {output_filename}")
        
        # Create temporary file list for ffmpeg concat
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as concat_file:
            for file_info in mp4_files:
                # Escape single quotes and wrap in single quotes for ffmpeg
                escaped_path = file_info['path'].replace("'", "'\"'\"'")
                concat_file.write(f"file '{escaped_path}'\\n")
            concat_file_path = concat_file.name
        
        log_progress(f"📝 Created concat file: {concat_file_path}")
        
        try:
            # Build ffmpeg concat command
            ffmpeg_cmd = [
                "ffmpeg",
                "-y",  # Overwrite output file
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file_path,
                "-c", "copy",  # Copy streams without re-encoding for speed
                output_path
            ]
            
            log_progress(f"🚀 Running ffmpeg concatenation...")
            
            # Execute ffmpeg command
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                error_msg = f"❌ ffmpeg failed: {result.stderr}"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
            
            # Verify output file was created
            if not os.path.exists(output_path):
                error_msg = "❌ Output file was not created"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
            
            file_size = os.path.getsize(output_path)
            log_progress(f"✅ Concatenation successful!")
            log_progress(f"📊 Output file size: {file_size / (1024 * 1024):.1f} MB")
            
            # Return formatted result
            result_lines = []
            result_lines.append(f"✅ Successfully concatenated {len(mp4_files)} MP4 files!")
            result_lines.append(f"")
            result_lines.append(f"📁 Output: {output_filename}")
            result_lines.append(f"📊 Files concatenated: {len(mp4_files)}")
            result_lines.append(f"💾 File size: {file_size / (1024 * 1024):.1f} MB")
            result_lines.append(f"")
            result_lines.append(f"📹 Source files:")
            for file_info in mp4_files:
                filename = os.path.basename(file_info['path'])
                result_lines.append(f"  • {filename}")
            result_lines.append(f"")
            result_lines.append(f"--- OUTPUT FILENAME ---")
            result_lines.append(f"{output_filename}")
            
            return "\\n".join(result_lines)
            
        finally:
            # Clean up temporary concat file
            try:
                os.unlink(concat_file_path)
                log_progress(f"🧹 Cleaned up temp file: {concat_file_path}")
            except:
                pass
                
    except subprocess.TimeoutExpired:
        error_msg = "❌ Video concatenation timed out"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except Exception as e:
        error_msg = f"❌ Unexpected error: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'videoConcatenator' as const,
            customData: {
                inputDirectory: '',
                outputDirectory: ''
            }
        } as VideoConcatenatorNodeData,
    };
}; 