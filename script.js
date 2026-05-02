document.addEventListener('DOMContentLoaded', () => {
    // STATE VARIABLES
    let p1Name = '';
    let p2Name = '';
    let p1Score = 0;
    let p2Score = 0;
    let currentSymbol = 'X';
    let boardState = '         '; // 9 empty spaces
    let isGameOver = false;

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
                oscMelody.type = 'triangle';
                oscMelody.frequency.setValueAtTime(melody[noteIndex], bgMusicContext.currentTime);

                gainMelody.gain.setValueAtTime(0, bgMusicContext.currentTime);
                gainMelody.gain.linearRampToValueAtTime(0.04, bgMusicContext.currentTime + 0.05);
                gainMelody.gain.exponentialRampToValueAtTime(0.0001, bgMusicContext.currentTime + 0.45);

                oscMelody.connect(gainMelody);
                gainMelody.connect(bgMusicContext.destination);
                oscMelody.start();
                oscMelody.stop(bgMusicContext.currentTime + 0.45);

                // Bass oscillator
                const oscBass = bgMusicContext.createOscillator();
                const gainBass = bgMusicContext.createGain();
                oscBass.type = 'sine';
                oscBass.frequency.setValueAtTime(bass[noteIndex], bgMusicContext.currentTime);

                gainBass.gain.setValueAtTime(0, bgMusicContext.currentTime);
                gainBass.gain.linearRampToValueAtTime(0.06, bgMusicContext.currentTime + 0.1);
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

    // SETUP SUBMISSION HANDLER
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        p1Name = player1Input.value.trim() || 'Player 1';
        p2Name = player2Input.value.trim() || 'Player 2';
        p1Score = 0;
        p2Score = 0;

        p1DisplayName.textContent = p1Name;
        p2DisplayName.textContent = p2Name;
        p1ScoreEl.textContent = p1Score;
        p2ScoreEl.textContent = p2Score;

        setupPanel.classList.add('hidden');
        gamePanel.classList.remove('hidden');
        initGame();
        stopBackgroundMusic();
    });

    // START / INITIALIZE GAME STATE
    function initGame() {
        boardState = '         ';
        currentSymbol = 'X';
        isGameOver = false;

        updateTurnDisplay();
        statusMessage.textContent = 'Championship has begun! Tap to play';

        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.addEventListener('click', handleCellClick);
        });
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
    async function handleCellClick(e) {
        if (isGameOver) return;
        const cell = e.currentTarget;
        const index = parseInt(cell.getAttribute('data-index'));

        // Local check to prevent unnecessary requests
        if (boardState[index] !== ' ') {
            showToast('Cell is already occupied.');
            return;
        }

        playClickSound();

        let result;
        try {
            const backendUrl = window.location.port === '3000' ? '/api/move' : 'http://localhost:3000/api/move';
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    board: boardState,
                    symbol: currentSymbol,
                    move: index
                })
            });

            if (response.ok) {
                result = await response.json();
            }
        } catch (error) {
            console.warn('Backend not accessible. Proceeding with client-side fallback logic.');
        }

        // JS Fallback if fetch failed or threw an error (perfect for static hosting like Vercel)
        if (!result) {
            const chars = boardState.split('');
            chars[index] = currentSymbol;
            const newBoardStr = chars.join('');

            // Parse into 2D array
            const board2D = [
                [chars[0], chars[1], chars[2]],
                [chars[3], chars[4], chars[5]],
                [chars[6], chars[7], chars[8]]
            ];

            const isWin = (sym) => {
                for (let i = 0; i < 3; i++) {
                    if (board2D[i][0] === sym && board2D[i][1] === sym && board2D[i][2] === sym) return true;
                    if (board2D[0][i] === sym && board2D[1][i] === sym && board2D[2][i] === sym) return true;
                }
                if (board2D[0][0] === sym && board2D[1][1] === sym && board2D[2][2] === sym) return true;
                if (board2D[0][2] === sym && board2D[1][1] === sym && board2D[2][0] === sym) return true;
                return false;
            };

            const hasEmpty = chars.some(c => c === ' ');

            result = {
                valid: true,
                board: newBoardStr,
                win: isWin(currentSymbol),
                draw: !isWin(currentSymbol) && !hasEmpty,
                msg: 'Move processed locally.'
            };
        }

        if (!result.valid) {
            showToast(result.msg || 'Invalid move attempt.');
            return;
        }

            // Update local state and DOM with result from C executable
            boardState = result.board;
            renderBoardState();

            if (result.win) {
                isGameOver = true;
                const winnerName = currentSymbol === 'X' ? p1Name : p2Name;
                
                // Update score
                if (currentSymbol === 'X') {
                    p1Score++;
                    p1ScoreEl.textContent = p1Score;
                } else {
                    p2Score++;
                    p2ScoreEl.textContent = p2Score;
                }

                // Show modal overlay
                modalIcon.textContent = '🏆';
                modalTitle.textContent = 'Victory!';
                modalBody.innerHTML = `Congratulations <strong>${winnerName}</strong>! You won this round.`;
                modalOverlay.classList.remove('hidden');

                playVictorySound();
                disableBoardEvents();
            } else if (result.draw) {
                isGameOver = true;

                // Show draw overlay
                modalIcon.textContent = '🤝';
                modalTitle.textContent = 'Draw';
                modalBody.innerHTML = `Great effort by both players! The game is a tie.`;
                modalOverlay.classList.remove('hidden');

                playDrawSound();
                disableBoardEvents();
            } else {
                // Game continues, switch player
                currentSymbol = currentSymbol === 'X' ? 'O' : 'X';
                updateTurnDisplay();
            }
    }

    // RENDER CELL STATUS ACCORDING TO BOARD STRING
    function renderBoardState() {
        for (let i = 0; i < 9; i++) {
            const char = boardState[i];
            const cell = document.getElementById(`cell-${i}`);
            
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

    // LOCK BOARD
    function disableBoardEvents() {
        cells.forEach(cell => {
            cell.classList.add('disabled');
            cell.removeEventListener('click', handleCellClick);
        });
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
