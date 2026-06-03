/**
 * BLOCKCHAIN QUIZ — GAME ENGINE (Quizizz Style)
 * Written in Vanilla JavaScript.
 * Autonomously uses Web Audio API for sound effects (works offline, no dependencies).
 */

// --- AUDIO MANAGER (Web Audio API) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!this.enabled) return;
    this.init();
    
    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        // Exponential decay
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.error("Audio error", e);
      }
    }, delay * 1000);
  }

  playCorrect() {
    // Satisfying upward arpeggio: C5 -> E5 -> G5 -> C6
    this.playTone(523.25, 'sine', 0.15, 0);      // C5
    this.playTone(659.25, 'sine', 0.15, 0.08);   // E5
    this.playTone(783.99, 'sine', 0.15, 0.16);   // G5
    this.playTone(1046.50, 'sine', 0.3, 0.24);   // C6
  }

  playWrong() {
    // Detuned buzzer sound: two low waves close to each other
    this.playTone(220, 'sawtooth', 0.4, 0);
    this.playTone(225, 'sawtooth', 0.4, 0.02);
  }

  playStreak() {
    // High celebratory chime arpeggio
    this.playTone(880.00, 'triangle', 0.1, 0);    // A5
    this.playTone(1109.73, 'triangle', 0.1, 0.05); // C#6
    this.playTone(1318.51, 'triangle', 0.1, 0.1);  // E6
    this.playTone(1760.00, 'triangle', 0.25, 0.15); // A6
  }

  playPowerup() {
    // Cyberpunk-style pitch sweep
    if (!this.enabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch(e){}
  }

  playGameOver() {
    // Upward warm chime ending
    this.playTone(523.25, 'sine', 0.2, 0);     // C5
    this.playTone(587.33, 'sine', 0.2, 0.1);   // D5
    this.playTone(659.25, 'sine', 0.2, 0.2);   // E5
    this.playTone(783.99, 'sine', 0.2, 0.3);   // G5
    this.playTone(1046.50, 'sine', 0.5, 0.4);  // C6
  }
}

const soundManager = new SoundManager();

// --- APP STATE ---
const state = {
  selectedSubject: 'blockchain',
  questions: [],          // Active question pool for the current round
  currentIndex: 0,        // Current question index in active pool
  score: 0,
  streak: 0,
  maxStreak: 0,
  timerDuration: 20,      // Seconds
  timeLeft: 20,
  timerInterval: null,
  isTimerFrozen: false,
  isDoubleActive: false,
  
  // Power-up status
  pu5050Available: true,
  puFreezeAvailable: true,
  puDoubleAvailable: true,
  
  // Stats and history
  history: [],            // Elements: { question, options, selected, correct, isCorrect, scoreAdded, timeSpent }
  failedQuestions: [],    // Elements: index from history to redemption
  redemptionIndex: null,  // Currently active redemption item index
  
  // Configuration
  selectedRange: 'all',
  selectedCount: 20,
  configShuffleQuestions: true,
  configShuffleOptions: true,
  configTimerEnabled: true,
  configSoundEnabled: true,
};

// --- MOTIVATIONAL PHRASES (Kazakh / Russian) ---
const CORRECT_MEMES_RU = [
  "Ты просто космос! 🌌",
  "Гениально! 🧠",
  "В точку! 🎯",
  "Абсолютно верно! 🔥",
  "Блокчейн-мастер! ⛓️",
  "Уровень: Эксперт! 🏆",
  "Идеально! ✨",
  "Отличный темп! ⚡"
];

const WRONG_MEMES_RU = [
  "Ой, не туда... 😢",
  "Не сдавайся, в следующий раз получится! 💪",
  "Блокчейн требует точности! 🔍",
  "Сбой транзакции! ❌",
  "Почти угадал! Учись на ошибках! 📚",
  "Ничего страшного, это опыт! 📈",
  "Ошибочный консенсус! 🤝",
  "Держи удар, впереди много вопросов! ✊"
];

// --- SHUFFLING UTILITIES ---
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- BACKGROUND PARTICLE CREATION ---
function initBackgroundParticles() {
  // Disabled for maximum performance on older/low-end devices
}

// --- PARTICLE BURST ON CORRECT ANSWER ---
function triggerBurstEffect(x, y) {
  // Disabled for maximum performance on older/low-end devices
}

