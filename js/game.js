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

    // now support multiple words per game
    this.currentWords = [];
    this.revealedLettersPerWord = []; // array of Sets, one per word
    this.guessedLetters = []; // letters the player has tried (globally)
    this.correctLetters = []; // letters revealed at least once across words
    this.wrongLetters = [];
        this.lives = 5;
        this.score = 0;
        this.gameState = 'playing';
        this.soundEnabled = true;

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

    // start a game with multiple words
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

        console.log(`🎯 New words: ${this.currentWords.join(', ')}`);

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }
    }

    getRandomWord() {
        const randomIndex = Math.floor(Math.random() * this.EasyWordList.length);
        return this.EasyWordList[randomIndex];
    }
    getRandomHardWord(){
        const randomIndex = Math.floor(Math.random() * this.HardWordList.length);
        return this.HardWordList[randomIndex];
    }

    // On each guess, reveal the letter in the first word (in order) that contains it and
    // still has that letter unrevealed. If no words contain it at all, treat as wrong.
    // The player may press the same letter multiple times; once all words that contain
    // the letter have had it revealed, further presses will be rejected and the UI
    // should disable the key.
    guessLetter(letter) {
        letter = letter.toUpperCase();

        if (this.gameState !== 'playing') return false;

        // determine if there are remaining unrevealed occurrences across words
        const remaining = this.currentWords.some((word, i) => word.includes(letter) && !this.revealedLettersPerWord[i].has(letter));

        // if letter already fully exhausted (no remaining) and it was already tried, reject
        if (!remaining && this.guessedLetters.includes(letter)) {
            return false;
        }

        // record that the player tried this letter at least once
        if (!this.guessedLetters.includes(letter)) this.guessedLetters.push(letter);

        if (remaining) {
            // reveal in the first matching word that still needs it
            for (let i = 0; i < this.currentWords.length; i++) {
                const word = this.currentWords[i];
                if (word.includes(letter) && !this.revealedLettersPerWord[i].has(letter)) {
                    this.revealedLettersPerWord[i].add(letter);

                    if (!this.correctLetters.includes(letter)) this.correctLetters.push(letter);
                    this.score += 10;
                    this.playSound('correct');

                    // check completion after revealing
                    if (this.isWordCompleted()) {
                        this.winGame();
                    }

                    break; // stop after first reveal
                }
            }
        } else {
            // wrong guess (letter not present in any word or already revealed everywhere)
            // check if letter exists in any word at all
            const presentInAny = this.currentWords.some(word => word.includes(letter));

            // If the letter is present in no words at all, it's a wrong guess
            if (!presentInAny) {
                if (!this.wrongLetters.includes(letter)) this.wrongLetters.push(letter);
                this.lives--;

                if (this.lives > 0) {
                    this.playSound('wrong');
                } else {
                    this.loseGame();
                }
            }

            // if the letter was present but had no remaining unrevealed occurrences,
            // we considered it exhausted and already added to guessedLetters above.
        }

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }

        return true;
    }

    isWordCompleted() {
        // completed when every word has all unique letters revealed
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

    loadSettings() {
        if (gameStorage) {
            const settings = gameStorage.loadSettings();
            this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
        }
    }

    getGameStatus() {
        // build per-word progress and letter status map for the UI
        const wordProgress = this.currentWords.map((word, i) =>
            word.split('').map(letter => this.revealedLettersPerWord[i].has(letter) ? letter : '_').join(' ')
        );

        // letter status: presentInAny, remaining (unrevealed occurrences exist)
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
            soundEnabled: this.soundEnabled
        };
    }
}

let wordPuzzleGame;

document.addEventListener('DOMContentLoaded', function () {
    wordPuzzleGame = new WordPuzzleGame();
    window.wordPuzzleGame = wordPuzzleGame;
});
