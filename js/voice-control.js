/**
 * NLBL Voice Control System
 * Hands-free navigation and control using Web Speech API
 */

class VoiceControlSystem {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.commands = new Map();
    this.synthesis = window.speechSynthesis;
    this.init();
  }

  init() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('[Voice Control] Error:', event.error);
        if (event.error === 'no-speech') {
          this.restart();
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.restart();
        }
      };

      this.setupCommands();
      console.log('[Voice Control] Initialized');
    } else {
      console.warn('[Voice Control] Speech recognition not supported');
    }
  }

  setupCommands() {
    // Navigation commands
    this.commands.set('go home', () => this.navigate('index.html'));
    this.commands.set('go to shop', () => this.navigate('shop.html'));
    this.commands.set('go to wall', () => this.navigate('message-wall.html'));
    this.commands.set('go to story', () => this.navigate('story-remembrance.html'));
    this.commands.set('go to brothers', () => this.navigate('remembrance.html'));
    this.commands.set('go to about', () => this.navigate('about.html'));

    // Private realm commands (owner only)
    this.commands.set('open private', () => this.navigate('private.html'));
    this.commands.set('open admin', () => this.navigate('admin.html'));
    this.commands.set('open orders', () => this.navigate('orders.html'));
    this.commands.set('open music', () => this.navigate('album.html'));

    // Action commands
    this.commands.set('search', () => this.activateSearch());
    this.commands.set('checkout', () => this.checkout());
    this.commands.set('help', () => this.showHelp());
    this.commands.set('stop listening', () => this.stop());
    this.commands.set('start listening', () => this.start());

    // AI commands
    this.commands.set('ask assistant', () => this.activateAI());
  }

  start() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      this.speak('Voice control activated. Say "help" for available commands.');
      document.body.classList.add('voice-active');
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      document.body.classList.remove('voice-active');
    }
  }

  restart() {
    if (this.isListening) {
      this.recognition.start();
    }
  }

  processCommand(transcript) {
    console.log('[Voice Control] Heard:', transcript);

    // Check for exact matches
    if (this.commands.has(transcript)) {
      this.commands.get(transcript)();
      return;
    }

    // Check for partial matches
    for (const [command, action] of this.commands) {
      if (transcript.includes(command)) {
        action();
        return;
      }
    }

    // Check for AI query
    if (transcript.startsWith('ask')) {
      this.queryAI(transcript.replace('ask', '').trim());
    }
  }

  navigate(page) {
    this.speak(`Navigating to ${page}`);
    window.location.href = page;
  }

  activateSearch() {
    const searchInput = document.querySelector('input[type="search"], #search');
    if (searchInput) {
      searchInput.focus();
      this.speak('Search activated. What are you looking for?');
    }
  }

  checkout() {
    const checkoutBtn = document.querySelector('#checkout-btn, .checkout-button');
    if (checkoutBtn) {
      checkoutBtn.click();
      this.speak('Proceeding to checkout');
    }
  }

  showHelp() {
    const helpText = 'Available commands: Go home, go to shop, go to wall, go to story, search, checkout, help, stop listening';
    this.speak(helpText);
  }

  activateAI() {
    if (window.nlblAI) {
      this.speak('AI Assistant activated. How can I help you?');
      // Show AI interface
      const aiEvent = new CustomEvent('ai-activate');
      window.dispatchEvent(aiEvent);
    }
  }

  async queryAI(query) {
    if (window.nlblAI && window.nlblAI.isReady) {
      this.speak('Thinking...');
      const response = await window.nlblAI.generateText(query);
      if (response) {
        this.speak(response);
      }
    }
  }

  speak(text) {
    if (this.synthesis) {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to use a good voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
                            voices.find(v => v.name.includes('Samantha')) ||
                            voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.synthesis.speak(utterance);
    }
  }

  // Toggle voice control
  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}

// Global instance
window.voiceControl = new VoiceControlSystem();

// Add keyboard shortcut (Ctrl+Shift+V)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'V') {
    window.voiceControl.toggle();
  }
});