// --- DOM ELEMENT REFERENCES ---
const DOM = {
  lobbyScreen: document.getElementById('lobbyScreen'),
  gameplayScreen: document.getElementById('gameplayScreen'),
  feedbackOverlay: document.getElementById('feedbackOverlay'),
  redemptionScreen: document.getElementById('redemptionScreen'),
  gameOverScreen: document.getElementById('gameOverScreen'),
  
  subjectSelect: document.getElementById('subjectSelect'),
  questionRange: document.getElementById('questionRange'),
  countGroup: document.getElementById('countGroup'),
  settingTimer: document.getElementById('settingTimer'),
  settingShuffleQuestions: document.getElementById('settingShuffleQuestions'),
  settingShuffleOptions: document.getElementById('settingShuffleOptions'),
  settingSound: document.getElementById('settingSound'),
  startGameBtn: document.getElementById('startGameBtn'),
  totalDBQuestions: document.getElementById('totalDBQuestions'),
  
  questionProgress: document.getElementById('questionProgress'),
  exitGameBtn: document.getElementById('exitGameBtn'),
  scoreDisplay: document.getElementById('scoreDisplay'),
  streakBadge: document.getElementById('streakBadge'),
  streakDisplay: document.getElementById('streakDisplay'),
  timerBar: document.getElementById('timerBar'),
  questionBox: document.getElementById('questionBox'),
  questionText: document.getElementById('questionText'),
  optionsContainer: document.getElementById('optionsContainer'),
  
  powerup5050: document.getElementById('powerup5050'),
  powerupFreeze: document.getElementById('powerupFreeze'),
  powerupDouble: document.getElementById('powerupDouble'),
  
  feedbackIcon: document.getElementById('feedbackIcon'),
  feedbackTitle: document.getElementById('feedbackTitle'),
  feedbackMeme: document.getElementById('feedbackMeme'),
  feedbackPoints: document.getElementById('feedbackPoints'),
  nextQuestionBtn: document.getElementById('nextQuestionBtn'),
  
  redemptionChoicesList: document.getElementById('redemptionChoicesList'),
  redemptionGameArea: document.getElementById('redemptionGameArea'),
  redemptionQuestionBox: document.getElementById('redemptionQuestionBox'),
  redemptionQuestionText: document.getElementById('redemptionQuestionText'),
  redemptionOptionsContainer: document.getElementById('redemptionOptionsContainer'),
  
  finalScore: document.getElementById('finalScore'),
  finalAccuracy: document.getElementById('finalAccuracy'),
  finalStreak: document.getElementById('finalStreak'),
  accuracyCircle: document.getElementById('accuracyCircle'),
  restartGameBtn: document.getElementById('restartGameBtn'),
  goHomeBtn: document.getElementById('goHomeBtn'),
  reportList: document.getElementById('reportList')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Update total questions from questions.js (QUIZ_SUBJECTS is global object)
  if (typeof QUIZ_SUBJECTS !== 'undefined') {
    updateLobbyForSubject();
    DOM.subjectSelect.addEventListener('change', () => {
      updateLobbyForSubject();
    });
  }
  
  initBackgroundParticles();
  setupLobbyEvents();
  setupGameplayEvents();
  setupRedemptionEvents();
  setupGameOverEvents();
});

// --- LOBBY LOGIC ---
function setupLobbyEvents() {
  // Handle toggles in the button group for question count
  const buttons = DOM.countGroup.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-value');
      state.selectedCount = val === 'max' ? 'max' : parseInt(val, 10);
    });
  });

  // Start game button trigger
  DOM.startGameBtn.addEventListener('click', () => {
    // Read selections
    state.selectedRange = DOM.questionRange.value;
    state.configShuffleQuestions = DOM.settingShuffleQuestions.checked;
    state.configShuffleOptions = DOM.settingShuffleOptions.checked;
    state.configTimerEnabled = DOM.settingTimer.checked;
    state.configSoundEnabled = DOM.settingSound.checked;
    
    soundManager.enabled = state.configSoundEnabled;
    soundManager.init();

    // Prepare questions pool
    prepareQuestionsPool();
    
    if (state.questions.length === 0) {
      alert("Не удалось загрузить вопросы. Пожалуйста, проверьте questions.js.");
      return;
    }
    
    // Reset Game parameters
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.history = [];
    state.failedQuestions = [];
    
    // Reset Power-ups
    state.pu5050Available = true;
    state.puFreezeAvailable = true;
    state.puDoubleAvailable = true;
    
    updatePowerupUI();
    
    // Switch Screen
    showScreen(DOM.gameplayScreen);
    
    // Start first question
    loadQuestion(0);
  });
}

