// UI variables
let highScore = localStorage.getItem('tankGameHighScore') || 0;

function setupMinimap() {
    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 150;
    
    window.updateMinimap = function() {
        minimapCtx.clearRect(0, 0, 200, 150);
        
        // Draw background with grid
        minimapCtx.fillStyle = '#228B22';
        minimapCtx.fillRect(0, 0, 200, 150);
        
        // Draw grid lines
        minimapCtx.strokeStyle = '#1a6b1a';
        minimapCtx.lineWidth = 1;
        for (let i = 0; i < 200; i += 20) {
            minimapCtx.beginPath();
            minimapCtx.moveTo(i, 0);
            minimapCtx.lineTo(i, 150);
            minimapCtx.stroke();
        }
        for (let i = 0; i < 150; i += 20) {
            minimapCtx.beginPath();
            minimapCtx.moveTo(0, i);
            minimapCtx.lineTo(200, i);
            minimapCtx.stroke();
        }
        
        // Draw path with checkpoints
        const pathPoints = [
            { x: -36, z: 50 },  // Start point
            { x: -20, z: 50 },  // First checkpoint
            { x: 0, z: 50 },    // Second checkpoint
            { x: 0, z: 0 },     // Third checkpoint
            { x: 0, z: -50 },   // Fourth checkpoint
            { x: 0, z: -100 },  // Fifth checkpoint
            { x: 0, z: -130 }   // End point (gate)
        ];
        
        // Draw path lines
        minimapCtx.strokeStyle = '#ff8800';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        pathPoints.forEach((point, index) => {
            const x = (point.x + 50) * 2;
            const y = (point.z + 100) * 150 / 200;
            if (index === 0) {
                minimapCtx.moveTo(x, y);
            } else {
                minimapCtx.lineTo(x, y);
            }
        });
        minimapCtx.stroke();
        
        // Draw checkpoints
        pathPoints.forEach((point, index) => {
            const x = (point.x + 50) * 2;
            const y = (point.z + 100) * 150 / 200;
            
            // Draw checkpoint circle
            minimapCtx.fillStyle = index === 0 ? '#00ff00' : // Start point (green)
                                  index === pathPoints.length - 1 ? '#ff0000' : // End point (red)
                                  '#ff8800'; // Checkpoints (orange)
            minimapCtx.beginPath();
            minimapCtx.arc(x, y, 4, 0, Math.PI * 2);
            minimapCtx.fill();
            
            // Add checkpoint numbers or X mark for goal
            minimapCtx.fillStyle = '#ffffff';
            minimapCtx.font = 'bold 12px Arial';
            minimapCtx.textAlign = 'center';
            if (index === pathPoints.length - 1) {
                // Draw X mark for goal
                minimapCtx.fillStyle = '#ff0000';
                minimapCtx.font = 'bold 16px Arial';
                minimapCtx.fillText('X', x, y + 5);
            } else {
                minimapCtx.fillText((index + 1).toString(), x, y + 15);
            }
        });
        
        // Draw target gate
        minimapCtx.fillStyle = '#ff0000';
        const gateX = (targetGate.position.x + 50) * 2;
        const gateY = (targetGate.position.z + 100) * 150 / 200;
        minimapCtx.fillRect(gateX - 4, gateY - 4, 8, 8);
        
        // Draw tank with direction indicator
        const tankX = (tank.position.x + 50) * 2;
        const tankY = (tank.position.z + 100) * 150 / 200;
        
        // Draw tank body
        minimapCtx.fillStyle = '#0000ff';
        minimapCtx.beginPath();
        minimapCtx.arc(tankX, tankY, 3, 0, Math.PI * 2);
        minimapCtx.fill();
        
        // Draw tank direction
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.moveTo(tankX, tankY);
        minimapCtx.lineTo(
            tankX + Math.sin(tank.rotation.y) * 6,
            tankY + Math.cos(tank.rotation.y) * 6
        );
        minimapCtx.stroke();
        
        // Draw soldiers
        if (gameState.soldiers) {
            gameState.soldiers.forEach(soldier => {
                const soldierX = (soldier.position.x + 50) * 2;
                const soldierY = (soldier.position.z + 100) * 150 / 200;
                minimapCtx.fillStyle = '#ff0000'; // Red for US soldiers
                minimapCtx.beginPath();
                minimapCtx.arc(soldierX, soldierY, 2, 0, Math.PI * 2);
                minimapCtx.fill();
            });
        }
        
        // Draw Vietnamese soldiers
        if (gameState.vietnameseSoldiers) {
            gameState.vietnameseSoldiers.forEach(soldier => {
                const soldierX = (soldier.position.x + 50) * 2;
                const soldierY = (soldier.position.z + 100) * 150 / 200;
                minimapCtx.fillStyle = '#00ff00'; // Green for Vietnamese soldiers
                minimapCtx.beginPath();
                minimapCtx.arc(soldierX, soldierY, 2, 0, Math.PI * 2);
                minimapCtx.fill();
            });
        }
    };
}

