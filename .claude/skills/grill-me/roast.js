test({
    type: 'commit',
    timestamp: Date.now(),
    metadata: {
        message: 'asdf',
        branch: 'main',
        isDefaultBranch: true,
        filesChanged: 50,
        insertions: 2000,
        deletions: 0
    },
}, 'Worst commit ever');