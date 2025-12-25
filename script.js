/* ============================================
   ADVANCED AI CHATBOT JAVASCRIPT
   ============================================ */

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    messages: [],
    voiceEnabled: false,
    soundEnabled: true,
    autoScroll: true,
    messageCount: 0,
    tokenCount: 0,
    responseTime: 0,
    isListening: false,
    selectedTheme: 'dark',
    fontSize: 'medium'
};

// ============================================
// DOM ELEMENTS
// ============================================

const dom = {
    messagesArea: document.getElementById('messagesArea'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceInput: document.getElementById('voiceInput'),
    voiceToggle: document.getElementById('voiceToggle'),
    clearHistory: document.getElementById('clearHistory'),
    exportChat: document.getElementById('exportChat'),
    charCount: document.getElementById('charCount'),
    voiceIndicator: document.getElementById('voiceIndicator'),
    status: document.getElementById('status'),
    indicator: document.getElementById('indicator'),
    messageCount: document.getElementById('messageCount'),
    tokenCount: document.getElementById('tokenCount'),
    responseTime: document.getElementById('responseTime'),
    notificationArea: document.getElementById('notificationArea'),
    themeSelect: document.getElementById('themeSelect'),
    fontSizeSelect: document.getElementById('fontSizeSelect'),
    autoScroll: document.getElementById('autoScroll'),
    soundEnabled: document.getElementById('soundEnabled')
};

// ============================================
// SPEECH RECOGNITION API
// ============================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        state.isListening = true;
        dom.voiceIndicator.classList.remove('hidden');
        updateStatus('Listening...', 'warning');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                dom.userInput.value = transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        if (interimTranscript) {
            dom.userInput.placeholder = `Heard: "${interimTranscript}"`;
        }
    };

    recognition.onerror = (event) => {
        showNotification(`Voice error: ${event.error}`, 'error');
        updateStatus('Ready', 'ready');
    };

    recognition.onend = () => {
        state.isListening = false;
        dom.voiceIndicator.classList.add('hidden');
        updateStatus('Ready', 'ready');
    };
}

// ============================================
// MESSAGE HANDLING
// ============================================

class Message {
    constructor(content, sender = 'user', metadata = {}) {
        this.id = Date.now();
        this.content = content;
        this.sender = sender;
        this.timestamp = new Date();
        this.tokens = this.estimateTokens(content);
        this.metadata = metadata;
    }

    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
}

function addMessage(content, sender = 'user') {
    const message = new Message(content, sender);
    state.messages.push(message);
    state.messageCount++;
    state.tokenCount += message.tokens;
    
    renderMessage(message);
    updateStats();
}

function renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.sender}`;
    messageEl.id = `msg-${message.id}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = parseMarkdown(message.content);

    const metaEl = document.createElement('div');
    metaEl.className = 'message-meta';
    metaEl.innerHTML = `
        <span>${message.timestamp.toLocaleTimeString()}</span>
        <span>⚡${message.tokens} tokens</span>
    `;

    messageEl.appendChild(contentEl);
    messageEl.appendChild(metaEl);
    dom.messagesArea.appendChild(messageEl);

    if (state.autoScroll) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    setTimeout(() => {
        dom.messagesArea.parentElement.scrollTop = dom.messagesArea.parentElement.scrollHeight;
    }, 0);
}

// ============================================
// MARKDOWN PARSING
// ============================================

function parseMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks
    html = html.replace(/```(.*?)```/gs, (match, code) => {
        return `<div class="code-block"><code>${escapeHtml(code.trim())}</code></div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(99,102,241,0.2); padding: 2px 6px; border-radius: 4px;">$1</code>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top: 12px; font-size: 1.1em;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top: 12px; font-size: 1.2em;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top: 12px; font-size: 1.3em;">$1</h1>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: var(--primary-color); text-decoration: underline;">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// AI RESPONSE SIMULATION
// ============================================

const aiResponses = {
    'hello': 'Hello! 👋 How can I assist you today?',
    'how are you': 'I\'m functioning optimally! ⚡ How can I help you?',
    'quantum computing': `Quantum computing uses quantum bits (qubits) that can exist in superposition.

**Key Concepts:**
- **Superposition**: Qubits can be 0, 1, or both simultaneously
- **Entanglement**: Qubits can be connected in ways classical bits cannot
- **Interference**: Amplify correct answers, cancel wrong ones

**Applications:** Drug discovery, optimization, cryptography, ML

\`\`\`
|0⟩ + |1⟩ = superposition
\`\`\`

Want to know more about specific applications?`,
    'ai trends': `**Latest AI Trends in 2025:**

1. **Large Language Models**: Advanced context windows (100K+ tokens)
2. **Multimodal AI**: Combined text, image, video understanding
3. **Edge AI**: Running models on devices, not just cloud
4. **AI Safety**: Increased focus on alignment and ethics
5. **Autonomous Agents**: Self-directing AI systems
6. **Retrieval Augmented Generation**: External knowledge integration

**Impact**: Revolutionizing healthcare, finance, creative industries`,
    'machine learning': `**How Machine Learning Works:**

1. **Data Collection**: Gather training data
2. **Feature Engineering**: Select relevant features
3. **Model Selection**: Choose algorithm
4. **Training**: Learn patterns from data
5. **Validation**: Test on unseen data
6. **Deployment**: Use in production

**Common Algorithms:**
- Linear Regression
- Decision Trees
- Neural Networks
- Support Vector Machines

Would you like details on any algorithm?`,
    'blockchain': `**Blockchain Technology Explained:**

**Core Features:**
- **Distributed**: Data across multiple nodes
- **Immutable**: Cannot be changed once recorded
- **Transparent**: All participants see transactions
- **Secure**: Cryptographic hashing

**How It Works:**
1. Transaction occurs
2. Broadcast to network
3. Nodes validate
4. Add to block
5. Link to previous block (chain)

**Applications:**
- Cryptocurrencies (Bitcoin, Ethereum)
- Supply chain tracking
- Smart contracts
- Digital identity`
};

function generateAIResponse(userMessage) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        
        // Simulate API call delay
        const delay = 500 + Math.random() * 1500;
        
        setTimeout(() => {
            const lowerMessage = userMessage.toLowerCase();
            let response = null;

            for (const [key, value] of Object.entries(aiResponses)) {
                if (lowerMessage.includes(key)) {
                    response = value;
                    break;
                }
            }

            if (!response) {
                response = `That's an interesting question! I'm processing: "${userMessage}"

I found some relevant information:
- Consider breaking down the topic into smaller parts
- Use specific keywords for better results
- Ask follow-up questions for clarity

**Related Topics:**
- Artificial Intelligence fundamentals
- Data science approaches
- Technology trends

How can I provide more detailed information?`;
            }

            state.responseTime = Math.round(performance.now() - startTime);
            resolve(response);
        }, delay);
    });
}

// ============================================
// USER INPUT HANDLING
// ============================================

dom.userInput.addEventListener('input', (e) => {
    const length = e.target.value.length;
    dom.charCount.textContent = length;
    
    if (length > 1900) {
        dom.charCount.style.color = 'var(--warning-color)';
    } else if (length > 2000) {
        e.target.value = e.target.value.slice(0, 2000);
        showNotification('Message limit reached', 'warning');
    } else {
        dom.charCount.style.color = '';
    }
});

dom.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

dom.sendBtn.addEventListener('click', sendMessage);
dom.voiceInput.addEventListener('click', startVoiceInput);
dom.voiceToggle.addEventListener('click', toggleVoiceMode);
dom.clearHistory.addEventListener('click', clearHistory);
dom.exportChat.addEventListener('click', exportChat);

async function sendMessage() {
    const message = dom.userInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'warning');
        return;
    }

    if (message.length > 2000) {
        showNotification('Message exceeds 2000 characters', 'error');
        return;
    }

    // Add user message
    addMessage(message, 'user');
    dom.userInput.value = '';
    dom.charCount.textContent = '0';

    // Show typing indicator
    showTypingIndicator();
    updateStatus('Processing...', 'processing');

    try {
        // Get AI response
        const response = await generateAIResponse(message);
        removeTypingIndicator();
        addMessage(response, 'assistant');
        updateStatus('Ready', 'ready');
        
        if (state.soundEnabled) {
            playSound('success');
        }
    } catch (error) {
        removeTypingIndicator();
        showNotification('Failed to get response', 'error');
        updateStatus('Error', 'error');
    }
}

function startVoiceInput() {
    if (!recognition) {
        showNotification('Voice recognition not supported in your browser', 'warning');
        return;
    }

    if (state.isListening) {
        recognition.abort();
        state.isListening = false;
        dom.voiceIndicator.classList.add('hidden');
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Voice error:', error);
        }
    }
}

function toggleVoiceMode() {
    state.voiceEnabled = !state.voiceEnabled;
    dom.voiceToggle.style.opacity = state.voiceEnabled ? '1' : '0.5';
    showNotification(
        `Voice mode ${state.voiceEnabled ? 'enabled' : 'disabled'}`,
        'success'
    );
}