// --- SUBJECT & RANGE DYNAMIC UPDATE ---
function updateLobbyForSubject() {
  const subject = DOM.subjectSelect.value;
  state.selectedSubject = subject;
  
  const questions = QUIZ_SUBJECTS[subject] || [];
  DOM.totalDBQuestions.textContent = questions.length;
  
  // Update the questionRange select options
  DOM.questionRange.innerHTML = '';
  
  // Add "All" option
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.selected = true;
  if (subject === 'blockchain') {
    allOpt.textContent = `Все вопросы (1-${questions.length}) — Полный курс`;
  } else {
    allOpt.textContent = `Барлық сұрақтар (1-${questions.length}) — Толық курс`;
  }
  DOM.questionRange.appendChild(allOpt);
  
  // Generate sub-ranges of 40
  const chunkSize = 40;
  for (let i = 0; i < questions.length; i += chunkSize) {
    const start = i + 1;
    const end = Math.min(i + chunkSize, questions.length);
    const opt = document.createElement('option');
    opt.value = `${start}-${end}`;
    
    if (subject === 'blockchain') {
      let title = `Вопросы ${start}-${end}`;
      if (start === 1) title += ': Введение в Блокчейн';
      else if (start === 41) title += ': Основы и Децентрализация';
      else if (start === 81) title += ': Архитектура и Хэширование';
      else if (start === 121) title += ': Криптография и Ключи';
      else if (start === 161) title += ': Консенсусы и Безопасность';
      else if (start === 202) title += ': Атаки и Разветвления (Forks)';
      else if (start === 242) title += ': Криптовалюты и Сеть Bitcoin';
      else if (start === 282) title += ': Смарт-контракты и DeFi';
      opt.textContent = title;
    } else {
      let title = `Сұрақтар ${start}-${end}`;
      if (start === 1) title += ': Кіріспе және Өндірістік кәсіпорын';
      else if (start === 41) title += ': Негізгі және Айналым қорлары';
      else if (start === 81) title += ': Шығындар және Өзіндік құн';
      else if (start === 121) title += ': Еңбек ресурстары және Еңбекақы';
      else if (start === 161) title += ': Пайда және Рентабельділік';
      else if (start === 202) title += ': Инвестициялар және Негізгі қорлар тозуы';
      else if (start === 242) title += ': Айналым қорларының айналымы';
      else if (start === 282) title += ': Шығындар сметасы және Тарифтер';
      opt.textContent = title;
    }
    DOM.questionRange.appendChild(opt);
  }
}

function prepareQuestionsPool() {
  if (typeof QUIZ_SUBJECTS === 'undefined') return;
  
  let pool = [...(QUIZ_SUBJECTS[state.selectedSubject] || [])];
  
  // Filter by range generic implementation
  if (state.selectedRange !== 'all') {
    const [start, end] = state.selectedRange.split('-').map(Number);
    pool = pool.slice(start - 1, end);
  }
  
  // Shuffle pool if selected
  if (state.configShuffleQuestions) {
    pool = shuffleArray(pool);
  }
  
  // Slicing by count
  const count = state.selectedCount === 'max' ? pool.length : state.selectedCount;
  state.questions = pool.slice(0, count);
}

