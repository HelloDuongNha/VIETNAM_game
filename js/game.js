// Game variables
let gameState = {
    health: 100,
    maxHealth: 100,
    score: 0,
    speed: 0,
    gameRunning: false,
    startTime: 0,
    lastSoldierSpawn: 0,
    lastVietnameseSoldierSpawn: 0,
    soldierSpawnInterval: 1000, // Time between soldier spawns in milliseconds
    vietnameseSoldierSpawnInterval: 1000, // Time between Vietnamese soldier spawns
    vietnameseSoldierKills: 0 // Track kills for each Vietnamese soldier
};

// Controls
const keys = {
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false,
    space: false
};

// Add joystick instance
let joystick;

// Sound variables
let backgroundMusic, loseSound, victorySound, movingSound;
let isMoving = false;
let audioContext;
let soundsLoaded = false;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context initialized');
    } catch (error) {
        console.error('Error initializing audio context:', error);
    }
}

// Load and play sound
function loadAndPlaySound(url, loop = false, volume = 1.0) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = audioContext.createBufferSource();
                const gainNode = audioContext.createGain();
                
                source.buffer = audioBuffer;
                source.loop = loop;
                gainNode.gain.value = volume;
                
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                source.start(0);
                console.log('Sound loaded and playing:', url);
                
                resolve(source);
            })
            .catch(error => {
                console.error('Error loading sound:', url, error);
                reject(error);
            });
    });
}

// Load all sounds
async function loadSounds() {
    try {
        // Background music
        backgroundMusic = await loadAndPlaySound('asset/sounds/background.ogg', true, 0.3);
        
        // Lose sound
        loseSound = await loadAndPlaySound('asset/sounds/Lose.ogg', false, 0.5);
        loseSound.stop();
        
        // Victory sound
        victorySound = await loadAndPlaySound('asset/sounds/Victory.ogg', false, 0.5);
        victorySound.stop();
        
        // Moving sound
        movingSound = await loadAndPlaySound('asset/sounds/moving.ogg', true, 0.2);
        movingSound.stop();
        
        soundsLoaded = true;
        console.log('All sounds loaded successfully');
    } catch (error) {
        console.error('Error loading sounds:', error);
    }
}

// Play background music
function playBackgroundMusic() {
    if (backgroundMusic && !backgroundMusic.isPlaying) {
        try {
            backgroundMusic.start(0);
            console.log('Background music started playing');
        } catch (error) {
            console.error('Error playing background music:', error);
        }
    }
}

// Play lose sound
function playLoseSound() {
    if (loseSound) {
        try {
            if (backgroundMusic) {
                backgroundMusic.stop();
            }
            loseSound.start(0);
            console.log('Lose sound played');
        } catch (error) {
            console.error('Error playing lose sound:', error);
        }
    }
}

// Play victory sound
function playVictorySound() {
    if (victorySound) {
        try {
            if (backgroundMusic) {
                backgroundMusic.stop();
            }
            victorySound.start(0);
            console.log('Victory sound played');
        } catch (error) {
            console.error('Error playing victory sound:', error);
        }
    }
}

// Play moving sound
function playMovingSound() {
    if (movingSound && !movingSound.isPlaying) {
        try {
            movingSound.start(0);
            console.log('Moving sound started playing');
        } catch (error) {
            console.error('Error playing moving sound:', error);
        }
    }
}

// Stop moving sound
function stopMovingSound() {
    if (movingSound && movingSound.isPlaying) {
        try {
            movingSound.stop();
            console.log('Moving sound stopped');
        } catch (error) {
            console.error('Error stopping moving sound:', error);
        }
    }
}

