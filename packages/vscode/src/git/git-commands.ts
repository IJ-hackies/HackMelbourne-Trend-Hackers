import { exec } from 'child_process';
import { promisify } from 'util';

const pexec = promisify(exec);
const MAX_DIFF_CHARS = 1500;
const MAX_FILES_LISTED = 8;

async function run(cwd: string, cmd: string): Promise<string> {
  try {
    const { stdout } = await pexec(cmd, { cwd, maxBuffer: 1024 * 1024, timeout: 5000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…[truncated ${s.length - max} chars]`;
}

function parseShortstat(line: string): { insertions?: number; deletions?: number; filesChanged?: number } {
  const filesM = line.match(/(\d+) files? changed/);
  const insM = line.match(/(\d+) insertions?/);
  const delM = line.match(/(\d+) deletions?/);
  return {
    filesChanged: filesM ? parseInt(filesM[1], 10) : undefined,
    insertions: insM ? parseInt(insM[1], 10) : undefined,
    deletions: delM ? parseInt(delM[1], 10) : undefined,
  };
}

export async function getCommitDiff(repoPath: string): Promise<Record<string, unknown>> {
  const stat = await run(repoPath, 'git show --shortstat --format= HEAD');
  const files = (await run(repoPath, 'git show --name-only --format= HEAD'))
    .split('\n').filter(Boolean).slice(0, MAX_FILES_LISTED);
  const diff = await run(repoPath, 'git show --no-color --unified=0 HEAD');
  const parsed = parseShortstat(stat);
  return {
    ...parsed,
    changedFiles: files,
    files,
    diffSummary: truncate(diff, MAX_DIFF_CHARS),
    stats: { filesChanged: parsed.filesChanged ?? 0, insertions: parsed.insertions ?? 0, deletions: parsed.deletions ?? 0, files },
  };
}

export async function getPushDiff(repoPath: string, branch: string): Promise<Record<string, unknown>> {
  const range = `origin/${branch}@{1}..origin/${branch}`;
  const stat = await run(repoPath, `git diff --shortstat ${range}`);
  const files = (await run(repoPath, `git diff --name-only ${range}`))
    .split('\n').filter(Boolean).slice(0, MAX_FILES_LISTED);
  const diff = await run(repoPath, `git diff --no-color --unified=0 ${range}`);
  return { ...parseShortstat(stat), changedFiles: files, diffSummary: truncate(diff, MAX_DIFF_CHARS) };
}

export async function getMergeConflictFiles(repoPath: string): Promise<Record<string, unknown>> {
  const files = (await run(repoPath, 'git diff --name-only --diff-filter=U'))
    .split('\n').filter(Boolean).slice(0, MAX_FILES_LISTED);
  return { changedFiles: files, filesChanged: files.length };
}
