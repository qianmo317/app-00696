/**
 * Sudoku Game Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const core = new SudokuCore();
    
    // Game State
    let state = {
        difficulty: 'easy',
        initialBoard: [],
        currentBoard: [],
        solution: [],
        notes: parseNotes(null), // 9x9 array of Set
        timerSeconds: 0,
        mistakes: 0,
        maxMistakes: 3,
        isPlaying: false,
        hintsLeft: 3,
        selectedCell: { row: -1, col: -1 },
        isNoteMode: false,
        history: [] // For undo
    };

    // DOM Elements
    const boardEl = document.getElementById('board');
    const timerEl = document.getElementById('timer');
    const mistakesEl = document.getElementById('mistakes');
    const difficultySelect = document.getElementById('difficulty-select');
    const difficultyDisplay = document.getElementById('difficulty-display');
    const hintCountEl = document.getElementById('hint-count');
    const noteIndicator = document.getElementById('note-indicator');
    
    // Buttons
    const btnUndo = document.getElementById('btn-undo');
    const btnErase = document.getElementById('btn-erase');
    const btnNote = document.getElementById('btn-note');
    const btnHint = document.getElementById('btn-hint');
    const numPadBtns = document.querySelectorAll('.num-btn');
    
    // Modals
    const winModal = document.getElementById('win-modal');
    const loseModal = document.getElementById('lose-modal');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnRetry = document.getElementById('btn-retry');

    // Timer Interval
    let timerInt;

    // --- Initialization ---
    init();

    function init() {
        // Load from local storage or start new
        const saved = localStorage.getItem('sudoku-state');
        if (saved) {
            try {
                loadGame(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load save", e);
                startNewGame('easy');
            }
        } else {
            startNewGame('easy');
        }

        setupEventListeners();
    }

    function setupEventListeners() {
        // Difficulty
        difficultySelect.value = state.difficulty;
        difficultySelect.addEventListener('change', (e) => {
            if (confirm('切换难​​度将开始新游戏，确定吗？')) {
                startNewGame(e.target.value);
            } else {
                difficultySelect.value = state.difficulty;
            }
        });

        // Board Clicks
        boardEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            selectCell(row, col);
        });

        // Keyboard Input
        document.addEventListener('keydown', (e) => {
            if (!state.isPlaying) return;
            if (e.key >= '1' && e.key <= '9') {
                handleInput(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleErase();
            } else if (e.key === 'ArrowUp') {
                moveSelection(-1, 0);
            } else if (e.key === 'ArrowDown') {
                moveSelection(1, 0);
            } else if (e.key === 'ArrowLeft') {
                moveSelection(0, -1);
            } else if (e.key === 'ArrowRight') {
                moveSelection(0, 1);
            }
        });

        // Controls
        btnUndo.addEventListener('click', handleUndo);
        btnErase.addEventListener('click', handleErase);
        btnNote.addEventListener('click', toggleNoteMode);
        btnHint.addEventListener('click', handleHint);
        
        // Numpad
        numPadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                handleInput(parseInt(btn.dataset.num));
            });
        });

        // Modals
        btnNewGame.addEventListener('click', () => {
            winModal.classList.remove('open');
            startNewGame(state.difficulty);
        });
        btnRetry.addEventListener('click', () => {
            loseModal.classList.remove('open');
            startNewGame(state.difficulty);
        });
    }

    function startNewGame(difficulty) {
        state.difficulty = difficulty;
        const puzzle = core.generate(difficulty);
        state.initialBoard = puzzle.initial;
        state.solution = puzzle.solution;
        state.currentBoard = JSON.parse(JSON.stringify(puzzle.initial));
        state.notes = createEmptyNotes();
        state.timerSeconds = 0;
        state.mistakes = 0;
        state.hintsLeft = 3;
        state.isPlaying = true;
        state.history = [];
        state.selectedCell = { row: -1, col: -1 };

        difficultyDisplay.textContent = getDifficultyName(difficulty);
        difficultySelect.value = difficulty;

        renderBoard();
        startTimer();
        updateUI();
        saveGame();
    }

    function loadGame(savedState) {
        state = savedState;
        // Restore Sets for notes as JSON stringify kills them
        state.notes = state.notes.map(row => row.map(cell => new Set(cell)));
        
        difficultyDisplay.textContent = getDifficultyName(state.difficulty);
        difficultySelect.value = state.difficulty;
        
        renderBoard();
        startTimer();
        updateUI();
    }

    function createEmptyNotes() {
        return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    }
    
    function parseNotes(notes) {
        if (!notes) return createEmptyNotes();
        return notes; // Assuming correct format if passed
    }

    function renderBoard() {
        boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const value = state.currentBoard[i][j];
                const initial = state.initialBoard[i][j];

                if (initial !== 0) {
                    cell.classList.add('initial');
                    cell.textContent = initial;
                } else if (value !== 0) {
                    cell.textContent = value;
                } else {
                    // Render notes
                    renderNotes(cell, state.notes[i][j]);
                }

                boardEl.appendChild(cell);
            }
        }
    }

    function renderNotes(cell, notesSet) {
        if (notesSet.size === 0) return;
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        
        // Always 9 slots
        for (let k = 1; k <= 9; k++) {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-num';
            if (notesSet.has(k)) {
                noteEl.textContent = k;
            }
            notesGrid.appendChild(noteEl);
        }
        cell.appendChild(notesGrid);
    }

    function selectCell(row, col) {
        if (!state.isPlaying) return;
        
        state.selectedCell = { row, col };
        highlightBoard();
    }

    function moveSelection(dRow, dCol) {
        let { row, col } = state.selectedCell;
        if (row === -1) {
            selectCell(0, 0);
            return;
        }
        
        let newRow = row + dRow;
        let newCol = col + dCol;
        
        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
            selectCell(newRow, newCol);
        }
    }

    function highlightBoard() {
        const { row, col } = state.selectedCell;
        const cells = document.querySelectorAll('.cell');
        const selectedValue = state.currentBoard[row][col];

        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            cell.classList.remove('selected', 'highlighted', 'same-number');

            if (r === row && c === col) {
                cell.classList.add('selected');
            } else if (r === row || c === col || isSameBlock(r, c, row, col)) {
                cell.classList.add('highlighted');
            }

            if (selectedValue !== 0 && state.currentBoard[r][c] === selectedValue) {
                cell.classList.add('same-number');
            }
        });
    }

    function isSameBlock(r1, c1, r2, c2) {
        return Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
    }

    function handleInput(num) {
        if (!state.isPlaying) return;
        const { row, col } = state.selectedCell;
        if (row === -1) return;
        
        // Cannot edit initial cells
        if (state.initialBoard[row][col] !== 0) return;

        // Note Mode
        if (state.isNoteMode) {
            toggleNote(row, col, num);
            saveGame();
            renderBoard();
            highlightBoard();
            return;
        }

        // Regular Input
        if (state.currentBoard[row][col] === num) return; // No change

        pushHistory();

        // Check Correctness immediately (Strict Mode)
        if (num === state.solution[row][col]) {
            // Correct
            state.currentBoard[row][col] = num;
            // Clear notes in row/col/block
            clearNotes(row, col, num);
            
            renderCell(row, col);
            checkWin();
        } else {
            // Incorrect
            handleMistake(row, col);
        }
        
        saveGame();
        highlightBoard();
    }

    function toggleNote(row, col, num) {
        if (state.notes[row][col].has(num)) {
            state.notes[row][col].delete(num);
        } else {
            state.notes[row][col].add(num);
        }
    }

    function clearNotes(row, col, num) {
        // Clear logic for row, col, block
        for(let i=0; i<9; i++) {
            state.notes[row][i].delete(num);
            state.notes[i][col].delete(num);
        }
        const startR = Math.floor(row/3)*3;
        const startC = Math.floor(col/3)*3;
        for(let i=0; i<3; i++){
            for(let j=0; j<3; j++){
                state.notes[startR+i][startC+j].delete(num);
            }
        }
        // state.notes[row][col].clear(); // Not strictly needed as cell is filled
    }

    function handleMistake(row, col) {
        state.mistakes++;
        mistakesEl.textContent = state.mistakes;
        
        const cell = getCellEl(row, col);
        cell.classList.add('error');
        setTimeout(() => cell.classList.remove('error'), 500);

        if (state.mistakes >= state.maxMistakes) {
            gameOver();
        }
        updateUI();
    }

    function handleErase() {
        if (!state.isPlaying) return;
        const { row, col } = state.selectedCell;
        if (row === -1) return;
        if (state.initialBoard[row][col] !== 0) return;

        pushHistory();
        state.currentBoard[row][col] = 0;
        renderCell(row, col);
        saveGame();
        highlightBoard();
    }

    function handleUndo() {
        if (state.history.length === 0) return;
        const prevState = state.history.pop();
        
        // Restore essential state
        state.currentBoard = prevState.currentBoard;
        state.notes = prevState.notes;
        state.mistakes = prevState.mistakes;
        
        renderBoard();
        highlightBoard();
        updateUI();
        saveGame();
    }

    function pushHistory() {
        // Deep clone complex objects
        const snapshot = {
            currentBoard: JSON.parse(JSON.stringify(state.currentBoard)),
            notes: state.notes.map(r => r.map(c => new Set(c))),
            mistakes: state.mistakes
        };
        state.history.push(snapshot);
        if (state.history.length > 20) state.history.shift(); // Limit history
    }

    function startTimer() {
        clearInterval(timerInt);
        timerInt = setInterval(() => {
            if (!state.isPlaying) return;
            state.timerSeconds++;
            timerEl.textContent = formatTime(state.timerSeconds);
            if (state.timerSeconds % 10 === 0) saveGame(); 
        }, 1000);
    }
    
    function formatTime(secs) {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function handleHint() {
        if (state.hintsLeft <= 0 || !state.isPlaying) return;
        
        // Find an empty cell
        const { row, col } = state.selectedCell;
        let targetRow = row, targetCol = col;

        // If no cell selected or selected is full, find first empty
        if (row === -1 || state.currentBoard[row][col] !== 0) {
            outer: for(let r=0; r<9; r++){
                for(let c=0; c<9; c++){
                    if(state.currentBoard[r][c] === 0){
                        targetRow = r; targetCol = c;
                        selectCell(r, c);
                        break outer;
                    }
                }
            }
        }

        if (state.currentBoard[targetRow][targetCol] !== 0) return; // Board full?

        pushHistory();
        state.hintsLeft--;
        const num = state.solution[targetRow][targetCol];
        state.currentBoard[targetRow][targetCol] = num;
        clearNotes(targetRow, targetCol, num);
        
        renderCell(targetRow, targetCol);
        updateUI();
        checkWin();
        saveGame();
    }

    function toggleNoteMode() {
        state.isNoteMode = !state.isNoteMode;
        if (state.isNoteMode) {
            btnNote.classList.add('active');
            noteIndicator.textContent = 'ON';
        } else {
            btnNote.classList.remove('active');
            noteIndicator.textContent = 'OFF';
        }
    }

    function getDifficultyName(d) {
        return { 'easy': '初级', 'medium': '中级', 'hard': '高级' }[d];
    }

    function updateUI() {
        mistakesEl.textContent = state.mistakes;
        hintCountEl.textContent = state.hintsLeft;
        timerEl.textContent = formatTime(state.timerSeconds);
    }

    function checkWin() {
        for(let i=0; i<9; i++){
            for(let j=0; j<9; j++){
                if(state.currentBoard[i][j] !== state.solution[i][j]) return;
            }
        }
        
        // Win!
        state.isPlaying = false;
        document.getElementById('win-difficulty').textContent = getDifficultyName(state.difficulty);
        document.getElementById('win-time').textContent = formatTime(state.timerSeconds);
        winModal.classList.add('open');
        window.startConfetti();
        localStorage.removeItem('sudoku-state');
    }

    function gameOver() {
        state.isPlaying = false;
        loseModal.classList.add('open');
        localStorage.removeItem('sudoku-state');
    }

    function renderCell(row, col) {
        renderBoard();
    }
    
    function getCellEl(row, col) {
        return boardEl.children[row*9 + col];
    }

    function saveGame() {
        const saveState = {
            ...state,
            notes: state.notes.map(row => row.map(set => Array.from(set))), // Convert Set -> Array
            history: [] // Don't save history to save space
        };
        localStorage.setItem('sudoku-state', JSON.stringify(saveState));
    }
});
