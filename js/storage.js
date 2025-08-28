class GameStorage {
    constructor() {
        this.cookieConsentKey = 'wordpuzzle_cookie_consent';
        this.gameStateKey = 'wordpuzzle_game_state';
        this.settingsKey = 'wordpuzzle_settings';

        this.defaultSettings = {
            soundEnabled: true,
            lastPlayed: null,
            totalGamesPlayed: 0,
            totalWordsGuessed: 0,
            highScore: 0
        };

        this.init();
    }

    init() {
        if (!this.hasCookieConsent()) {
            this.showCookieConsent();
        } else {
            this.hideCookieConsent();
        }

        this.setupCookieConsentListeners();
    }

    hasCookieConsent() {
        try {
            return localStorage.getItem(this.cookieConsentKey) === 'accepted';
        } catch (error) {
            console.log('LocalStorage not available:', error);
            return false;
        }
    }

    showCookieConsent() {
        const modal = document.getElementById('cookieConsent');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideCookieConsent() {
        const modal = document.getElementById('cookieConsent');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    setupCookieConsentListeners() {
        const acceptBtn = document.getElementById('acceptCookies');
        const declineBtn = document.getElementById('declineCookies');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptCookies();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineCookies();
            });
        }
    }

    acceptCookies() {
        try {
            localStorage.setItem(this.cookieConsentKey, 'accepted');
            this.hideCookieConsent();
            console.log('Cookies accepted - game data will be saved');
        } catch (error) {
            console.log('Could not save cookie consent:', error);
        }
    }

    declineCookies() {
        try {
            localStorage.setItem(this.cookieConsentKey, 'declined');
            this.hideCookieConsent();
            console.log('Cookies declined - game data will not be saved');
        } catch (error) {
            console.log('Could not save cookie decline:', error);
        }
    }

    canUseStorage() {
        return this.hasCookieConsent() && this.isLocalStorageAvailable();
    }

    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    saveGameState(gameState) {
        if (!this.canUseStorage()) {
            console.log('Cannot save game state - storage not available or consent not given');
            return false;
        }

        try {
            const stateToSave = {
                ...gameState,
                lastSaved: new Date().toISOString()
            };

            localStorage.setItem(this.gameStateKey, JSON.stringify(stateToSave));
            console.log('Game state saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            return false;
        }
    }

    loadGameState() {
        if (!this.canUseStorage()) {
            console.log('Cannot load game state - storage not available or consent not given');
            return null;
        }

        try {
            const savedState = localStorage.getItem(this.gameStateKey);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                console.log('Game state loaded successfully');
                return parsedState;
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }

        return null;
    }

    clearGameState() {
        if (!this.canUseStorage()) {
            return false;
        }

        try {
            localStorage.removeItem(this.gameStateKey);
            console.log('Game state cleared');
            return true;
        } catch (error) {
            console.error('Error clearing game state:', error);
            return false;
        }
    }

    saveSettings(settings) {
        if (!this.canUseStorage()) {
            console.log('Cannot save settings - storage not available or consent not given');
            return false;
        }

        try {
            const settingsToSave = {
                ...this.defaultSettings,
                ...settings,
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem(this.settingsKey, JSON.stringify(settingsToSave));
            console.log('Settings saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    loadSettings() {
        if (!this.canUseStorage()) {
            console.log('Cannot load settings - returning defaults');
            return this.defaultSettings;
        }

        try {
            const savedSettings = localStorage.getItem(this.settingsKey);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                const settings = { ...this.defaultSettings, ...parsedSettings };
                console.log('Settings loaded successfully');
                return settings;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        return this.defaultSettings;
    }

    updateSetting(key, value) {
        const currentSettings = this.loadSettings();
        currentSettings[key] = value;
        return this.saveSettings(currentSettings);
    }

    incrementGamesPlayed() {
        const settings = this.loadSettings();
        settings.totalGamesPlayed = (settings.totalGamesPlayed || 0) + 1;
        settings.lastPlayed = new Date().toISOString();
        this.saveSettings(settings);
    }

    incrementWordsGuessed() {
        const settings = this.loadSettings();
        settings.totalWordsGuessed = (settings.totalWordsGuessed || 0) + 1;
        this.saveSettings(settings);
    }

    updateHighScore(score) {
        const settings = this.loadSettings();
        if (score > (settings.highScore || 0)) {
            settings.highScore = score;
            this.saveSettings(settings);
            return true;
        }
        return false;
    }

    getStatistics() {
        const settings = this.loadSettings();
        return {
            totalGamesPlayed: settings.totalGamesPlayed || 0,
            totalWordsGuessed: settings.totalWordsGuessed || 0,
            highScore: settings.highScore || 0,
            lastPlayed: settings.lastPlayed
        };
    }

    exportData() {
        if (!this.canUseStorage()) {
            return null;
        }

        try {
            const gameState = this.loadGameState();
            const settings = this.loadSettings();

            return {
                gameState,
                settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(data) {
        if (!this.canUseStorage() || !data) {
            return false;
        }

        try {
            if (data.gameState) {
                this.saveGameState(data.gameState);
            }

            if (data.settings) {
                this.saveSettings(data.settings);
            }

            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

const gameStorage = new GameStorage();