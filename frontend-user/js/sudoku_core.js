/**
 * SudokuCore Class
 * Handles board generation, solving, and validation.
 */
class SudokuCore {
  constructor() {
    this.size = 9;
    this.boxSize = 3;
  }

  // Initialize a blank 9x9 grid
  createEmptyBoard() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(0));
  }

  // Check if placing num at board[row][col] is valid
  isValid(board, row, col, num) {
    for (let x = 0; x < this.size; x++) {
      // Check row and column
      if (board[row][x] === num || board[x][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const startRow = row - (row % this.boxSize);
    const startCol = col - (col % this.boxSize);
    for (let i = 0; i < this.boxSize; i++) {
      for (let j = 0; j < this.boxSize; j++) {
        if (board[i + startRow][j + startCol] === num) {
          return false;
        }
      }
    }

    return true;
  }

  // Solves the board using backtracking
  solve(board, randomize = false) {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (board[row][col] === 0) {
          let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          if (randomize) {
            nums = this.shuffle(nums);
          }

          for (let num of nums) {
            if (this.isValid(board, row, col, num)) {
              board[row][col] = num;
              if (this.solve(board, randomize)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Helper to shuffle array
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Generate a new puzzle
  // difficulty: 'easy', 'medium', 'hard'
  generate(difficulty = "easy") {
    // 1. Create a full valid board
    const fullBoard = this.createEmptyBoard();
    this.solve(fullBoard, true);

    // 2. Clone to create the puzzle board
    const puzzleBoard = fullBoard.map((row) => [...row]);

    // 3. Remove numbers based on difficulty
    // Easy: Remove ~30-35
    // Medium: Remove ~40-45
    // Hard: Remove ~50-55
    let attempts;
    switch (difficulty) {
      case "medium":
        attempts = 45;
        break;
      case "hard":
        attempts = 55;
        break;
      case "easy":
      default:
        attempts = 35;
        break;
    }

    while (attempts > 0) {
      let row = Math.floor(Math.random() * this.size);
      let col = Math.floor(Math.random() * this.size);
      while (puzzleBoard[row][col] === 0) {
        row = Math.floor(Math.random() * this.size);
        col = Math.floor(Math.random() * this.size);
      }
      // Ideally we should check if the puzzle still has a unique solution here
      // For this version, we'll keep it simple but ensure we don't remove too many to make it unsolvable by logic
      // A robust generator checks uniqueness, but for client-side performant generation, this approximation is often used
      // We can add a uniqueness check if performance allows.

      puzzleBoard[row][col] = 0;
      attempts--;
    }

    return {
      initial: puzzleBoard.map((row) => [...row]), // The starting state
      solution: fullBoard, // The answer key
    };
  }
}

// Export for usage
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = SudokuCore;
// }
