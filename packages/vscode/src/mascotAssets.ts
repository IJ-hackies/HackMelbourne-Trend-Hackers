import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface MascotAnimation {
  frames: Partial<Record<'south' | 'east' | 'west' | 'north', string[]>>;
}

export interface MascotAssets {
  width: number;
  height: number;
  rotations: Partial<Record<'south' | 'east' | 'west' | 'north', string>>;
  animations: Record<string, MascotAnimation>;
}

const KNOWN_ANIMS = {
  idle: 'Breathing_Idle-41a25bef',
  walking: 'Walking-a5b54fbd',
  thumbs_up: 'Smile_and_thumbs_up_with_right_hand-12506ce7',
  point_and_laugh: 'Point_and_laugh-033f2884',
  uppercut: 'Surprise_Uppercut-5aabbbd1',
  falling_death: 'Falling_Back_Death-b9d8d4cd',
  crouching: 'Crouching-d70ac509',
} as const;

export type MascotAnimName = keyof typeof KNOWN_ANIMS;

export function loadMascotAssets(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): MascotAssets | null {
  const root = path.join(context.extensionPath, 'media', 'mascot');
  const metaPath = path.join(root, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const c = meta.character;
  const rotationsRaw = meta.frames.rotations as Record<string, string>;
  const animationsRaw = meta.frames.animations as Record<string, Record<string, string[]>>;

  const toUri = (rel: string) => webview.asWebviewUri(vscode.Uri.file(path.join(root, rel))).toString();

  const rotations: MascotAssets['rotations'] = {};
  for (const [dir, p] of Object.entries(rotationsRaw)) {
    rotations[dir as 'south' | 'east' | 'west' | 'north'] = toUri(p);
  }

  const animations: Record<string, MascotAnimation> = {};
  for (const [animKey, dirs] of Object.entries(animationsRaw)) {
    const frames: MascotAnimation['frames'] = {};
    for (const [dir, paths] of Object.entries(dirs)) {
      frames[dir as 'south' | 'east' | 'west' | 'north'] = paths.map(toUri);
    }
    animations[animKey] = { frames };
  }

  return {
    width: c.size?.width ?? 92,
    height: c.size?.height ?? 92,
    rotations,
    animations,
  };
}

export function resolveAnimKey(name: MascotAnimName, assets: MascotAssets): string | null {
  const id = KNOWN_ANIMS[name];
  return assets.animations[id] ? id : null;
}

export const ANIM_IDS = KNOWN_ANIMS;
