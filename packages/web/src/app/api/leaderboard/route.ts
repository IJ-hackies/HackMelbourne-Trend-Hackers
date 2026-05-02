import { NextResponse } from 'next/server';

interface TeamEntry {
  name: string;
  rank: string;
  score: number;
  personality: string;
  suffering: number;
  lastUpdated: number;
}

const leaderboards = new Map<string, TeamEntry[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamCode, player, playerName } = body;

    if (!teamCode || !player) {
      return NextResponse.json({ success: false, error: 'Missing teamCode or player' }, { status: 400 });
    }

    const existing = leaderboards.get(teamCode) || [];
    const idx = existing.findIndex(e => e.name === (playerName || 'Anonymous'));
    const entry: TeamEntry = {
      name: playerName || 'Anonymous',
      rank: player.rank?.name || 'Bronze Committer',
      score: player.score?.total || 0,
      personality: player.personality?.type || 'Unknown',
      suffering: player.suffering?.score || 0,
      lastUpdated: Date.now(),
    };

    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }

    // Sort by score desc
    existing.sort((a, b) => b.score - a.score);
    leaderboards.set(teamCode, existing);

    return NextResponse.json({ success: true, leaderboard: existing });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamCode = searchParams.get('teamCode');

  if (!teamCode) {
    return NextResponse.json({ success: false, error: 'Missing teamCode' }, { status: 400 });
  }

  const board = leaderboards.get(teamCode) || [];
  return NextResponse.json({ success: true, leaderboard: board });
}
