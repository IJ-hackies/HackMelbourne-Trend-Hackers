import type { GitEvent } from '@git-gud/core';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Git Gud is now active');

  const command = vscode.commands.registerCommand('gitGud.showStatus', () => {
    const event: GitEvent = {
      type: 'commit',
      timestamp: Date.now(),
      metadata: {},
    };
    vscode.window.showInformationMessage(
      `Git Gud: Ready to roast. Event type: ${event.type}`
    );
  });

  context.subscriptions.push(command);
}

export function deactivate() {}