// ============================================
// UI UTILITIES
// ============================================

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    dom.messagesArea.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function updateStatus(text, type = 'ready') {
    dom.status.textContent = text;
    dom.status.style.background = getStatusColor(type);
    dom.status.style.color = type === 'ready' ? 'var(--success-color)' : 
                             type === 'processing' ? 'var(--warning-color)' :
                             type === 'error' ? 'var(--error-color)' : '';
}

function getStatusColor(type) {
    const colors = {
        ready: 'rgba(16, 185, 129, 0.1)',
        processing: 'rgba(245, 158, 11, 0.1)',
        error: 'rgba(239, 68, 68, 0.1)',
        warning: 'rgba(245, 158, 11, 0.1)'
    };
    return colors[type] || colors.ready;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    dom.notificationArea.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateStats() {
    dom.messageCount.textContent = state.messageCount;
    dom.tokenCount.textContent = state.tokenCount;
    dom.responseTime.textContent = state.responseTime + 'ms';
}

function clearHistory() {
    if (confirm('Are you sure you want to clear chat history?')) {
        state.messages = [];
        state.messageCount = 0;
        state.tokenCount = 0;
        dom.messagesArea.innerHTML = `
            <div class="welcome-section">
                <h2>Welcome to Neural Chat AI</h2>
                <p>Ask me anything about technology, science, programming, or just chat!</p>
                <div class="quick-prompts">
                    <button class="prompt-btn" data-prompt="Explain quantum computing in simple terms">Quantum Computing</button>
                    <button class="prompt-btn" data-prompt="What are the latest AI trends?">AI Trends</button>
                    <button class="prompt-btn" data-prompt="How does machine learning work?">Machine Learning</button>
                    <button class="prompt-btn" data-prompt="Explain blockchain technology">Blockchain</button>
                </div>
            </div>
        `;
        updateStats();
        showNotification('Chat history cleared', 'success');
        attachPromptListeners();
    }
}

function exportChat() {
    if (state.messages.length === 0) {
        showNotification('No messages to export', 'warning');
        return;
    }

    const chatExport = state.messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.sender.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([chatExport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Chat exported successfully', 'success');
}

// ============================================
// SOUND EFFECTS
// ============================================

function playSound(type = 'success') {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = type === 'success' ? 800 : 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// ============================================
// SETTINGS & THEME
// ============================================

dom.themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    state.selectedTheme = theme;
    
    if (theme === 'dark') {
        document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        // Auto - detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('light-theme', !prefersDark);
    }
    
    localStorage.setItem('theme', theme);
});

dom.fontSizeSelect.addEventListener('change', (e) => {
    const fontSize = e.target.value;
    state.fontSize = fontSize;
    
    const sizes = {
        small: '0.875rem',
        medium: '1rem',
        large: '1.125rem'
    };
    
    document.body.style.fontSize = sizes[fontSize];
    localStorage.setItem('fontSize', fontSize);
});

dom.autoScroll.addEventListener('change', (e) => {
    state.autoScroll = e.target.checked;
    localStorage.setItem('autoScroll', e.target.checked);
});

dom.soundEnabled.addEventListener('change', (e) => {
    state.soundEnabled = e.target.checked;
    localStorage.setItem('soundEnabled', e.target.checked);
});

// ============================================
// QUICK PROMPTS
// ============================================

function attachPromptListeners() {
    document.querySelectorAll('.prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            dom.userInput.value = e.target.dataset.prompt;
            dom.userInput.focus();
            sendMessage();
        });
    });
}

// ============================================
// LOCAL STORAGE
// ============================================

function loadSettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const autoScroll = localStorage.getItem('autoScroll') !== 'false';
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

    state.selectedTheme = theme;
    state.fontSize = fontSize;
    state.autoScroll = autoScroll;
    state.soundEnabled = soundEnabled;

    dom.themeSelect.value = theme;
    dom.fontSizeSelect.value = fontSize;
    dom.autoScroll.checked = autoScroll;
    dom.soundEnabled.checked = soundEnabled;

    if (theme === 'light') {
        document.body.classList.add('light-theme');
    }

    document.body.style.fontSize = fontSize === 'small' ? '0.875rem' : 
                                     fontSize === 'large' ? '1.125rem' : '1rem';
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    attachPromptListeners();
    updateStats();
    showNotification('Welcome to Neural Chat AI! 🚀', 'success');
    dom.userInput.focus();
});

// Prevent context menu for cleaner UI on right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
}, false);

// Handle window resize
window.addEventListener('resize', () => {
    if (state.autoScroll) {
        scrollToBottom();
    }
});
