const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 40;
const BOARD_SIZE = 15;

let currentPlayer = 1; // 1: 黑棋, 2: 白棋
let gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
let gameOver = false;
let isAIMode = false;
let isAITurn = false;

// 添加历史记录数组
let moveHistory = [];

// 添加悔棋次数限制
let undoCountP1 = 1; // 玩家1（黑棋）的悔棋次数
let undoCountP2 = 1; // 玩家2（白棋）的悔棋次数
let undoCountPvE = 2; // 人机模式下玩家的悔棋次数

// 添加确认提示函数
function showConfirm(message) {
    return window.confirm(message);
}

// 显示游戏模式选择
function showGameMode() {
    document.getElementById('gameMode').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
}

// 开始游戏
function startGame(mode) {
    document.getElementById('gameMode').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    isAIMode = (mode === 'pve');
    moveHistory = []; // 清空历史记录
    
    // 重置悔棋次数
    if (isAIMode) {
        undoCountPvE = 2;
    } else {
        undoCountP1 = 1;
        undoCountP2 = 1;
    }
    
    restartGame();
}

// 返回菜单
function backToMenu() {
    showGameMode();
}

// AI下棋逻辑
function aiMove() {
    if (gameOver) return;
    
    // 简单的AI策略：评分每个位置，选择最高分的位置
    let bestScore = -1;
    let bestMove = null;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (gameBoard[i][j] === 0) {
                let score = evaluatePosition(i, j);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {row: i, col: j};
                }
            }
        }
    }
    
    if (bestMove) {
        setTimeout(() => {
            makeMove(bestMove.row, bestMove.col);
            isAITurn = false;
        }, 500);
    }
}

// 评估位置分数
function evaluatePosition(row, col) {
    let score = 0;
    const directions = [
        [[0,1], [0,-1]], // 水平
        [[1,0], [-1,0]], // 垂直
        [[1,1], [-1,-1]], // 对角线
        [[1,-1], [-1,1]] // 反对角线
    ];
    
    // 检查每个方向
    for (let direction of directions) {
        let count = {1: 0, 2: 0}; // 统计双方棋子数
        let empty = 0; // 统计空位
        
        // 检查两个方向
        for (let [dx, dy] of direction) {
            for (let step = 1; step <= 4; step++) {
                let r = row + dx * step;
                let c = col + dy * step;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                    if (gameBoard[r][c] === 0) empty++;
                    else count[gameBoard[r][c]]++;
                }
            }
        }
        
        // 评分规则
        if (count[1] === 4) score += 10000; // 防守：对方快赢了
        if (count[2] === 4) score += 15000; // 进攻：自己快赢了
        if (count[1] === 3 && empty >= 2) score += 1000;
        if (count[2] === 3 && empty >= 2) score += 2000;
        if (count[1] === 2 && empty >= 3) score += 100;
        if (count[2] === 2 && empty >= 3) score += 200;
    }
    
    // 优先考虑中心位置
    score += (BOARD_SIZE/2 - Math.abs(row - BOARD_SIZE/2)) * 2;
    score += (BOARD_SIZE/2 - Math.abs(col - BOARD_SIZE/2)) * 2;
    
    return score;
}

// 下棋
function makeMove(row, col) {
    if (gameBoard[row][col] === 0) {
        // 记录这步棋
        moveHistory.push({
            row: row,
            col: col,
            player: currentPlayer
        });
        
        gameBoard[row][col] = currentPlayer;
        drawPiece(row, col, currentPlayer);
        
        if (checkWin(row, col)) {
            alert((currentPlayer === 1 ? '黑棋' : '白棋') + '获胜！');
            gameOver = true;
            return;
        }
        
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateUndoButtonStatus(); // 更新悔棋按钮状态
        
        if (isAIMode && !gameOver && currentPlayer === 2) {
            isAITurn = true;
            aiMove();
        }
    }
}

// 处理点击事件
canvas.addEventListener('click', function(e) {
    if (gameOver || isAITurn) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - GRID_SIZE) / GRID_SIZE);
    const row = Math.round((y - GRID_SIZE) / GRID_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameBoard[row][col] === 0) {
        makeMove(row, col);
    }
});