function updateUI() {
    gameState.health = Math.max(0, Math.min(gameState.maxHealth, gameState.health));
    
    // Update health bar with gradient
    const healthPercent = (gameState.health / gameState.maxHealth) * 100;
    const healthBar = document.getElementById('healthBar');
    healthBar.style.width = healthPercent + '%';
    
    // Update health bar color based on health percentage
    if (healthPercent > 60) {
        healthBar.style.backgroundColor = '#00ff00'; // Green
    } else if (healthPercent > 30) {
        healthBar.style.backgroundColor = '#ffff00'; // Yellow
    } else {
        healthBar.style.backgroundColor = '#ff0000'; // Red
    }
    
    document.getElementById('health').textContent = Math.floor(healthPercent);
    
    // Update score with animation
    const scoreElement = document.getElementById('score');
    const currentScore = parseInt(scoreElement.textContent);
    if (currentScore !== gameState.score) {
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    }
    scoreElement.textContent = gameState.score;
    
    // Update distance with arrow indicator
    const distance = calculateDistance();
    const distanceElement = document.getElementById('distance');
    distanceElement.textContent = Math.floor(distance) + 'm';
    
    // Update tank coordinates with better formatting
    if (tank) {
        document.getElementById('tankX').textContent = `X: ${Math.floor(tank.position.x)}`;
        document.getElementById('tankY').textContent = `Y: ${Math.floor(tank.position.y)}`;
        document.getElementById('tankZ').textContent = `Z: ${Math.floor(tank.position.z)}`;
    }
    
    // Update minimap
    if (window.updateMinimap) {
        window.updateMinimap();
    }
}

function endGame(won) {
    gameState.gameRunning = false;
    const gameOverDiv = document.getElementById('gameOver');
    const resultTitle = document.getElementById('gameResult');
    const resultMessage = document.getElementById('gameMessage');
    
    // Update high score
    if (gameState.score > highScore) {
        highScore = gameState.score;
        localStorage.setItem('tankGameHighScore', highScore);
    }
    
    if (won) {
        resultTitle.textContent = '🎉 CHIẾN THẮNG VĨ ĐẠI! 🎉';
        resultTitle.style.color = '#00ff00';
        resultMessage.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 20px; color: #00ff00;">
                🇻🇳 Chúc mừng! Bạn đã tông vào cổng Dinh Độc Lập thành công! 🇻🇳
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">⭐ Điểm số:</span> <strong>${gameState.score}</strong>
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">⏱️ Thời gian:</span> <strong>${Math.floor((Date.now() - gameState.startTime) / 1000)}s</strong>
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">🏆 Kỷ lục:</span> <strong>${highScore}</strong>
            </div>
        `;
        
        // Victory celebration particles
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                createExplosionParticle(new THREE.Vector3(
                    tank.position.x + (Math.random() - 0.5) * 10,
                    tank.position.y + Math.random() * 5,
                    tank.position.z + (Math.random() - 0.5) * 10
                ));
            }, i * 100);
        }
    } else {
        resultTitle.textContent = '💥 NHIỆM VỤ THẤT BẠI! 💥';
        resultTitle.style.color = '#ff0000';
        resultMessage.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 20px; color: #ff0000;">
                Xe tăng đã bị phá hủy! Hãy thử lại nhiệm vụ.
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">⭐ Điểm số:</span> <strong>${gameState.score}</strong>
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">⏱️ Thời gian sống sót:</span> <strong>${Math.floor((Date.now() - gameState.startTime) / 1000)}s</strong>
            </div>
            <div style="font-size: 16px; margin: 10px 0;">
                <span style="color: #ffd700;">🏆 Kỷ lục:</span> <strong>${highScore}</strong>
            </div>
        `;
    }
    
    gameOverDiv.style.display = 'block';
    gameOverDiv.style.animation = 'fadeIn 0.5s ease-in-out';
}

function calculateDistance() {
    // Calculate distance from tank body to gate (not from the front)
    const tankBodyX = tank.position.x - Math.sin(tank.rotation.y) * 2; // Move back 2 units from front
    const tankBodyZ = tank.position.z - Math.cos(tank.rotation.y) * 2; // Move back 2 units from front
    
    const distance = Math.sqrt(
        Math.pow(tankBodyX - targetGate.position.x, 2) +
        Math.pow(tankBodyZ - targetGate.position.z, 2)
    );
    return Math.max(0, Math.floor(distance));
} 