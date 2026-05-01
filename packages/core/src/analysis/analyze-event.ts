import type { GitEvent } from '../types';
import type { AnalysisContext, AnalysisResult, AnyVerdict, Severity } from './types';
import { analyzeCommitMessage } from './commit-message';
import { analyzeBranchName } from './branch-name';
import { analyzeCommitSize } from './commit-size';
import type { CommitSizeStats } from './commit-size';
import { classifyRiskyAction } from './risky-action';
import { analyzeSession } from './session-duration';

const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

function highestSeverity(verdicts: AnyVerdict[]): Severity {
  let max: Severity = 'info';
  for (const v of verdicts) {
    if (SEVERITY_ORDER[v.severity] > SEVERITY_ORDER[max]) {
      max = v.severity;
    }
  }
  return max;
}

export function analyzeEvent(event: GitEvent, context?: AnalysisContext): AnalysisResult {
  const verdicts: AnyVerdict[] = [];

  if (event.type === 'commit') {
    const message = event.metadata.message as string | undefined;
    if (message !== undefined) {
      verdicts.push(analyzeCommitMessage(message));
    }

    const stats = event.metadata.stats as CommitSizeStats | undefined;
    if (stats) {
      verdicts.push(analyzeCommitSize(stats));
    }
  }

  if (context?.branchName !== undefined) {
    verdicts.push(
      analyzeBranchName(context.branchName, context.isDefaultBranch ?? false),
    );
  }

  const riskyVerdict = classifyRiskyAction(event);
  if (riskyVerdict) {
    verdicts.push(riskyVerdict);
  }

  if (context?.recentCommitTimestamps && context.recentCommitTimestamps.length > 0) {
    verdicts.push(analyzeSession(context.recentCommitTimestamps));
  }

  verdicts.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  return {
    event,
    verdicts,
    timestamp: Date.now(),
    highestSeverity: highestSeverity(verdicts),
  };
}
