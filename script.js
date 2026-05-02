document.addEventListener('DOMContentLoaded', () => {
    // STATE VARIABLES
    let p1Name = '';
    let p2Name = '';
    let p1Score = 0;
    let p2Score = 0;
    let currentSymbol = 'X';
    let boardState = []; 
    let isGameOver = false;
    let gridSize = 3;
    let gameMode = 'pvp';
    let targetRounds = null;

    // AUDIO GENERATORS
    let bgMusicContext = null;
    let bgMusicInterval = null;

    function startBackgroundMusic() {
        if (bgMusicContext) {
            if (bgMusicContext.state === 'suspended') {
                bgMusicContext.resume();
            }
            return;
        }
        try {
            bgMusicContext = new (window.AudioContext || window.webkitAudioContext)();
            if (bgMusicContext.state === 'suspended') {
                bgMusicContext.resume();
            }

            let noteIndex = 0;
            // Catchy, rich continuous song melody and bass notes
            const melody = [
                329.63, 392.00, 329.63, 440.00, 392.00, 329.63, 293.66, 261.63,
                220.00, 246.94, 261.63, 329.63, 293.66, 261.63, 220.00, 196.00
            ];
            const bass = [
                110.00, 110.00, 130.81, 130.81, 146.83, 146.83, 97.99, 97.99,
                110.00, 110.00, 130.81, 130.81, 146.83, 146.83, 97.99, 97.99
            ];

            function playSongStep() {
                if (!bgMusicContext) return;
                if (bgMusicContext.state === 'suspended') {
                    bgMusicContext.resume();
                }

                // Melody oscillator
                const oscMelody = bgMusicContext.createOscillator();
                const gainMelody = bgMusicContext.createGain();
                oscMelody.type = 'sawtooth';
                oscMelody.frequency.setValueAtTime(melody[noteIndex], bgMusicContext.currentTime);

                gainMelody.gain.setValueAtTime(0, bgMusicContext.currentTime);
                gainMelody.gain.linearRampToValueAtTime(0.3, bgMusicContext.currentTime + 0.05);
                gainMelody.gain.exponentialRampToValueAtTime(0.0001, bgMusicContext.currentTime + 0.45);

                oscMelody.connect(gainMelody);
                gainMelody.connect(bgMusicContext.destination);
                oscMelody.start();
                oscMelody.stop(bgMusicContext.currentTime + 0.45);

                // Bass oscillator
                const oscBass = bgMusicContext.createOscillator();
                const gainBass = bgMusicContext.createGain();
                oscBass.type = 'triangle';
                oscBass.frequency.setValueAtTime(bass[noteIndex], bgMusicContext.currentTime);

                gainBass.gain.setValueAtTime(0, bgMusicContext.currentTime);
                gainBass.gain.linearRampToValueAtTime(0.35, bgMusicContext.currentTime + 0.1);
                gainBass.gain.exponentialRampToValueAtTime(0.0001, bgMusicContext.currentTime + 0.5);

                oscBass.connect(gainBass);
                gainBass.connect(bgMusicContext.destination);
                oscBass.start();
                oscBass.stop(bgMusicContext.currentTime + 0.5);

                noteIndex = (noteIndex + 1) % melody.length;
            }

            playSongStep();
            bgMusicInterval = setInterval(playSongStep, 350); // Fast continuous tempo!

            // Unlock audio on first window click to allow autoplay
            window.addEventListener('click', () => {
                if (!bgMusicContext) {
                    startBackgroundMusic();
                } else if (bgMusicContext.state === 'suspended') {
                    bgMusicContext.resume();
                }
            }, { once: true });

        } catch (e) {
            console.warn('AudioContext failed:', e);
        }
    }

    function stopBackgroundMusic() {
        if (bgMusicInterval) {
            clearInterval(bgMusicInterval);
            bgMusicInterval = null;
        }
        if (bgMusicContext) {
            try {
                bgMusicContext.close();
            } catch (e) {}
            bgMusicContext = null;
        }
    }

    function playVictorySound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // Uplifting ascending C Major arpeggio
            notes.forEach((note, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, ctx.currentTime + (i * 0.12));
                
                gain.gain.setValueAtTime(0, ctx.currentTime + (i * 0.12));
                gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + (i * 0.12) + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (i * 0.12) + 0.55);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + (i * 0.12));
                osc.stop(ctx.currentTime + (i * 0.12) + 0.55);
            });
        } catch (e) {
            console.warn('Victory audio blocked:', e);
        }
    }

    function playDrawSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [293.66, 329.63, 261.63, 196.00]; // Rich melodic descending chords for ties
            notes.forEach((note, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, ctx.currentTime + (i * 0.15));
                
                gain.gain.setValueAtTime(0, ctx.currentTime + (i * 0.15));
                gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + (i * 0.15) + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (i * 0.15) + 0.5);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + (i * 0.15));
                osc.stop(ctx.currentTime + (i * 0.15) + 0.5);
            });
        } catch (e) {
            console.warn('Draw audio blocked:', e);
        }
    }

    function playClickSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn('AudioContext blocked:', e);
        }
    }

    // DOM ELEMENTS
    const setupPanel = document.getElementById('setup-panel');
    const gamePanel = document.getElementById('game-panel');
    const playerForm = document.getElementById('player-form');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const gameModeSelect = document.getElementById('game-mode');
    const gridSizeSelect = document.getElementById('grid-size');
    const targetRoundsInput = document.getElementById('target-rounds');
    const p2InputWrapper = document.getElementById('p2-input-wrapper');

    const p1DisplayName = document.getElementById('p1-display-name');
    const p2DisplayName = document.getElementById('p2-display-name');
    const p1ScoreEl = document.getElementById('p1-score');
    const p2ScoreEl = document.getElementById('p2-score');

    const p1ProfileCard = document.getElementById('p1-profile-card');
    const p2ProfileCard = document.getElementById('p2-profile-card');

    const turnIndicator = document.getElementById('turn-indicator');
    const statusMessage = document.getElementById('status-message');
    const cells = document.querySelectorAll('.cell');

    const resetBtn = document.getElementById('reset-btn');
    const changePlayersBtn = document.getElementById('change-players-btn');
    const toast = document.getElementById('toast-notification');

    // MODAL ELEMENTS
    const modalOverlay = document.getElementById('modal-overlay');
    const modalIcon = document.getElementById('modal-icon');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalNextBtn = document.getElementById('modal-next-btn');

    // GAME MODE CHANGE LISTENER
    if (gameModeSelect) {
        gameModeSelect.addEventListener('change', () => {
            if (gameModeSelect.value === 'pve') {
                p2InputWrapper.style.display = 'none';
                player2Input.required = false;
            } else {
                p2InputWrapper.style.display = 'block';
                player2Input.required = true;
            }
        });
    }

    // SETUP SUBMISSION HANDLER
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        p1Name = player1Input.value.trim() || 'Player 1';
        gameMode = gameModeSelect ? gameModeSelect.value : 'pvp';
        gridSize = gridSizeSelect ? parseInt(gridSizeSelect.value) : 3;
        targetRounds = targetRoundsInput && targetRoundsInput.value ? parseInt(targetRoundsInput.value) : null;

        if (gameMode === 'pve') {
            p2Name = 'Robot 🤖';
        } else {
            p2Name = player2Input.value.trim() || 'Player 2';
        }

        p1Score = 0;
        p2Score = 0;

        p1DisplayName.textContent = p1Name;
        p2DisplayName.textContent = p2Name;
        p1ScoreEl.textContent = p1Score;
        p2ScoreEl.textContent = p2Score;

        const boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.style.setProperty('--grid-size', gridSize);
            boardEl.style.setProperty('--cell-font-size', gridSize === 5 ? '1.85rem' : '2.75rem');
        }

        setupPanel.classList.add('hidden');
        gamePanel.classList.remove('hidden');
        initGame();
        stopBackgroundMusic();
    });

    // START / INITIALIZE GAME STATE
    function initGame() {
        boardState = Array(gridSize * gridSize).fill(' ');
        currentSymbol = 'X';
        isGameOver = false;

        updateTurnDisplay();
        statusMessage.textContent = 'Championship has begun! Tap to play';

        const boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let i = 0; i < gridSize * gridSize; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${i}`;
                cell.setAttribute('data-index', i);
                cell.addEventListener('click', handleCellClick);
                boardEl.appendChild(cell);
            }
        }
    }

    // UPDATE DISPLAY LABELS
    function updateTurnDisplay() {
        if (isGameOver) return;
        const currentName = currentSymbol === 'X' ? p1Name : p2Name;
        if (turnIndicator) turnIndicator.textContent = `${currentSymbol}'S TURN`;
        statusMessage.textContent = `Strategic Move: ${currentName}`;

        if (currentSymbol === 'X') {
            p1ProfileCard.classList.add('active-turn');
            p2ProfileCard.classList.remove('active-turn');
        } else {
            p1ProfileCard.classList.remove('active-turn');
            p2ProfileCard.classList.add('active-turn');
        }
    }

    // CLICK CELL HANDLER
    function handleCellClick(e) {
        if (isGameOver) return;
        const cell = e.currentTarget;
        const index = parseInt(cell.getAttribute('data-index'));

        if (boardState[index] !== ' ') return;

        // Player makes move
        makeMove(index);
    }

    function makeMove(index) {
        if (isGameOver || boardState[index] !== ' ') return;

        boardState[index] = currentSymbol;
        renderBoardState();
        playClickSound();

        // Win check
        if (checkWin(currentSymbol)) {
            isGameOver = true;
            const winnerName = currentSymbol === 'X' ? p1Name : p2Name;

            if (currentSymbol === 'X') {
                p1Score++;
                p1ScoreEl.textContent = p1Score;
            } else {
                p2Score++;
                p2ScoreEl.textContent = p2Score;
            }

            // Check if tournament target rounds met
            if (targetRounds && (p1Score >= targetRounds || p2Score >= targetRounds)) {
                modalIcon.textContent = '👑';
                modalTitle.textContent = 'Grand Champion!';
                modalBody.innerHTML = `🏆 Amazing! <strong>${winnerName}</strong> reached ${targetRounds} wins first and is the Ultimate Champion!`;
                
                // Clear scores on overall win
                p1Score = 0;
                p2Score = 0;
                p1ScoreEl.textContent = '0';
                p2ScoreEl.textContent = '0';
            } else {
                modalIcon.textContent = '🏆';
                modalTitle.textContent = 'Victory!';
                modalBody.innerHTML = `Congratulations <strong>${winnerName}</strong>! You won this round.`;
            }

            modalOverlay.classList.remove('hidden');
            playVictorySound();
            return;
        }

        // Draw check
        if (boardState.every(c => c !== ' ')) {
            isGameOver = true;
            modalIcon.textContent = '🤝';
            modalTitle.textContent = 'Draw';
            modalBody.innerHTML = `Great effort by both players! The round is a tie.`;
            modalOverlay.classList.remove('hidden');
            playDrawSound();
            return;
        }

        // Move to next turn
        currentSymbol = currentSymbol === 'X' ? 'O' : 'X';
        updateTurnDisplay();

        // Robot AI Move trigger
        if (currentSymbol === 'O' && gameMode === 'pve' && !isGameOver) {
            setTimeout(makeRobotMove, 500);
        }
    }

    function makeRobotMove() {
        if (isGameOver || currentSymbol !== 'O') return;

        // Collect all empty cell indexes
        const empties = [];
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === ' ') empties.push(i);
        }

        if (empties.length === 0) return;

        // Try simple winning/blocking moves for AI
        let bestMove = -1;

        // 1. Can Robot win immediately?
        for (const idx of empties) {
            boardState[idx] = 'O';
            if (checkWin('O')) {
                boardState[idx] = ' ';
                bestMove = idx;
                break;
            }
            boardState[idx] = ' ';
        }

        // 2. Can Player 1 win immediately? Block them!
        if (bestMove === -1) {
            for (const idx of empties) {
                boardState[idx] = 'X';
                if (checkWin('X')) {
                    boardState[idx] = ' ';
                    bestMove = idx;
                    break;
                }
                boardState[idx] = ' ';
            }
        }

        // 3. Fallback: random move
        if (bestMove === -1) {
            bestMove = empties[Math.floor(Math.random() * empties.length)];
        }

        makeMove(bestMove);
    }

    function checkWin(sym) {
        const winLength = gridSize === 5 ? 4 : 3;

        // Check rows
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c <= gridSize - winLength; c++) {
                let count = 0;
                for (let k = 0; k < winLength; k++) {
                    if (boardState[r * gridSize + (c + k)] === sym) count++;
                }
                if (count === winLength) return true;
            }
        }

        // Check columns
        for (let c = 0; c < gridSize; c++) {
            for (let r = 0; r <= gridSize - winLength; r++) {
                let count = 0;
                for (let k = 0; k < winLength; k++) {
                    if (boardState[(r + k) * gridSize + c] === sym) count++;
                }
                if (count === winLength) return true;
            }
        }

        // Check diagonals (top-left to bottom-right)
        for (let r = 0; r <= gridSize - winLength; r++) {
            for (let c = 0; c <= gridSize - winLength; c++) {
                let count = 0;
                for (let k = 0; k < winLength; k++) {
                    if (boardState[(r + k) * gridSize + (c + k)] === sym) count++;
                }
                if (count === winLength) return true;
            }
        }

        // Check diagonals (top-right to bottom-left)
        for (let r = 0; r <= gridSize - winLength; r++) {
            for (let c = winLength - 1; c < gridSize; c++) {
                let count = 0;
                for (let k = 0; k < winLength; k++) {
                    if (boardState[(r + k) * gridSize + (c - k)] === sym) count++;
                }
                if (count === winLength) return true;
            }
        }

        return false;
    }

    // RENDER CELL STATUS
    function renderBoardState() {
        for (let i = 0; i < gridSize * gridSize; i++) {
            const char = boardState[i];
            const cell = document.getElementById(`cell-${i}`);
            if (!cell) continue;

            if (char === 'X') {
                cell.textContent = 'X';
                cell.className = 'cell x-mark disabled';
            } else if (char === 'O') {
                cell.textContent = 'O';
                cell.className = 'cell o-mark disabled';
            } else {
                cell.textContent = '';
                cell.className = 'cell';
            }
        }
    }

    // RESTART CURRENT PLAYERS
    resetBtn.addEventListener('click', () => {
        initGame();
        showToast('Round restarted.');
    });

    // START FRESH WITH NEW PLAYERS
    changePlayersBtn.addEventListener('click', () => {
        gamePanel.classList.add('hidden');
        setupPanel.classList.remove('hidden');
        player1Input.value = '';
        player2Input.value = '';
        startBackgroundMusic();
        showToast('Set new player names.');
    });

    // MODAL NEXT ROUND HANDLER
    modalNextBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        initGame();
    });

    // TOAST SYSTEM
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    startBackgroundMusic();

    ['click', 'touchstart', 'keydown', 'mousedown'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (!bgMusicContext) {
                startBackgroundMusic();
            } else if (bgMusicContext.state === 'suspended') {
                bgMusicContext.resume();
            }
        }, { once: true });
    });
});
