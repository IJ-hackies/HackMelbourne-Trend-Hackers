import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { GitWatcher } from './gitWatcher';
import { RoastEngine } from './roastEngine';
import { DashboardPanel } from './dashboard';
import { AchievementManager } from './achievementManager';
import { getCommitDiff, getPushDiff, getMergeConflictFiles } from './gitCommands';
import { MergeConflictTracker } from './mergeConflictTracker';

let gitWatcher: GitWatcher | undefined;
let roastChannel: vscode.OutputChannel | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const storage = new StorageManager(context);
  const roastEngine = new RoastEngine(context);
  const achievementManager = new AchievementManager(storage);
  const dashboard = new DashboardPanel(context, storage);
  roastChannel = vscode.window.createOutputChannel('Git Gud Roasts');

  let conflictTracker: MergeConflictTracker | undefined;

  const handleEvent = async (event: any) => {
    // Enrich event with diff context where useful
    try {
      if (event.type === 'commit') {
        Object.assign(event.metadata, await getCommitDiff(event.repoPath));
      } else if (event.type === 'push_to_main' || event.type === 'force_push') {
        Object.assign(event.metadata, await getPushDiff(event.repoPath, event.metadata.branchName ?? 'main'));
      } else if (event.type === 'merge_conflict_start') {
        Object.assign(event.metadata, await getMergeConflictFiles(event.repoPath));
        if (!conflictTracker) {
          conflictTracker = new MergeConflictTracker(event.repoPath, async (type, metadata) => {
            await handleEvent({ type, timestamp: Date.now(), repoPath: event.repoPath, metadata });
          });
          await conflictTracker.start(event.metadata.changedFiles);
        }
      } else if (event.type === 'merge_conflict_resolved') {
        conflictTracker?.stop();
        conflictTracker = undefined;
      }
    } catch {}

    const stats = await storage.applyEvent(event);

    const newAchievements = await achievementManager.check(event, stats);
    for (const achievement of newAchievements) {
      vscode.window.showInformationMessage(
        `🏆 ACHIEVEMENT UNLOCKED — ${achievement.name}: ${achievement.description}`,
      );
    }

    const SILENT_EVENTS = new Set(['conflict_block_preview', 'file_fully_resolved']);
    if (SILENT_EVENTS.has(event.type)) {
      dashboard.refresh(await storage.getStats());
      return;
    }

    const roast = await roastEngine.roast(event);
    if (roast) {
      await storage.appendRoast(roast);
      roastChannel!.appendLine(`\n[${event.type}] ${new Date().toLocaleTimeString()}`);
      roastChannel!.appendLine(`🎮 ${roast.roast}`);
      roastChannel!.appendLine(`💡 ${roast.advice}`);
      roastChannel!.show(true);
      const action = await vscode.window.showWarningMessage(
        `🎮 ${roast.roast}`,
        { modal: false },
        'Show Advice',
      );
      if (action === 'Show Advice') {
        vscode.window.showInformationMessage(`💡 ${roast.advice}`);
      }
    }

    dashboard.refresh(await storage.getStats());
  };

  gitWatcher = new GitWatcher(handleEvent);
  gitWatcher.start();

  context.subscriptions.push(
    vscode.commands.registerCommand('gitGud.showDashboard', () => dashboard.show()),
    vscode.commands.registerCommand('gitGud.resetStats', async () => {
      await storage.reset();
      dashboard.refresh(await storage.getStats());
      vscode.window.showInformationMessage('Git Gud: Stats reset. Time to make new mistakes.');
    }),
    vscode.commands.registerCommand('gitGud.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Gemini API key',
        password: true,
        ignoreFocusOut: true,
      });
      if (key) {
        await context.secrets.store('gitGud.geminiApiKey', key);
        vscode.window.showInformationMessage('Git Gud: API key saved to SecretStorage.');
      }
    }),
  );
}

export function deactivate() {
  gitWatcher?.dispose();
  roastChannel?.dispose();
}
