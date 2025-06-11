import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import TimerNode from './TimerNode';
import { TimerNodeData } from './TimerNode.types';

export const timerNodeConfig: NodeTypeConfig = {
    type: 'timer',
    displayName: 'Timer',
    description: 'Countdown timer with audio notification',
    icon: '⏰',
    color: '#2196f3',
    component: TimerNode,
    defaultData: {
        label: 'Timer',
        pythonFunction: `def process(inputs):
    # Timer completion message
    message = inputs.get("manual", "Timer completed!")
    return message`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'timer' as const,
        customData: {
            minutes: 5,
            isRunning: false,
            remainingSeconds: 300,
            originalSeconds: 300,
        }
    } as TimerNodeData
};

export const timerNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_timer',
        type: 'timer',
        position: {
            x: position.x - 140,
            y: position.y - 100,
        },
        data: {
            label: `Timer ${Date.now()}`,
            pythonFunction: `def process(inputs):
    # Timer completion message
    message = inputs.get("manual", "Timer completed!")
    return message`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'timer',
            customData: {
                minutes: 5,
                isRunning: false,
                remainingSeconds: 300,
                originalSeconds: 300,
            }
        } as BaseNodeData,
    };
}; 