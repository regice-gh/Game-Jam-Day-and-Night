class WordPuzzleGame {
    constructor() {
        this.wordList = [
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

        this.currentWord = '';
        this.guessedLetters = [];
        this.correctLetters = [];
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
            gameOver: 'assets/sounds/gameOver.mp3'
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

    startNewGame() {
        this.currentWord = this.getRandomWord();
        this.guessedLetters = [];
        this.correctLetters = [];
        this.wrongLetters = [];
        this.lives = 5;
        this.gameState = 'playing';

        console.log(`🎯 New word: ${this.currentWord}`);

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }
    }

    getRandomWord() {
        const randomIndex = Math.floor(Math.random() * this.wordList.length);
        return this.wordList[randomIndex];
    }

    guessLetter(letter) {
        letter = letter.toUpperCase();

        if (this.gameState !== 'playing' || this.guessedLetters.includes(letter)) {
            return false;
        }

        this.guessedLetters.push(letter);

        if (this.currentWord.includes(letter)) {
            this.correctLetters.push(letter);
            this.score += 10;
            this.playSound('correct');

            if (this.isWordCompleted()) {
                this.winGame();
            }
        } else {
            this.wrongLetters.push(letter);
            this.lives--;

            if (this.lives > 0) {
                this.playSound('wrong');
            } else {
                this.loseGame();
            }
        }

        if (window.gameUI) {
            window.gameUI.updateDisplay();
        }

        return true;
    }

    isWordCompleted() {
        return this.currentWord.split('').every(letter => this.correctLetters.includes(letter));
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
        return {
            currentWord: this.currentWord,
            wordProgress: this.currentWord.split('').map(letter =>
                this.correctLetters.includes(letter) ? letter : '_'
            ).join(' '),
            guessedLetters: [...this.guessedLetters],
            correctLetters: [...this.correctLetters],
            wrongLetters: [...this.wrongLetters],
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
