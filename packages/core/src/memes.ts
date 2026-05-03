import type { AnyVerdict } from './analysis/types';

export type Tag =
  | 'destructive'
  | 'chaotic'
  | 'lazy'
  | 'tryhard'
  | 'cringe'
  | 'dramatic'
  | 'absurd';

export interface MemeCategory {
  id: string;
  description: string;
  tags: Tag[];
  terms: string[];
  notes?: Record<string, string>;
}

export const MEME_CATEGORIES: Record<string, MemeCategory> = {
  brainrot: {
    id: 'brainrot',
    description: 'general Gen Z internet slang — casual, dismissive, ambient',
    tags: ['lazy', 'cringe'],
    terms: [
      'gyatt', 'rizz', 'mogged', 'mewing', 'looksmaxxing', 'aura points', 'negative aura',
      'cooked', 'cooking', 'ate that', 'ate and left no crumbs', 'mid', 'cap / no cap',
      'bussin', 'goated', 'L take', 'W rizz', 'caught in 4k', 'demure', 'mindful',
      'delulu', 'unc behavior', 'in shambles', "it's giving",
      'hawk tuah', 'yapping', 'ick', 'bet', 'lowkey', 'highkey', 'vibe check', 'era',
      'understood the assignment', 'nah this is crazy',
    ],
  },
  gaming_callouts: {
    id: 'gaming_callouts',
    description: 'team-game blame language — for when someone wrecks shared state',
    tags: ['destructive', 'tryhard'],
    terms: [
      'griefing the team', 'throwing the match', 'hard inting', 'tilted', 'monkas',
      'one-trick pony', 'feeding', 'KDA negative', "ratio'd", 'down bad', 'GG go next',
      'reverse sweep', 'choking the lead', 'main character syndrome', 'support diff',
      'jungle diff', 'skill issue', 'touch grass', 'diff', 'hardstuck', 'smurf energy',
    ],
  },
  esports_caster: {
    id: 'esports_caster',
    description: 'overdramatic tournament-commentator energy, all caps and theatrics',
    tags: ['dramatic', 'chaotic'],
    terms: [
      'WHAT A PLAY', 'DOWN GOES THE GIANT', 'INSANE outplay', 'absolute travesty',
      'crowd is in shambles', 'momentum shift', 'this is for ALL the marbles',
      'and HE DELIVERS', 'first blood', 'pentakill incoming', 'clutch or kick',
      'and the crowd goes mild',
    ],
  },
  twitter_discourse: {
    id: 'twitter_discourse',
    description: 'extremely-online quote-tweet snark, ratio-coded',
    tags: ['lazy', 'cringe'],
    terms: [
      'tell me you X without telling me you X', 'name a more iconic duo',
      'this you?', 'ratio + L + you fell off', 'main character of the timeline',
      'screenshot this', 'we are so back', "it's so over", 'cancelled',
      "didn't read + L + ratio", 'POV:', 'real ones know',
    ],
  },
  finance_bro: {
    id: 'finance_bro',
    description: 'sigma grindset / hustle-podcast affectations',
    tags: ['tryhard', 'cringe'],
    terms: [
      'sigma grindset', 'rise and grind', 'alpha behavior', 'NPC mindset', 'low T move',
      'beta energy', 'high agency', 'based', 'cringe', 'cope and seethe',
      '5am club energy', 'the grind never stops', 'optimal', 'suboptimal',
    ],
  },
  anime: {
    id: 'anime',
    description: 'shonen-arc / power-up framing for overcommitted moments',
    tags: ['dramatic', 'tryhard'],
    terms: [
      'nani', 'kimochi', 'gigachad', 'ultra instinct', 'going Super Saiyan',
      'final form', 'getting clapped by Goku', 'protagonist plot armor',
      'filler arc', 'the anime is peaking', 'mid season finale energy',
    ],
  },
  music: {
    id: 'music',
    description: 'pop-music-fandom register — eras, drops, comeback singles',
    tags: ['dramatic', 'cringe'],
    terms: [
      'banger', 'mid drop', 'flop era', 'comeback single', "we listen and we don't judge",
      'hot girl summer', 'sad boy hours', 'soundtrack of my villain arc',
      'this slaps', 'this is mid asf',
    ],
  },
  tech_bro: {
    id: 'tech_bro',
    description: 'startup / shipping / move-fast-break-things bravado',
    tags: ['tryhard', 'chaotic'],
    terms: [
      'shipped to prod', 'YOLO deploy', 'move fast and break things', 'tech debt arc',
      'pivoting', 'MVP energy', 'startup grindset', 'IPO behavior',
      'series A and clueless', 'webscale', 'enterprise-ready chaos',
    ],
  },
  reaction: {
    id: 'reaction',
    description: 'theatrical TikTok-comment overreaction phrases',
    tags: ['cringe', 'dramatic'],
    terms: [
      'the disrespect', "I'm yelling", 'crying screaming throwing up', 'unwell',
      'this is sending me', 'I cannot', 'pls', 'help', 'with my own two eyes',
      'I am simply Going Through It', 'the lore is wild',
    ],
  },
  recent_2025_2026: {
    id: 'recent_2025_2026',
    description: 'currently-peaking 2025–2026 brainrot — the freshest stuff',
    tags: ['absurd', 'cringe'],
    terms: [
      'demure', 'mindful', 'very cutesy', 'glazing', 'glazed', 'standing on business',
      'crash out', 'crashing out', 'chat is this real', 'opp behavior', 'twin', 'chat',
      'in this economy', 'goon cave', 'rate my unboxing',
      'AI fruit drama energy', 'the fruits are fighting again',
      'doing the scuba dance', 'Nick Wilde scuba moment', 'scuba-ing my way out of this bug',
      'finger gloving in the dark', 'LED gloves arc', 'Infinite Puppet behavior',
      'doing the dirty laundry dance', "my girl don't want me because of my dirty laundry",
      'AI buzz-cut dance energy', 'rigid choreography arc',
    ],
    notes: {
      'doing the scuba dance': 'Nick Wilde from Zootopia 2 plugging his nose and waving his hand — invoke as a dodging/escaping move',
      'Nick Wilde scuba moment': 'Zootopia 2 Nick Wilde nose-plug dodge — escape/avoidance reference',
      'scuba-ing my way out of this bug': 'Zootopia 2 Nick Wilde nose-plug dodge — escape/avoidance reference',
      'doing the dirty laundry dance': 'stiff awkward AI-buzz-cut character — reference for cringe/rigid behavior',
      'AI buzz-cut dance energy': 'stiff awkward AI-buzz-cut character — reference for cringe/rigid behavior',
      'AI fruit drama energy': 'surreal anthropomorphic-fruit Reels drama — reference for absurd/chaotic vibes',
      'the fruits are fighting again': 'surreal anthropomorphic-fruit Reels drama — reference for absurd/chaotic vibes',
    },
  },
  italian_brainrot: {
    id: 'italian_brainrot',
    description: 'absurd AI-generated Italian creature characters — invoke as named entities',
    tags: ['absurd', 'chaotic'],
    terms: [
      'Tralalero Tralala', 'Bombardiro Crocodilo', 'Tung Tung Tung Sahur',
      'Cappuccino Assassino', 'Ballerina Cappuccina', 'Lirilì Larilà',
      'Bombombini Gusini', 'Trippi Troppi', 'Chimpanzini Bananini', 'Brr Brr Patapim',
      "getting Bombardiro'd", 'this is Cappuccino Assassino energy',
      "Tralalero Tralala wouldn't even ship this", 'absolute Tung Tung Tung Sahur moment',
    ],
    notes: {
      'Tralalero Tralala': 'absurd AI-generated Italian creature character — invoke as a named entity, not a phrase',
      'Bombardiro Crocodilo': 'absurd AI-generated Italian creature character — invoke as a named entity',
      'Cappuccino Assassino': 'absurd AI-generated Italian creature character — invoke as a named entity',
      'Tung Tung Tung Sahur': 'absurd AI-generated Italian creature character — invoke as a named entity',
    },
  },
  six_seven: {
    id: 'six_seven',
    description: 'the "six seven" / "6-7" chant meme — used for chaotic/numerical moments',
    tags: ['absurd', 'chaotic'],
    terms: [
      'six seven', '6-7', 'SIX SEVEN', 'doing the 6-7 hands',
      'this is a 6-7 moment', 'LaMelo six-seven energy', 'Skrilla doot doot six seven',
      'absolute six-seven behavior', 'the kids are yelling six seven',
    ],
  },
  streamer_drama: {
    id: 'streamer_drama',
    description: 'Twitch / LSF investigation deadpan — apology-video and exposed-on-stream sound bites',
    tags: ['cringe', 'dramatic'],
    terms: [
      'my exp bar is low', "only cuz you're here", 'pulling a Sykkuno',
      '32-page Google Doc energy', 'streamer apology video arc', 'taking a break from streaming',
      'caught view-botting', 'ExtraEmily tab-share moment', 'accidentally screen-shared the evidence',
      'doing an LSF investigation on yourself', 'Mizkif would expose this',
      'Beast Games contestant treatment', 'MrBeast ultra grind mode', 'pivoting to ultra grind mode',
      'class action arc', 'Chichén Itzá behavior',
    ],
    notes: {
      'my exp bar is low': "TikTok-edit sound bite from streamer drama — drop as a deadpan reaction",
      "only cuz you're here": "TikTok-edit sound bite from streamer drama — drop as a deadpan reaction",
    },
  },
};

