import json
import os
from typing import Dict, Any, Optional
from datetime import datetime

# Directory to store flow data
FLOWS_DIR = "flows_data"

def ensure_flows_directory():
    """Ensure the flows directory exists"""
    if not os.path.exists(FLOWS_DIR):
        os.makedirs(FLOWS_DIR)

def save_flow(flow_data: Dict[str, Any], flow_id: str = "default") -> Dict[str, Any]:
    """
    Save flow data to a JSON file
    
    Args:
        flow_data: Dictionary containing nodes and edges
        flow_id: ID for the flow (defaults to "default")
        
    Returns:
        Dictionary with save result
    """
    try:
        ensure_flows_directory()
        
        # Add metadata
        save_data = {
            "flow_id": flow_id,
            "saved_at": datetime.now().isoformat(),
            "nodes": flow_data.get("nodes", []),
            "edges": flow_data.get("edges", [])
        }
        
        file_path = os.path.join(FLOWS_DIR, f"{flow_id}.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "message": f"Flow '{flow_id}' saved successfully",
            "flow_id": flow_id,
            "saved_at": save_data["saved_at"],
            "file_path": file_path
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to save flow: {str(e)}",
            "flow_id": flow_id,
            "error": str(e)
        }

def load_flow(flow_id: str = "default") -> Dict[str, Any]:
    """
    Load flow data from a JSON file
    
    Args:
        flow_id: ID for the flow to load
        
    Returns:
        Dictionary with flow data or error
    """
    try:
        ensure_flows_directory()
        file_path = os.path.join(FLOWS_DIR, f"{flow_id}.json")
        
        if not os.path.exists(file_path):
            return {
                "success": False,
                "message": f"Flow '{flow_id}' not found",
                "flow_id": flow_id,
                "nodes": [],
                "edges": []
            }
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {
            "success": True,
            "message": f"Flow '{flow_id}' loaded successfully",
            "flow_id": data.get("flow_id", flow_id),
            "saved_at": data.get("saved_at"),
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", [])
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load flow: {str(e)}",
            "flow_id": flow_id,
            "error": str(e),
            "nodes": [],
            "edges": []
        }

def list_flows() -> Dict[str, Any]:
    """
    List all available flows
    
    Returns:
        Dictionary with list of flows
    """
    try:
        ensure_flows_directory()
        
        flows = []
        for filename in os.listdir(FLOWS_DIR):
            if filename.endswith('.json'):
                flow_id = filename[:-5]  # Remove .json extension
                file_path = os.path.join(FLOWS_DIR, filename)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    flows.append({
                        "flow_id": flow_id,
                        "saved_at": data.get("saved_at"),
                        "node_count": len(data.get("nodes", [])),
                        "edge_count": len(data.get("edges", []))
                    })
                except:
                    # Skip corrupted files
                    continue
        
        # Sort by saved_at descending
        flows.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
        
        return {
            "success": True,
            "flows": flows,
            "count": len(flows)
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to list flows: {str(e)}",
            "flows": [],
            "count": 0
        } 