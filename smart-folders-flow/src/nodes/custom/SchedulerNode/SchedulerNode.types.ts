import { BaseNodeData } from '../../base/BaseNode.types';

export interface SchedulerNodeData extends BaseNodeData {
    nodeType: 'scheduler';
    customData: {
        cronExpression: string; // Cron expression (e.g., "0 9 * * 1-5")
        isActive: boolean; // Whether the scheduler is running
        timezone: string; // Timezone for scheduling
        lastTriggered?: number; // Timestamp of last trigger
        nextTrigger?: number; // Timestamp of next scheduled trigger
        triggerCount: number; // Number of times triggered
        includeDate: boolean; // Include date in output
        includeTime: boolean; // Include time in output
        dateFormat: string; // Date format string
        timeFormat: string; // Time format string
        customMessage?: string; // Optional custom message to include
        lastTriggerMessage?: string; // Last message sent downstream
    };
} 