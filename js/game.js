class WordPuzzleGame {
    constructor() {
        this.EasyWordList = [
            'APPEL', 'BANAAN', 'CITROEN', 'DRUIF', 'AARDBEI',
            'HUIS', 'AUTO', 'FIETS', 'TREIN', 'VLIEGTUIG',
            'SCHOOL', 'BOEK', 'TAFEL', 'STOEL', 'LAMP',
            'WATER', 'BROOD', 'KAAS', 'MELK', 'KOFFIE',
            'MUZIEK', 'DANSEN', 'ZINGEN', 'LACHEN', 'SPELEN',
            'ROOD', 'BLAUW', 'GROEN', 'GEEL', 'ZWART',
            'GROOT', 'KLEIN', 'MOOI', 'LELIJK', 'NIEUW',
            'WINTER', 'LENTE', 'ZOMER', 'HERFST', 'SNEEUW',
            'BLOEM', 'BOOM', 'GRAS', 'VOGEL', 'HOND',
            'COMPUTER', 'TELEFOON', 'INTERNET', 'WEBSITE', 'EMAIL'
        ];
        this.HardWordList = [
            'KETTINGZAAG', 'VERDOVENDE', 'ONDERBROEK', 'AFSPRAAK', 'VERANTWOORD',
            'ONDERWIJS', 'VERBETEREN', 'AFLEIDING', 'VERWACHTING', 'ONDERSTEUNING',
            'UITDAGING', 'VERKENNING', 'ONDERZOEK', 'AFLEIDING', 'VERBINDING',
            'SAMENWERKING', 'VERANTWOORDELIJKHEID', 'DOELGERICHTHEID', 'INNOVATIE', 'KWALITEIT',
            'EFFICIENTIE', 'TRANSPARANTIE', 'COMMUNICATIE', 'COLLABORATIE', 'PROACTIVITEIT',
            'LEIDERSCHAP', 'STRATEGIE', 'IMPLEMENTATIE', 'OPTIMALISATIE', 'DIGITALISATIE'
        ];

        this.currentWords = [];
        this.revealedPositionsPerWord = [];
        this.guessedLetters = [];
        this.correctLetters = [];
        this.wrongLetters = [];
        this.lives = 5;
        this.score = 0;
        this.gameState = 'playing';
        this.soundEnabled = true;
        this.streak = 0;
        this.hintsUsed = 0;

        this.sounds = {};

        this.lastGuessedLetter = null;
        this.lastReveal = null;

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadSounds();
        this.startNewGame();
    }

    loadSounds() {
        const soundFiles = {
            correct: 'assets/sounds/correct.mp3',
            wrong: 'assets/sounds/wrong.mp3',
            victory: 'assets/sounds/victory.mp3',
            gameOver: 'assets/sounds/gameOver.mp3'
        };

        for (const [type, path] of Object.entries(soundFiles)) {
            try {
                this.sounds[type] = new Audio(path);
                this.sounds[type].preload = 'auto';
                this.sounds[type].volume = type === 'gameOver' ? 1.0 : 0.5;
            } catch (error) {
                console.warn(`❌ Failed to load sound: ${type}`, error);
            }
        }
    }

    startNewGame(wordCount = 3) {
        const pool = [...this.EasyWordList, ...this.HardWordList];
        const chosen = [];
        const maxWords = Math.min(wordCount, pool.length);

        while (chosen.length < maxWords) {
            const idx = Math.floor(Math.random() * pool.length);
            const word = pool[idx];
            if (!chosen.includes(word)) chosen.push(word);
        }

        this.currentWords = chosen;
        this.revealedPositionsPerWord = this.currentWords.map(word => new Set());
        this.guessedLetters = [];
        this.correctLetters = [];
        this.wrongLetters = [];
        this.lives = 5;
        this.score = 0;
        this.gameState = 'playing';
        this.streak = 0;
        this.hintsUsed = 0;

        console.log(`New words: ${this.currentWords.join(', ')}`);

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }
    }

    getRandomWord() {
        const randomIndex = Math.floor(Math.random() * this.EasyWordList.length);
        return this.EasyWordList[randomIndex];
    }
    getRandomHardWord() {
        const randomIndex = Math.floor(Math.random() * this.HardWordList.length);
        return this.HardWordList[randomIndex];
    }

    guessLetter(letter) {
        letter = letter.toUpperCase();

        if (this.gameState !== 'playing') return false;

        this.lastGuessedLetter = letter;
        this.lastReveal = null;

        const remaining = this.currentWords.some((word, i) => {
            for (let idx = 0; idx < word.length; idx++) {
                if (word[idx] === letter && !this.revealedPositionsPerWord[i].has(idx)) {
                    return true;
                }
            }
            return false;
        });

        if (!remaining && this.guessedLetters.includes(letter)) {
            return false;
        }

        if (!this.guessedLetters.includes(letter)) this.guessedLetters.push(letter);

        if (remaining) {
            let revealed = false;
            for (let i = 0; i < this.currentWords.length && !revealed; i++) {
                const word = this.currentWords[i];
                for (let idx = 0; idx < word.length; idx++) {
                    if (word[idx] === letter && !this.revealedPositionsPerWord[i].has(idx)) {
                        this.revealedPositionsPerWord[i].add(idx);
                        this.lastReveal = { wordIndex: i, position: idx, letter };

                        if (!this.correctLetters.includes(letter)) this.correctLetters.push(letter);
                        this.score += 10;
                        this.streak++;
                        this.playSound('correct');

                        if (this.streak === 3 && this.lives < 5) {
                            this.lives++;
                            this.streak = 0;

                            if (window.gameUI) {
                                window.gameUI.showSuccess('Streak Bonus!', 'Je hebt een extra leven gekregen!');
                            }
                        }

                        if (this.isWordCompleted()) {
                            this.winGame();
                        }

                        revealed = true;
                        break;
                    }
                }
            }
        } else {
            const presentInAny = this.currentWords.some(word => word.includes(letter));

            if (!presentInAny) {
                if (!this.wrongLetters.includes(letter)) this.wrongLetters.push(letter);
                this.lives--;
                this.streak = 0;

                if (this.lives > 0) {
                    this.playSound('wrong');
                } else {
                    this.loseGame();
                }
            }

        }

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }

        return true;
    }

    isWordCompleted() {
        return this.currentWords.every((word, i) => {
            return this.revealedPositionsPerWord[i].size === word.length;
        });
    }

    winGame() {
        this.gameState = 'won';
        this.score += 50;
        this.playSound('victory');

        if (window.gameUI) {
            const wordsText = this.currentWords && this.currentWords.length > 0
                ? `De woorden waren: "${this.currentWords.join('\", \"')}".`
                : '';
            window.gameUI.showMessage(
                'Gefeliciteerd! 🎉',
                `Je hebt alle woorden geraden! ${wordsText}`.trim(),
                'Nieuw Spel',
                () => this.startNewGame()
            );
        }
    }

    loseGame() {
        this.gameState = 'lost';
        this.playSound('gameOver');

        if (window.gameUI) {
            const wordsText = this.currentWords && this.currentWords.length > 0
                ? `De woorden waren: "${this.currentWords.join('\", \"')}"`
                : 'Geen woorden beschikbaar.';
            window.gameUI.showMessage(
                'Game Over! 💀',
                wordsText,
                'Nieuw Spel',
                () => {
                    this.score = 0;
                    this.startNewGame();
                }
            );
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            const sound = this.sounds[type];
            if (sound) {
                sound.currentTime = 0;

                const playPromise = sound.play();

                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn(`⚠️ Could not play sound: ${type}`, error);
                    });
                }
            }
        } catch (error) {
            console.warn(`❌ Error playing sound: ${type}`, error);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    useHint() {
        if (this.lives >= 2) {
            return false;
        }

        if (this.gameState !== 'playing') {
            return false;
        }

        const unrevealedPositions = [];

        for (let i = 0; i < this.currentWords.length; i++) {
            const word = this.currentWords[i];
            for (let idx = 0; idx < word.length; idx++) {
                if (!this.revealedPositionsPerWord[i].has(idx)) {
                    unrevealedPositions.push({ wordIndex: i, position: idx });
                }
            }
        }

        if (unrevealedPositions.length === 0) {
            return false;
        }

        const choice = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        const i = choice.wordIndex;
        const idx = choice.position;
        const letter = this.currentWords[i][idx];

        this.revealedPositionsPerWord[i].add(idx);

        if (!this.guessedLetters.includes(letter)) this.guessedLetters.push(letter);
        if (!this.correctLetters.includes(letter)) this.correctLetters.push(letter);

        this.hintsUsed++;

        if (this.isWordCompleted()) {
            this.winGame();
        }

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }

        return true;
    }

    loadSettings() {
        if (gameStorage) {
            const settings = gameStorage.loadSettings();
            this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
        }
    }

    getGameStatus() {
        const wordProgress = this.currentWords.map((word, i) =>
            word.split('').map((letter, idx) => this.revealedPositionsPerWord[i].has(idx) ? letter : '_').join(' ')
        );


        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const letterStatus = {};
        letters.forEach(ch => {
            const presentInAny = this.currentWords.some(word => word.includes(ch));
            const remaining = this.currentWords.some((word, i) => {
                for (let idx = 0; idx < word.length; idx++) {
                    if (word[idx] === ch && !this.revealedPositionsPerWord[i].has(idx)) {
                        return true;
                    }
                }
                return false;
            });
            letterStatus[ch] = { presentInAny, remaining };
        });

        return {
            currentWords: [...this.currentWords],
            wordProgress,
            revealedPositionsPerWord: this.revealedPositionsPerWord.map(s => Array.from(s)),
            guessedLetters: [...this.guessedLetters],
            correctLetters: [...this.correctLetters],
            wrongLetters: [...this.wrongLetters],
            letterStatus,
            lives: this.lives,
            score: this.score,
            gameState: this.gameState,
            soundEnabled: this.soundEnabled,
            streak: this.streak,
            hintsUsed: this.hintsUsed,
            lastGuessedLetter: this.lastGuessedLetter,
            lastReveal: this.lastReveal
        };
    }
}

let wordPuzzleGame;

document.addEventListener('DOMContentLoaded', function () {
    wordPuzzleGame = new WordPuzzleGame();
    window.wordPuzzleGame = wordPuzzleGame;
});
