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
            'KETTINGSAW', 'VERDOVENDE', 'ONDERBROEK', 'AFSPRAAK', 'VERANTWOORD',
            'ONDERWIJS', 'VERBETEREN', 'AFLEIDING', 'VERWACHTING', 'ONDERSTEUNING',
            'UITDAGING', 'VERKENNING', 'ONDERZOEK', 'AFLEIDING', 'VERBINDING',
            'SAMENWERKING', 'VERANTWOORDELIJKHEID', 'DOELGERICHTHEID', 'INNOVATIE', 'KWALITEIT',
            'EFFICIENTIE', 'TRANSPARANTIE', 'COMMUNICATIE', 'COLLABORATIE', 'PROACTIVITEIT'
        ];

        this.currentWords = [];
        this.revealedLettersPerWord = [];
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

        this.init();
    }

    init() {
        console.log('🎮 Word Puzzle Game initialized!');
        this.loadSettings();
        this.loadSounds();
        this.startNewGame();
    }

    loadSounds() {
        const soundFiles = {
            correct: 'assets/sounds/correct.mp3',
            wrong: 'assets/sounds/wrong.mp3',
            victory: 'assets/sounds/victory.mp3',
            gameOver: 'assets/sounds/gameover.mp3'
        };

        for (const [type, path] of Object.entries(soundFiles)) {
            try {
                this.sounds[type] = new Audio(path);
                this.sounds[type].preload = 'auto';
                this.sounds[type].volume = type === 'gameOver' ? 1.0 : 0.5;
                console.log(`✅ Sound loaded: ${type}`);
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
        this.revealedLettersPerWord = this.currentWords.map(() => new Set());
        this.guessedLetters = [];
        this.correctLetters = [];
        this.wrongLetters = [];
        this.lives = 5;
        this.score = 0;
        this.gameState = 'playing';
        this.streak = 0;
        this.hintsUsed = 0;

        console.log(`🎯 New words: ${this.currentWords.join(', ')}`);

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

        const remaining = this.currentWords.some((word, i) => word.includes(letter) && !this.revealedLettersPerWord[i].has(letter));

        if (!remaining && this.guessedLetters.includes(letter)) {
            return false;
        }

        if (!this.guessedLetters.includes(letter)) this.guessedLetters.push(letter);

        if (remaining) {
            for (let i = 0; i < this.currentWords.length; i++) {
                const word = this.currentWords[i];
                if (word.includes(letter) && !this.revealedLettersPerWord[i].has(letter)) {
                    this.revealedLettersPerWord[i].add(letter);

                    if (!this.correctLetters.includes(letter)) this.correctLetters.push(letter);
                    this.score += 10;
                    this.streak++;
                    this.playSound('correct');

                    if (this.streak === 3 && this.lives < 5) {
                        this.lives++;
                        this.streak = 0;
                        console.log('🎉 Streak bonus! Extra life granted!');
                        
                        if (window.gameUI) {
                            window.gameUI.showSuccess('Streak Bonus!', 'Je hebt een extra leven gekregen! 🎉');
                        }
                    }

                    if (this.isWordCompleted()) {
                        this.winGame();
                    }

                    break;
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
            const unique = Array.from(new Set(word.split('')));
            return unique.every(ch => this.revealedLettersPerWord[i].has(ch));
        });
    }

    winGame() {
        this.gameState = 'won';
        this.score += 50;
        this.playSound('victory');

        if (window.gameUI) {
            window.gameUI.showMessage(
                'Gefeliciteerd! 🎉',
                `Je hebt het woord "${this.currentWord}" geraden!`,
                'Volgend woord',
                () => this.startNewGame()
            );
        }
    }

    loseGame() {
        this.gameState = 'lost';
        this.playSound('gameOver');

        if (window.gameUI) {
            window.gameUI.showMessage(
                'Game Over! 💀',
                `Het woord was: "${this.currentWord}"`,
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

                console.log(`🔊 Playing sound: ${type}`);
            } else {
                console.warn(`⚠️ Sound not found: ${type}`);
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
            console.log('❌ Hints can only be used when you have less than 2 lives');
            return false;
        }

        if (this.gameState !== 'playing') {
            console.log('❌ Cannot use hint when game is not active');
            return false;
        }

        const unrevealedLetters = [];

        for (let i = 0; i < this.currentWords.length; i++) {
            const word = this.currentWords[i];
            for (const letter of word) {
                if (!this.revealedLettersPerWord[i].has(letter) && !unrevealedLetters.includes(letter)) {
                    unrevealedLetters.push(letter);
                }
            }
        }

        if (unrevealedLetters.length === 0) {
            console.log('❌ No letters available for hint');
            return false;
        }

        const randomLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];

        for (let i = 0; i < this.currentWords.length; i++) {
            const word = this.currentWords[i];
            if (word.includes(randomLetter)) {
                this.revealedLettersPerWord[i].add(randomLetter);
            }
        }

        if (!this.guessedLetters.includes(randomLetter)) this.guessedLetters.push(randomLetter);
        if (!this.correctLetters.includes(randomLetter)) this.correctLetters.push(randomLetter);

        this.hintsUsed++;
        console.log(`💡 Hint used! Letter "${randomLetter}" revealed`);

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
            word.split('').map(letter => this.revealedLettersPerWord[i].has(letter) ? letter : '_').join(' ')
        );


        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const letterStatus = {};
        letters.forEach(ch => {
            const presentInAny = this.currentWords.some(word => word.includes(ch));
            const remaining = this.currentWords.some((word, i) => word.includes(ch) && !this.revealedLettersPerWord[i].has(ch));
            letterStatus[ch] = { presentInAny, remaining };
        });

        return {
            currentWords: [...this.currentWords],
            wordProgress,
            revealedLettersPerWord: this.revealedLettersPerWord.map(s => Array.from(s)),
            guessedLetters: [...this.guessedLetters],
            correctLetters: [...this.correctLetters],
            wrongLetters: [...this.wrongLetters],
            letterStatus,
            lives: this.lives,
            score: this.score,
            gameState: this.gameState,
            soundEnabled: this.soundEnabled,
            streak: this.streak,
            hintsUsed: this.hintsUsed
        };
    }
}

let wordPuzzleGame;

document.addEventListener('DOMContentLoaded', function () {
    wordPuzzleGame = new WordPuzzleGame();
    window.wordPuzzleGame = wordPuzzleGame;
});
