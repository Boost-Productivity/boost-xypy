import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import SchedulerNode from './SchedulerNode';
import { SchedulerNodeData } from './SchedulerNode.types';

export const schedulerNodeConfig: NodeTypeConfig = {
    type: 'scheduler',
    displayName: 'Scheduler',
    description: 'Cron-based scheduler that triggers downstream nodes with datetime strings',
    icon: '⏰',
    color: '#607d8b',
    component: SchedulerNode,
    defaultData: {
        label: 'Scheduler',
        pythonFunction: `def process(inputs):
    # Scheduled trigger message with datetime
    message = inputs.get("manual", "Scheduled trigger")
    return f"Scheduled execution: {message}"`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'scheduler' as const,
        customData: {
            cronExpression: '0 9 * * 1-5', // Default: 9 AM weekdays
            isActive: false,
            timezone: 'America/New_York',
            triggerCount: 0,
            includeDate: true,
            includeTime: true,
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm:ss',
            customMessage: ''
        }
    } as SchedulerNodeData
};

export const schedulerNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_scheduler',
        type: 'scheduler',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Scheduler ${Date.now()}`,
            pythonFunction: `def process(inputs):
    # Scheduled trigger message with datetime
    message = inputs.get("manual", "Scheduled trigger")
    return f"Scheduled execution: {message}"`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'scheduler',
            customData: {
                cronExpression: '0 9 * * 1-5', // Default: 9 AM weekdays
                isActive: false,
                timezone: 'America/New_York',
                triggerCount: 0,
                includeDate: true,
                includeTime: true,
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm:ss',
                customMessage: ''
            }
        } as BaseNodeData,
    };
}; 