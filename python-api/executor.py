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
}

def safe_import(name, *args, **kwargs):
    """Custom import function that only allows safe modules"""
    if name in SAFE_MODULES:
        return SAFE_MODULES[name]
    raise ImportError(f"Module '{name}' is not allowed")

def execute_python_function(function_code: str, input_value: str, timeout: int = 5) -> Dict[str, Any]:
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
        
        # Execute the process function with timeout protection
        def run_with_timeout():
            return process_func(input_value)
        
        # Simple timeout implementation
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError(f"Function execution exceeded {timeout} seconds")
        
        # Set up timeout (Unix-like systems only)
        try:
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout)
            
            result = run_with_timeout()
            
            signal.alarm(0)  # Cancel the alarm
        except AttributeError:
            # Windows doesn't support signal.alarm, use a basic execution
            result = run_with_timeout()
        
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
        # Make sure to cancel any remaining alarms
        try:
            signal.alarm(0)
        except:
            pass 