// 绘制棋盘
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制木纹背景
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    
    // 画横线
    for(let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(GRID_SIZE, GRID_SIZE + i * GRID_SIZE);
        ctx.lineTo(GRID_SIZE * BOARD_SIZE, GRID_SIZE + i * GRID_SIZE);
        ctx.stroke();
    }
    
    // 画竖线
    for(let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(GRID_SIZE + i * GRID_SIZE, GRID_SIZE);
        ctx.lineTo(GRID_SIZE + i * GRID_SIZE, GRID_SIZE * BOARD_SIZE);
        ctx.stroke();
    }
    
    // 绘制天元和星位
    const stars = [
        {x: 4, y: 4}, {x: 12, y: 4}, 
        {x: 8, y: 8}, 
        {x: 4, y: 12}, {x: 12, y: 12}
    ];
    
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(GRID_SIZE + star.x * GRID_SIZE, 
                GRID_SIZE + star.y * GRID_SIZE, 
                4, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
    });
}

// 画棋子
function drawPiece(row, col, player) {
    const x = GRID_SIZE + col * GRID_SIZE;
    const y = GRID_SIZE + row * GRID_SIZE;
    
    // 绘制阴影
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    
    // 绘制棋子
    ctx.beginPath();
    ctx.arc(x, y, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    
    // 创建渐变
    const gradient = ctx.createRadialGradient(
        x - GRID_SIZE/6, y - GRID_SIZE/6, 0,
        x, y, GRID_SIZE/2 - 2
    );
    
    if(player === 1) { // 黑棋
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#000');
    } else { // 白棋
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ddd');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 棋子边缘
    ctx.strokeStyle = player === 1 ? '#000' : '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 检查是否获胜
function checkWin(row, col) {
    const directions = [
        [[0,1], [0,-1]], // 水平
        [[1,0], [-1,0]], // 垂直
        [[1,1], [-1,-1]], // 对角线
        [[1,-1], [-1,1]] // 反对角线
    ];
    
    for(let direction of directions) {
        let count = 1;
        for(let [dx, dy] of direction) {
            let r = row + dx;
            let c = col + dy;
            while(r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE 
                  && gameBoard[r][c] === currentPlayer) {
                count++;
                r += dx;
                c += dy;
            }
        }
        if(count >= 5) return true;
    }
    return false;
}

// 重新开始游戏
function restartGame() {
    gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    moveHistory = []; // 清空历史记录
    currentPlayer = 1;
    gameOver = false;
    isAITurn = false;
    drawBoard();
}

// 获取当前可用的悔棋次数
function getAvailableUndoCount() {
    if (isAIMode) {
        return undoCountPvE;
    } else {
        return currentPlayer === 1 ? undoCountP1 : undoCountP2;
    }
}

// 更新悔棋函数
function undoMove() {
    if (gameOver || moveHistory.length === 0) return;
    
    let availableUndos = getAvailableUndoCount();
    if (availableUndos <= 0) {
        alert('您的悔棋次数已用完！');
        return;
    }

    let confirmMessage = isAIMode ? 
        `您还有 ${availableUndos} 次悔棋机会，确定要悔棋吗？` :
        `${currentPlayer === 1 ? '黑棋' : '白棋'}还有 ${availableUndos} 次悔棋机会，确定要悔棋吗？`;

    if (!showConfirm(confirmMessage)) {
        return;
    }

    if (isAIMode) {
        // 人机模式下悔棋
        if (moveHistory.length >= 2) {
            // 撤销AI的棋
            let aiMove = moveHistory.pop();
            gameBoard[aiMove.row][aiMove.col] = 0;
            
            // 撤销玩家的棋
            let playerMove = moveHistory.pop();
            gameBoard[playerMove.row][playerMove.col] = 0;
            
            currentPlayer = 1;
            undoCountPvE--;
        }
    } else {
        // 双人模式下悔棋
        let lastMove = moveHistory.pop();
        gameBoard[lastMove.row][lastMove.col] = 0;
        currentPlayer = lastMove.player;
        
        // 扣除相应玩家的悔棋次数
        if (lastMove.player === 1) {
            undoCountP1--;
        } else {
            undoCountP2--;
        }
    }
    
    isAITurn = false;
    
    // 重绘棋盘
    drawBoard();
    moveHistory.forEach(move => {
        drawPiece(move.row, move.col, move.player);
    });
    
    // 显示剩余悔棋次数
    updateUndoButtonStatus();
}

// 更新悔棋按钮状态和文字
function updateUndoButtonStatus() {
    const undoButton = document.querySelector('.undo-button');
    let availableUndos = getAvailableUndoCount();
    
    if (isAIMode) {
        undoButton.textContent = `悔棋(剩余${undoCountPvE}次)`;
    } else {
        undoButton.textContent = `悔棋(${currentPlayer === 1 ? '黑棋' : '白棋'}剩余${availableUndos}次)`;
    }
    
    // 当没有悔棋次数时禁用按钮
    undoButton.disabled = availableUndos <= 0;
}

// 初始化
showGameMode();
drawBoard();