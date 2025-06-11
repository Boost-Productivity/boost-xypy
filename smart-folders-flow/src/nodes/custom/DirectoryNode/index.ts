import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import DirectoryNode from './DirectoryNode';
import { DirectoryNodeData } from './DirectoryNode.types';

export const directoryNodeConfig: NodeTypeConfig = {
    type: 'directory',
    displayName: 'Directory Creator',
    description: 'Create directories and return paths for chaining to other nodes',
    icon: '📁',
    color: '#8e24aa',
    component: DirectoryNode,
    defaultData: {
        label: 'Directory Creator',
        pythonFunction: `def process(inputs):
    import os
    import stat
    import platform
    
    directory_path = inputs.get("directory_path", "").strip()
    create_parents = inputs.get("create_parents", True)
    permissions = inputs.get("permissions", "755")
    
    if not directory_path:
        return "ERROR: No directory path specified"
    
    log_progress(f"📁 Directory Creator starting...")
    log_progress(f"🎯 Target path: {directory_path}")
    log_progress(f"👨‍👩‍👧‍👦 Create parents: {create_parents}")
    log_progress(f"🔐 Permissions: {permissions}")
    
    try:
        # Expand user path (~/something) and environment variables
        expanded_path = os.path.expanduser(os.path.expandvars(directory_path))
        log_progress(f"🔍 Expanded path: {expanded_path}")
        
        # Get absolute path for consistent output
        absolute_path = os.path.abspath(expanded_path)
        
        # Check if directory already exists
        if os.path.exists(expanded_path):
            if os.path.isdir(expanded_path):
                log_progress(f"✅ Directory already exists: {expanded_path}")
                log_progress(f"🎉 Using existing directory: {absolute_path}")
                return absolute_path
            else:
                error_msg = f"❌ Path exists but is not a directory: {expanded_path}"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
        
        # Create directory
        if create_parents:
            log_progress(f"🏗️ Creating directory and all parent directories...")
            os.makedirs(expanded_path, exist_ok=True)
        else:
            log_progress(f"🏗️ Creating directory (no parent creation)...")
            os.mkdir(expanded_path)
        
        # Set permissions on Unix-like systems
        if platform.system() != "Windows":
            try:
                # Convert permission string to octal
                octal_permissions = int(permissions, 8)
                os.chmod(expanded_path, octal_permissions)
                log_progress(f"🔐 Set permissions to {permissions} ({oct(octal_permissions)})")
            except (ValueError, OSError) as e:
                log_progress(f"⚠️ Could not set permissions: {e}")
        else:
            log_progress(f"🪟 Windows detected - skipping permission setting")
        
        # Verify creation
        if os.path.exists(expanded_path) and os.path.isdir(expanded_path):
            log_progress(f"📊 Directory created successfully!")
            log_progress(f"🎉 Final absolute path: {absolute_path}")
            return absolute_path
        else:
            error_msg = f"❌ Failed to create directory (verification failed): {expanded_path}"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
            
    except PermissionError as e:
        error_msg = f"❌ Permission denied: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except FileExistsError as e:
        error_msg = f"❌ File already exists at path: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except OSError as e:
        error_msg = f"❌ OS error creating directory: {str(e)}"
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
        nodeType: 'directory' as const,
        customData: {
            directoryPath: '',
            createParents: true,
            permissions: '755'
        }
    } as DirectoryNodeData
};

export const directoryNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_directory',
        type: 'directory',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: `Directory Creator ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    import stat
    import platform
    
    directory_path = inputs.get("directory_path", "").strip()
    create_parents = inputs.get("create_parents", True)
    permissions = inputs.get("permissions", "755")
    
    if not directory_path:
        return "ERROR: No directory path specified"
    
    log_progress(f"📁 Directory Creator starting...")
    log_progress(f"🎯 Target path: {directory_path}")
    log_progress(f"👨‍👩‍👧‍👦 Create parents: {create_parents}")
    log_progress(f"🔐 Permissions: {permissions}")
    
    try:
        # Expand user path (~/something) and environment variables
        expanded_path = os.path.expanduser(os.path.expandvars(directory_path))
        log_progress(f"🔍 Expanded path: {expanded_path}")
        
        # Get absolute path for consistent output
        absolute_path = os.path.abspath(expanded_path)
        
        # Check if directory already exists
        if os.path.exists(expanded_path):
            if os.path.isdir(expanded_path):
                log_progress(f"✅ Directory already exists: {expanded_path}")
                log_progress(f"🎉 Using existing directory: {absolute_path}")
                return absolute_path
            else:
                error_msg = f"❌ Path exists but is not a directory: {expanded_path}"
                log_progress(error_msg)
                return f"ERROR: {error_msg}"
        
        # Create directory
        if create_parents:
            log_progress(f"🏗️ Creating directory and all parent directories...")
            os.makedirs(expanded_path, exist_ok=True)
        else:
            log_progress(f"🏗️ Creating directory (no parent creation)...")
            os.mkdir(expanded_path)
        
        # Set permissions on Unix-like systems
        if platform.system() != "Windows":
            try:
                # Convert permission string to octal
                octal_permissions = int(permissions, 8)
                os.chmod(expanded_path, octal_permissions)
                log_progress(f"🔐 Set permissions to {permissions} ({oct(octal_permissions)})")
            except (ValueError, OSError) as e:
                log_progress(f"⚠️ Could not set permissions: {e}")
        else:
            log_progress(f"🪟 Windows detected - skipping permission setting")
        
        # Verify creation
        if os.path.exists(expanded_path) and os.path.isdir(expanded_path):
            log_progress(f"📊 Directory created successfully!")
            log_progress(f"🎉 Final absolute path: {absolute_path}")
            return absolute_path
        else:
            error_msg = f"❌ Failed to create directory (verification failed): {expanded_path}"
            log_progress(error_msg)
            return f"ERROR: {error_msg}"
            
    except PermissionError as e:
        error_msg = f"❌ Permission denied: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except FileExistsError as e:
        error_msg = f"❌ File already exists at path: {str(e)}"
        log_progress(error_msg)
        return f"ERROR: {error_msg}"
    except OSError as e:
        error_msg = f"❌ OS error creating directory: {str(e)}"
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
            nodeType: 'directory',
            customData: {
                directoryPath: '',
                createParents: true,
                permissions: '755'
            }
        } as BaseNodeData,
    };
}; 