// Initialize the game
function init() {
    // Hide loading screen after a delay
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
        startGame();
    }, 2000);
    
    // Create scene with enhanced atmosphere
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
    
    // Create camera with better positioning
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 15);
    camera.lookAt(0, 0, 0);
    camera.rotation.y = Math.PI;
    
    // Create renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB, 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    document.getElementById('gameContainer').appendChild(renderer.domElement);
    
    // Enhanced lighting system
    createLighting();
    
    // Create environment
    createTerrain();
    
    // Create game objects
    createEnhancedTank();
    
    // Create flag
    // createFlag();
    
    // Initialize particle systems
    initParticles();
    
    // Setup controls
    setupControls();
    
    // Create minimap
    setupMinimap();
    
    // Create crosshair
    const crosshairGeometry = new THREE.RingGeometry(0.02, 0.03, 32);
    const crosshairMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
    crosshair.position.z = -0.5;
    camera.add(crosshair);
    
    // Add crosshair lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    
    // Vertical line
    const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.05, 0),
        new THREE.Vector3(0, -0.05, 0)
    ]);
    const verticalLine = new THREE.Line(verticalGeometry, lineMaterial);
    verticalLine.position.z = -0.5;
    camera.add(verticalLine);
    
    // Horizontal line
    const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.05, 0, 0),
        new THREE.Vector3(0.05, 0, 0)
    ]);
    const horizontalLine = new THREE.Line(horizontalGeometry, lineMaterial);
    horizontalLine.position.z = -0.5;
    camera.add(horizontalLine);
    
    // Add event listener for shooting
    document.addEventListener('keydown', (event) => {
        console.log('Key pressed:', event.code); // Debug log
        if (event.code === 'ControlLeft' && gameState.gameRunning) {
            console.log('Shooting...'); // Debug log
            shootTank();
        }
    });
    
    // Initialize joystick
    joystick = new Joystick();
    
    // Start game loop
    animate();
    
    initAudio();
    loadSounds();
    
    // Add click event listener to start audio context
    document.addEventListener('click', function startAudio() {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.removeEventListener('click', startAudio);
    }, { once: true });
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) {
            keys[key] = true;
            e.preventDefault();
        }
        if (key === 'arrowup') keys.up = true;
        if (key === 'arrowdown') keys.down = true;
        if (key === 'arrowleft') keys.left = true;
        if (key === 'arrowright') keys.right = true;
        if (key === ' ') keys.space = true;
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) {
            keys[key] = false;
        }
        if (key === 'arrowup') keys.up = false;
        if (key === 'arrowdown') keys.down = false;
        if (key === 'arrowleft') keys.left = false;
        if (key === 'arrowright') keys.right = false;
        if (key === ' ') keys.space = false;
    });
    
    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        hideGameOver();
        location.reload();
    });
}

function startGame() {
    gameState.gameRunning = true;
    gameState.startTime = Date.now();
    document.getElementById('highScore').textContent = highScore;
}