// --- GAMEPLAY SYSTEM ---
function loadQuestion(index) {
  // Clear any existing timer
  clearInterval(state.timerInterval);
  
  if (index >= state.questions.length) {
    // End of normal questions
    triggerEndGameFlow();
    return;
  }
  
  state.currentIndex = index;
  state.isTimerFrozen = false;
  state.isDoubleActive = false;
  
  const q = state.questions[index];
  
  // Update progress UI
  DOM.questionProgress.textContent = `Вопрос ${index + 1} / ${state.questions.length}`;
  DOM.scoreDisplay.textContent = padZero(state.score, 4);
  
  // Display question text
  DOM.questionText.textContent = q.question;
  
  // Prepare options
  // Store correct answer (which is option 0 or q.answer)
  const correctOptionText = q.answer;
  
  // Shuffled indices
  let optionIndices = [0, 1, 2, 3, 4].slice(0, q.options.length);
  if (state.configShuffleOptions) {
    optionIndices = shuffleArray(optionIndices);
  }
  
  // Build options DOM
  DOM.optionsContainer.innerHTML = '';
  const badges = ['A', 'B', 'C', 'D', 'E'];
  
  optionIndices.forEach((optIndex, orderIndex) => {
    const optText = q.options[optIndex];
    
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('data-correct', optText === correctOptionText ? 'true' : 'false');
    btn.setAttribute('data-text', optText);
    
    // Check if options have letters like "A) " in raw text, if so we don't double badge it
    const badgeText = badges[orderIndex];
    
    btn.innerHTML = `
      <span class="option-badge">${badgeText}</span>
      <span class="option-text">${optText}</span>
    `;
    
    btn.addEventListener('click', (e) => {
      handleAnswerSelection(btn, correctOptionText, e.clientX, e.clientY);
    });
    
    DOM.optionsContainer.appendChild(btn);
  });
  
  // Update Power-ups status (visual disabled state)
  updatePowerupUI();
  
  // Timer initialization
  if (state.configTimerEnabled) {
    startTimer();
  } else {
    DOM.timerBar.style.width = '100%';
    DOM.timerBar.classList.remove('warning');
  }
}

