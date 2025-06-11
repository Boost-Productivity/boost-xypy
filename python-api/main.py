from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import json
import subprocess
import os
import threading
import tempfile
import time
import uuid
import glob
from executor import execute_python_function, register_session_for_cancellation
from storage import save_flow, load_flow, list_flows

# Session management for execution cancellation
execution_sessions: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title="Smart Folder Python Executor",
    description="A safe Python function execution API for Smart Folders",
    version="1.0.0"
)

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Allow streaming headers
)

class ExecutionRequest(BaseModel):
    function_code: str
    input_value: str
    timeout: int = 600

class ExecutionResponse(BaseModel):
    success: bool
    output: str | None
    execution_time: float
    error: str | None
    error_type: str | None

class FlowData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class SaveFlowRequest(BaseModel):
    flow_data: FlowData
    flow_id: str = "default"

class FlowResponse(BaseModel):
    success: bool
    message: str
    flow_id: str
    saved_at: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

@app.get("/")
async def root():
    return {
        "message": "Smart Folder Python Executor API",
        "docs": "Visit /docs for API documentation"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "python_version": sys.version,
        "api_version": "1.0.0"
    }

@app.post("/api/execute", response_model=ExecutionResponse)
async def execute_function(request: ExecutionRequest):
    """
    Execute a Python function safely with the given input.
    
    The function code must define a function named 'process' that takes one argument.
    
    Example:
    ```python
    def process(input_text):
        return input_text.upper()
    ```
    """
    try:
        result = execute_python_function(
            function_code=request.function_code,
            input_value=request.input_value,
            timeout=request.timeout
        )
        return ExecutionResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/execute/stream")
async def execute_function_stream(request: ExecutionRequest):
    """
    Execute a Python function with streaming output for subprocess commands.
    """
    def generate_stream():
        try:
            # Simple streaming for subprocess commands
            yield f"data: {json.dumps({'type': 'start', 'content': 'Starting execution...'})}\n\n"
            
            # Execute the function but capture subprocess output
            result = execute_python_function(
                function_code=request.function_code,
                input_value=request.input_value,
                timeout=request.timeout
            )
            
            # Stream the final result
            if result["success"]:
                yield f"data: {json.dumps({'type': 'success', 'content': result['output']})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'content': result['error']})}\n\n"
                
            yield f"data: {json.dumps({'type': 'complete', 'execution_time': result['execution_time']})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")

@app.post("/api/execute/logging")
async def execute_function_with_logging(request: ExecutionRequest):
    """
    Execute a Python function with file-based logging for streaming updates.
    Returns immediately with log_file_id for polling.
    """
    try:
        # Generate log file ID immediately
        log_file_id = str(__import__('uuid').uuid4())
        log_path = os.path.join(tempfile.gettempdir(), f"smart_folder_log_{log_file_id}.txt")
        
        # Create initial log file
        with open(log_path, 'w') as log:
            log.write("🚀 Starting execution...\n")
            log.flush()
        
        # Track session
        execution_sessions[log_file_id] = {
            "start_time": time.time(),
            "status": "running",
            "log_path": log_path,
            "thread_ref": None,
            "process_refs": []
        }
        
        # Register session for cancellation checks
        register_session_for_cancellation(log_file_id, execution_sessions[log_file_id])
        
        # Start execution in background thread
        def run_execution():
            result = execute_python_function(
                function_code=request.function_code,
                input_value=request.input_value,
                timeout=request.timeout,
                log_file_id=log_file_id  # Pass existing log file ID
            )
            
            # Check if session was cancelled
            session = execution_sessions.get(log_file_id)
            if session and session["status"] == "cancelled":
                with open(log_path, 'a') as log:
                    log.write("🚫 EXECUTION CANCELLED\n--- FINAL RESULT ---\nExecution was cancelled by user\n")
                    log.flush()
                return
            
            # Write completion status to log
            with open(log_path, 'a') as log:
                if result["success"]:
                    log.write(f"✅ EXECUTION COMPLETE\n--- FINAL RESULT ---\n{result['output']}\n")
                else:
                    log.write(f"❌ EXECUTION FAILED\n--- ERROR ---\n{result['error']}\n")
                log.flush()
            
            # Update session status
            if log_file_id in execution_sessions:
                execution_sessions[log_file_id]["status"] = "completed"
        
        # Start background execution
        thread = threading.Thread(target=run_execution)
        thread.daemon = True
        thread.start()
        
        # Store thread reference
        execution_sessions[log_file_id]["thread_ref"] = thread
        
        # Return immediately with log file ID
        return {
            "success": True,
            "log_file_id": log_file_id,
            "message": "Execution started, poll logs for updates"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/cancel/{log_file_id}")
async def cancel_execution(log_file_id: str):
    """
    Cancel a running execution by log file ID.
    """
    try:
        session = execution_sessions.get(log_file_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Execution session not found")
        
        if session["status"] != "running":
            return {
                "success": True,
                "message": f"Execution already {session['status']}",
                "log_file_id": log_file_id
            }
        
        # Mark session as cancelled
        session["status"] = "cancelled"
        
        # Write cancellation marker to log file
        log_path = session.get("log_path")
        if log_path and os.path.exists(log_path):
            with open(log_path, 'a') as log:
                log.write("🚫 Cancellation requested...\n")
                log.flush()
        
        # TODO: Kill any subprocess references if we had them
        # For now, the thread will check the cancelled status
        
        return {
            "success": True,
            "message": "Execution cancelled",
            "log_file_id": log_file_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel execution: {str(e)}"
        )

@app.post("/api/flows/save")
async def save_flow_endpoint(request: SaveFlowRequest):
    """
    Save a flow (nodes and edges) to persistent storage
    """
    try:
        flow_data = {
            "nodes": request.flow_data.nodes,
            "edges": request.flow_data.edges
        }
        
        result = save_flow(flow_data, request.flow_id)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["message"])
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save flow: {str(e)}"
        )

