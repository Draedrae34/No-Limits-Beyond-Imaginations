// Public Shop Assistant - Customer Facing
// This handles basic product queries and brand storytelling.
class ShopAssistant {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.productKnowledge = this.loadProductKnowledge();
    }

    loadProductKnowledge() {
        // Load your product catalog
        return {
            "Tie-Dye Tee": {
                name: "Tie-Dye Tee",
                price: 29.99,
                description: "Vibrant blue tie-dye tank top with custom print",
                features: ["100% cotton", "vibrant colors", "custom design"],
                sizes: ["S", "M", "L", "XL", "2XL"],
                care: "Machine wash cold, tumble dry low"
            },
            "CamoHex Tee": {
                name: "CamoHex Tee", 
                price: 32.99,
                description: "Tactical camo hex pattern tee with modern design",
                features: ["100% cotton", "camo pattern", "durable"],
                sizes: ["S", "M", "L", "XL", "2XL"],
                care: "Machine wash cold, tumble dry low"
            },
            "Premium Sherpa Blanket": {
                name: "Premium Sherpa Blanket",
                price: 89.99,
                description: "Ultra-soft sherpa blanket with embroidered logo",
                features: ["Microfiber fleece", "embroidered logo", "ultra-soft"],
                sizes: ["One Size"],
                care: "Dry clean only"
            }
        };
    }

    async generateResponse(userMessage) {
        // AI response generation
        const lowerMessage = userMessage.toLowerCase();
        
        // Greetings
        if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
            return "Hello! Welcome to No Limits Beyond Limitations. 🌌 How can I help you explore our collection today?";
        }

        // Product recommendations
        if (lowerMessage.includes("tee") || lowerMessage.includes("shirt")) {
            return this.recommendProduct("Tie-Dye Tee");
        }
        
        if (lowerMessage.includes("blanket")) {
            return this.recommendProduct("Premium Sherpa Blanket");
        }
        
        // Order support
        if (lowerMessage.includes("order") || lowerMessage.includes("tracking")) {
            return this.getOrderSupport();
        }
        
        // General help
        if (lowerMessage.includes("help") || lowerMessage.includes("what")) {
            return this.getGeneralHelp();
        }
        
        // Fallback
        return this.generateContextualResponse(userMessage);
    }

    recommendProduct(productName) {
        const product = this.productKnowledge[productName];
        return `🛍️ I recommend our ${product.name}! It's ${product.description}. Available in ${product.sizes.join(", ")}. Only $${product.price} with free shipping on orders over $50. ${product.features.join(", " and ").toUpperCase()}. Care: ${product.care}.`;
    }

    getOrderSupport() {
        return `📦 For order support, please check your email for order confirmation. You can also track your order status here: [Your Domain]/orders. For immediate assistance, reply with your order number.`;
    }

    getGeneralHelp() {
        return `🤖 Welcome to No Limits Beyond Limitations! I'm here to help with:

🛍️ **Products**: Ask about our tees, hoodies, blankets, and accessories
📦 **Orders**: Check order status, tracking, and support
💳 **Payments**: Secure checkout with Stripe and Printify fulfillment
🎨 **Design**: Custom design inquiries and suggestions
📞 **Contact**: Reach out for personalized assistance

Type "help" anytime to see this menu again!`;
    }

    generateContextualResponse(userMessage) {
        // Smart contextual responses
        const responses = [
            "That sounds great! Can you tell me more about what you're looking for?",
            "I'd be happy to help you find the perfect product. What style or occasion are you shopping for?",
            "Our products are designed with quality and comfort in mind. Is there something specific you'd like to know?",
            "I can help with sizing, care instructions, or product recommendations. What would be most helpful?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessage(role, content) {
        this.chatHistory.push({ role, content, timestamp: new Date() });
        
        // Update UI (if you have a chat interface)
        this.updateChatUI(role, content);
    }

    updateChatUI(role, content) {
        // This would update your website chat interface
        const chatContainer = document.getElementById('ai-chat-container');
        if (chatContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = `ai-message ${role}`;
            messageElement.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            chatContainer.appendChild(messageElement);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Public API for your website
    async processUserMessage(message) {
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate response
        const response = await this.generateResponse(message);
        
        // Hide typing indicator
        this.hideTypingIndicator();
        
        // Add AI response
        this.addMessage('assistant', response);
    }

    showTypingIndicator() {
        this.isTyping = true;
        // Update UI to show "AI is typing..."
    }

    hideTypingIndicator() {
        this.isTyping = false;
        // Update UI to hide typing indicator
    }
}

// Initialize AI assistant
const websiteAI = new ShopAssistant();

// Make it globally available
window.WebsiteAIAssistant = websiteAI;
window.ShopAssistant = websiteAI;
