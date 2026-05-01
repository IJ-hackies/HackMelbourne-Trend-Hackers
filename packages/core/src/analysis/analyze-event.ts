import type { GitEvent, AnalysisResult, AnalysisContext } from '../types';
import { analyzeCommitMessage } from './commit-message';
import { analyzeBranchName } from './branch-name';
import { analyzeCommitSize } from './commit-size';
import { classifyRiskyAction } from './risky-action';
import { analyzeSession } from './session-duration';

export { analyzeCommitMessage, analyzeBranchName, analyzeCommitSize, classifyRiskyAction, analyzeSession };

export function analyzeEvent(event: GitEvent, context?: AnalysisContext): AnalysisResult {
    const verdicts: AnalysisResult['verdicts'] = [];

    if (event.type === 'commit') {
        const msg = (event.metadata?.message as string) || '';
        verdicts.push(analyzeCommitMessage(msg));

        const branch = (event.metadata?.branch as string) || '';
        const isDefault = !!(event.metadata?.isDefaultBranch);
        verdicts.push(analyzeBranchName(branch, isDefault));

        const stats = {
            filesChanged: (event.metadata?.filesChanged as number) || 0,
            insertions: (event.metadata?.insertions as number) || 0,
            deletions: (event.metadata?.deletions as number) || 0,
        };
        verdicts.push(analyzeCommitSize(stats));
    }

    if (event.type === 'branch-switch') {
        const branch = (event.metadata?.branch as string) || '';
        const isDefault = !!(event.metadata?.isDefaultBranch);
        verdicts.push(analyzeBranchName(branch, isDefault));
    }

    const risky = classifyRiskyAction(event);
    if (risky) {
        verdicts.push(risky);
    }

    const timestamps = context?.commitTimestamps || [];
    if (timestamps.length > 0 || event.type === 'commit') {
        const sessionTs = event.type === 'commit'
            ? [...timestamps, event.timestamp]
            : timestamps;
        verdicts.push(analyzeSession(sessionTs));
    }

    // Deduplicate by category, keeping the most severe
    const byCategory = new Map<string, typeof verdicts[0]>();
    for (const v of verdicts) {
        const existing = byCategory.get(v.category);
        if (!existing || severityRank(v.severity) > severityRank(existing.severity)) {
            byCategory.set(v.category, v);
        }
    }

    const unique = Array.from(byCategory.values());
    unique.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

    const criticals = unique.filter(v => v.severity === 'critical').length;
    const warnings = unique.filter(v => v.severity === 'warning').length;

    let summary: string;
    if (criticals > 0) {
        summary = `${criticals} critical issue${criticals > 1 ? 's' : ''}, ${warnings} warning${warnings > 1 ? 's' : ''}. Your git history is in shambles.`;
    } else if (warnings > 0) {
        summary = `${warnings} warning${warnings > 1 ? 's' : ''}. Not terrible, but room for improvement.`;
    } else {
        summary = 'Clean bill of health. A git master in the making.';
    }

    return {
        event,
        verdicts: unique,
        summary,
    };
}

function severityRank(s: string): number {
    switch (s) {
        case 'critical': return 3;
        case 'warning': return 2;
        case 'info': return 1;
        default: return 0;
    }
}
