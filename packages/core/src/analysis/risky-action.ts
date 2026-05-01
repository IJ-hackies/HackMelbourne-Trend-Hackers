import type { GitEvent } from '../types';
import type { RiskyActionVerdict, Severity } from './types';

function verdict(
  severity: Severity,
  pattern: RiskyActionVerdict['pattern'],
  message: string,
  advice: string,
): RiskyActionVerdict {
  return { severity, category: 'risky-action', pattern, message, advice };
}

const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev']);

export function classifyRiskyAction(event: GitEvent): RiskyActionVerdict | null {
  if (event.type === 'force-push') {
    return verdict(
      'critical',
      'force-push',
      'Force push detected. You just rewrote history. Congratulations, historian.',
      'Force pushes overwrite remote history and can destroy teammates\' work. Use --force-with-lease at minimum, or avoid force pushing shared branches entirely.',
    );
  }

  if (event.type === 'push') {
    const branch = event.metadata.branch as string | undefined;
    const isDefault = event.metadata.isDefaultBranch as boolean | undefined;
    if (isDefault || (branch && DEFAULT_BRANCHES.has(branch.toLowerCase()))) {
      return verdict(
        'critical',
        'direct-push-default',
        `Pushing directly to ${branch ?? 'the default branch'}. No PR, no review, no mercy.`,
        'Use feature branches and pull requests. Direct pushes to the default branch skip review and can break the build for everyone.',
      );
    }
  }

  if (event.type === 'rebase') {
    const isShared = event.metadata.isSharedBranch as boolean | undefined;
    const hasRemoteTracking = event.metadata.hasRemoteTracking as boolean | undefined;
    if (isShared || hasRemoteTracking) {
      return verdict(
        isShared ? 'critical' : 'warning',
        'shared-rebase',
        'Rebasing a branch that other people are using. Bold move.',
        'Rebasing rewrites commit history. On shared branches, this forces teammates to deal with diverged histories. Rebase only on local/private branches.',
      );
    }
  }

  if (event.type === 'push') {
    const deletedRemoteBranch = event.metadata.deletedRemoteBranch as string | undefined;
    if (deletedRemoteBranch) {
      return verdict(
        'warning',
        'delete-remote-branch',
        `Deleted remote branch "${deletedRemoteBranch}". Gone. Reduced to atoms.`,
        'Make sure the branch was fully merged before deleting. Unmerged remote branches are recoverable but painful to restore.',
      );
    }
  }

  const isHardReset = event.metadata.isHardReset as boolean | undefined;
  if (isHardReset) {
    return verdict(
      'critical',
      'hard-reset',
      'git reset --hard. All uncommitted work? Evaporated.',
      'Hard resets discard all uncommitted changes permanently. Use git stash or commit before resetting. If you already did it, check git reflog.',
    );
  }

  return null;
}
