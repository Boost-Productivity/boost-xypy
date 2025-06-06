from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
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
)

class ExecutionRequest(BaseModel):
    function_code: str
    input_value: str
    timeout: int = 5

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 