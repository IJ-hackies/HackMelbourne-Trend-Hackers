export const MEME_CATEGORIES: Record<string, string[]> = {
  brainrot: [
    'gyatt', 'rizz', 'mogged', 'mewing', 'looksmaxxing', 'aura points', 'negative aura',
    'cooked', 'cooking', 'ate that', 'ate and left no crumbs', 'mid', 'cap / no cap',
    'bussin', 'goated', 'L take', 'W rizz', 'caught in 4k', 'demure', 'mindful',
    'delulu', 'unc behavior', 'in shambles', 'it\'s giving',
  ],
  gaming_callouts: [
    'griefing the team', 'throwing the match', 'hard inting', 'tilted', 'monkas',
    'one-trick pony', 'feeding', 'KDA negative', 'ratio\'d', 'down bad', 'GG go next',
    'reverse sweep', 'choking the lead', 'main character syndrome', 'support diff',
    'jungle diff', 'skill issue', 'touch grass', 'diff', 'hardstuck', 'smurf energy',
  ],
  esports_caster: [
    'WHAT A PLAY', 'DOWN GOES THE GIANT', 'INSANE outplay', 'absolute travesty',
    'crowd is in shambles', 'momentum shift', 'this is for ALL the marbles',
    'and HE DELIVERS', 'first blood', 'pentakill incoming', 'clutch or kick',
    'and the crowd goes mild',
  ],
  twitter_discourse: [
    'tell me you X without telling me you X', 'name a more iconic duo',
    'this you?', 'ratio + L + you fell off', 'main character of the timeline',
    'screenshot this', 'we are so back', 'it\'s so over', 'cancelled',
    'didn\'t read + L + ratio', 'POV:', 'real ones know',
  ],
  finance_bro: [
    'sigma grindset', 'rise and grind', 'alpha behavior', 'NPC mindset', 'low T move',
    'beta energy', 'high agency', 'based', 'cringe', 'cope and seethe',
    '5am club energy', 'the grind never stops', 'optimal', 'suboptimal',
  ],
  anime: [
    'nani', 'kimochi', 'gigachad', 'ultra instinct', 'going Super Saiyan',
    'final form', 'getting clapped by Goku', 'protagonist plot armor',
    'filler arc', 'the anime is peaking', 'mid season finale energy',
  ],
  music: [
    'banger', 'mid drop', 'flop era', 'comeback single', 'we listen and we don\'t judge',
    'hot girl summer', 'sad boy hours', 'soundtrack of my villain arc',
    'this slaps', 'this is mid asf',
  ],
  tech_bro: [
    'shipped to prod', 'YOLO deploy', 'move fast and break things', 'tech debt arc',
    'pivoting', 'MVP energy', 'startup grindset', 'IPO behavior',
    'series A and clueless', 'webscale', 'enterprise-ready chaos',
  ],
  reaction: [
    'the disrespect', 'I\'m yelling', 'crying screaming throwing up', 'unwell',
    'this is sending me', 'I cannot', 'pls', 'help', 'with my own two eyes',
    'I am simply Going Through It', 'the lore is wild',
  ],
  recent_2025_2026: [
    'demure', 'mindful', 'very cutesy', 'glazing', 'glazed', 'standing on business',
    'crash out', 'crashing out', 'chat is this real', 'opp behavior', 'twin', 'chat',
    'in this economy', 'looksmaxxing', 'mewing', 'goon cave', 'rate my unboxing',
    'AI fruit drama energy', 'the fruits are fighting again',
    'doing the scuba dance', 'Nick Wilde scuba moment', 'scuba-ing my way out of this bug',
    'finger gloving in the dark', 'LED gloves arc', 'Infinite Puppet behavior',
    'doing the dirty laundry dance', 'my girl don\'t want me because of my dirty laundry',
    'AI buzz-cut dance energy', 'rigid choreography arc',
  ],
  italian_brainrot: [
    'Tralalero Tralala', 'Bombardiro Crocodilo', 'Tung Tung Tung Sahur',
    'Cappuccino Assassino', 'Ballerina Cappuccina', 'Lirilì Larilà',
    'Bombombini Gusini', 'Trippi Troppi', 'Chimpanzini Bananini', 'Brr Brr Patapim',
    'getting Bombardiro\'d', 'this is Cappuccino Assassino energy',
    'Tralalero Tralala wouldn\'t even ship this', 'absolute Tung Tung Tung Sahur moment',
  ],
  six_seven: [
    'six seven', '6-7', 'SIX SEVEN', 'doing the 6-7 hands',
    'this is a 6-7 moment', 'LaMelo six-seven energy', 'Skrilla doot doot six seven',
    'absolute six-seven behavior', 'the kids are yelling six seven',
  ],
  streamer_drama: [
    'my exp bar is low', 'only cuz you\'re here', 'pulling a Sykkuno',
    '32-page Google Doc energy', 'streamer apology video arc', 'taking a break from streaming',
    'caught view-botting', 'ExtraEmily tab-share moment', 'accidentally screen-shared the evidence',
    'doing an LSF investigation on yourself', 'Mizkif would expose this',
    'Beast Games contestant treatment', 'MrBeast ultra grind mode', 'pivoting to ultra grind mode',
    'class action arc', 'Chichén Itzá behavior',
  ],
};

// Add unique terms from Jorvan-version's brainrot library not already in Feat/V1
const EXTRA_TERMS = ['hawk tuah', 'yapping', 'ick', 'bet', 'lowkey', 'highkey', 'vibe check', 'era', 'understood the assignment', 'nah this is crazy'];
MEME_CATEGORIES.brainrot.push(...EXTRA_TERMS.filter(t => !MEME_CATEGORIES.brainrot.includes(t)));

export interface MemePoolOptions {
  perCategory?: number;
  totalCap?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickMemePool(opts: MemePoolOptions = {}): string[] {
  const perCategory = opts.perCategory ?? 2;
  const totalCap = opts.totalCap ?? 12;
  const all: string[] = [];
  for (const items of Object.values(MEME_CATEGORIES)) {
    all.push(...shuffle(items).slice(0, perCategory));
  }
  return shuffle(all).slice(0, totalCap);
}
