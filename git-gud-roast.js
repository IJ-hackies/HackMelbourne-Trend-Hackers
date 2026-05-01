const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { evaluate, GitEventType } = require('./packages/core/dist/index.js');

const defaultState = {
    score: { total: 0, delta: 0, breakdown: {} },
    rank: { id: 'bronze', name: 'Bronze Committer', tier: 1, threshold: 0 },
    achievements: [],
    stats: {
        totalCommits: 0, totalForcePushes: 0, totalMergeConflicts: 0,
        totalRebases: 0, totalDirectMainPushes: 0, averageCommitSize: 0,
        currentStreak: 0, bestStreak: 0, lateNightCommits: 0,
        weekendCommits: 0, branchCount: 0, readmeEdits: 0,
        eventHistory: [], commitTimestamps: [],
    },
    personality: { type: 'Git Novice', description: 'Keep committing.' },
    suffering: { score: 0, title: 'Mild Annoyance' },
};

// Colors for terminal
const colors = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

function getGitDir() {
    try {
        const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8', cwd: process.cwd() }).trim();
        return path.resolve(process.cwd(), gitDir);
    } catch {
        console.log(`${colors.red}Error:${colors.reset} This folder is not a git repo.`);
        console.log('Please run this script inside a git repository.');
        process.exit(1);
    }
}

function getLastCommitInfo() {
    try {
        const hashAndMsg = execSync('git log -1 --pretty=format:"%H|%s"', { encoding: 'utf-8' }).trim();
        const [hash, ...msgParts] = hashAndMsg.split('|');
        const message = msgParts.join('|');
        
        const stats = execSync('git log -1 --shortstat --pretty=format:""', { encoding: 'utf-8' }).trim();
        let filesChanged = 0, insertions = 0, deletions = 0;
        const fcMatch = stats.match(/(\d+) file/);
        const insMatch = stats.match(/(\d+) insertion/);
        const delMatch = stats.match(/(\d+) deletion/);
        if (fcMatch) filesChanged = parseInt(fcMatch[1]);
        if (insMatch) insertions = parseInt(insMatch[1]);
        if (delMatch) deletions = parseInt(delMatch[1]);

        const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        
        return { hash, message, filesChanged, insertions, deletions, branch };
    } catch {
        return null;
    }
}

function roastCommit() {
    const info = getLastCommitInfo();
    if (!info) {
        console.log('No commit found.');
        return;
    }

    const { hash, message, filesChanged, insertions, deletions, branch } = info;
    const isDefaultBranch = ['main', 'master', 'develop'].includes(branch);

    console.clear();
    console.log('\n');
    console.log(`${colors.bold}${colors.red}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.red}║              GIT GUD — COMMIT DETECTED                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.red}╚══════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`  Commit: ${colors.cyan}${hash.slice(0, 7)}${colors.reset}`);
    console.log(`  Message: "${colors.magenta}${message}${colors.reset}"`);
    console.log(`  Branch: ${colors.cyan}${branch}${colors.reset} ${isDefaultBranch ? colors.red + '(DEFAULT!)' + colors.reset : ''}`);
    console.log(`  Files: ${filesChanged} | +${insertions} / -${deletions}`);
    console.log();    const event = {
        type: 'commit',
        timestamp: Date.now(),
        metadata: {
            message,
            branch,
            isDefaultBranch,
            filesChanged,
            insertions,
            deletions,
        },
    };

    const result = evaluate(event, defaultState);

    // Determine roast box style
    let borderColor = colors.green;
    let severityLabel = 'INFO';
    if (result.roast.severity === 'savage') {
        borderColor = colors.red;
        severityLabel = 'SAVAGE';
    } else if (result.roast.severity === 'medium') {
        borderColor = colors.yellow;
        severityLabel = 'MEDIUM';
    }

    console.log(`${borderColor}┌──────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${borderColor}│  🔥 ROAST [${severityLabel}]${' '.repeat(42 - severityLabel.length)}│${colors.reset}`);
    console.log(`${borderColor}│                                                          │${colors.reset}`);
    
    // Word wrap the roast message
    const words = result.roast.message.split(' ');
    let line = '';
    const lines = [];
    for (const word of words) {
        if ((line + word).length > 52) {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line += word + ' ';
        }
    }
    if (line.trim()) lines.push(line.trim());
    
    for (const l of lines) {
        const padding = ' '.repeat(56 - l.length);
        console.log(`${borderColor}│  ${l}${padding}│${colors.reset}`);
    }
    console.log(`${borderColor}│                                                          │${colors.reset}`);
    console.log(`${borderColor}│  💡 ${result.roast.advice}${' '.repeat(53 - result.roast.advice.length)}│${colors.reset}`);
    console.log(`${borderColor}└──────────────────────────────────────────────────────────┘${colors.reset}`);

    console.log();
    console.log(`${colors.bold}📊 Score Impact:${colors.reset}`);
    const scoreColor = result.score.delta >= 0 ? colors.green : colors.red;
    console.log(`   Total: ${result.score.total} (${scoreColor}${result.score.delta >= 0 ? '+' : ''}${result.score.delta}${colors.reset})`);
    console.log(`   Rank: ${colors.cyan}${result.rank.rank.name}${colors.reset}`);
    console.log(`   Personality: ${colors.magenta}${result.personality.type}${colors.reset}`);
    console.log(`   Teammate Suffering: ${colors.red}${result.suffering.score}/100${colors.reset} — ${result.suffering.title}`);
    
    if (result.analysis.verdicts.length > 0) {
        console.log();
        console.log(`${colors.bold}📋 Verdicts:${colors.reset}`);
        for (const v of result.analysis.verdicts) {
            const icon = v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '🟡' : '🟢';
            console.log(`   ${icon} [${v.severity.toUpperCase()}] ${v.category}: ${v.message}`);
        }
    }

    console.log('\n─────────────────────────────────────────────────────────\n');
}

// ─── MAIN ────────────────────────────────────────────────────

const gitDir = getGitDir();
console.log(`${colors.cyan}Git Gud is watching your commits...${colors.reset}`);
console.log(`Monitoring: ${gitDir}\n`);

// Check if user wants to roast the last commit immediately
if (process.argv.includes('--last')) {
    roastCommit();
    process.exit(0);
}

// Interactive mode
console.log('1. Make a commit in another terminal');
console.log('2. Press ENTER here to roast it\n');
console.log('Or run: node git-gud-roast.js --last\n');

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask() {
    rl.question(`${colors.bold}Press ENTER to check for new commits (or type 'q' to quit): ${colors.reset}`, (answer) => {
        if (answer.toLowerCase() === 'q') {
            console.log('Goodbye!');
            rl.close();
            return;
        }
        roastCommit();
        ask();
    });
}

ask();