@app.get("/api/flows/load/{flow_id}")
async def load_flow_endpoint(flow_id: str = "default"):
    """
    Load a flow from persistent storage
    """
    try:
        result = load_flow(flow_id)
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load flow: {str(e)}"
        )

@app.get("/api/flows/list")
async def list_flows_endpoint():
    """
    List all available flows
    """
    try:
        result = list_flows()
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list flows: {str(e)}"
        )

@app.get("/api/flow-data")
async def get_flow_data():
    """
    Get flow data in the format expected by the 3D neural visualization
    """
    try:
        # Load the default flow
        result = load_flow("default")
        
        if result["success"]:
            return {
                "nodes": result["nodes"],
                "edges": result["edges"]
            }
        else:
            # Return empty structure if no flow found
            return {
                "nodes": [],
                "edges": []
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get flow data: {str(e)}"
        )

@app.post("/api/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    directory: str = Form(...),
    nodeId: str = Form(...)
):
    """
    Upload and save video file to specified server directory
    """
    try:
        # Validate file type
        if not video.content_type or not video.content_type.startswith('video/'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {video.content_type}. Expected video file."
            )
        
        # Ensure directory exists
        os.makedirs(directory, exist_ok=True)
        
        # Generate safe filename
        safe_filename = video.filename or f"video_{int(time.time())}.webm"
        # Remove any path traversal attempts
        safe_filename = os.path.basename(safe_filename)
        
        # Full file path
        file_path = os.path.join(directory, safe_filename)
        
        # Save file to server
        with open(file_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Get absolute path for return
        abs_file_path = os.path.abspath(file_path)
        
        return {
            "success": True,
            "filePath": abs_file_path,
            "filename": safe_filename,
            "directory": directory,
            "nodeId": nodeId,
            "fileSize": len(content),
            "contentType": video.content_type
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Video upload failed: {str(e)}"
        )

@app.get("/api/logs/{log_file_id}")
async def read_execution_log(log_file_id: str, last_position: int = 0):
    """
    Read execution log file from a specific position for polling updates.
    """
    try:
        import tempfile
        log_path = os.path.join(tempfile.gettempdir(), f"smart_folder_log_{log_file_id}.txt")
        
        if not os.path.exists(log_path):
            return {"content": "", "position": 0, "exists": False}
        
        with open(log_path, 'r') as f:
            f.seek(last_position)
            new_content = f.read()
            new_position = f.tell()
            
        return {
            "content": new_content,
            "position": new_position,
            "exists": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read log: {str(e)}"
        )

@app.post("/api/list-videos")
async def list_videos(request: dict):
    """
    List video files in the specified directory path
    """
    try:
        path = request.get("path", "").strip()
        node_id = request.get("nodeId", "")
        
        if not path:
            raise HTTPException(status_code=400, detail="Path is required")
        
        # Handle both file and directory paths
        if os.path.isfile(path):
            # If it's a single file, check if it's a video
            if path.lower().endswith(('.mp4', '.avi', '.mov', '.webm', '.mkv', '.wmv', '.flv')):
                return {"videos": [path]}
            else:
                return {"videos": []}
        
        elif os.path.isdir(path):
            # If it's a directory, find all video files
            video_extensions = ['*.mp4', '*.avi', '*.mov', '*.webm', '*.mkv', '*.wmv', '*.flv']
            video_files = []
            
            for extension in video_extensions:
                pattern = os.path.join(path, '**', extension)
                video_files.extend(glob.glob(pattern, recursive=True))
                # Also check current directory
                pattern = os.path.join(path, extension)
                video_files.extend(glob.glob(pattern))
            
            # Remove duplicates and sort
            video_files = sorted(list(set(video_files)))
            
            return {"videos": video_files}
        
        else:
            raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list videos: {str(e)}"
        )

