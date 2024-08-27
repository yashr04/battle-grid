document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const currentPlayerElement = document.getElementById('current-player');
    const selectedElement = document.getElementById('selected');
    const buttons = document.getElementById('buttons');
    const historyList = document.getElementById('history-list');
    const historyContainer = document.getElementById('history-container');
    const startGameButton = document.createElement('button');
    startGameButton.textContent = 'Start Game';
    startGameButton.style.display = 'none';
    startGameButton.style.marginTop = '10px';

    // Create winner announcement element
    const winnerAnnouncement = document.createElement('button');
    winnerAnnouncement.style.display = 'none';
    winnerAnnouncement.style.fontSize = '16px';
    winnerAnnouncement.style.padding = '10px 20px';
    winnerAnnouncement.style.backgroundColor = '#4CAF50';
    winnerAnnouncement.style.color = 'white';
    winnerAnnouncement.style.border = 'none';
    winnerAnnouncement.style.borderRadius = '5px';
    winnerAnnouncement.style.margin = '10px 0';
    board.before(winnerAnnouncement);

    // Create restart game button
    const restartGameButton = document.createElement('button');
    restartGameButton.textContent = 'Restart Game';
    restartGameButton.style.display = 'none';
    restartGameButton.style.marginTop = '10px';
    restartGameButton.style.marginLeft = '10px';
    winnerAnnouncement.after(restartGameButton);

    const gridSize = 5;
    let currentPlayer = 'A';
    let selectedCharacter = null;
    const characters = {};
    const moveHistory = [];
    let gameStarted = false;
    let gameEnded = false;
    let placedCharacters = { A: 0, B: 0 };
    const characterOrder = ['P1', 'P2', 'H1', 'H2', 'P3'];

    const initializeGame = () => {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                board.appendChild(cell);

                cell.addEventListener('click', () => {
                    if (gameEnded) {
                        alert('Game has ended. Restart Game to play again.');
                    } else if (!gameStarted) {
                        if (placedCharacters['A'] === 5 && placedCharacters['B'] === 5) {
                            alert('Click Start Game button to play the game.');
                        } else {
                            placeCharacter(cell);
                        }
                    } else {
                        selectCharacter(cell);
                    }
                });
            }
        }

        board.after(startGameButton);

        selectedElement.style.display = 'none';
        historyContainer.style.display = 'none';
        buttons.style.display = 'none';

        currentPlayerElement.textContent = `Player A, place your A-P1`;

        // Add character movement guide
        const guideContainer = document.createElement('div');
        guideContainer.id = 'movement-guide';
        guideContainer.innerHTML = `
            <h3>Piece Movement Guide</h3>
            <ul>
                <li>Pawn (P1,P2,P3): Moves 1 step straight in any direction (⬅️ ➡️ ⬆️ ⬇️)</li>
                <li>Hero1 (H1): Moves 2 steps straight in any direction (⬅️ ➡️ ⬆️ ⬇️)</li>
                <li>Hero2 (H2): Moves 2 steps diagonally in any direction (↖️ ↗️ ↙️ ↘️)</li>
            </ul>
        `;
        guideContainer.style.marginTop = '20px';
        guideContainer.style.textAlign = 'left';
        board.after(guideContainer);

        updateBoard();
    };

    const placeCharacter = (cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if ((currentPlayer === 'A' && row !== 0) || (currentPlayer === 'B' && row !== 4)) {
            alert('Please place your character in your starting row.');
            return;
        }

        if (Object.values(characters).some(char => char.row === row && char.col === col)) {
            alert('This cell is already occupied.');
            return;
        }

        const currentCharType = characterOrder[placedCharacters[currentPlayer]];
        const characterId = `${currentPlayer}-${currentCharType}`;
        characters[characterId] = { 
            row, 
            col, 
            type: currentCharType.startsWith('P') ? 'pawn' : 
                  (currentCharType === 'H1' ? 'hero1' : 'hero2'), 
            player: currentPlayer 
        };

        placedCharacters[currentPlayer]++;
        updateBoard();

        if (placedCharacters[currentPlayer] === 5) {
            if (currentPlayer === 'A') {
                currentPlayer = 'B';
                currentPlayerElement.textContent = 'Player B, place your B-P1';
            } else {
                currentPlayerElement.textContent = 'All characters placed. Click Start Game to begin.';
                startGameButton.style.display = 'block';
            }
        } else {
            const nextCharType = characterOrder[placedCharacters[currentPlayer]];
            currentPlayerElement.textContent = `Player ${currentPlayer}, place your ${currentPlayer}-${nextCharType}`;
        }
    };

    const updateBoard = () => {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('player-a', 'player-b', 'selected', 'highlight', 'highlight-enemy');
        });

        Object.keys(characters).forEach(key => {
            const { row, col, player } = characters[key];
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = key;
            cell.classList.add(`player-${player.toLowerCase()}`);
            if (key === selectedCharacter) {
                cell.classList.add('selected');
            }
        });

        if (gameStarted && !gameEnded) {
            currentPlayerElement.textContent = `Current Player: ${currentPlayer}`;
            selectedElement.textContent = selectedCharacter ? `Selected: ${selectedCharacter}` : 'Selected: None';
        }
    };

    const selectCharacter = (cell) => {
        if (!gameStarted || gameEnded) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        const character = Object.keys(characters).find(key => 
            characters[key].row === row && characters[key].col === col && characters[key].player === currentPlayer
        );

        if (character) {
            selectedCharacter = character;
            document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'highlight', 'highlight-enemy'));
            cell.classList.add('selected');
            updateBoard();
            showMoveOptions(character);
            highlightPossibleMoves(character);
        } else {
            alert('Invalid selection. Please select your own character.');
        }
    };

    const showMoveOptions = (character) => {
        buttons.innerHTML = '';

        if (gameEnded) return;

        const { type } = characters[character];

        const moveButtons = {
            'pawn': ['L', 'R', 'F', 'B'],
            'hero1': ['L', 'R', 'F', 'B'],
            'hero2': ['FL', 'FR', 'BL', 'BR']
        };

        moveButtons[type].forEach(move => {
            const button = document.createElement('button');
            button.textContent = move;
            button.onclick = () => makeMove(character, move);
            buttons.appendChild(button);
        });
    };

    const highlightPossibleMoves = (character) => {
        const { row, col, type, player } = characters[character];
        const possibleMoves = getPossibleMoves(row, col, type, player);

        possibleMoves.forEach(({ newRow, newCol }) => {
            if (isValidMove(newRow, newCol, player)) {
                const cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
                if (cell) {
                    const isEnemy = Object.values(characters).some(char => char.row === newRow && char.col === newCol && char.player !== player);
                    cell.classList.add(isEnemy ? 'highlight-enemy' : 'highlight');
                }
            }
        });
    };

    const getPossibleMoves = (row, col, type, player) => {
        const moves = [];

        if (type === 'pawn') {
            moves.push({ newRow: row, newCol: col - 1 }); // L
            moves.push({ newRow: row, newCol: col + 1 }); // R
            moves.push({ newRow: player === 'A' ? row + 1 : row - 1, newCol: col }); // F
            moves.push({ newRow: player === 'A' ? row - 1 : row + 1, newCol: col }); // B
        }

        if (type === 'hero1') {
            moves.push({ newRow: row, newCol: col - 2 }); // L
            moves.push({ newRow: row, newCol: col + 2 }); // R
            moves.push({ newRow: player === 'A' ? row + 2 : row - 2, newCol: col }); // F
            moves.push({ newRow: player === 'A' ? row - 2 : row + 2, newCol: col }); // B
        }

        if (type === 'hero2') {
            moves.push({ newRow: player === 'A' ? row + 2 : row - 2, newCol: col - 2 }); // FL
            moves.push({ newRow: player === 'A' ? row + 2 : row - 2, newCol: col + 2 }); // FR
            moves.push({ newRow: player === 'A' ? row - 2 : row + 2, newCol: col - 2 }); // BL
            moves.push({ newRow: player === 'A' ? row - 2 : row + 2, newCol: col + 2 }); // BR
        }

        return moves;
    };

    const makeMove = (character, move) => {
        if (gameEnded) {
            alert('Game has ended. Restart Game to play again.');
            return;
        }

        const { row, col, type, player } = characters[character];
        let newRow = row, newCol = col;
    
        let deltaRow = 0, deltaCol = 0;
    
        const adjustedMove = (player === 'A') ? 
                             (move === 'L' ? 'R' :
                              move === 'R' ? 'L' :
                              move === 'FR' ? 'FL' :
                              move === 'FL' ? 'FR' :
                              move === 'BR' ? 'BL' :
                              move === 'BL' ? 'BR' : move) : move;
    
        const direction = player === 'A' ? 1 : -1;
    
        switch (adjustedMove) {
            case 'L': deltaCol = -1 * (type === 'pawn' ? 1 : 2); break;
            case 'R': deltaCol = 1 * (type === 'pawn' ? 1 : 2); break;
            case 'F': deltaRow = direction * (type === 'pawn' ? 1 : 2); break;
            case 'B': deltaRow = -direction * (type === 'pawn' ? 1 : 2); break;
            case 'FL': deltaRow = 2 * direction; deltaCol = -2; break;
            case 'FR': deltaRow = 2 * direction; deltaCol = 2; break;
            case 'BL': deltaRow = -2 * direction; deltaCol = -2; break;
            case 'BR': deltaRow = -2 * direction; deltaCol = 2; break;
        }
    
        newRow += deltaRow;
        newCol += deltaCol;
    
        if (isValidMove(newRow, newCol, player)) {
            const capturedCharacters = handleCombat(character, row, col, deltaRow, deltaCol);
            characters[character].row = newRow;
            characters[character].col = newCol;
            addMoveToHistory(character, move, capturedCharacters);
            switchPlayer();
            updateBoard();
            checkWinner();
        } else {
            alert('Invalid move!');
        }
    };

    const isValidMove = (newRow, newCol, player) => {
        return newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize && !Object.values(characters).some(char => char.row === newRow && char.col === newCol && char.player === player);
    };

    const handleCombat = (character, startRow, startCol, deltaRow, deltaCol) => {
        let capturedCharacters = [];
        let row = startRow + Math.sign(deltaRow);
        let col = startCol + Math.sign(deltaCol);

        while (row !== startRow + deltaRow || col !== startCol + deltaCol) {
            const opponent = Object.keys(characters).find(key => 
                characters[key].row === row && characters[key].col === col && characters[key].player !== currentPlayer
            );

            if (opponent) {
                capturedCharacters.push(opponent);
                delete characters[opponent];
            }

            row += Math.sign(deltaRow);
            col += Math.sign(deltaCol);
        }

        const finalRow = startRow + deltaRow;
        const finalCol = startCol + deltaCol;

        const finalOpponent = Object.keys(characters).find(key => 
            characters[key].row === finalRow && characters[key].col === finalCol && characters[key].player !== currentPlayer
        );

        if (finalOpponent) {
            capturedCharacters.push(finalOpponent);
            delete characters[finalOpponent];
        }

        return capturedCharacters;
    };

    const switchPlayer = () => {
        currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
        selectedCharacter = null;
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight', 'highlight-enemy'));
    };

    const addMoveToHistory = (character, move, capturedCharacters) => {
        if (gameEnded) return;

        const listItem = document.createElement('li');
        let moveText = `${character}: ${move}`;
        if (capturedCharacters.length > 0) {
            moveText += ` <span style="color: red;">(Captured ${capturedCharacters.join(', ')})</span>`;
        }
        listItem.innerHTML = moveText;
        moveHistory.push(listItem.innerHTML);
        historyList.appendChild(listItem);
    };

    const checkWinner = () => {
        const playerACharacters = Object.values(characters).filter(char => char.player === 'A');
        const playerBCharacters = Object.values(characters).filter(char => char.player === 'B');
        
        if (playerBCharacters.length === 0) {
            announceWinner('Player A');
        } else if (playerACharacters.length === 0) {
            announceWinner('Player B');
        }
    };

    const announceWinner = (winner) => {
        gameStarted = false;
        gameEnded = true;
        winnerAnnouncement.textContent = `${winner} wins!`;
        winnerAnnouncement.style.display = 'inline-block';
        currentPlayerElement.style.display = 'none';
        restartGameButton.style.display = 'inline-block';
        buttons.innerHTML = ''; // Clear move buttons
        selectedElement.textContent = 'Selected: None'; // Reset selected character display
        winnerAnnouncement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const restartGame = () => {
        // Reset game state
        currentPlayer = 'A';
        selectedCharacter = null;
        Object.keys(characters).forEach(key => delete characters[key]);
        moveHistory.length = 0;
        gameStarted = false;
        gameEnded = false;
        placedCharacters = { A: 0, B: 0 };

        // Clear the board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('player-a', 'player-b', 'selected', 'highlight', 'highlight-enemy');
        });

        // Reset UI elements
        currentPlayerElement.textContent = `Player A, place your A-P1`;
        currentPlayerElement.style.display = 'block';
        selectedElement.style.display = 'none';
        historyContainer.style.display = 'none';
        buttons.style.display = 'none';
        winnerAnnouncement.style.display = 'none';
        restartGameButton.style.display = 'none';
        startGameButton.style.display = 'none';

        // Clear history list
        historyList.innerHTML = '';

        // Show movement guide
        const movementGuide = document.getElementById('movement-guide');
        if (movementGuide) {
            movementGuide.style.display = 'block';
        }

        updateBoard();
    };

    startGameButton.addEventListener('click', () => {
        gameStarted = true;
        startGameButton.style.display = 'none';
        currentPlayer = 'A';
        currentPlayerElement.textContent = 'Current Player: A';
        currentPlayerElement.style.display = 'block';
        
        selectedElement.style.display = 'block';
        historyContainer.style.display = 'block';
        buttons.style.display = 'block';
        
        // Hide the movement guide when the game starts
        const movementGuide = document.getElementById('movement-guide');
        if (movementGuide) {
            movementGuide.style.display = 'none';
        }
        
        updateBoard();
    });

    restartGameButton.addEventListener('click', restartGame);

    initializeGame();

    // Reposition the Selected element below the grid
    board.after(selectedElement);

    // Add CSS for highlighting selected character
    const style = document.createElement('style');
    style.textContent = `
        .cell.selected {
            border: 2px solid yellow;
        }
        .cell.highlight {
            background-color: rgba(0, 255, 0, 0.3);
        }
        .cell.highlight-enemy {
            background-color: rgba(255, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);
});