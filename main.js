import './style.css'
import { getBotResponse } from './counter.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="chat-container">
    <div class="chat-header">
      <div class="avatar">🤖</div>
      <div class="header-info">
        <h1>AI Buddy</h1>
        <div class="status"><span class="dot"></span> Online</div>
      </div>
      <button class="clear-btn" id="clearBtn" title="Clear chat">🗑</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="welcome-screen" id="welcomeScreen">
        <div class="welcome-icon">🤖</div>
        <h2>Welcome to AI Buddy!</h2>
        <p>I'm your AI-powered chatbot. Ask me anything — I can answer questions, do math, tell jokes, explain concepts, and more!</p>
        <div class="suggestions">
          <button class="suggestion-chip" data-msg="Hello!">Say hello</button>
          <button class="suggestion-chip" data-msg="Tell me a joke">Tell me a joke</button>
          <button class="suggestion-chip" data-msg="What is the capital of France?">Ask a question</button>
          <button class="suggestion-chip" data-msg="What is 25 * 4?">Try some math</button>
          <button class="suggestion-chip" data-msg="Explain how rainbows work">Explain something</button>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <div class="chat-input-wrapper">
        <textarea class="chat-input" id="chatInput" placeholder="Type your message..." rows="1"></textarea>
        <button class="send-btn" id="sendBtn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
`

const chatMessages = document.getElementById('chatMessages')
const chatInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('sendBtn')
const clearBtn = document.getElementById('clearBtn')
let welcomeScreen = document.getElementById('welcomeScreen')

let isTyping = false
let conversationHistory = []

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function appendMessage(text, sender) {
  if (welcomeScreen) {
    welcomeScreen.remove()
    welcomeScreen = null
  }

  const messageEl = document.createElement('div')
  messageEl.className = `message ${sender}`

  const avatarChar = sender === 'bot' ? '🤖' : '🧑'
  messageEl.innerHTML = `
    <div class="msg-avatar">${avatarChar}</div>
    <div>
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${formatTime()}</div>
    </div>
  `

  chatMessages.appendChild(messageEl)
  chatMessages.scrollTop = chatMessages.scrollHeight

  conversationHistory.push({ role: sender === 'bot' ? 'assistant' : 'user', content: text })
}

function showTypingIndicator() {
  const typingEl = document.createElement('div')
  typingEl.className = 'typing-indicator'
  typingEl.id = 'typingIndicator'
  typingEl.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `
  chatMessages.appendChild(typingEl)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function removeTypingIndicator() {
  const typingEl = document.getElementById('typingIndicator')
  if (typingEl) {
    typingEl.remove()
  }
}

async function handleSend() {
  const text = chatInput.value.trim()
  if (!text || isTyping) return

  appendMessage(text, 'user')
  chatInput.value = ''
  chatInput.style.height = 'auto'
  updateSendButton()

  isTyping = true
  showTypingIndicator()

  try {
    const response = await getBotResponse(text, conversationHistory)
    removeTypingIndicator()
    appendMessage(response, 'bot')
  } catch {
    removeTypingIndicator()
    appendMessage("I'm having trouble connecting right now. Please try again in a moment!", 'bot')
  }

  isTyping = false
}

function updateSendButton() {
  sendBtn.disabled = chatInput.value.trim().length === 0
}

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto'
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px'
  updateSendButton()
})

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
})

sendBtn.addEventListener('click', handleSend)

clearBtn.addEventListener('click', () => {
  conversationHistory = []
  chatMessages.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <div class="welcome-icon">🤖</div>
      <h2>Welcome to AI Buddy!</h2>
      <p>I'm your AI-powered chatbot. Ask me anything — I can answer questions, do math, tell jokes, explain concepts, and more!</p>
      <div class="suggestions">
        <button class="suggestion-chip" data-msg="Hello!">Say hello</button>
        <button class="suggestion-chip" data-msg="Tell me a joke">Tell me a joke</button>
        <button class="suggestion-chip" data-msg="What is the capital of France?">Ask a question</button>
        <button class="suggestion-chip" data-msg="What is 25 * 4?">Try some math</button>
        <button class="suggestion-chip" data-msg="Explain how rainbows work">Explain something</button>
      </div>
    </div>
  `
  welcomeScreen = document.getElementById('welcomeScreen')
  rebindSuggestionChips()
})

function rebindSuggestionChips() {
  document.querySelectorAll('.suggestion-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.dataset.msg
      handleSend()
    })
  })
}

rebindSuggestionChips()
chatInput.focus()