type ByCategory<C extends AnyVerdict['category']> = Extract<AnyVerdict, { category: C }>;
type VerdictTagsTable = {
  [C in AnyVerdict['category']]: { [P in ByCategory<C>['pattern']]: Tag[] };
};

export const VERDICT_TAGS: VerdictTagsTable = {
  'commit-message': {
    'too-short': ['lazy'],
    'generic': ['lazy', 'cringe'],
    'no-context': ['lazy'],
    'all-caps': ['dramatic', 'cringe'],
    'emoji-only': ['cringe', 'absurd'],
    'default-message': ['lazy'],
    'clean': [],
  },
  'branch-name': {
    'default-branch': ['lazy'],
    'meaningless': ['lazy', 'cringe'],
    'no-prefix': ['lazy'],
    'too-long': ['tryhard', 'cringe'],
    'bad-characters': ['chaotic', 'absurd'],
    'clean': [],
  },
  'commit-size': {
    'giant': ['tryhard', 'dramatic'],
    'micro': ['lazy', 'absurd'],
    'high-deletion-ratio': ['destructive', 'dramatic'],
    'generated-only': ['lazy', 'cringe'],
    'clean': [],
  },
  'risky-action': {
    'force-push': ['destructive', 'dramatic'],
    'direct-push-default': ['chaotic', 'destructive'],
    'shared-rebase': ['destructive', 'chaotic'],
    'delete-remote-branch': ['destructive', 'dramatic'],
    'hard-reset': ['destructive', 'chaotic'],
  },
  'session': {
    'long-session': ['tryhard', 'dramatic'],
    'late-night': ['absurd', 'tryhard'],
    'weekend-warrior': ['tryhard', 'cringe'],
    'panic-mode': ['chaotic', 'dramatic'],
    'clean': [],
  },
};

