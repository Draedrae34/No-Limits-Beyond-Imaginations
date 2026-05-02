/**
 * NLBL AI Assistant - Transformers.js Integration
 * Runs entirely in browser - ZERO server costs
 */

class NLBLAIAssistant {
  constructor() {
    this.pipeline = null;
    this.isReady = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load Transformers.js from CDN
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      
      // Initialize text generation pipeline
      this.pipeline = await pipeline('text-generation', 'Xenova/distilgpt2', {
        quantized: true, // Use quantized model for faster loading
      });
      
      this.isReady = true;
      this.initialized = true;
      console.log('[AI Assistant] Ready');
      
      // Dispatch event for UI
      window.dispatchEvent(new CustomEvent('ai-assistant-ready'));
    } catch (error) {
      console.error('[AI Assistant] Initialization failed:', error);
    }
  }

  async generateText(prompt, maxLength = 100) {
    if (!this.isReady) {
      await this.initialize();
    }

    try {
      const result = await this.pipeline(prompt, {
        max_new_tokens: maxLength,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.2,
      });

      return result[0].generated_text;
    } catch (error) {
      console.error('[AI Assistant] Generation error:', error);
      return null;
    }
  }

  async generateProductDescription(productName, style = 'casual') {
    const prompt = `Create an enticing product description for a ${style} clothing item called "${productName}". Highlight its unique features and style.`;
    return this.generateText(prompt, 150);
  }

  async suggestDesignIdeas(theme) {
    const prompt = `Suggest 3 creative design ideas for a ${theme} themed clothing line. Make them unique and appealing.`;
    return this.generateText(prompt, 200);
  }

  async analyzeSentiment(text) {
    if (!this.pipeline) return null;
    
    try {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      const sentimentAnalyzer = await pipeline('sentiment-analysis');
      const result = await sentimentAnalyzer(text);
      return result[0];
    } catch (error) {
      console.error('[AI Assistant] Sentiment analysis error:', error);
      return null;
    }
  }

  // Voice synthesis for AI responses
  speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }
}

// Global instance
window.nlblAI = new NLBLAIAssistant();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.nlblAI.initialize();
});