function startTimer() {
  state.timeLeft = state.timerDuration;
  DOM.timerBar.style.width = '100%';
  DOM.timerBar.classList.remove('warning');
  
  const tickMs = 250; // Performance optimization: tick 4 times a second instead of 10
  const decrement = tickMs / 1000;
  
  state.timerInterval = setInterval(() => {
    if (state.isTimerFrozen) return; // Freeze bonus active
    
    state.timeLeft -= decrement;
    
    // UI update
    const percent = (state.timeLeft / state.timerDuration) * 100;
    DOM.timerBar.style.width = `${percent}%`;
    
    if (state.timeLeft <= 5) {
      DOM.timerBar.classList.add('warning');
    }
    
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, tickMs);
}

function handleTimeout() {
  // Highlight correct answer
  const options = DOM.optionsContainer.querySelectorAll('.option-btn');
  let correctAnswerText = "";
  options.forEach(opt => {
    if (opt.getAttribute('data-correct') === 'true') {
      correctAnswerText = opt.getAttribute('data-text');
      opt.style.boxShadow = '0 0 20px var(--neon-green)';
      opt.style.borderColor = 'var(--neon-green)';
    } else {
      opt.classList.add('faded');
    }
  });
  
  // Streak lost
  state.streak = 0;
  updateStreakUI();
  
  // Add to history
  const q = state.questions[state.currentIndex];
  state.history.push({
    question: q.question,
    options: q.options,
    selected: "[ВРЕМЯ ИСТЕКЛО]",
    correct: q.answer,
    isCorrect: false,
    scoreAdded: 0,
    timeSpent: state.timerDuration
  });
  state.failedQuestions.push(state.history.length - 1);
  
  soundManager.playWrong();
  
  // Show timeout feedback
  showFeedbackModal(false, "Время вышло! ⏱️", "Постарайтесь отвечать быстрее!", 0);
}

function handleAnswerSelection(selectedBtn, correctText, clickX, clickY) {
  // Stop timer
  clearInterval(state.timerInterval);
  
  // Disable option clicks
  const options = DOM.optionsContainer.querySelectorAll('.option-btn');
  options.forEach(opt => opt.style.pointerEvents = 'none');
  
  // Disable power-up clicks immediately during the delay
  DOM.powerup5050.disabled = true;
  DOM.powerupFreeze.disabled = true;
  DOM.powerupDouble.disabled = true;
  
  const isCorrect = selectedBtn.getAttribute('data-correct') === 'true';
  const selectedText = selectedBtn.getAttribute('data-text');
  const timeSpent = state.timerDuration - state.timeLeft;
  
  let scoreAdded = 0;
  
  if (isCorrect) {
    // Math: speed score + base score + streak multiplier
    // Base 600 + up to 400 points for speed
    const speedRatio = state.configTimerEnabled ? (state.timeLeft / state.timerDuration) : 1;
    const baseScore = 600 + Math.round(400 * speedRatio);
    const streakBonus = Math.min(state.streak * 100, 500); // Caps at 500
    
    scoreAdded = baseScore + streakBonus;
    
    if (state.isDoubleActive) {
      scoreAdded *= 2;
    }
    
    state.score += scoreAdded;
    state.streak++;
    if (state.streak > state.maxStreak) {
      state.maxStreak = state.streak;
    }
    
    // visual highlights
    selectedBtn.style.boxShadow = '0 0 25px var(--neon-green)';
    selectedBtn.style.border = '2px solid var(--neon-green)';
    
    options.forEach(opt => {
      if (opt !== selectedBtn) opt.classList.add('faded');
    });
    
    // Play sounds
    if (state.streak >= 3) {
      soundManager.playStreak();
    } else {
      soundManager.playCorrect();
    }
    
    // Trigger splash particles
    triggerBurstEffect(clickX || window.innerWidth / 2, clickY || window.innerHeight / 2);
    
    updateStreakUI();
    
    // Delay feedback popup so user can see highlights (1.5 seconds for correct answer)
    setTimeout(() => {
      const randomMeme = CORRECT_MEMES_RU[Math.floor(Math.random() * CORRECT_MEMES_RU.length)];
      showFeedbackModal(true, randomMeme, `Шкала скорости: +${Math.round(400 * speedRatio)} | Серия: +${streakBonus}`, scoreAdded);
    }, 1500);
    
  } else {
    // Incorrect answer
    state.streak = 0;
    
    selectedBtn.style.boxShadow = '0 0 25px var(--neon-red)';
    selectedBtn.style.border = '2px solid var(--neon-red)';
    
    options.forEach(opt => {
      if (opt.getAttribute('data-correct') === 'true') {
        opt.style.boxShadow = '0 0 25px var(--neon-green)';
        opt.style.border = '2px solid var(--neon-green)';
      } else if (opt !== selectedBtn) {
        opt.classList.add('faded');
      }
    });
    
    soundManager.playWrong();
    updateStreakUI();
    
    // Delay feedback popup so user can see correct answer highlights (3 seconds for incorrect answer)
    setTimeout(() => {
      const randomMeme = WRONG_MEMES_RU[Math.floor(Math.random() * WRONG_MEMES_RU.length)];
      showFeedbackModal(false, randomMeme, `Правильный ответ: ${correctText}`, 0);
    }, 3000);
  }
  
  // Record history
  const q = state.questions[state.currentIndex];
  state.history.push({
    question: q.question,
    options: q.options,
    selected: selectedText,
    correct: correctText,
    isCorrect: isCorrect,
    scoreAdded: scoreAdded,
    timeSpent: timeSpent
  });
  
  if (!isCorrect) {
    state.failedQuestions.push(state.history.length - 1);
  }
}

function updateStreakUI() {
  DOM.streakDisplay.textContent = state.streak;
  if (state.streak >= 3) {
    DOM.streakBadge.classList.add('fire-combo');
  } else {
    DOM.streakBadge.classList.remove('fire-combo');
  }
}

function updatePowerupUI() {
  DOM.powerup5050.disabled = !state.pu5050Available;
  DOM.powerupFreeze.disabled = !state.puFreezeAvailable || !state.configTimerEnabled;
  DOM.powerupDouble.disabled = !state.puDoubleAvailable;
}

function setupGameplayEvents() {
  // POWER UP 1: 50-50
  DOM.powerup5050.addEventListener('click', () => {
    if (!state.pu5050Available) return;
    state.pu5050Available = false;
    updatePowerupUI();
    soundManager.playPowerup();
    
    // Find incorrect options
    const options = Array.from(DOM.optionsContainer.querySelectorAll('.option-btn'));
    const incorrectOptions = options.filter(opt => opt.getAttribute('data-correct') === 'false');
    
    // Shuffle and fade 2 incorrect options
    const fadedOptions = shuffleArray(incorrectOptions).slice(0, 2);
    fadedOptions.forEach(opt => opt.classList.add('faded'));
  });

  // POWER UP 2: FREEZE TIME
  DOM.powerupFreeze.addEventListener('click', () => {
    if (!state.puFreezeAvailable || !state.configTimerEnabled) return;
    state.puFreezeAvailable = false;
    state.isTimerFrozen = true;
    updatePowerupUI();
    soundManager.playPowerup();
    
    // Visual indicator of freezing
    DOM.timerBar.style.background = 'linear-gradient(90deg, #a5f3fc, #38bdf8)';
    DOM.timerBar.classList.remove('warning');
  });

  // POWER UP 3: DOUBLE POINTS
  DOM.powerupDouble.addEventListener('click', () => {
    if (!state.puDoubleAvailable) return;
    state.puDoubleAvailable = false;
    state.isDoubleActive = true;
    updatePowerupUI();
    soundManager.playPowerup();
    
    // Show visual effect on score display or button
    DOM.scoreDisplay.style.color = 'var(--neon-pink)';
    setTimeout(() => {
      DOM.scoreDisplay.style.color = 'var(--neon-cyan)';
    }, 1000);
  });

  // Feedback modal button click
  DOM.nextQuestionBtn.addEventListener('click', () => {
    DOM.feedbackOverlay.classList.remove('active');
    loadQuestion(state.currentIndex + 1);
  });

  // EXIT GAME SESSION
  DOM.exitGameBtn.addEventListener('click', () => {
    if (confirm("Вы уверены, что хотите выйти в главное меню? Текущий прогресс будет потерян.")) {
      clearInterval(state.timerInterval);
      showScreen(DOM.lobbyScreen);
    }
  });
}

function showFeedbackModal(isCorrect, title, meme, points) {
  DOM.feedbackOverlay.classList.add('active');
  
  const card = DOM.feedbackOverlay.querySelector('.feedback-card');
  card.className = 'feedback-card glass animate-pop';
  
  if (isCorrect) {
    card.classList.add('correct');
    DOM.feedbackIcon.textContent = "🎉";
    DOM.feedbackPoints.textContent = `+${points} очков`;
    DOM.feedbackPoints.style.display = 'block';
  } else {
    card.classList.add('wrong');
    DOM.feedbackIcon.textContent = "❌";
    DOM.feedbackPoints.style.display = 'none';
  }
  
  DOM.feedbackTitle.textContent = title;
  DOM.feedbackMeme.textContent = meme;
  
  // Auto-focus next button
  DOM.nextQuestionBtn.focus();
}

// --- REDEMPTION SYSTEM FLOW ---
function setupRedemptionEvents() {
  // Empty listener, we build redemption list in triggerEndGameFlow
}

function triggerEndGameFlow() {
  // Check if we have failed questions for redemption
  if (state.failedQuestions.length > 0) {
    showScreen(DOM.redemptionScreen);
    buildRedemptionUI();
  } else {
    showGameOverScreen();
  }
}

function buildRedemptionUI() {
  DOM.redemptionChoicesList.innerHTML = '';
  DOM.redemptionGameArea.style.display = 'none';
  
  state.failedQuestions.forEach((historyIndex, idx) => {
    const btn = document.createElement('button');
    btn.className = 'redemption-choice-btn';
    btn.textContent = idx + 1;
    btn.addEventListener('click', () => {
      startRedemptionQuestion(historyIndex);
    });
    DOM.redemptionChoicesList.appendChild(btn);
  });
}

function startRedemptionQuestion(historyIndex) {
  state.redemptionIndex = historyIndex;
  const historyItem = state.history[historyIndex];
  
  DOM.redemptionChoicesList.style.display = 'none';
  DOM.redemptionGameArea.style.display = 'block';
  
  DOM.redemptionQuestionText.textContent = historyItem.question;
  
  // Prepare options
  const correctText = historyItem.correct;
  
  // Shuffled indices
  let optionIndices = [0, 1, 2, 3, 4].slice(0, historyItem.options.length);
  if (state.configShuffleOptions) {
    optionIndices = shuffleArray(optionIndices);
  }
  
  DOM.redemptionOptionsContainer.innerHTML = '';
  const badges = ['A', 'B', 'C', 'D', 'E'];
  
  optionIndices.forEach((optIndex, orderIndex) => {
    const optText = historyItem.options[optIndex];
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('data-correct', optText === correctText ? 'true' : 'false');
    btn.innerHTML = `
      <span class="option-badge">${badges[orderIndex]}</span>
      <span class="option-text">${optText}</span>
    `;
    
    btn.addEventListener('click', (e) => {
      handleRedemptionAnswer(btn, correctText, e.clientX, e.clientY);
    });
    
    DOM.redemptionOptionsContainer.appendChild(btn);
  });
}

function handleRedemptionAnswer(selectedBtn, correctText, clickX, clickY) {
  const options = DOM.redemptionOptionsContainer.querySelectorAll('.option-btn');
  options.forEach(opt => opt.style.pointerEvents = 'none');
  
  const isCorrect = selectedBtn.getAttribute('data-correct') === 'true';
  const historyItem = state.history[state.redemptionIndex];
  
  if (isCorrect) {
    selectedBtn.style.boxShadow = '0 0 25px var(--neon-green)';
    selectedBtn.style.border = '2px solid var(--neon-green)';
    
    options.forEach(opt => {
      if (opt !== selectedBtn) opt.classList.add('faded');
    });
    
    soundManager.playCorrect();
    triggerBurstEffect(clickX || window.innerWidth / 2, clickY || window.innerHeight / 2);
    
    // Add flat bonus to score
    state.score += 500;
    
    // Update original history record to marked Corrected
    historyItem.isCorrect = true;
    historyItem.scoreAdded += 500;
    historyItem.selected = `[ИСПРАВЛЕНО] ${correctText}`;
  } else {
    selectedBtn.style.boxShadow = '0 0 25px var(--neon-red)';
    selectedBtn.style.border = '2px solid var(--neon-red)';
    
    options.forEach(opt => {
      if (opt.getAttribute('data-correct') === 'true') {
        opt.style.boxShadow = '0 0 25px var(--neon-green)';
        opt.style.border = '2px solid var(--neon-green)';
      } else if (opt !== selectedBtn) {
        opt.classList.add('faded');
      }
    });
    
    soundManager.playWrong();
  }
  
  // Proceed to game over after 2 seconds
  setTimeout(() => {
    showGameOverScreen();
  }, 2000);
}

// --- GAME OVER PAGE ---
function setupGameOverEvents() {
  DOM.restartGameBtn.addEventListener('click', () => {
    // Restart with same options
    prepareQuestionsPool();
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.history = [];
    state.failedQuestions = [];
    
    state.pu5050Available = true;
    state.puFreezeAvailable = true;
    state.puDoubleAvailable = true;
    
    updatePowerupUI();
    showScreen(DOM.gameplayScreen);
    loadQuestion(0);
  });
  
  DOM.goHomeBtn.addEventListener('click', () => {
    // Clean and go home
    showScreen(DOM.lobbyScreen);
    DOM.redemptionChoicesList.style.display = 'flex';
  });
}

function showGameOverScreen() {
  showScreen(DOM.gameOverScreen);
  soundManager.playGameOver();
  
  // Update stats
  DOM.finalScore.textContent = state.score;
  DOM.finalStreak.textContent = state.maxStreak;
  
  // Calculate accuracy
  const total = state.history.length;
  const correctCount = state.history.filter(h => h.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  DOM.finalAccuracy.textContent = `${accuracy}%`;
  
  // Animate accuracy ring
  const circle = DOM.accuracyCircle;
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  const offset = circumference - (accuracy / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  
  // Build report card list
  buildReportCard();
}

function buildReportCard() {
  DOM.reportList.innerHTML = '';
  
  state.history.forEach((h, idx) => {
    const card = document.createElement('article');
    card.className = `report-item ${h.isCorrect ? 'correct' : 'wrong'}`;
    
    card.innerHTML = `
      <div class="report-q-header">
        <span class="report-num">Вопрос ${idx + 1}</span>
        <div class="report-q-text">${h.question}</div>
        <span class="report-status-badge">${h.isCorrect ? 'ВЕРНО' : 'НЕВЕРНО'}</span>
      </div>
      <div class="report-answers">
        <div class="report-answer-line">
          <span class="ans-label">Ваш ответ:</span>
          <span class="ans-val ${h.isCorrect ? 'correct-val' : 'user-wrong-val'}">${h.selected}</span>
        </div>
        ${!h.isCorrect ? `
        <div class="report-answer-line">
          <span class="ans-label">Правильный:</span>
          <span class="ans-val correct-val">${h.correct}</span>
        </div>
        ` : ''}
        <div class="report-answer-line">
          <span class="ans-label">Очки:</span>
          <span class="ans-val">+${h.scoreAdded}</span>
        </div>
      </div>
    `;
    
    DOM.reportList.appendChild(card);
  });
}

// --- UTILITY FUNCTIONS ---
function showScreen(screenEl) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  screenEl.classList.add('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function padZero(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}
