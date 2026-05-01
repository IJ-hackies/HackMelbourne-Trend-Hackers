import type { GitEvent, RiskyActionVerdict } from '../types';

export function classifyRiskyAction(event: GitEvent): RiskyActionVerdict | null {
    const type = event.type;
    const meta = event.metadata;

    if (type === 'force-push') {
        return {
            severity: 'critical',
            category: 'risky-action',
            message: 'FORCE PUSH DETECTED. You just rewrote shared history. Someone is going to have a bad day.',
            advice: 'Avoid force pushing to shared branches. Use revert commits or coordinate with your team.',
            actionType: 'force-push',
        };
    }

    if (type === 'push' && (meta?.branch === 'main' || meta?.branch === 'master')) {
        return {
            severity: 'critical',
            category: 'risky-action',
            message: 'Direct push to default branch. You are playing with fire and everyone is watching.',
            advice: 'Always open a pull request for default branch changes. It protects you and your team.',
            actionType: 'direct-main-push',
        };
    }

    if (type === 'rebase') {
        return {
            severity: 'warning',
            category: 'risky-action',
            message: 'Rebase detected. History is being rewritten. Hope this is a local-only branch.',
            advice: 'Rebasing shared branches causes pain. Only rebase branches that exist only on your machine.',
            actionType: 'rebase',
        };
    }

    if (type === 'merge-conflict') {
        return {
            severity: 'warning',
            category: 'risky-action',
            message: 'Merge conflict in progress. The codebase is bleeding. Handle with care.',
            advice: 'Take your time resolving conflicts. Test thoroughly before committing the resolution.',
            actionType: 'merge-conflict',
        };
    }

    return null;
}
