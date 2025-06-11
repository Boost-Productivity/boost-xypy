import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import OldFileDeleterNode from './OldFileDeleterNode';
import { OldFileDeleterNodeData } from './OldFileDeleterNode.types';

export const oldFileDeleterNodeConfig: NodeTypeConfig = {
    type: 'oldFileDeleter',
    displayName: 'Old File Deleter',
    description: 'Safely delete files with options for dry run and trash',
    icon: '🗑️',
    color: '#ef4444',
    component: OldFileDeleterNode,
    defaultData: {
        label: 'Old File Deleter',
        pythonFunction: `def process(inputs):
    import os
    import json
    import datetime
    import shutil
    
    file_paths = inputs.get("file_paths", [])
    dry_run = inputs.get("dry_run", False)
    move_to_trash = inputs.get("move_to_trash", True)
    confirm_before_delete = inputs.get("confirm_before_delete", True)
    manual_confirmation = inputs.get("manual_confirmation", False)
    
    if not file_paths:
        return "ERROR: No file paths provided"
    
    if not isinstance(file_paths, list):
        try:
            # Try to parse as JSON if it's a string
            file_paths = json.loads(str(file_paths))
        except:
            # Try to split by lines if it's a text list
            file_paths = str(file_paths).strip().split('\\n')
            file_paths = [p.strip() for p in file_paths if p.strip()]
    
    if not file_paths:
        return "ERROR: No valid file paths found"
    
    log_progress(f"🗑️ File Deleter starting...")
    log_progress(f"📁 Files to process: {len(file_paths)}")
    log_progress(f"🔍 Dry run: {dry_run}")
    log_progress(f"🗑️ Move to trash: {move_to_trash}")
    log_progress(f"⚠️ Confirm each: {confirm_before_delete}")
    
    results = {
        'processed': 0,
        'deleted': 0,
        'skipped': 0,
        'errors': 0,
        'total_size_freed': 0,
        'details': []
    }
    
    # Function to get file size safely
    def get_file_size(path):
        try:
            return os.path.getsize(path)
        except:
            return 0
    
    # Function to move to trash (cross-platform)
    def move_to_trash_safe(file_path):
        try:
            # Try to use system trash
            import platform
            system = platform.system()
            
            if system == "Darwin":  # macOS
                os.system(f'osascript -e "tell application \\"Finder\\" to delete POSIX file \\"{file_path}\\""')
                return True
            elif system == "Windows":
                # Use send2trash if available, otherwise move to Recycle Bin
                try:
                    import send2trash
                    send2trash.send2trash(file_path)
                    return True
                except ImportError:
                    # Fallback to moving to a .trash folder
                    trash_dir = os.path.join(os.path.dirname(file_path), '.trash')
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
            else:  # Linux and others
                # Move to ~/.local/share/Trash/files/ if it exists
                trash_dir = os.path.expanduser("~/.local/share/Trash/files")
                if os.path.exists(os.path.dirname(trash_dir)):
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
                else:
                    # Fallback: move to .trash folder in same directory
                    trash_dir = os.path.join(os.path.dirname(file_path), '.trash')
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
        except Exception as e:
            log_progress(f"❌ Failed to move to trash: {e}")
            return False
    
    # Process each file
    for i, file_path in enumerate(file_paths):
        results['processed'] += 1
        file_path = file_path.strip()
        
        if not file_path:
            continue
            
        log_progress(f"🔍 [{i+1}/{len(file_paths)}] Checking: {file_path}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            log_progress(f"⚠️ File not found: {file_path}")
            results['skipped'] += 1
            results['details'].append(f"SKIPPED (not found): {file_path}")
            continue
        
        # Check if it's actually a file
        if not os.path.isfile(file_path):
            log_progress(f"⚠️ Not a file: {file_path}")
            results['skipped'] += 1
            results['details'].append(f"SKIPPED (not a file): {file_path}")
            continue
        
        # Get file info
        try:
            file_size = get_file_size(file_path)
            file_size_mb = file_size / (1024 * 1024)
            file_mtime = os.path.getmtime(file_path)
            file_date = datetime.datetime.fromtimestamp(file_mtime).strftime('%Y-%m-%d %H:%M:%S')
            
            file_info = f"{file_path} ({file_size_mb:.2f} MB, modified: {file_date})"
            
            if dry_run:
                log_progress(f"👁️ PREVIEW: Would delete {file_info}")
                results['deleted'] += 1
                results['total_size_freed'] += file_size
                results['details'].append(f"WOULD DELETE: {file_info}")
                continue
            
            # Actual deletion
            success = False
            if move_to_trash:
                log_progress(f"🗑️ Moving to trash: {file_info}")
                success = move_to_trash_safe(file_path)
                if success:
                    results['details'].append(f"MOVED TO TRASH: {file_info}")
                else:
                    results['details'].append(f"FAILED TO TRASH: {file_info}")
            else:
                log_progress(f"💥 Permanently deleting: {file_info}")
                try:
                    os.remove(file_path)
                    success = True
                    results['details'].append(f"PERMANENTLY DELETED: {file_info}")
                except Exception as e:
                    log_progress(f"❌ Failed to delete: {e}")
                    results['details'].append(f"FAILED TO DELETE: {file_info} - {e}")
            
            if success:
                results['deleted'] += 1
                results['total_size_freed'] += file_size
                log_progress(f"✅ Successfully processed: {file_path}")
            else:
                results['errors'] += 1
                
        except Exception as e:
            log_progress(f"❌ Error processing {file_path}: {e}")
            results['errors'] += 1
            results['details'].append(f"ERROR: {file_path} - {e}")
    
    # Summary
    total_size_mb = results['total_size_freed'] / (1024 * 1024)
    
    summary_lines = []
    summary_lines.append(f"{'=' * 50}")
    summary_lines.append(f"FILE DELETION SUMMARY")
    summary_lines.append(f"{'=' * 50}")
    summary_lines.append(f"Mode: {'DRY RUN (Preview)' if dry_run else 'LIVE DELETION'}")
    summary_lines.append(f"Method: {'Move to Trash' if move_to_trash and not dry_run else 'Permanent Delete' if not dry_run else 'Preview'}")
    summary_lines.append(f"")
    summary_lines.append(f"📊 STATISTICS:")
    summary_lines.append(f"  • Files processed: {results['processed']}")
    summary_lines.append(f"  • Files {'previewed' if dry_run else 'deleted'}: {results['deleted']}")
    summary_lines.append(f"  • Files skipped: {results['skipped']}")
    summary_lines.append(f"  • Errors: {results['errors']}")
    summary_lines.append(f"  • Space {'would be' if dry_run else ''} freed: {total_size_mb:.2f} MB")
    summary_lines.append(f"")
    
    if results['details']:
        summary_lines.append(f"📋 DETAILED RESULTS:")
        for detail in results['details']:
            summary_lines.append(f"  {detail}")
    
    if dry_run:
        summary_lines.append(f"")
        summary_lines.append(f"💡 This was a DRY RUN - no files were actually deleted.")
        summary_lines.append(f"   Uncheck 'Dry Run' to perform actual deletion.")
    
    result_text = "\\n".join(summary_lines)
    
    if results['deleted'] > 0:
        log_progress(f"🎉 Completed! {'Previewed' if dry_run else 'Deleted'} {results['deleted']} files, freed {total_size_mb:.2f} MB")
    else:
        log_progress(f"ℹ️ No files were processed")
    
    return result_text`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'oldFileDeleter' as const,
        customData: {
            confirmBeforeDelete: true,
            dryRun: false,
            moveToTrash: true,
            requireManualConfirmation: true
        }
    } as OldFileDeleterNodeData
};

