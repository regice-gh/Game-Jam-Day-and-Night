class InputHandler {
    constructor() {
        this.keyListeners = new Map();
        this.isListening = false;
        this.init();
    }

    init() {
        console.log('⌨️ Input Handler initialized!');

        this.setupKeyboardListeners();

        this.setupTouchSupport();

        this.startListening();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            if (this.isGameKey(key)) {
                event.preventDefault();
            }
        });

        console.log('Keyboard listeners set up');
    }

    handleKeyDown(event) {
        if (!this.isListening) return;

        const key = event.key.toLowerCase();

        if (this.isLetter(key)) {
            this.handleLetterInput(key.toUpperCase());
            return;
        }

        switch (key) {
            case 'enter':
                this.handleEnterKey();
                break;

            case 'escape':
                this.handleEscapeKey();
                break;

            case ' ':
            case 'spacebar':
                this.handleSpaceKey();
                break;

            case 'n':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleNewGameKey();
                }
                break;

            case 'h':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleHintKey();
                }
                break;

            case 'm':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleSoundToggleKey();
                }
                break;

            case 'f1':
                event.preventDefault();
                this.handleHelpKey();
                break;
        }
    }

    handleKeyUp(event) {
    }

    isLetter(key) {
        return /^[a-zA-Z]$/.test(key);
    }

    isGameKey(key) {
        const gameKeys = [
            'enter', 'escape', ' ', 'spacebar',
            'f1', 'n', 'h', 'm'
        ];

        return this.isLetter(key) || gameKeys.includes(key);
    }

    handleLetterInput(letter) {
        if (!window.wordPuzzleGame) {
            console.log('Game not initialized');
            return;
        }

        const success = window.wordPuzzleGame.guessLetter(letter);

        if (success) {
            console.log(`Letter ${letter} input processed`);

            this.addKeyboardFeedback(letter);
        } else {
            console.log(`Letter ${letter} input rejected (already guessed or game not active)`);

            this.showInputFeedback('Letter al geraden of spel niet actief', 'error');
        }
    }

    addKeyboardFeedback(letter) {
        if (window.gameUI && window.gameUI.elements.virtualKeyboard) {
            const keyElement = window.gameUI.elements.virtualKeyboard.querySelector(`[data-letter="${letter}"]`);

            if (keyElement) {
                keyElement.style.transform = 'scale(1.1)';
                keyElement.style.transition = 'transform 0.1s ease-out';

                setTimeout(() => {
                    keyElement.style.transform = '';
                }, 100);
            }
        }
    }

    handleEnterKey() {
        if (window.wordPuzzleGame) {
            const gameState = window.wordPuzzleGame.getGameStatus();

            if (gameState.gameState === 'won' || gameState.gameState === 'lost') {
                window.wordPuzzleGame.startNewGame();
                this.showInputFeedback('Nieuw spel gestart!', 'success');
            }
        }
    }

    handleEscapeKey() {
        if (window.gameUI) {
            window.gameUI.hideMessage();
        }

        console.log('Escape pressed - closing modals');
    }

    handleSpaceKey() {
        this.handleHintKey();
    }

    handleNewGameKey() {
        if (window.wordPuzzleGame) {
            window.wordPuzzleGame.startNewGame();
            this.showInputFeedback('Nieuw spel gestart! (Ctrl+N)', 'success');
        }
    }

    handleHintKey() {
        this.showInputFeedback('Hints komen binnenkort! (H of Spatie)', 'info');
    }

    handleSoundToggleKey() {
        if (window.wordPuzzleGame) {
            const soundEnabled = window.wordPuzzleGame.toggleSound();

            if (window.gameUI) {
                window.gameUI.updateSoundButton(soundEnabled);
            }

            this.showInputFeedback(
                `Geluid ${soundEnabled ? 'aan' : 'uit'} (Ctrl+M)`,
                'info'
            );
        }
    }

    handleHelpKey() {
        const helpText = `
🎮 WOORDPUZZEL SPEL CONTROLS:

Toetsenbord:
• A-Z: Raad letters
• Enter: Nieuw spel (na game over)
• Escape: Sluit modals
• Spatie/H: Hint (binnenkort)
• Ctrl+N: Nieuw spel
• Ctrl+M: Geluid aan/uit
• F1: Help

Muis/Touch:
• Klik op letters in virtueel toetsenbord
• Klik op knoppen voor acties

Doel: Raad het Nederlandse woord voordat je levens op zijn!
        `;

        this.showInputFeedback(helpText.trim(), 'info', 8000);
    }

    setupTouchSupport() {
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        if (this.isMobileDevice()) {
            document.body.classList.add('mobile-device');
            console.log('Mobile device detected - touch support enabled');
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    showInputFeedback(message, type = 'info', duration = 2000) {
        if (window.gameUI) {
            const titles = {
                'success': 'Gelukt!',
                'error': 'Fout!',
                'warning': 'Waarschuwing!',
                'info': 'Info'
            };

            const title = titles[type] || titles.info;
            window.gameUI.showToast(type, title, message, { duration });
        } else {
            console.log(`INPUT FEEDBACK [${type}]: ${message}`);
        }
    }

    startListening() {
        this.isListening = true;
        console.log('Input handler is now listening for events');
    }

    stopListening() {
        this.isListening = false;
        console.log('Input handler stopped listening');
    }

    pauseInput() {
        this.stopListening();
    }

    resumeInput() {
        this.startListening();
    }

    bindKey(key, callback) {
        this.keyListeners.set(key.toLowerCase(), callback);
    }

    unbindKey(key) {
        this.keyListeners.delete(key.toLowerCase());
    }

    clearAllBindings() {
        this.keyListeners.clear();
    }

    setupAccessibility() {
        document.addEventListener('focusin', (event) => {
            const element = event.target;

            if (element.classList.contains('key')) {
                this.announceForScreenReader(`Letter ${element.textContent}`);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.handleTabNavigation(event);
            }
        });
    }

    announceForScreenReader(text) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = text;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    handleTabNavigation(event) {
        const focusableElements = document.querySelectorAll(
            'button, .key, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const focusedElementIndex = Array.from(focusableElements).indexOf(document.activeElement);

        if (event.shiftKey) {
            if (focusedElementIndex === 0) {
                event.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
            }
        } else {
            if (focusedElementIndex === focusableElements.length - 1) {
                event.preventDefault();
                focusableElements[0].focus();
            }
        }
    }

    getInputStatus() {
        return {
            isListening: this.isListening,
            boundKeys: Array.from(this.keyListeners.keys()),
            isMobile: this.isMobileDevice()
        };
    }
}

let inputHandler;

document.addEventListener('DOMContentLoaded', function () {
    inputHandler = new InputHandler();
    window.inputHandler = inputHandler;

    console.log('🎮 All game systems initialized and ready!');
});