import type { Roast, AnalysisResult } from '../types';
import { TEMPLATES } from './templates';

export function generateRoast(analysis: AnalysisResult): Roast {
    const eventType = analysis.event.type;
    const severities = ['savage', 'medium', 'mild'] as const;

    const matched = severities
        .map(sev => TEMPLATES.filter(t =>
            t.eventTypes.includes(eventType) &&
            t.severities.includes(sev) &&
            (!t.predicate || t.predicate(analysis))
        ))
        .flat();

    if (matched.length === 0) {
        return {
            message: 'Git event detected. Not enough drama to roast... yet.',
            severity: 'mild',
            advice: 'Keep committing. We are building a profile of your habits.',
        };
    }

    const template = matched[Math.floor(Math.random() * matched.length)];
    let message = template.templates[Math.floor(Math.random() * template.templates.length)];

    // Interpolate placeholders from analysis metadata
    const meta = analysis.event.metadata;
    message = message.replace(/{message}/g, (meta?.message as string) || '???');
    message = message.replace(/{branch}/g, (meta?.branch as string) || 'this branch');
    message = message.replace(/{files}/g, String(meta?.filesChanged || 'many'));
    message = message.replace(/{insertions}/g, String(meta?.insertions || 0));
    message = message.replace(/{deletions}/g, String(meta?.deletions || 0));
    const hour = new Date(analysis.event.timestamp).getHours();
    message = message.replace(/{hour}/g, `${hour}:00`);

    // Determine overall severity from the worst verdict
    const hasCritical = analysis.verdicts.some(v => v.severity === 'critical');
    const hasWarning = analysis.verdicts.some(v => v.severity === 'warning');
    const severity: 'mild' | 'medium' | 'savage' = hasCritical
        ? 'savage'
        : hasWarning
            ? 'medium'
            : 'mild';

    return {
        message,
        severity,
        advice: template.advice,
    };
}
