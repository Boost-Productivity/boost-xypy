import time
import traceback
from typing import Dict, Any, Optional
import math
import string
import re
import json
import datetime
import random
import collections
import itertools
import anthropic
import os
import uuid
import glob
import subprocess
import tempfile
import zipfile
import google.cloud
import google.cloud.storage

# Available modules that users can import
AVAILABLE_MODULES = {
    'math': math,
    'string': string,
    're': re,
    'json': json,
    'datetime': datetime,
    'random': random,
    'collections': collections,
    'itertools': itertools,
    'anthropic': anthropic,
    'os': os,
    'uuid': uuid,
    'glob': glob,
    'subprocess': subprocess,
    'time': time,
    'zipfile': zipfile,
    'tempfile': tempfile,
    'google': google,
    'google.cloud': google.cloud,
    'google.cloud.storage': google.cloud.storage,
    'storage': google.cloud.storage,  # Add direct access to storage module
}

def execute_python_function(function_code: str, input_value: str, timeout: int = 600, log_file_id: str = None) -> Dict[str, Any]:
    """
    Execute a Python function with file-based logging for streaming updates.
    """
    start_time = time.time()
    
    if log_file_id is None:
        log_file_id = str(uuid.uuid4())
    
    log_path = os.path.join(tempfile.gettempdir(), f"smart_folder_log_{log_file_id}.txt")
    
    try:
        # Create log file if it doesn't exist, or append if it does
        if not os.path.exists(log_path):
            with open(log_path, 'w') as log:
                log.write("🚀 Starting execution...\n")
                log.flush()
        
        # Compile the Python code
        with open(log_path, 'a') as log:
            log.write("⚙️ Compiling function...\n")
            log.flush()
            
        code = compile(function_code, filename="<user_function>", mode="exec")
        
        # Set up execution environment with all standard modules
        exec_globals = globals().copy()
        exec_globals.update(AVAILABLE_MODULES)
        
        # Add log file path to globals so function can write to it
        exec_globals['_log_file_path'] = log_path
        
        # Add logging helper function
        def log_progress(message):
            """Helper function for user code to log progress"""
            try:
                with open(log_path, 'a') as log:
                    log.write(f"{message}\n")
                    log.flush()
            except:
                pass  # Fail silently if logging fails
        
        exec_globals['log_progress'] = log_progress
        
        with open(log_path, 'a') as log:
            log.write("⚙️ Executing function...\n")
            log.flush()
        
        # Execute the code
        local_vars = {}
        exec(code, exec_globals, local_vars)
        
        # Check if 'process' function exists
        if 'process' not in local_vars:
            with open(log_path, 'a') as log:
                log.write("❌ Function 'process(inputs)' not found in code\n")
                log.flush()
            return {
                "success": False,
                "output": None,
                "execution_time": time.time() - start_time,
                "error": "Function 'process(inputs)' not found in code. The function should accept a dictionary of inputs.",
                "error_type": "FunctionNotFoundError",
                "log_file_id": log_file_id,
                "log_path": log_path
            }
        
        process_func = local_vars['process']
        
        with open(log_path, 'a') as log:
            log.write("🚀 Executing process function...\n")
            log.flush()
        
        # Parse input_value as JSON to get multiple inputs, fallback to single input
        try:
            if input_value.strip().startswith('{'):
                # Multiple inputs as JSON
                inputs_dict = json.loads(input_value)
                with open(log_path, 'a') as log:
                    log.write(f"📊 Processing multiple inputs: {list(inputs_dict.keys())}\n")
                    log.flush()
            else:
                # Single input (backward compatibility)
                inputs_dict = {"input": input_value}
                with open(log_path, 'a') as log:
                    log.write("📝 Processing single input (legacy mode)\n")
                    log.flush()
        except json.JSONDecodeError:
            # Treat as single string input
            inputs_dict = {"input": input_value}
            with open(log_path, 'a') as log:
                log.write("📝 Processing single string input\n")
                log.flush()
        
        # Execute the process function
        try:
            result = process_func(inputs_dict)
        except Exception as e:
            with open(log_path, 'a') as log:
                log.write(f"❌ Function raised exception: {str(e)}\n")
                log.flush()
            raise e
        
        execution_time = time.time() - start_time
        
        # Convert result to string if it's not already
        if result is not None:
            output = str(result)
        else:
            output = "None"
        
        with open(log_path, 'a') as log:
            log.write("✅ Execution completed successfully!\n")
            log.flush()
        
        return {
            "success": True,
            "output": output,
            "execution_time": execution_time,
            "error": None,
            "error_type": None,
            "log_file_id": log_file_id,
            "log_path": log_path
        }
        
    except TimeoutError as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": str(e),
            "error_type": "TimeoutError",
            "log_file_id": log_file_id,
            "log_path": log_path
        }
    except SyntaxError as e:
        with open(log_path, 'a') as log:
            log.write(f"❌ SyntaxError: {str(e)}\n")
            log.flush()
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": f"SyntaxError: {str(e)}",
            "error_type": "SyntaxError",
            "log_file_id": log_file_id,
            "log_path": log_path
        }
    except ImportError as e:
        with open(log_path, 'a') as log:
            log.write(f"❌ ImportError: {str(e)}\n")
            log.flush()
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": str(e),
            "error_type": "ImportError",
            "log_file_id": log_file_id,
            "log_path": log_path
        }
    except Exception as e:
        with open(log_path, 'a') as log:
            log.write(f"❌ RuntimeError: {str(e)}\n")
            log.flush()
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": f"RuntimeError: {str(e)}",
            "error_type": "RuntimeError",
            "log_file_id": log_file_id,
            "log_path": log_path
        } 