function handleInput() {
    if (!gameState.gameRunning) return;
    
    const moveSpeed = 0.2;
    const rotateSpeed = 0.08;
    let isMoving = false;
    let currentSpeed = 0;
    
    // Get joystick values
    const joystickValues = joystick.getValues();
    
    // Handle braking
    if (keys.space) {
        gameState.speed *= 0.95;
    }
    
    // Use joystick for movement if it's being used
    if (Math.abs(joystickValues.y) > 0.1) {
        gameState.speed = Math.min(moveSpeed, gameState.speed - joystickValues.y * 0.01);
        currentSpeed = Math.abs(gameState.speed);
        isMoving = true;
    } else if (keys.w || keys.up) {
        gameState.speed = Math.min(moveSpeed, gameState.speed + 0.01);
        currentSpeed = gameState.speed;
        isMoving = true;
    }
    if (keys.s || keys.down) {
        gameState.speed = Math.max(-moveSpeed * 0.6, gameState.speed - 0.01);
        currentSpeed = Math.abs(gameState.speed);
        isMoving = true;
    }
    
    // Use joystick for rotation if it's being used
    if (Math.abs(joystickValues.x) > 0.1) {
        // Đảo ngược giá trị x để kéo trái là rẽ trái, kéo phải là rẽ phải
        tank.rotation.y -= rotateSpeed * joystickValues.x * 0.25;
    } else {
        // Handle keyboard rotation
        const steerMultiplier = Math.max(0.3, Math.abs(gameState.speed) * 5);
        if (keys.a || keys.left) {
            tank.rotation.y += rotateSpeed * steerMultiplier;
        }
        if (keys.d || keys.right) {
            tank.rotation.y -= rotateSpeed * steerMultiplier;
        }
    }
    
    // Calculate next position (reversed direction)
    const nextX = tank.position.x + Math.sin(tank.rotation.y) * gameState.speed;
    const nextZ = tank.position.z + Math.cos(tank.rotation.y) * gameState.speed;
    
    // Try to move
    const oldX = tank.position.x;
    const oldZ = tank.position.z;
    let canMove = true;
    
    // Check X-axis boundaries first
    if (nextX >= -45 && nextX <= 40) {
        // Check Z-axis boundaries based on X position
        if (nextX >= -45 && nextX <= 40) {
            // Special case for X between -15 and 8
            if (nextX >= -20 && nextX <= 12) {
                if (nextZ >= -140 && nextZ <= 58) {
                    tank.position.z = nextZ;
                } else {
                    canMove = false;
                }
            } else {
                // Normal Z limits for this X range
                if (nextZ >= 50 && nextZ <= 58) {
                    tank.position.z = nextZ;
                } else {
                    canMove = false;
                }
            }
        } else {
            // Normal Z limits for other X ranges
            if (nextZ >= -136 && nextZ <= 65) {
                tank.position.z = nextZ;
            } else {
                canMove = false;
            }
        }
        
        // Check special X limits when Z is in range
        if (nextZ >= -120 && nextZ <= 40) {
            if (nextX >= -14 && nextX <= 12) {
                tank.position.x = nextX;
            } else {
                canMove = false;
            }
        } else {
            tank.position.x = nextX;
        }
    } else {
        canMove = false;
    }
    
    // If cannot move, stop the tank and check for damage
    if (!canMove) {
        // Calculate speed in km/h (currentSpeed * 500 is the speed display value)
        const speedKmh = Math.abs(currentSpeed * 500);
        
        // If speed is 100 km/h or higher, reduce health
        if (speedKmh >= 100) {
            gameState.health -= 10;
            
            // Create impact effects
            const impactPos = tank.position.clone();
            createExplosionParticle(impactPos);
            for (let i = 0; i < 8; i++) {
                createDustParticle(impactPos, 0xff4444);
            }
            
            // Check if tank is destroyed
            if (gameState.health <= 0) {
                endGame(false);
            }
        }
        
        gameState.speed = 0;
        tank.position.x = oldX;
        tank.position.z = oldZ;
    } else {
        // Check for road obstacle
        if ((nextX >= -6 && nextX <= -0) && (nextZ >= -50 && nextZ <= -30)) {
            // If collision detected, stop completely and check for damage
            const speedKmh = Math.abs(currentSpeed * 500);
            if (speedKmh >= 100) {
                gameState.health -= 10;
                
                // Create impact effects
                const impactPos = tank.position.clone();
                createExplosionParticle(impactPos);
                for (let i = 0; i < 8; i++) {
                    createDustParticle(impactPos, 0xff4444);
                }
                
                // Check if tank is destroyed
                if (gameState.health <= 0) {
                    endGame(false);
                }
            }
            
            gameState.speed = 0;
            tank.position.x = oldX;
            tank.position.z = oldZ;
        } else {
            // If no collision, allow movement
            if (tank.userData.wheels) {
                tank.userData.wheels.forEach(wheel => {
                    wheel.rotation.x += gameState.speed * 2;
                });
            }
            
            // Add points for movement
            if (gameState.speed > 0) {
                gameState.score += Math.floor(gameState.speed * 10);
            }
        }
    }
    
    // Apply friction
    gameState.speed *= 0.98;
    
    // Create dust particles when moving
    if (isMoving && Math.random() < 0.4) {
        const dustPos = tank.position.clone();
        dustPos.y = 0.2;
        dustPos.x += (Math.random() - 0.5) * 3;
        dustPos.z += (Math.random() - 0.5) * 3;
        createDustParticle(dustPos);
    }
    
    // Enhanced camera follow with smoother movement
    const cameraDistance = 15;
    const cameraHeight = 10;
    const targetCameraPos = new THREE.Vector3(
        tank.position.x - Math.sin(tank.rotation.y) * cameraDistance,
        cameraHeight,
        tank.position.z - Math.cos(tank.rotation.y) * cameraDistance
    );
    
    camera.position.lerp(targetCameraPos, 0.08);
    
    // Look ahead of tank
    const lookAheadPos = new THREE.Vector3(
        tank.position.x + Math.sin(tank.rotation.y) * 5,
        tank.position.y,
        tank.position.z + Math.cos(tank.rotation.y) * 5
    );
    camera.lookAt(lookAheadPos);
    
    // Update speed display
    document.getElementById('speed').textContent = Math.floor(currentSpeed * 500);
}

