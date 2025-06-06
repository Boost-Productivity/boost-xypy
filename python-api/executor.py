import time
import traceback
from typing import Dict, Any, Optional
from RestrictedPython import compile_restricted
from RestrictedPython.Guards import safe_globals, safe_builtins
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

# Safe modules that users can import
SAFE_MODULES = {
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
}

def safe_import(name, *args, **kwargs):
    """Custom import function that only allows safe modules"""
    if name in SAFE_MODULES:
        return SAFE_MODULES[name]
    raise ImportError(f"Module '{name}' is not allowed")

def execute_python_function_with_logging(function_code: str, input_value: str, timeout: int = 600, log_file_id: str = None) -> Dict[str, Any]:
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
        
        # Compile the restricted Python code
        with open(log_path, 'a') as log:
            log.write("⚙️ Compiling function...\n")
            log.flush()
            
        code = compile_restricted(function_code, filename="<user_function>", mode="exec")
        
        if code is None:
            with open(log_path, 'a') as log:
                log.write("❌ Failed to compile code - syntax error or security violation\n")
                log.flush()
            return {
                "success": False,
                "output": None,
                "execution_time": 0,
                "error": "Failed to compile code - syntax error or security violation",
                "error_type": "CompilationError",
                "log_file_id": log_file_id,
                "log_path": log_path
            }
        
        # Set up safe execution environment (same as original)
        safe_globals_dict = safe_globals.copy()
        safe_globals_dict['__builtins__'] = safe_builtins.copy()
        safe_globals_dict['__builtins__']['__import__'] = safe_import
        safe_globals_dict['__builtins__']['open'] = open
        safe_globals_dict['__builtins__']['max'] = max
        safe_globals_dict['__builtins__']['min'] = min
        safe_globals_dict['__builtins__']['len'] = len
        safe_globals_dict['__builtins__']['sum'] = sum
        safe_globals_dict['__builtins__']['sorted'] = sorted
        safe_globals_dict['__builtins__']['reversed'] = reversed
        safe_globals_dict['__builtins__']['enumerate'] = enumerate
        safe_globals_dict['__builtins__']['zip'] = zip
        safe_globals_dict['__builtins__']['all'] = all
        safe_globals_dict['__builtins__']['any'] = any
        safe_globals_dict['_getattr_'] = getattr
        safe_globals_dict['_getitem_'] = lambda obj, key: obj[key]
        safe_globals_dict['_write_'] = lambda x: x
        safe_globals_dict['_getiter_'] = lambda obj: iter(obj)
        
        # Proper inplace variable handler for RestrictedPython
        def _inplacevar_(op, obj, other):
            if op == '+=':
                return obj + other
            elif op == '-=':
                return obj - other
            elif op == '*=':
                return obj * other
            elif op == '/=':
                return obj / other
            elif op == '//=':
                return obj // other
            elif op == '%=':
                return obj % other
            elif op == '**=':
                return obj ** other
            elif op == '&=':
                return obj & other
            elif op == '|=':
                return obj | other
            elif op == '^=':
                return obj ^ other
            elif op == '<<=':
                return obj << other
            elif op == '>>=':
                return obj >> other
            else:
                raise TypeError(f"unsupported inplace operation: {op}")
        
        safe_globals_dict['_inplacevar_'] = _inplacevar_
        safe_globals_dict.update(SAFE_MODULES)
        
        # Add log file path to globals so function can write to it
        safe_globals_dict['_log_file_path'] = log_path
        
        # Add logging helper function
        def log_progress(message):
            """Helper function for user code to log progress"""
            try:
                with open(log_path, 'a') as log:
                    log.write(f"{message}\n")
                    log.flush()
            except:
                pass  # Fail silently if logging fails
        
        safe_globals_dict['log_progress'] = log_progress
        
        with open(log_path, 'a') as log:
            log.write("⚙️ Executing function...\n")
            log.flush()
        
        # Execute the code
        local_vars = {}
        exec(code, safe_globals_dict, local_vars)
        
        # Check if 'process' function exists
        if 'process' not in local_vars:
            with open(log_path, 'a') as log:
                log.write("❌ Function 'process(input_text)' not found in code\n")
                log.flush()
            return {
                "success": False,
                "output": None,
                "execution_time": time.time() - start_time,
                "error": "Function 'process(input_text)' not found in code",
                "error_type": "FunctionNotFoundError",
                "log_file_id": log_file_id,
                "log_path": log_path
            }
        
        process_func = local_vars['process']
        
        with open(log_path, 'a') as log:
            log.write("🚀 Executing process function...\n")
            log.flush()
        
        # Execute the process function (simplified timeout for background threads)
        try:
            result = process_func(input_value)
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
    finally:
        # No cleanup needed for background thread execution
        pass

