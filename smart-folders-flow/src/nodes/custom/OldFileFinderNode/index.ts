import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import OldFileFinderNode from './OldFileFinderNode';
import { OldFileFinderNodeData } from './OldFileFinderNode.types';

export const oldFileFinderNodeConfig: NodeTypeConfig = {
    type: 'oldFileFinder',
    displayName: 'Old File Finder',
    description: 'Find files older than a specified time period',
    icon: '🔍',
    color: '#f59e0b',
    component: OldFileFinderNode,
    defaultData: {
        label: 'Old File Finder',
        pythonFunction: `def process(inputs):
    import os
    import glob
    import time
    import datetime
    
    directory = inputs.get("directory", "").strip()
    older_than = inputs.get("older_than", "30 days")
    file_pattern = inputs.get("file_pattern", "*")
    include_subdirectories = inputs.get("include_subdirectories", True)
    
    if not directory:
        return "ERROR: No directory specified"
    
    if not os.path.exists(directory):
        return f"ERROR: Directory does not exist: {directory}"
    
    log_progress(f"🔍 Searching for files in: {directory}")
    log_progress(f"📅 Finding files older than: {older_than}")
    log_progress(f"🎯 Pattern: {file_pattern}")
    log_progress(f"📁 Include subdirectories: {include_subdirectories}")
    
    # Parse the age threshold
    try:
        parts = older_than.lower().split()
        if len(parts) != 2:
            return f"ERROR: Invalid age format. Use format like '30 days' or '2 weeks'"
        
        amount = int(parts[0])
        unit = parts[1]
        
        # Convert to seconds
        if unit.startswith('second'):
            threshold_seconds = amount
        elif unit.startswith('minute'):
            threshold_seconds = amount * 60
        elif unit.startswith('hour'):
            threshold_seconds = amount * 3600
        elif unit.startswith('day'):
            threshold_seconds = amount * 86400
        elif unit.startswith('week'):
            threshold_seconds = amount * 604800
        elif unit.startswith('month'):
            threshold_seconds = amount * 2592000  # 30 days
        elif unit.startswith('year'):
            threshold_seconds = amount * 31536000  # 365 days
        else:
            return f"ERROR: Unknown time unit: {unit}"
            
    except ValueError:
        return f"ERROR: Invalid number in age format: {older_than}"
    
    # Calculate cutoff time
    cutoff_time = time.time() - threshold_seconds
    cutoff_date = datetime.datetime.fromtimestamp(cutoff_time)
    
    log_progress(f"⏰ Cutoff date: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Build search pattern
    if include_subdirectories:
        search_pattern = os.path.join(directory, "**", file_pattern)
        recursive = True
    else:
        search_pattern = os.path.join(directory, file_pattern)
        recursive = False
    
    log_progress(f"🔎 Search pattern: {search_pattern}")
    log_progress(f"🔄 Recursive: {recursive}")
    
    # Find matching files
    try:
        matching_files = glob.glob(search_pattern, recursive=recursive)
        log_progress(f"📋 Found {len(matching_files)} files matching pattern")
        
        old_files = []
        for file_path in matching_files:
            if os.path.isfile(file_path):  # Only check actual files
                try:
                    file_mtime = os.path.getmtime(file_path)
                    if file_mtime < cutoff_time:
                        file_date = datetime.datetime.fromtimestamp(file_mtime)
                        file_size = os.path.getsize(file_path)
                        old_files.append({
                            'path': file_path,
                            'modified': file_date.strftime('%Y-%m-%d %H:%M:%S'),
                            'size': file_size
                        })
                except (OSError, IOError) as e:
                    log_progress(f"⚠️ Could not check file: {file_path} - {e}")
        
        log_progress(f"🎯 Found {len(old_files)} old files")
        
        if not old_files:
            return f"No files found older than {older_than} in {directory}"
        
        # Sort by modification time (oldest first)
        old_files.sort(key=lambda x: x['modified'])
        
        # Format output
        result_lines = [f"Found {len(old_files)} files older than {older_than}:\\n"]
        total_size = 0
        
        for file_info in old_files:
            size_mb = file_info['size'] / (1024 * 1024)
            total_size += file_info['size']
            result_lines.append(f"• {file_info['path']}")
            result_lines.append(f"  Modified: {file_info['modified']}, Size: {size_mb:.2f} MB")
        
        total_size_mb = total_size / (1024 * 1024)
        result_lines.append(f"\\nTotal size: {total_size_mb:.2f} MB")
        
        # Also return as JSON for downstream processing
        import json
        file_paths = [f['path'] for f in old_files]
        result_lines.append(f"\\n--- FILE PATHS (JSON) ---")
        result_lines.append(json.dumps(file_paths, indent=2))
        
        return "\\n".join(result_lines)
        
    except Exception as e:
        error_msg = f"❌ Error searching for files: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'oldFileFinder' as const,
        customData: {
            directory: '',
            olderThan: '30 days',
            filePattern: '*',
            includeSubdirectories: true
        }
    } as OldFileFinderNodeData
};

export const oldFileFinderNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_oldFileFinder',
        type: 'oldFileFinder',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: `Old File Finder ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    import glob
    import time
    import datetime
    
    directory = inputs.get("directory", "").strip()
    older_than = inputs.get("older_than", "30 days")
    file_pattern = inputs.get("file_pattern", "*")
    include_subdirectories = inputs.get("include_subdirectories", True)
    
    if not directory:
        return "ERROR: No directory specified"
    
    if not os.path.exists(directory):
        return f"ERROR: Directory does not exist: {directory}"
    
    log_progress(f"🔍 Searching for files in: {directory}")
    log_progress(f"📅 Finding files older than: {older_than}")
    log_progress(f"🎯 Pattern: {file_pattern}")
    log_progress(f"📁 Include subdirectories: {include_subdirectories}")
    
    # Parse the age threshold
    try:
        parts = older_than.lower().split()
        if len(parts) != 2:
            return f"ERROR: Invalid age format. Use format like '30 days' or '2 weeks'"
        
        amount = int(parts[0])
        unit = parts[1]
        
        # Convert to seconds
        if unit.startswith('second'):
            threshold_seconds = amount
        elif unit.startswith('minute'):
            threshold_seconds = amount * 60
        elif unit.startswith('hour'):
            threshold_seconds = amount * 3600
        elif unit.startswith('day'):
            threshold_seconds = amount * 86400
        elif unit.startswith('week'):
            threshold_seconds = amount * 604800
        elif unit.startswith('month'):
            threshold_seconds = amount * 2592000  # 30 days
        elif unit.startswith('year'):
            threshold_seconds = amount * 31536000  # 365 days
        else:
            return f"ERROR: Unknown time unit: {unit}"
            
    except ValueError:
        return f"ERROR: Invalid number in age format: {older_than}"
    
    # Calculate cutoff time
    cutoff_time = time.time() - threshold_seconds
    cutoff_date = datetime.datetime.fromtimestamp(cutoff_time)
    
    log_progress(f"⏰ Cutoff date: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Build search pattern
    if include_subdirectories:
        search_pattern = os.path.join(directory, "**", file_pattern)
        recursive = True
    else:
        search_pattern = os.path.join(directory, file_pattern)
        recursive = False
    
    log_progress(f"🔎 Search pattern: {search_pattern}")
    log_progress(f"🔄 Recursive: {recursive}")
    
    # Find matching files
    try:
        matching_files = glob.glob(search_pattern, recursive=recursive)
        log_progress(f"📋 Found {len(matching_files)} files matching pattern")
        
        old_files = []
        for file_path in matching_files:
            if os.path.isfile(file_path):  # Only check actual files
                try:
                    file_mtime = os.path.getmtime(file_path)
                    if file_mtime < cutoff_time:
                        file_date = datetime.datetime.fromtimestamp(file_mtime)
                        file_size = os.path.getsize(file_path)
                        old_files.append({
                            'path': file_path,
                            'modified': file_date.strftime('%Y-%m-%d %H:%M:%S'),
                            'size': file_size
                        })
                except (OSError, IOError) as e:
                    log_progress(f"⚠️ Could not check file: {file_path} - {e}")
        
        log_progress(f"🎯 Found {len(old_files)} old files")
        
        if not old_files:
            return f"No files found older than {older_than} in {directory}"
        
        # Sort by modification time (oldest first)
        old_files.sort(key=lambda x: x['modified'])
        
        # Format output
        result_lines = [f"Found {len(old_files)} files older than {older_than}:\\n"]
        total_size = 0
        
        for file_info in old_files:
            size_mb = file_info['size'] / (1024 * 1024)
            total_size += file_info['size']
            result_lines.append(f"• {file_info['path']}")
            result_lines.append(f"  Modified: {file_info['modified']}, Size: {size_mb:.2f} MB")
        
        total_size_mb = total_size / (1024 * 1024)
        result_lines.append(f"\\nTotal size: {total_size_mb:.2f} MB")
        
        # Also return as JSON for downstream processing
        import json
        file_paths = [f['path'] for f in old_files]
        result_lines.append(f"\\n--- FILE PATHS (JSON) ---")
        result_lines.append(json.dumps(file_paths, indent=2))
        
        return "\\n".join(result_lines)
        
    except Exception as e:
        error_msg = f"❌ Error searching for files: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'oldFileFinder',
            customData: {
                directory: '',
                olderThan: '30 days',
                filePattern: '*',
                includeSubdirectories: true
            }
        } as BaseNodeData,
    };
}; 