// Add building collision detection
function checkBuildingCollision(nextX, nextZ) {
    if (!vietnamMap) return false;
    
    // Create a collision box for the tank
    const tankBox = new THREE.Box3().setFromObject(tank);
    // Make the collision box slightly larger than the tank
    tankBox.expandByScalar(0.2);
    // Only check ground level collision
    tankBox.min.y = 0;
    tankBox.max.y = 1.5;
    
    // Check collision with main buildings only
    let collision = false;
    vietnamMap.traverse(function(node) {
        if (node.isMesh) {
            // Only check collision with main buildings
            if (node.name.toLowerCase().includes('main') || 
                node.name.toLowerCase().includes('building') ||
                node.name.toLowerCase().includes('wall')) {
                const meshBox = new THREE.Box3().setFromObject(node);
                if (tankBox.intersectsBox(meshBox)) {
                    collision = true;
                }
            }
        }
    });
    
    return collision;
}

function checkCollisions() {
    if (!gameState.gameRunning) return;
    
    const tankBox = new THREE.Box3().setFromObject(tank);
    
    // Check collision with obstacles
    obstacles.forEach((obstacle, index) => {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (tankBox.intersectsBox(obstacleBox)) {
            const damage = 5 + Math.floor(Math.abs(gameState.speed) * 100);
            gameState.health -= damage;
            
            // Push tank away from obstacle
            const direction = new THREE.Vector3()
                .subVectors(tank.position, obstacle.position)
                .normalize();
            tank.position.add(direction.multiplyScalar(1.2));
            
            // Create impact effects
            createExplosionParticle(obstacle.position);
            for (let i = 0; i < 8; i++) {
                createDustParticle(obstacle.position, 0xff4444);
            }
            
            // Stop tank
            gameState.speed *= 0.5;
            
            if (gameState.health <= 0) {
                endGame(false);
            }
        }
    });
    
    // Check victory condition
    if (Math.abs(tank.position.z - (-135)) < 1 && tank.position.x >= -12 && tank.position.x <= 12) {
        endGame(true);
    }
    
    // Check if tank falls off the world
    if (tank.position.y < -10) {
        gameState.health = 0;
        endGame(false);
    }
}

function updateAnimations() {
    const time = Date.now() * 0.001;
    
    // Animate road markers
    roadMarkers.forEach((marker, index) => {
        marker.userData.blinkTimer += 0.1;
        const intensity = (Math.sin(marker.userData.blinkTimer) + 1) * 0.5;
        marker.userData.sign.material.emissive.copy(marker.userData.originalColor);
        marker.userData.sign.material.emissive.multiplyScalar(intensity * 0.4);
    });
    
    // Animate obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.rotation.y += obstacle.userData.rotationSpeed;
        const intensity = (Math.sin(time * 3 + index) + 1) * 0.5;
        obstacle.userData.light.material.emissive.setRGB(
            0.6 * intensity,
            0,
            0
        );
        
        // Bob up and down slightly
        obstacle.position.y += Math.sin(time * 2 + index) * 0.005;
    });
    
    // Animate target gate elements
    if (targetGate) {
        targetGate.children.forEach((child, index) => {
            if (child.material && child.material.emissive) {
                const intensity = (Math.sin(time * 2 + index * 0.5) + 1) * 0.5;
                child.material.emissive.multiplyScalar(intensity * 0.3);
            }
        });
    }
}