def execute_python_function(function_code: str, input_value: str, timeout: int = 600) -> Dict[str, Any]:
    """
    Safely execute a Python function with the given input.
    
    Args:
        function_code: Python function code as string
        input_value: Input string to pass to the function
        timeout: Maximum execution time in seconds
        
    Returns:
        Dictionary with success, output, execution_time, and error information
    """
    start_time = time.time()
    
    try:
        # Compile the restricted Python code
        code = compile_restricted(function_code, filename="<user_function>", mode="exec")
        
        if code is None:
            return {
                "success": False,
                "output": None,
                "execution_time": 0,
                "error": "Failed to compile code - syntax error or security violation",
                "error_type": "CompilationError"
            }
        
        # Set up safe execution environment
        safe_globals_dict = safe_globals.copy()
        safe_globals_dict['__builtins__'] = safe_builtins.copy()
        safe_globals_dict['__builtins__']['__import__'] = safe_import
        safe_globals_dict['__builtins__']['open'] = open  # Add file open capability
        safe_globals_dict['__builtins__']['max'] = max
        safe_globals_dict['__builtins__']['min'] = min
        safe_globals_dict['__builtins__']['len'] = len
        safe_globals_dict['__builtins__']['sum'] = sum
        safe_globals_dict['__builtins__']['sorted'] = sorted
        safe_globals_dict['__builtins__']['reversed'] = reversed
        safe_globals_dict['__builtins__']['enumerate'] = enumerate
        safe_globals_dict['__builtins__']['zip'] = zip
        safe_globals_dict['__builtins__']['all'] = all
        safe_globals_dict['__builtins__']['any'] = any
        safe_globals_dict['_getattr_'] = getattr
        safe_globals_dict['_getitem_'] = lambda obj, key: obj[key]
        safe_globals_dict['_write_'] = lambda x: x  # Allow writing to variables
        safe_globals_dict['_getiter_'] = lambda obj: iter(obj)  # Allow iteration (for loops)
        
        # Proper inplace variable handler for RestrictedPython
        def _inplacevar_(op, obj, other):
            if op == '+=':
                return obj + other
            elif op == '-=':
                return obj - other
            elif op == '*=':
                return obj * other
            elif op == '/=':
                return obj / other
            elif op == '//=':
                return obj // other
            elif op == '%=':
                return obj % other
            elif op == '**=':
                return obj ** other
            elif op == '&=':
                return obj & other
            elif op == '|=':
                return obj | other
            elif op == '^=':
                return obj ^ other
            elif op == '<<=':
                return obj << other
            elif op == '>>=':
                return obj >> other
            else:
                raise TypeError(f"unsupported inplace operation: {op}")
        
        safe_globals_dict['_inplacevar_'] = _inplacevar_
        
        # Add safe modules to globals
        safe_globals_dict.update(SAFE_MODULES)
        
        # Execute the code
        local_vars = {}
        exec(code, safe_globals_dict, local_vars)
        
        # Check if 'process' function exists
        if 'process' not in local_vars:
            return {
                "success": False,
                "output": None,
                "execution_time": time.time() - start_time,
                "error": "Function 'process(input_text)' not found in code",
                "error_type": "FunctionNotFoundError"
            }
        
        process_func = local_vars['process']
        
        with open(log_path, 'a') as log:
            log.write("🚀 Executing process function...\n")
            log.flush()
        
        # Execute the process function (simplified timeout for background threads)
        try:
            result = process_func(input_value)
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
        
        return {
            "success": True,
            "output": output,
            "execution_time": execution_time,
            "error": None,
            "error_type": None
        }
        
    except TimeoutError as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": str(e),
            "error_type": "TimeoutError"
        }
    except SyntaxError as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": f"SyntaxError: {str(e)}",
            "error_type": "SyntaxError"
        }
    except ImportError as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": str(e),
            "error_type": "ImportError"
        }
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": f"RuntimeError: {str(e)}",
            "error_type": "RuntimeError"
        }
    finally:
        # No cleanup needed for background thread execution
        pass 