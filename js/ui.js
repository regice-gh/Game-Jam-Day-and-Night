class GameUI {
    constructor() {
        this.elements = {};
        this.init();
    }

    init() {
        console.log('🎨 UI Manager initialized!');

        this.cacheElements();

        this.setupEventListeners();

        this.initializeKeyboard();

        setTimeout(() => {
            this.updateDisplay();
        }, 100);
    }

    cacheElements() {
        this.elements = {
            wordDisplay: document.getElementById('wordDisplay'),
            wordHint: document.getElementById('wordHint'),

            livesDisplay: document.getElementById('livesDisplay'),
            scoreDisplay: document.getElementById('scoreDisplay'),

            usedLetters: document.getElementById('usedLetters'),

            virtualKeyboard: document.getElementById('virtualKeyboard'),

            newGameBtn: document.getElementById('newGameBtn'),
            hintBtn: document.getElementById('hintBtn'),
            soundToggle: document.getElementById('soundToggle'),

            gameMessage: document.getElementById('gameMessage'),
            messageTitle: document.getElementById('messageTitle'),
            messageText: document.getElementById('messageText'),
            messageBtn: document.getElementById('messageBtn')
        };

        console.log('DOM elements cached');
    }

    setupEventListeners() {
        if (this.elements.newGameBtn) {
            this.elements.newGameBtn.addEventListener('click', () => {
                if (window.wordPuzzleGame) {
                    window.wordPuzzleGame.startNewGame();
                }
            });
        }

        if (this.elements.soundToggle) {
            this.elements.soundToggle.addEventListener('click', () => {
                if (window.wordPuzzleGame) {
                    const soundEnabled = window.wordPuzzleGame.toggleSound();
                    this.updateSoundButton(soundEnabled);
                }
            });
        }

        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => {
                console.log('Hint button clicked - feature coming soon!');
                this.showTemporaryMessage('Hints komen binnenkort!', 2000);
            });
        }

        console.log('Event listeners set up');
    }

    initializeKeyboard() {
        if (!this.elements.virtualKeyboard) {
            console.log('Virtual keyboard element not found');
            return;
        }

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.elements.virtualKeyboard.innerHTML = '';

        letters.forEach(letter => {
            const keyElement = document.createElement('div');
            keyElement.className = 'key';
            keyElement.textContent = letter;
            keyElement.dataset.letter = letter;

            keyElement.addEventListener('click', () => {
                this.handleLetterClick(letter);
            });

            this.elements.virtualKeyboard.appendChild(keyElement);
        });

        console.log('Virtual keyboard initialized');
    }

    handleLetterClick(letter) {
        if (window.wordPuzzleGame) {
            const success = window.wordPuzzleGame.guessLetter(letter);

            if (success) {
                const keyElement = this.elements.virtualKeyboard.querySelector(`[data-letter="${letter}"]`);
                if (keyElement) {
                    keyElement.classList.add('used');
                }
            }
        }
    }

    updateDisplay() {
        if (!window.wordPuzzleGame) {
            console.log('Game not initialized yet');
            return;
        }

        const gameStatus = window.wordPuzzleGame.getGameStatus();

        this.updateWordDisplay(gameStatus);

        this.updateLivesDisplay(gameStatus.lives);

        this.updateScoreDisplay(gameStatus.score);

        this.updateUsedLetters(gameStatus);

        this.updateKeyboard(gameStatus);

        this.updateHintText(gameStatus);
    }

    updateWordDisplay(gameStatus) {
        if (!this.elements.wordDisplay) return;
        // render multiple words as rows; use revealedLettersPerWord to decide
        this.elements.wordDisplay.innerHTML = '';

        if (!gameStatus.currentWords || gameStatus.currentWords.length === 0) return;

        gameStatus.currentWords.forEach((word, i) => {
            const row = document.createElement('div');
            row.className = 'word-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'center';
            row.style.gap = '10px';
            row.style.marginBottom = '8px';

            word.split('').forEach(letter => {
                const letterSlot = document.createElement('div');
                letterSlot.className = 'letter-slot';

                if (gameStatus.revealedLettersPerWord && gameStatus.revealedLettersPerWord[i] && gameStatus.revealedLettersPerWord[i].includes(letter)) {
                    letterSlot.textContent = letter;
                    letterSlot.classList.add('revealed');
                } else {
                    letterSlot.textContent = '';
                }

                row.appendChild(letterSlot);
            });

            this.elements.wordDisplay.appendChild(row);
        });
    }

    updateLivesDisplay(lives) {
        if (!this.elements.livesDisplay) return;

        const hearts = this.elements.livesDisplay.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
    }

    updateScoreDisplay(score) {
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = score;
        }
    }

    updateUsedLetters(gameStatus) {
        if (!this.elements.usedLetters) return;

        this.elements.usedLetters.innerHTML = '';

        gameStatus.guessedLetters.forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'used-letter';
            letterElement.textContent = letter;

            // mark correct if revealed at least once, incorrect if never present in any word
            const status = gameStatus.letterStatus && gameStatus.letterStatus[letter];
            if (status) {
                if (!status.presentInAny) {
                    letterElement.classList.add('incorrect');
                } else if (!status.remaining) {
                    // present but fully revealed -> mark as correct
                    letterElement.classList.add('correct');
                } else if (gameStatus.correctLetters.includes(letter)) {
                    letterElement.classList.add('correct');
                } else {
                    // guessed but still has remaining occurrences
                    letterElement.classList.add('used');
                }
            }

            this.elements.usedLetters.appendChild(letterElement);
        });
    }

    updateKeyboard(gameStatus) {
        if (!this.elements.virtualKeyboard) return;

        const keys = this.elements.virtualKeyboard.querySelectorAll('.key');
        keys.forEach(key => {
            const letter = key.dataset.letter;

            key.classList.remove('used', 'correct', 'incorrect');
            key.style.pointerEvents = '';
            key.style.opacity = '';
            key.removeAttribute('aria-disabled');

            if (gameStatus.guessedLetters.includes(letter)) {
                key.classList.add('used');
            }

            const status = gameStatus.letterStatus && gameStatus.letterStatus[letter];
            if (status) {
                if (!status.presentInAny) {
                    // letter not present in any word -> disable and mark incorrect
                    key.classList.add('incorrect');
                    key.setAttribute('aria-disabled', 'true');
                    key.style.pointerEvents = 'none';
                    key.style.opacity = '0.4';
                } else if (!status.remaining) {
                    // present but fully revealed -> disable
                    key.classList.add('used');
                    key.setAttribute('aria-disabled', 'true');
                    key.style.pointerEvents = 'none';
                    key.style.opacity = '0.6';
                } else if (gameStatus.correctLetters.includes(letter)) {
                    key.classList.add('correct');
                }
            }
        });
    }

    updateHintText(gameStatus) {
        if (!this.elements.wordHint) return;
        const totalWords = (gameStatus.currentWords && gameStatus.currentWords.length) || 0;
        const guessedCount = gameStatus.correctLetters.length;

        if (gameStatus.gameState === 'playing') {
            this.elements.wordHint.textContent = `Totaal ${totalWords} woorden - ${guessedCount} letters geraden`;
        } else if (gameStatus.gameState === 'won') {
            this.elements.wordHint.textContent = 'Gefeliciteerd! Je hebt alle woorden geraden!';
        } else if (gameStatus.gameState === 'lost') {
            this.elements.wordHint.textContent = `Game over!`; 
        }
    }

    updateSoundButton(soundEnabled) {
        if (this.elements.soundToggle) {
            const icon = soundEnabled ? 'fa-volume-up' : 'fa-volume-mute';
            this.elements.soundToggle.innerHTML = `<i class="fas ${icon}"></i> Geluid`;
        }
    }

    showMessage(title, text, buttonText, callback) {
        if (!this.elements.gameMessage) return;

        if (this.elements.messageTitle) {
            this.elements.messageTitle.textContent = title;
        }

        if (this.elements.messageText) {
            this.elements.messageText.textContent = text;
        }

        if (this.elements.messageBtn) {
            this.elements.messageBtn.textContent = buttonText || 'OK';

            this.elements.messageBtn.replaceWith(this.elements.messageBtn.cloneNode(true));
            this.elements.messageBtn = document.getElementById('messageBtn');

            this.elements.messageBtn.addEventListener('click', () => {
                this.hideMessage();
                if (callback) {
                    callback();
                }
            });
        }

        this.elements.gameMessage.classList.remove('hidden');
    }

    hideMessage() {
        if (this.elements.gameMessage) {
            this.elements.gameMessage.classList.add('hidden');
        }
    }

    showTemporaryMessage(text, duration = 3000) {
        const tempMessage = document.createElement('div');
        tempMessage.className = 'temp-message';
        tempMessage.textContent = text;
        tempMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            font-size: 16px;
            font-weight: 600;
            animation: fadeIn 0.3s ease-out;
        `;

        document.body.appendChild(tempMessage);

        setTimeout(() => {
            tempMessage.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (tempMessage.parentNode) {
                    tempMessage.parentNode.removeChild(tempMessage);
                }
            }, 300);
        }, duration);
    }

    animateLetterReveal(letterElement) {
        if (!letterElement) return;

        letterElement.style.transform = 'scale(0)';
        letterElement.style.opacity = '0';

        setTimeout(() => {
            letterElement.style.transition = 'all 0.3s ease-out';
            letterElement.style.transform = 'scale(1)';
            letterElement.style.opacity = '1';
        }, 50);
    }

    animateWrongGuess() {
        if (this.elements.wordDisplay) {
            this.elements.wordDisplay.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                this.elements.wordDisplay.style.animation = '';
            }, 500);
        }
    }

    showLoadingState() {
        if (this.elements.wordDisplay) {
            this.elements.wordDisplay.innerHTML = '<div class="loading">Laden...</div>';
        }
    }

    clearDisplay() {
        if (this.elements.wordDisplay) {
            this.elements.wordDisplay.innerHTML = '';
        }

        if (this.elements.usedLetters) {
            this.elements.usedLetters.innerHTML = '';
        }
    }
}

let gameUI;

document.addEventListener('DOMContentLoaded', function () {
    gameUI = new GameUI();
    window.gameUI = gameUI;
});