function createSoldier() {
    const soldier = new THREE.Group();
    
    // Create soldier body (tiger stripe pattern)
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4B5320, // Olive drab base color
        map: createTigerStripeTexture()
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    soldier.add(body);

    // Create soldier head (unchanged)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9;
    soldier.add(head);
    
    // Create helmet (Dark Green)
    const helmetGeometry = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 2.05;
    helmet.rotation.x = Math.PI;
    soldier.add(helmet);

    // Create soldier arms (tiger stripe pattern)
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4B5320,
        map: createTigerStripeTexture()
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35, 1.3, 0);
    soldier.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35, 1.3, 0);
    soldier.add(rightArm);

    // Create soldier legs (tiger stripe pattern)
    const legGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const legMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4B5320,
        map: createTigerStripeTexture()
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, 0.45, 0);
    soldier.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, 0.45, 0);
    soldier.add(rightLeg);
    
    // Create gun
    const gunGroup = new THREE.Group();
    
    // Gun body
    const gunBodyGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
    const gunBodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const gunBody = new THREE.Mesh(gunBodyGeometry, gunBodyMaterial);
    gunBody.position.set(0, 0, 0.25);
    gunGroup.add(gunBody);
    
    // Gun handle
    const gunHandleGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
    const gunHandleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const gunHandle = new THREE.Mesh(gunHandleGeometry, gunHandleMaterial);
    gunHandle.position.set(0, -0.05, 0.2);
    gunGroup.add(gunHandle);

    gunGroup.position.set(0.2, 1.3, 0.1);
    gunGroup.rotation.z = Math.PI / 6;
    soldier.add(gunGroup);
    
    // Set random position
    const randomX = Math.random() < 0.5 ? -30 : 40;
    const randomZ = -120 - Math.random() * 20;
    soldier.position.set(randomX, 0, randomZ);
    
    // Add waypoint and state tracking
    soldier.userData.waypoint = new THREE.Vector3(
        randomX < 0 ? -10 : 10,
        0,
        -130
    );
    soldier.userData.reachedWaypoint = false;
    
    scene.add(soldier);
    if (!gameState.soldiers) {
        gameState.soldiers = [];
    }
    gameState.soldiers.push(soldier);
}

// Helper function to create tiger stripe texture
function createTigerStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base color (olive drab)
    ctx.fillStyle = '#4B5320';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiger stripes
    ctx.fillStyle = '#2F4F4F'; // Darker green for stripes
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const width = 20 + Math.random() * 40;
        const height = 10 + Math.random() * 30;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createVietnameseSoldier() {
    const soldier = new THREE.Group();
    
    // Create soldier body (red uniform)
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    soldier.add(body);
    
    // Add yellow star to uniform
    const starGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
    const starMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 }); // Yellow
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(0, 1.2, 0.3);
    soldier.add(star);
    
    // Create soldier head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.2;
    soldier.add(head);
    
    // Create helmet (Dark Green)
    const helmetGeometry = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 }); // Dark green
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 2.4; // Position slightly above head
    helmet.rotation.x = Math.PI; // Rotate to cover top of head
    soldier.add(helmet);
    
    // Create soldier arms (red)
    const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.65, 1.2, 0);
    soldier.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.65, 1.2, 0);
    soldier.add(rightArm);
    
    // Create soldier legs (red)
    const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0, 0);
    soldier.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0, 0);
    soldier.add(rightLeg);
    
    // Create gun
    const gunGroup = new THREE.Group();
    
    // Gun body
    const gunBodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
    const gunBodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Dark gray
    const gunBody = new THREE.Mesh(gunBodyGeometry, gunBodyMaterial);
    gunBody.position.set(0, 0, 0.5); // Position relative to gunGroup center
    gunGroup.add(gunBody);
    
    // Gun handle
    const gunHandleGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
    const gunHandleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    const gunHandle = new THREE.Mesh(gunHandleGeometry, gunHandleMaterial);
    gunHandle.position.set(0, -0.1, 0.4); // Position relative to gunGroup center
    gunGroup.add(gunHandle);

    gunGroup.position.set(0.4, 1.2, 0.3); // Position gun group relative to soldier body
    gunGroup.rotation.z = Math.PI / 6; // Slight upward angle
    soldier.add(gunGroup);
    
    // Add Vietnamese flag for the first soldier
    if (!gameState.vietnameseSoldiers || gameState.vietnameseSoldiers.length === 0) {
        // Create flag pole
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(0, 2.5, 0);
        soldier.add(pole);
        
        // Create flag
        const flagGeometry = new THREE.PlaneGeometry(0.8, 0.5);
        const flagMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000, // Red
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.4, 3, 0);
        flag.rotation.y = Math.PI / 2;
        soldier.add(flag);
        
        // Add yellow star to flag
        const flagStarGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const flagStarMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 }); // Yellow
        const flagStar = new THREE.Mesh(flagStarGeometry, flagStarMaterial);
        flagStar.position.set(0.4, 3, 0.1);
        soldier.add(flagStar);
    }
    
    // Set initial position randomly on either side
    const randomZ = Math.random() * 7 + 50; // Random Z between 50 and 57
    const spawnX = Math.random() < 0.5 ? -36 : 40; // Randomly choose between -36 and 40
    soldier.position.set(spawnX, 0, randomZ);
    
    // Add waypoint and state tracking
    soldier.userData.initialWaypoint = new THREE.Vector3(0, 0, soldier.position.z);
    soldier.userData.reachedInitialWaypoint = false;
    soldier.userData.kills = 0;
    
    scene.add(soldier);
    if (!gameState.vietnameseSoldiers) {
        gameState.vietnameseSoldiers = [];
    }
    gameState.vietnameseSoldiers.push(soldier);
}