@app.get("/api/serve-video")
async def serve_video(path: str):
    """
    Serve a video file for playback
    """
    try:
        if not path:
            raise HTTPException(status_code=400, detail="Path parameter is required")
        
        # Validate the file exists
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail=f"Video file not found: {path}")
        
        # Validate it's a video file
        if not path.lower().endswith(('.mp4', '.avi', '.mov', '.webm', '.mkv', '.wmv', '.flv')):
            raise HTTPException(status_code=400, detail="File is not a supported video format")
        
        # Return the video file
        return FileResponse(
            path=path,
            media_type='video/mp4',  # Browser will handle different formats
            filename=os.path.basename(path)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to serve video: {str(e)}"
        )

@app.post("/api/list-audios")
async def list_audios(request: dict):
    """
    List audio files in the specified directory path
    """
    try:
        path = request.get("path", "").strip()
        node_id = request.get("nodeId", "")
        
        if not path:
            raise HTTPException(status_code=400, detail="Path is required")
        
        # Handle both file and directory paths
        if os.path.isfile(path):
            # If it's a single file, check if it's an audio file
            if path.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.opus')):
                return {"audios": [path]}
            else:
                return {"audios": []}
        
        elif os.path.isdir(path):
            # If it's a directory, find all audio files
            audio_extensions = ['*.mp3', '*.wav', '*.ogg', '*.m4a', '*.aac', '*.flac', '*.wma', '*.opus']
            audio_files = []
            
            for extension in audio_extensions:
                pattern = os.path.join(path, '**', extension)
                audio_files.extend(glob.glob(pattern, recursive=True))
                # Also check current directory
                pattern = os.path.join(path, extension)
                audio_files.extend(glob.glob(pattern))
            
            # Remove duplicates and sort
            audio_files = sorted(list(set(audio_files)))
            
            return {"audios": audio_files}
        
        else:
            raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list audios: {str(e)}"
        )

@app.get("/api/serve-audio")
async def serve_audio(path: str):
    """Serve audio files from the server"""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Security check - ensure path is within allowed directories
    allowed_dirs = [
        os.path.abspath("./audio_recordings"),
        os.path.abspath("./recordings"), 
        os.path.abspath("./uploads")
    ]
    
    abs_path = os.path.abspath(path)
    if not any(abs_path.startswith(allowed_dir) for allowed_dir in allowed_dirs):
        raise HTTPException(status_code=403, detail="Access denied")
    
    def iterfile():
        with open(path, mode="rb") as file_like:
            yield from file_like
    
    # Determine content type
    if path.endswith('.mp3'):
        media_type = 'audio/mpeg'
    elif path.endswith('.wav'):
        media_type = 'audio/wav'
    elif path.endswith('.m4a'):
        media_type = 'audio/mp4'
    elif path.endswith('.aac'):
        media_type = 'audio/aac'
    else:
        media_type = 'audio/mpeg'  # Default
    
    return StreamingResponse(iterfile(), media_type=media_type)

# IP Camera Recording Endpoints

class IPCameraTestRequest(BaseModel):
    url: str
    timeout: int = 10

class IPCameraRecordRequest(BaseModel):
    url: str
    duration: int = 60
    output_dir: str = "./webcam_recordings"
    quality: str = "medium"
    node_id: str
    continuous: bool = False

# Global dictionary to track recording processes
recording_processes: Dict[str, Dict[str, Any]] = {}

@app.post("/api/test-ip-camera")
async def test_ip_camera(request: IPCameraTestRequest):
    """Test IP camera connection"""
    try:
        import requests
        
        # Try to access the camera stream
        response = requests.get(request.url, timeout=request.timeout, stream=True)
        
        if response.status_code == 200:
            # Try to read a small amount of data to verify it's actually a video stream
            data = response.raw.read(1024)
            if len(data) > 0:
                return {"status": "success", "message": "Camera connection successful"}
            else:
                raise Exception("No data received from camera")
        else:
            raise Exception(f"HTTP {response.status_code}: {response.reason}")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/record-ip-camera")
