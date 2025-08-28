class Toaster {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.toastId = 0;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'toaster-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(this.container);
    }

    show(type = 'info', title, message, options = {}) {
        const {
            duration = type === 'error' ? 7000 : 4000,
            closable = true,
            persistent = false
        } = options;

        const toastId = ++this.toastId;
        const toast = this.createToastElement(type, title, message, toastId, closable);

        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        if (!persistent && duration > 0) {
            this.setupAutoDismiss(toastId, duration);
        }

        return toastId;
    }

    createToastElement(type, title, message, toastId, closable) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
            </div>
            ${closable ? `
                <button class="toast-close" type="button" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
            <div class="toast-progress"></div>
        `;

        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismiss(toastId));
        }

        return toast;
    }

    setupAutoDismiss(toastId, duration) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const progressBar = toast.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = `${duration}ms`;

            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }

        setTimeout(() => {
            this.dismiss(toastId);
        }, duration);
    }

    dismiss(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        toast.classList.add('removing');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    dismissAll() {
        this.toasts.forEach((_, toastId) => {
            this.dismiss(toastId);
        });
    }

    success(title, message, options) {
        return this.show('success', title, message, options);
    }

    error(title, message, options) {
        return this.show('error', title, message, options);
    }

    warning(title, message, options) {
        return this.show('warning', title, message, options);
    }

    info(title, message, options) {
        return this.show('info', title, message, options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getActiveToasts() {
        return this.toasts.size;
    }

    destroy() {
        this.dismissAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}

class GameUI {
    constructor() {
        this.elements = {};
        this.toaster = new Toaster();
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
            guessedDisplay: document.getElementById('guessedDisplay'),

            virtualKeyboard: document.getElementById('virtualKeyboard'),

            newGameBtn: document.getElementById('newGameBtn'),
            hintBtn: document.getElementById('hintBtn'),
            soundToggle: document.getElementById('soundToggle'),
            testToastBtn: document.getElementById('testToastBtn'),

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
                if (window.wordPuzzleGame) {
                    const success = window.wordPuzzleGame.useHint();
                    if (!success) {
                        if (window.wordPuzzleGame.lives >= 2) {
                            this.showWarning('Hint Niet Beschikbaar', 'Hints zijn alleen beschikbaar met minder dan 2 levens!');
                        } else {
                            this.showWarning('Geen Hints', 'Er zijn momenteel geen hints beschikbaar!');
                        }
                    } else {
                        this.showSuccess('Hint Gebruikt!', 'Een letter is onthuld 💡');
                    }
                }
            });
        }

        if (this.elements.testToastBtn) {
            this.elements.testToastBtn.addEventListener('click', () => {
                this.showTestToasts();
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

        this.updateKeyboard(gameStatus);

        this.updateHintText(gameStatus);

        this.updateHintButton(gameStatus);

        this.updateGuessedDisplay(gameStatus);
    }

    updateWordDisplay(gameStatus) {
        if (!this.elements.wordDisplay) return;
        this.elements.wordDisplay.innerHTML = '';

        if (!gameStatus.currentWords || gameStatus.currentWords.length === 0) return;

        const maxLength = Math.max(...gameStatus.currentWords.map(word => word.length));
        document.documentElement.style.setProperty('--max-word-length', maxLength);

        gameStatus.currentWords.forEach((word, i) => {
            const row = document.createElement('div');
            row.className = 'word-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'center';
            row.style.gap = '8px';
            row.style.marginBottom = '12px';
            row.style.flexWrap = 'wrap';
            row.style.width = '100%';

            word.split('').forEach((letter, idx) => {
                const letterSlot = document.createElement('div');
                letterSlot.className = 'letter-slot';

                const revealedPositions = gameStatus.revealedPositionsPerWord && gameStatus.revealedPositionsPerWord[i];
                if (revealedPositions && revealedPositions.includes(idx)) {
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

                const status = gameStatus.letterStatus && gameStatus.letterStatus[letter];
                if (status) {
                    if (!status.presentInAny) {
                        key.classList.add('incorrect');
                        key.setAttribute('aria-disabled', 'true');
                        key.style.pointerEvents = 'none';
                        key.style.opacity = '0.4';
                    } else if (!status.remaining) {
                        key.setAttribute('aria-disabled', 'true');
                        key.style.pointerEvents = 'none';
                        key.style.opacity = '0.6';
                    } else if (gameStatus.correctLetters.includes(letter)) {
                        key.classList.add('correct');
                    }
                }
            }
        });
    }

    updateHintText(gameStatus) {
        if (!this.elements.wordHint) return;

        if (gameStatus.gameState === 'playing') {
            this.elements.wordHint.textContent = `Raad het woord!`;
        } else if (gameStatus.gameState === 'won') {
            this.elements.wordHint.textContent = 'Gefeliciteerd! Je hebt alle woorden geraden!';
        } else if (gameStatus.gameState === 'lost') {
            this.elements.wordHint.textContent = `Game over!`;
        }
    }

    updateHintButton(gameStatus) {
        if (!this.elements.hintBtn) return;

        const canUseHint = gameStatus.lives < 2 && gameStatus.gameState === 'playing';

        if (canUseHint) {
            this.elements.hintBtn.disabled = false;
            this.elements.hintBtn.style.opacity = '1';
            this.elements.hintBtn.style.pointerEvents = 'auto';
            this.elements.hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint';
        } else {
            this.elements.hintBtn.disabled = true;
            this.elements.hintBtn.style.opacity = '0.5';
            this.elements.hintBtn.style.pointerEvents = 'none';
            if (gameStatus.lives >= 2) {
                this.elements.hintBtn.innerHTML = '<i class="fas fa-lock"></i> Hint';
            } else {
                this.elements.hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint';
            }
        }
    }

    updateGuessedDisplay(gameStatus) {
        if (!this.elements.guessedDisplay) return;

        const totalWords = gameStatus.currentWords ? gameStatus.currentWords.length : 0;
        let completedWords = 0;

        if (gameStatus.currentWords && gameStatus.revealedPositionsPerWord) {
            completedWords = gameStatus.currentWords.reduce((count, word, i) => {
                const isComplete = gameStatus.revealedPositionsPerWord[i] &&
                    gameStatus.revealedPositionsPerWord[i].length === word.length;
                return count + (isComplete ? 1 : 0);
            }, 0);
        }

        this.elements.guessedDisplay.textContent = `${completedWords}/${totalWords}`;
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

    showTemporaryMessage(text, duration = 3000, type = 'info') {
        return this.toaster.show(type, null, text, { duration });
    }

    showToast(type, title, message, options) {
        return this.toaster.show(type, title, message, options);
    }

    showSuccess(title, message, options) {
        return this.toaster.success(title, message, options);
    }

    showError(title, message, options) {
        return this.toaster.error(title, message, options);
    }

    showWarning(title, message, options) {
        return this.toaster.warning(title, message, options);
    }

    showInfo(title, message, options) {
        return this.toaster.info(title, message, options);
    }

    showTestToasts() {
        const toasts = [
            { type: 'success', title: 'Success!', message: 'Dit is een success bericht 🎉', delay: 0 },
            { type: 'info', title: 'Info', message: 'Dit is een informatief bericht 💡', delay: 500 },
            { type: 'warning', title: 'Waarschuwing', message: 'Dit is een waarschuwing ⚠️', delay: 1000 },
            { type: 'error', title: 'Error', message: 'Dit is een error bericht ❌', delay: 1500 }
        ];

        toasts.forEach(toast => {
            setTimeout(() => {
                this.showToast(toast.type, toast.title, toast.message);
            }, toast.delay);
        });
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
    }
}

let gameUI;

document.addEventListener('DOMContentLoaded', function () {
    gameUI = new GameUI();
    window.gameUI = gameUI;
});