function updateSoldiers() {
    const currentTime = Date.now();
    
    // Spawn new US soldier
    if (currentTime - gameState.lastSoldierSpawn >= gameState.soldierSpawnInterval) {
        createSoldier();
        gameState.lastSoldierSpawn = currentTime;
    }
    
    // Spawn new Vietnamese soldier
    if (currentTime - gameState.lastVietnameseSoldierSpawn >= gameState.vietnameseSoldierSpawnInterval) {
        createVietnameseSoldier();
        gameState.lastVietnameseSoldierSpawn = currentTime;
    }
    
    // Update US soldiers
    if (gameState.soldiers) {
        for (let i = gameState.soldiers.length - 1; i >= 0; i--) {
            const soldier = gameState.soldiers[i];
            
            // Skip if soldier has no children
            if (soldier.children.length === 0) continue;
            
            let targetPos;
            if (!soldier.userData.reachedWaypoint) {
                // Move towards waypoint
                targetPos = soldier.userData.waypoint;
                
                // Check if reached waypoint
                if (soldier.position.distanceTo(targetPos) < 1) {
                    soldier.userData.reachedWaypoint = true;
                }
            } else {
                // Move towards tank
                targetPos = tank.position;
            }
            
            // Calculate direction to target
            const direction = new THREE.Vector3()
                .subVectors(targetPos, soldier.position)
                .normalize();
            
            // Calculate next position
            const nextX = soldier.position.x + direction.x * 0.05;
            const nextZ = soldier.position.z + direction.z * 0.05;
            
            // Check if next position is valid (not inside a wall)
            if (!checkBuildingCollision(nextX, nextZ)) {
                // Move soldier towards target
                soldier.position.x = nextX;
                soldier.position.z = nextZ;
                
                // Make soldier face the target
                soldier.rotation.y = Math.atan2(direction.x, direction.z);
            }
            
            // Check collision with tank
            const soldierBox = new THREE.Box3().setFromObject(soldier);
            const tankBox = new THREE.Box3().setFromObject(tank);
            
            if (soldierBox.intersectsBox(tankBox)) {
                // If collision, reduce tank health
                gameState.health -= 1;
                
                // Create impact effect
                createExplosionParticle(soldier.position);
                for (let j = 0; j < 8; j++) {
                    createDustParticle(soldier.position, 0xff4444);
                }
                
                // Remove soldier
                scene.remove(soldier);
                gameState.soldiers.splice(i, 1);
                
                // Check if tank is destroyed
                if (gameState.health <= 0) {
                    endGame(false);
                }
                
                // Update UI to show health change
                updateUI();
                continue;
            }
            
            // Remove soldier if too far from tank
            if (soldier.position.distanceTo(tank.position) > 200) {
                scene.remove(soldier);
                gameState.soldiers.splice(i, 1);
            }
        }
    }
    
    // Update Vietnamese soldiers
    if (gameState.vietnameseSoldiers) {
        for (let i = gameState.vietnameseSoldiers.length - 1; i >= 0; i--) {
            const vietnameseSoldier = gameState.vietnameseSoldiers[i];
            
            // Skip if soldier has no children
            if (vietnameseSoldier.children.length === 0) continue;
            
            // First move to initial waypoint if not reached
            if (!vietnameseSoldier.userData.reachedInitialWaypoint) {
                const direction = new THREE.Vector3()
                    .subVectors(vietnameseSoldier.userData.initialWaypoint, vietnameseSoldier.position)
                    .normalize();
                
                // Calculate next position
                const nextX = vietnameseSoldier.position.x + direction.x * 0.08;
                const nextZ = vietnameseSoldier.position.z;
                
                // Check if next position is valid (not inside a wall)
                if (!checkBuildingCollision(nextX, nextZ)) {
                    // Move soldier towards initial waypoint
                    vietnameseSoldier.position.x = nextX;
                    vietnameseSoldier.position.z = nextZ;
                    
                    // Make soldier face the waypoint
                    vietnameseSoldier.rotation.y = Math.atan2(direction.x, direction.z);
                }
                
                // Check if reached initial waypoint
                if (vietnameseSoldier.position.distanceTo(vietnameseSoldier.userData.initialWaypoint) < 1) {
                    vietnameseSoldier.userData.reachedInitialWaypoint = true;
                }
                continue;
            }
            
            // Find nearest US soldier
            let nearestUSSoldier = null;
            let minDistance = Infinity;
            
            if (gameState.soldiers) {
                gameState.soldiers.forEach(usSoldier => {
                    const distance = vietnameseSoldier.position.distanceTo(usSoldier.position);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestUSSoldier = usSoldier;
                    }
                });
            }
            
            // If found a US soldier, move towards it
            if (nearestUSSoldier) {
                const direction = new THREE.Vector3()
                    .subVectors(nearestUSSoldier.position, vietnameseSoldier.position)
                    .normalize();
                
                // Calculate next position
                let nextX = vietnameseSoldier.position.x + direction.x * 0.08;
                let nextZ = vietnameseSoldier.position.z;
                
                // Only allow Z movement if X is in the correct range
                if (nextX >= -11 && nextX <= 9) {
                    nextZ = vietnameseSoldier.position.z + direction.z * 0.08;
                }
                
                // Check if next position is valid (not inside a wall)
                if (!checkBuildingCollision(nextX, nextZ)) {
                    // Move soldier towards US soldier
                    vietnameseSoldier.position.x = nextX;
                    vietnameseSoldier.position.z = nextZ;
                    
                    // Make soldier face the US soldier
                    vietnameseSoldier.rotation.y = Math.atan2(direction.x, direction.z);
                }
                
                // Check collision with US soldier
                const vietnameseBox = new THREE.Box3().setFromObject(vietnameseSoldier);
                const usBox = new THREE.Box3().setFromObject(nearestUSSoldier);
                
                if (vietnameseBox.intersectsBox(usBox)) {
                    // Remove US soldier
                    scene.remove(nearestUSSoldier);
                    gameState.soldiers = gameState.soldiers.filter(s => s !== nearestUSSoldier);
                    
                    // Increment kill count
                    vietnameseSoldier.userData.kills++;
                    
                    // Create impact effect
                    createExplosionParticle(nearestUSSoldier.position);
                    for (let j = 0; j < 8; j++) {
                        createDustParticle(nearestUSSoldier.position, 0xff4444);
                    }
                    
                    // Remove Vietnamese soldier if it has killed 2 US soldiers
                    if (vietnameseSoldier.userData.kills >= 2) {
                        scene.remove(vietnameseSoldier);
                        gameState.vietnameseSoldiers.splice(i, 1);
                    }
                }
            }
            
            // Remove Vietnamese soldier if too far from any US soldier
            if (minDistance > 200) {
                scene.remove(vietnameseSoldier);
                gameState.vietnameseSoldiers.splice(i, 1);
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate); 
    
    if (gameState.gameRunning) {
        handleInput();
        checkCollisions();
        updateAnimations();
        updateUI();
        updateSoldiers();
    }
    
    updateParticles();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the game
init();

function createFlag() {
    // Create flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2.5;
    pole.castShadow = true;
    pole.receiveShadow = true;

    // Create flag
    const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
    const flagMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFF00,  // Yellow background
        side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(1, 4, 0);
    flag.rotation.y = Math.PI / 2;
    flag.castShadow = true;
    flag.receiveShadow = true;

    // Create red stripes
    const stripeGeometry = new THREE.PlaneGeometry(2, 0.1); // Thinner stripes
    const stripeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF0000,  // Red color
        side: THREE.DoubleSide
    });

    // Create three stripes with more spacing
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.set(1, 4.4, 0);
    stripe1.rotation.y = Math.PI / 2;

    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.set(1, 4, 0);
    stripe2.rotation.y = Math.PI / 2;

    const stripe3 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe3.position.set(1, 3.6, 0);
    stripe3.rotation.y = Math.PI / 2;

    // Create flag group
    const flagGroup = new THREE.Group();
    flagGroup.add(pole);
    flagGroup.add(flag);
    flagGroup.add(stripe1);
    flagGroup.add(stripe2);
    flagGroup.add(stripe3);

    // Position the flag at the gate
    flagGroup.position.set(0, 0, -130);

    // Add to scene
    scene.add(flagGroup);

    return flagGroup;
}