export const oldFileDeleterNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_oldFileDeleter',
        type: 'oldFileDeleter',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: `Old File Deleter ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    import json
    import datetime
    import shutil
    
    file_paths = inputs.get("file_paths", [])
    dry_run = inputs.get("dry_run", False)
    move_to_trash = inputs.get("move_to_trash", True)
    confirm_before_delete = inputs.get("confirm_before_delete", True)
    manual_confirmation = inputs.get("manual_confirmation", False)
    
    if not file_paths:
        return "ERROR: No file paths provided"
    
    if not isinstance(file_paths, list):
        try:
            # Try to parse as JSON if it's a string
            file_paths = json.loads(str(file_paths))
        except:
            # Try to split by lines if it's a text list
            file_paths = str(file_paths).strip().split('\\n')
            file_paths = [p.strip() for p in file_paths if p.strip()]
    
    if not file_paths:
        return "ERROR: No valid file paths found"
    
    log_progress(f"🗑️ File Deleter starting...")
    log_progress(f"📁 Files to process: {len(file_paths)}")
    log_progress(f"🔍 Dry run: {dry_run}")
    log_progress(f"🗑️ Move to trash: {move_to_trash}")
    log_progress(f"⚠️ Confirm each: {confirm_before_delete}")
    
    results = {
        'processed': 0,
        'deleted': 0,
        'skipped': 0,
        'errors': 0,
        'total_size_freed': 0,
        'details': []
    }
    
    # Function to get file size safely
    def get_file_size(path):
        try:
            return os.path.getsize(path)
        except:
            return 0
    
    # Function to move to trash (cross-platform)
    def move_to_trash_safe(file_path):
        try:
            # Try to use system trash
            import platform
            system = platform.system()
            
            if system == "Darwin":  # macOS
                os.system(f'osascript -e "tell application \\"Finder\\" to delete POSIX file \\"{file_path}\\""')
                return True
            elif system == "Windows":
                # Use send2trash if available, otherwise move to Recycle Bin
                try:
                    import send2trash
                    send2trash.send2trash(file_path)
                    return True
                except ImportError:
                    # Fallback to moving to a .trash folder
                    trash_dir = os.path.join(os.path.dirname(file_path), '.trash')
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
            else:  # Linux and others
                # Move to ~/.local/share/Trash/files/ if it exists
                trash_dir = os.path.expanduser("~/.local/share/Trash/files")
                if os.path.exists(os.path.dirname(trash_dir)):
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
                else:
                    # Fallback: move to .trash folder in same directory
                    trash_dir = os.path.join(os.path.dirname(file_path), '.trash')
                    os.makedirs(trash_dir, exist_ok=True)
                    trash_path = os.path.join(trash_dir, f"{os.path.basename(file_path)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    shutil.move(file_path, trash_path)
                    return True
        except Exception as e:
            log_progress(f"❌ Failed to move to trash: {e}")
            return False
    
    # Process each file
    for i, file_path in enumerate(file_paths):
        results['processed'] += 1
        file_path = file_path.strip()
        
        if not file_path:
            continue
            
        log_progress(f"🔍 [{i+1}/{len(file_paths)}] Checking: {file_path}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            log_progress(f"⚠️ File not found: {file_path}")
            results['skipped'] += 1
            results['details'].append(f"SKIPPED (not found): {file_path}")
            continue
        
        # Check if it's actually a file
        if not os.path.isfile(file_path):
            log_progress(f"⚠️ Not a file: {file_path}")
            results['skipped'] += 1
            results['details'].append(f"SKIPPED (not a file): {file_path}")
            continue
        
        # Get file info
        try:
            file_size = get_file_size(file_path)
            file_size_mb = file_size / (1024 * 1024)
            file_mtime = os.path.getmtime(file_path)
            file_date = datetime.datetime.fromtimestamp(file_mtime).strftime('%Y-%m-%d %H:%M:%S')
            
            file_info = f"{file_path} ({file_size_mb:.2f} MB, modified: {file_date})"
            
            if dry_run:
                log_progress(f"👁️ PREVIEW: Would delete {file_info}")
                results['deleted'] += 1
                results['total_size_freed'] += file_size
                results['details'].append(f"WOULD DELETE: {file_info}")
                continue
            
            # Actual deletion
            success = False
            if move_to_trash:
                log_progress(f"🗑️ Moving to trash: {file_info}")
                success = move_to_trash_safe(file_path)
                if success:
                    results['details'].append(f"MOVED TO TRASH: {file_info}")
                else:
                    results['details'].append(f"FAILED TO TRASH: {file_info}")
            else:
                log_progress(f"💥 Permanently deleting: {file_info}")
                try:
                    os.remove(file_path)
                    success = True
                    results['details'].append(f"PERMANENTLY DELETED: {file_info}")
                except Exception as e:
                    log_progress(f"❌ Failed to delete: {e}")
                    results['details'].append(f"FAILED TO DELETE: {file_info} - {e}")
            
            if success:
                results['deleted'] += 1
                results['total_size_freed'] += file_size
                log_progress(f"✅ Successfully processed: {file_path}")
            else:
                results['errors'] += 1
                
        except Exception as e:
            log_progress(f"❌ Error processing {file_path}: {e}")
            results['errors'] += 1
            results['details'].append(f"ERROR: {file_path} - {e}")
    
    # Summary
    total_size_mb = results['total_size_freed'] / (1024 * 1024)
    
    summary_lines = []
    summary_lines.append(f"{'=' * 50}")
    summary_lines.append(f"FILE DELETION SUMMARY")
    summary_lines.append(f"{'=' * 50}")
    summary_lines.append(f"Mode: {'DRY RUN (Preview)' if dry_run else 'LIVE DELETION'}")
    summary_lines.append(f"Method: {'Move to Trash' if move_to_trash and not dry_run else 'Permanent Delete' if not dry_run else 'Preview'}")
    summary_lines.append(f"")
    summary_lines.append(f"📊 STATISTICS:")
    summary_lines.append(f"  • Files processed: {results['processed']}")
    summary_lines.append(f"  • Files {'previewed' if dry_run else 'deleted'}: {results['deleted']}")
    summary_lines.append(f"  • Files skipped: {results['skipped']}")
    summary_lines.append(f"  • Errors: {results['errors']}")
    summary_lines.append(f"  • Space {'would be' if dry_run else ''} freed: {total_size_mb:.2f} MB")
    summary_lines.append(f"")
    
    if results['details']:
        summary_lines.append(f"📋 DETAILED RESULTS:")
        for detail in results['details']:
            summary_lines.append(f"  {detail}")
    
    if dry_run:
        summary_lines.append(f"")
        summary_lines.append(f"💡 This was a DRY RUN - no files were actually deleted.")
        summary_lines.append(f"   Uncheck 'Dry Run' to perform actual deletion.")
    
    result_text = "\\n".join(summary_lines)
    
    if results['deleted'] > 0:
        log_progress(f"🎉 Completed! {'Previewed' if dry_run else 'Deleted'} {results['deleted']} files, freed {total_size_mb:.2f} MB")
    else:
        log_progress(f"ℹ️ No files were processed")
    
    return result_text`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'oldFileDeleter',
            customData: {
                confirmBeforeDelete: true,
                dryRun: false,
                moveToTrash: true,
                requireManualConfirmation: true
            }
        } as BaseNodeData,
    };
}; 