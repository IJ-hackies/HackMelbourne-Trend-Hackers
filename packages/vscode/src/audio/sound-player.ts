import type { SidebarProvider } from '../webview/sidebar-provider';
import type { RankEvaluation } from '@git-gud/core';
import type { Achievement } from '@git-gud/core';
import type { Roast } from '@git-gud/core';

export type SoundEffect = 'rank-up' | 'rank-down' | 'achievement' | 'critical' | 'event';

export class SoundPlayer {
  private _enabled = true;

  constructor(private readonly _sidebar: SidebarProvider) {}

  set enabled(value: boolean) {
    this._enabled = value;
  }

  play(sound: SoundEffect): void {
    if (!this._enabled) return;
    this._sidebar.postMessage({ type: 'playSound', sound });
  }

  playSoundsForResult(
    roasts: Roast[],
    rankEvaluation: RankEvaluation,
    newAchievements: Achievement[],
  ): void {
    if (!this._enabled) return;

    if (rankEvaluation.promoted) {
      this.play('rank-up');
      return;
    }
    if (rankEvaluation.demoted) {
      this.play('rank-down');
      return;
    }
    if (newAchievements.length > 0) {
      this.play('achievement');
      return;
    }

    const hasCritical = roasts.some(r => r.severity === 'savage');
    this.play(hasCritical ? 'critical' : 'event');
  }
}