function shootTank() {
    console.log('Shoot function called'); // Debug log
    
    // Create muzzle flash effect
    const muzzleFlashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const muzzleFlashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8
    });
    const muzzleFlash = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);
    
    // Position muzzle flash at tank's gun
    const gunPosition = new THREE.Vector3(0, 1, 2);
    gunPosition.applyQuaternion(tank.quaternion);
    gunPosition.add(tank.position);
    muzzleFlash.position.copy(gunPosition);
    
    scene.add(muzzleFlash);
    console.log('Muzzle flash created at:', gunPosition); // Debug log
    
    // Animate muzzle flash
    let flashOpacity = 0.8;
    const flashInterval = setInterval(() => {
        flashOpacity -= 0.1;
        muzzleFlashMaterial.opacity = flashOpacity;
        if (flashOpacity <= 0) {
            clearInterval(flashInterval);
            scene.remove(muzzleFlash);
        }
    }, 50);
    
    // Calculate impact position
    const impactPosition = new THREE.Vector3(0, 0, -100);
    impactPosition.applyQuaternion(camera.quaternion);
    impactPosition.add(camera.position);
    console.log('Impact position:', impactPosition); // Debug log
    
    // Create explosion effect
    createExplosionEffect(impactPosition);
    
    // Check for US soldiers in explosion radius
    if (gameState.soldiers) {
        console.log('Checking for soldiers in explosion radius'); // Debug log
        for (let i = gameState.soldiers.length - 1; i >= 0; i--) {
            const soldier = gameState.soldiers[i];
            const distance = soldier.position.distanceTo(impactPosition);
            console.log('Soldier distance:', distance); // Debug log
            
            // If soldier is within 5 units of explosion
            if (distance <= 5) {
                console.log('Soldier hit!'); // Debug log
                // Create impact effect
                createExplosionParticle(soldier.position);
                for (let j = 0; j < 8; j++) {
                    createDustParticle(soldier.position, 0xff4444);
                }
                
                // Remove soldier
                scene.remove(soldier);
                gameState.soldiers.splice(i, 1);
            }
        }
    }
}

function createExplosionEffect(position) {
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position within explosion radius
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5;
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + Math.random() * 3,
            position.z + Math.sin(angle) * radius
        );
        
        scene.add(particle);
        
        // Animate particle
        let opacity = 0.8;
        const speed = 0.1 + Math.random() * 0.2;
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() * 2,
            Math.random() - 0.5
        ).normalize();
        
        const particleInterval = setInterval(() => {
            opacity -= 0.05;
            particleMaterial.opacity = opacity;
            particle.position.add(direction.multiplyScalar(speed));
            
            if (opacity <= 0) {
                clearInterval(particleInterval);
                scene.remove(particle);
            }
        }, 50);
    }
    
    // Create explosion light
    const light = new THREE.PointLight(0xff4400, 2, 10);
    light.position.copy(position);
    scene.add(light);
    
    // Animate light
    let intensity = 2;
    const lightInterval = setInterval(() => {
        intensity -= 0.1;
        light.intensity = intensity;
        
        if (intensity <= 0) {
            clearInterval(lightInterval);
            scene.remove(light);
        }
    }, 50);
}

function showGameOver() {
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('gameContainer').classList.add('game-over-active');
}

function hideGameOver() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('gameContainer').classList.remove('game-over-active');
} 