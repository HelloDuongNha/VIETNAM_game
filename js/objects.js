// Game objects
let scene, camera, renderer, tank, targetGate;
let obstacles = [], trees = [], roadMarkers = [], roadSegments = [];
let vietnamMap = null;

// Enhanced road path with curves
const roadPath = [
    { x: 0, z: 8 },
    { x: -2, z: 6 },
    { x: -4, z: 3 },
    { x: -5, z: 0 },
    { x: -4, z: -3 },
    { x: -2, z: -6 },
    { x: 0, z: -9 },
    { x: 3, z: -12 },
    { x: 5, z: -15 },
    { x: 4, z: -18 },
    { x: 2, z: -21 },
    { x: -1, z: -24 },
    { x: -2, z: -27 },
    { x: 0, z: -30 },
    { x: 2, z: -33 },
    { x: 1, z: -36 },
    { x: 0, z: -40 }
];

// Load Vietnam map model
function loadVietnamMap() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        'asset/objects/vietnam_map.glb',
        function (gltf) {
            vietnamMap = gltf.scene;
            
            // Scale the map to be much larger
            vietnamMap.scale.set(2, 2, 2);
            
            // Position the map higher by 5 meters and move it 10 units to the right
            vietnamMap.position.set(-10, -1, 0);
            
            // Rotate the map 90 degrees to the left
            vietnamMap.rotation.y = Math.PI / 2; // 90 degrees in radians
            
            // Enable shadows and mark buildings for collision
            vietnamMap.traverse(function (node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Mark buildings for collision detection
                    if (node.name.toLowerCase().includes('building') || 
                        node.name.toLowerCase().includes('house') ||
                        node.name.toLowerCase().includes('wall')) {
                        node.userData.isBuilding = true;
                    }
                }
            });
            
            scene.add(vietnamMap);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened while loading the map:', error);
        }
    );
}

function createLighting() {
    // Enhanced ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(30, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);
    
    // Add atmospheric hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
    scene.add(hemisphereLight);
    
    // Point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(0xffaa00, 0.8, 50);
    pointLight1.position.set(-20, 15, -20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00aaff, 0.6, 40);
    pointLight2.position.set(25, 12, -30);
    scene.add(pointLight2);
}

function createTerrain() {
    // Load Vietnam map
    loadVietnamMap();
    
    // Create target gate
    createEnhancedTargetGate();
}

function createEnhancedTank() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        'asset/objects/tank.glb',
        function (gltf) {
            tank = gltf.scene;
            
            // Scale the tank to be larger
            tank.scale.set(25, 35, 25);
            
            // Rotate the tank 90 degrees to the right
            tank.rotation.y = Math.PI / 2;
            
            // Position the tank
            tank.position.set(-36, 1, 50);
            
            // Enable shadows
            tank.traverse(function (node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            // Store wheels for animation
            tank.userData = {
                wheels: tank.children.filter(child => 
                    child.name.toLowerCase().includes('wheel') || 
                    child.name.toLowerCase().includes('track')
                )
            };
            
            scene.add(tank);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened while loading the tank:', error);
        }
    );
}

function createEnhancedTargetGate() {
    const gateGroup = new THREE.Group();
    
    // Enhanced gate base platform
    const baseGeometry = new THREE.BoxGeometry(45, 2.4, 15);
    const baseMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x999999,
        roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.2;
    base.castShadow = true;
    base.receiveShadow = true;
    gateGroup.add(base);
    
    // Enhanced gate pillars
    for (let i = 0; i < 2; i++) {
        const pillarGeometry = new THREE.BoxGeometry(4.5, 24, 4.5);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.x = i === 0 ? -16.5 : 16.5;
        pillar.position.y = 12;
        pillar.castShadow = true;
        gateGroup.add(pillar);
        
        // Pillar caps
        const capGeometry = new THREE.BoxGeometry(6, 1.5, 6);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        for (let j = 0; j < 4; j++) {
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.x = pillar.position.x;
            cap.position.y = 3 + j * 6;
            gateGroup.add(cap);
        }
    }
    
    // Add metal bars between pillars
    const barGeometry = new THREE.CylinderGeometry(0.2, 0.2, 33, 8);
    const barMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x808080,
        metalness: 0.8,
        roughness: 0.2
    });

    // Create vertical bars with pointed tops
    for (let i = 0; i < 21; i++) {
        // Main bar
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.x = -10 + i;
        bar.position.y = 8;
        bar.position.z = 3;
        bar.rotation.z = Math.PI / 2;
        bar.scale.set(1, 1, 1.5);
        bar.castShadow = true;
        bar.receiveShadow = true;
        gateGroup.add(bar);

        // Add pointed top
        const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const cone = new THREE.Mesh(coneGeometry, barMaterial);
        cone.position.x = bar.position.x;
        cone.position.y = bar.position.y;
        cone.position.z = 3;
        cone.rotation.z = Math.PI / 2;
        cone.castShadow = true;
        cone.receiveShadow = true;
        gateGroup.add(cone);
    }

    // Add horizontal bars
    for (let i = 0; i < 5; i++) {
        const horizontalBar = new THREE.Mesh(barGeometry, barMaterial);
        horizontalBar.position.y = 4 + (i * 5);
        horizontalBar.position.z = 3;
        horizontalBar.scale.set(1, 1, 0.7);
        horizontalBar.castShadow = true;
        horizontalBar.receiveShadow = true;
        gateGroup.add(horizontalBar);
    }
    
    // Enhanced gate arch
    const archGeometry = new THREE.BoxGeometry(36, 4.5, 6);
    const archMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
    const arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.y = 21.6;
    arch.castShadow = true;
    gateGroup.add(arch);
    
    // Create yellow flag with red stripes
    const flagGeometry = new THREE.BoxGeometry(24, 2.4, 0.3);
    const yellowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xFFFF00,
        emissive: 0x444400
    });
    const flag = new THREE.Mesh(flagGeometry, yellowMaterial);
    flag.position.y = 18;
    flag.position.z = 3.6;
    gateGroup.add(flag);

    // Create three thin red stripes
    const stripeGeometry = new THREE.BoxGeometry(24, 0.2, 0.31);
    const redMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xFF0000,
        emissive: 0x330000
    });

    // Create and position three stripes
    const stripe1 = new THREE.Mesh(stripeGeometry, redMaterial);
    stripe1.position.set(0, 18.6, 3.61);
    gateGroup.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeometry, redMaterial);
    stripe2.position.set(0, 18, 3.61);
    gateGroup.add(stripe2);

    const stripe3 = new THREE.Mesh(stripeGeometry, redMaterial);
    stripe3.position.set(0, 17.4, 3.61);
    gateGroup.add(stripe3);
    
    // Gate lights
    for (let i = 0; i < 4; i++) {
        const lightGeometry = new THREE.SphereGeometry(0.9, 12, 8);
        const lightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFF88,
            emissive: 0x444400
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(
            i < 2 ? -12 : 12,
            i % 2 === 0 ? 6 : 18,
            5.4
        );
        gateGroup.add(light);
    }
    
    // Add "DINH ĐỘC LẬP" sign
    const signGeometry = new THREE.BoxGeometry(30, 3, 0.6);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 9, 4.5);
    gateGroup.add(sign);
    
    gateGroup.position.set(0, -1, -140);
    targetGate = gateGroup;
    scene.add(gateGroup);
}

function isNearRoad(x, z, minDistance) {
    return false; // Since we don't have road markers anymore
} 