function tagsForVerdict(v: AnyVerdict): Tag[] {
  const byCat = VERDICT_TAGS[v.category] as Record<string, Tag[]> | undefined;
  return byCat?.[v.pattern] ?? [];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PickedCategory {
  id: string;
  description: string;
  sampleTerms: string[];
  notes: Array<{ term: string; note: string }>;
}

export interface PickOptions {
  categoryCount?: number;
  termsPerCategory?: number;
}

export function pickMemePoolForVerdicts(
  verdicts: AnyVerdict[],
  opts: PickOptions = {},
): PickedCategory[] {
  const categoryCount = opts.categoryCount ?? 3;
  const termsPerCategory = opts.termsPerCategory ?? 3;

  const verdictTagSet = new Set<Tag>();
  for (const v of verdicts) for (const t of tagsForVerdict(v)) verdictTagSet.add(t);

  const all = Object.values(MEME_CATEGORIES);
  const scored = all.map(cat => ({
    cat,
    score: cat.tags.reduce((n, t) => n + (verdictTagSet.has(t) ? 1 : 0), 0),
  }));

  const eligible = scored.filter(s => s.score > 0);
  const ranked = (eligible.length > 0 ? eligible : scored.map(s => ({ ...s, score: 1 })));

  // Sort by score desc, then shuffle within tiers so equal-scored cats vary turn-to-turn.
  const byTier = new Map<number, typeof ranked>();
  for (const s of ranked) {
    const list = byTier.get(s.score) ?? [];
    list.push(s);
    byTier.set(s.score, list);
  }
  const ordered: typeof ranked = [];
  for (const score of [...byTier.keys()].sort((a, b) => b - a)) {
    ordered.push(...shuffle(byTier.get(score)!));
  }

  return ordered.slice(0, categoryCount).map(({ cat }) => {
    const sampleTerms = shuffle(cat.terms).slice(0, termsPerCategory);
    const notes: Array<{ term: string; note: string }> = [];
    if (cat.notes) {
      for (const term of sampleTerms) {
        const note = cat.notes[term];
        if (note) notes.push({ term, note });
      }
    }
    return { id: cat.id, description: cat.description, sampleTerms, notes };
  });
}

// Curated celebratory slang — used when the user actually did something right.
// Keep this list positive-only: no "mid", no "L", no "down bad", no "skill issue".
export const HYPE_VOCAB: string[] = [
  // brainrot wins
  'W rizz', 'ate that', 'ate and left no crumbs', 'goated', 'bussin', 'cooking',
  'understood the assignment', 'no cap', 'aura points', 'we are so back', "it's giving",
  'main character of the timeline', 'caught in 4k (clean edition)',
  // esports caster celebration
  'WHAT A PLAY', 'INSANE outplay', 'and HE DELIVERS', 'first blood', 'pentakill incoming',
  'momentum shift', 'absolute travesty (in a good way)',
  // anime power-up
  'gigachad', 'ultra instinct', 'final form', 'protagonist plot armor', 'the anime is peaking',
  // music
  'banger', 'this slaps', 'comeback single',
  // tryhard W
  'shipped to prod', 'high agency', 'alpha behavior', 'sigma grindset', 'optimal',
  '5am club energy',
  // six-seven (still mandatory if 67 detected)
  'absolute six-seven behavior', 'six-seven hands going up',
  // italian brainrot W
  'this is Cappuccino Assassino energy',
];

export function formatHypeVocabForPrompt(termCount = 10): string {
  const sample = shuffle(HYPE_VOCAB).slice(0, termCount);
  return sample.map(t => `"${t}"`).join(', ');
}

export function formatMemePoolForPrompt(picked: PickedCategory[]): string {
  const blocks = picked.map(p => {
    const termsLine = p.sampleTerms.map(t => `"${t}"`).join(', ');
    const notesLines = p.notes.length > 0
      ? '\n  notes: ' + p.notes.map(n => `"${n.term}" — ${n.note}`).join('; ')
      : '';
    return `- ${p.id} (${p.description}): ${termsLine}${notesLines}`;
  });
  return blocks.join('\n');
}