async def start_ip_camera_recording(request: IPCameraRecordRequest):
    """Start recording from IP camera using ffmpeg with optional continuous chunking"""
    try:
        # Create output directory if it doesn't exist
        os.makedirs(request.output_dir, exist_ok=True)
        
        # Initialize or update recording session
        if request.node_id not in recording_processes:
            recording_processes[request.node_id] = {
                "chunk_number": 1,
                "continuous": request.continuous,
                "request": request,
                "should_stop": False
            }
        else:
            recording_processes[request.node_id]["continuous"] = request.continuous
            recording_processes[request.node_id]["request"] = request
            recording_processes[request.node_id]["should_stop"] = False
        
        # Start first chunk
        await _start_recording_chunk(request.node_id)
        
        return {
            "status": "recording_started",
            "continuous": request.continuous,
            "node_id": request.node_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start recording: {str(e)}")

async def _start_recording_chunk(node_id: str):
    """Start recording a single chunk"""
    session = recording_processes[node_id]
    request = session["request"]
    chunk_num = session["chunk_number"]
    
    # Generate output filename with chunk number
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_filename = f"ipcam_{node_id}_chunk{chunk_num:03d}_{timestamp}.mp4"
    output_path = os.path.join(request.output_dir, output_filename)
    
    # Quality settings
    quality_settings = {
        "low": ["-s", "640x480", "-b:v", "500k"],
        "medium": ["-s", "1280x720", "-b:v", "1000k"], 
        "high": ["-s", "1920x1080", "-b:v", "2000k"]
    }
    
    quality_args = quality_settings.get(request.quality, quality_settings["medium"])
    
    # Build ffmpeg command
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",  # Overwrite output file
        "-i", request.url,  # Input stream URL
        "-t", str(request.duration),  # Duration
        "-c:v", "libx264",  # Video codec
        "-preset", "fast",  # Encoding preset
        *quality_args,  # Quality settings
        "-f", "mp4",  # Output format
        output_path
    ]
    
    # Start recording process
    process = subprocess.Popen(
        ffmpeg_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Store process reference
    session["process"] = process
    session["output_path"] = output_path
    
    # Start background thread to monitor completion
    def monitor_completion():
        stdout, stderr = process.communicate()
        
        # Check if recording was stopped
        if session.get("should_stop", False):
            return
            
        if process.returncode == 0 and os.path.exists(output_path):
            # Chunk completed successfully
            file_size = os.path.getsize(output_path)
            
            # Add to completed chunks list for polling
            if "completed_chunks" not in session:
                session["completed_chunks"] = []
            
            session["completed_chunks"].append({
                "chunk_number": chunk_num,
                "file_path": output_path,
                "file_size": file_size
            })
            
            # If continuous mode, start next chunk
            if session.get("continuous", False) and not session.get("should_stop", False):
                session["chunk_number"] += 1
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(_start_recording_chunk(node_id))
                loop.close()
    
    thread = threading.Thread(target=monitor_completion)
    thread.daemon = True
    thread.start()

@app.post("/api/stop-ip-camera-recording/{node_id}")
async def stop_ip_camera_recording(node_id: str):
    """Stop IP camera recording for a specific node"""
    try:
        if node_id not in recording_processes:
            raise HTTPException(status_code=404, detail="No active recording found for this node")
        
        session = recording_processes[node_id]
        session["should_stop"] = True
        
        process = session.get("process")
        if process:
            # Terminate the ffmpeg process gracefully
            process.terminate()
            
            # Wait for process to finish (with timeout)
            try:
                stdout, stderr = process.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't terminate gracefully
                process.kill()
                stdout, stderr = process.communicate()
        
        # Get the last recorded file
        output_file = session.get("output_path")
        chunk_number = session.get("chunk_number", 1)
        
        # Clean up session
        del recording_processes[node_id]
        
        if output_file and os.path.exists(output_file):
            return {
                "status": "recording_stopped",
                "filePath": output_file,
                "file_size": os.path.getsize(output_file),
                "final_chunk": chunk_number
            }
        else:
            return {
                "status": "recording_stopped", 
                "filePath": None,
                "final_chunk": chunk_number
            }
            
    except HTTPException:
        raise
    except Exception as e:
        # Clean up process reference even if there's an error
        if node_id in recording_processes:
            session = recording_processes[node_id]
            process = session.get("process")
            if process:
                try:
                    process.kill()
                except:
                    pass
            del recording_processes[node_id]
        
        raise HTTPException(status_code=500, detail=f"Failed to stop recording: {str(e)}")

@app.post("/api/ip-camera-chunk-completed/{node_id}")
async def handle_chunk_completed(node_id: str, chunk_data: dict):
    """Handle chunk completion notification from frontend"""
    # This endpoint allows the frontend to be notified when chunks complete
    # The actual triggering happens in the frontend
    return {"status": "acknowledged"}

@app.get("/api/check-chunks/{node_id}")
async def check_chunks(node_id: str):
    """Check for new completed chunks for a node"""
    if node_id not in recording_processes:
        return {"newChunks": []}
    
    session = recording_processes[node_id]
    completed_chunks = session.get("completed_chunks", [])
    
    # Return and clear the completed chunks
    session["completed_chunks"] = []
    
    return {"newChunks": completed_chunks}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 