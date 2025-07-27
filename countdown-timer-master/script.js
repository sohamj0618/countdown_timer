document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dateInput = document.getElementById('date-input');
    const timeInput = document.getElementById('time-input');
    const nameInput = document.getElementById('name-input');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const daysDisplay = document.getElementById('days');
    const hoursDisplay = document.getElementById('hours');
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const messageDisplay = document.getElementById('message');
    const eventNameDisplay = document.getElementById('event-name');
    const timersList = document.getElementById('timers-list');
    const alarmSound = document.getElementById('alarm-sound');
    const savedTimersSection = document.getElementById('saved-timers');

    // State variables
    let countdownInterval;
    let savedTimers = JSON.parse(localStorage.getItem('savedTimers')) || [];

    // Initialize the app
    function init() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Load saved timers
        renderSavedTimers();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.setAttribute('data-theme', 'dark');
            updateThemeIcon();
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        startBtn.addEventListener('click', startCountdown);
        resetBtn.addEventListener('click', resetCountdown);
        themeToggle.addEventListener('click', toggleTheme);
        
        // Allow Enter key to start countdown
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') startCountdown();
        });
    }

    // Start the countdown
    function startCountdown() {
        // Validate inputs
        if (!dateInput.value || !timeInput.value) {
            showMessage('Please select both date and time', 'error');
            return;
        }

        const targetDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
        const now = new Date();

        if (targetDateTime <= now) {
            showMessage('Please select a future date and time', 'error');
            return;
        }

        // Clear any existing interval
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // Update UI
        eventNameDisplay.textContent = nameInput.value || 'Countdown';
        showMessage('Countdown started!', 'success');
        startBtn.disabled = true;

        // Start the countdown
        updateCountdown(targetDateTime);
        countdownInterval = setInterval(() => updateCountdown(targetDateTime), 1000);

        // Save to timers list if there's a name
        if (nameInput.value) {
            saveTimer({
                name: nameInput.value,
                date: dateInput.value,
                time: timeInput.value,
                target: targetDateTime.getTime()
            });
        }
    }

    // Update the countdown display
    function updateCountdown(targetDateTime) {
        const now = new Date();
        const timeRemaining = targetDateTime - now;

        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            showMessage("Time's up!", 'success');
            eventNameDisplay.classList.add('pulse');
            daysDisplay.textContent = '00';
            hoursDisplay.textContent = '00';
            minutesDisplay.textContent = '00';
            secondsDisplay.textContent = '00';
            playAlarm();
            startBtn.disabled = false;
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        daysDisplay.textContent = days.toString().padStart(2, '0');
        hoursDisplay.textContent = hours.toString().padStart(2, '0');
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    // Reset the countdown
    function resetCountdown() {
        clearInterval(countdownInterval);
        countdownInterval = null;
        
        daysDisplay.textContent = '00';
        hoursDisplay.textContent = '00';
        minutesDisplay.textContent = '00';
        secondsDisplay.textContent = '00';
        
        eventNameDisplay.textContent = '';
        eventNameDisplay.classList.remove('pulse');
        messageDisplay.textContent = '';
        startBtn.disabled = false;
        
        // Stop any playing alarm
        stopAlarm();
    }

    // Save timer to localStorage
    function saveTimer(timer) {
        // Check if timer with this name already exists
        const existingIndex = savedTimers.findIndex(t => t.name === timer.name);
        
        if (existingIndex >= 0) {
            savedTimers[existingIndex] = timer;
        } else {
            savedTimers.push(timer);
        }
        
        localStorage.setItem('savedTimers', JSON.stringify(savedTimers));
        renderSavedTimers();
    }

    // Render saved timers list
    function renderSavedTimers() {
        // Filter out expired timers
        const now = new Date().getTime();
        savedTimers = savedTimers.filter(timer => timer.target > now);
        localStorage.setItem('savedTimers', JSON.stringify(savedTimers));
        
        if (savedTimers.length === 0) {
            savedTimersSection.style.display = 'none';
            return;
        }
        
        savedTimersSection.style.display = 'block';
        timersList.innerHTML = '';
        
        savedTimers.forEach(timer => {
            const li = document.createElement('li');
            li.className = 'timer-item';
            
            li.innerHTML = `
                <div class="timer-info">
                    <strong>${timer.name}</strong>
                    <div>${formatDate(timer.date)} at ${timer.time}</div>
                </div>
                <div class="timer-actions">
                    <button class="timer-btn start" data-name="${timer.name}">Start</button>
                    <button class="timer-btn delete" data-name="${timer.name}">Delete</button>
                </div>
            `;
            
            timersList.appendChild(li);
        });
        
        // Add event listeners to timer buttons
        document.querySelectorAll('.timer-btn.start').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timerName = e.target.getAttribute('data-name');
                loadTimer(timerName);
            });
        });
        
        document.querySelectorAll('.timer-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timerName = e.target.getAttribute('data-name');
                deleteTimer(timerName);
            });
        });
    }

    // Load a saved timer
    function loadTimer(timerName) {
        const timer = savedTimers.find(t => t.name === timerName);
        if (!timer) return;
        
        nameInput.value = timer.name;
        dateInput.value = timer.date;
        timeInput.value = timer.time;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Delete a saved timer
    function deleteTimer(timerName) {
        savedTimers = savedTimers.filter(t => t.name !== timerName);
        localStorage.setItem('savedTimers', JSON.stringify(savedTimers));
        renderSavedTimers();
    }

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Show message
    function showMessage(message, type) {
        messageDisplay.textContent = message;
        messageDisplay.style.color = type === 'error' ? 'var(--error-color)' : 'var(--accent-color)';
        
        if (type === 'error') {
            messageDisplay.classList.add('flash');
            setTimeout(() => {
                messageDisplay.classList.remove('flash');
            }, 2000);
        }
    }

    // Play alarm sound
    function playAlarm() {
        if (alarmSound) {
            alarmSound.currentTime = 0;
            alarmSound.play().catch(e => console.log('Audio playback prevented:', e));
        }
    }

    // Stop alarm sound
    function stopAlarm() {
        if (alarmSound) {
            alarmSound.pause();
            alarmSound.currentTime = 0;
        }
    }

    // Toggle dark/light theme
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        updateThemeIcon();
    }

    // Update theme toggle icon
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (document.body.getAttribute('data-theme') === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Initialize the app
    init();
});
