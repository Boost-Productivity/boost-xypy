from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import json
import subprocess
import os
from executor import execute_python_function
from storage import save_flow, load_flow, list_flows

app = FastAPI(
    title="Smart Folder Python Executor",
    description="A safe Python function execution API for Smart Folders",
    version="1.0.0"
)

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
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
        import asyncio
        import threading
        import tempfile
        
        # Generate log file ID immediately
        log_file_id = str(__import__('uuid').uuid4())
        log_path = os.path.join(tempfile.gettempdir(), f"smart_folder_log_{log_file_id}.txt")
        
        # Create initial log file
        with open(log_path, 'w') as log:
            log.write("🚀 Starting execution...\n")
            log.flush()
        
        # Start execution in background thread
        def run_execution():
            result = execute_python_function(
                function_code=request.function_code,
                input_value=request.input_value,
                timeout=request.timeout,
                log_file_id=log_file_id  # Pass existing log file ID
            )
            
            # Write completion status to log
            with open(log_path, 'a') as log:
                if result["success"]:
                    log.write(f"✅ EXECUTION COMPLETE\n--- FINAL RESULT ---\n{result['output']}\n")
                else:
                    log.write(f"❌ EXECUTION FAILED\n--- ERROR ---\n{result['error']}\n")
                log.flush()
        
        # Start background execution
        thread = threading.Thread(target=run_execution)
        thread.daemon = True
        thread.start()
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 