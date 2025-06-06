// Particle system variables
let dustParticles = [], explosionParticles = [];

function initParticles() {
    dustParticles = [];
    explosionParticles = [];
}

function createDustParticle(position, color = 0x8B7355) {
    const particleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.15 + 0.05,
        (Math.random() - 0.5) * 0.15
    );
    particle.life = 1.0;
    particle.maxLife = 1.0;
    dustParticles.push(particle);
    scene.add(particle);
}

function createExplosionParticle(position) {
    for (let i = 0; i < 8; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5),
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.2 + 0.1,
            (Math.random() - 0.5) * 0.3
        );
        particle.life = 0.8;
        particle.maxLife = 0.8;
        explosionParticles.push(particle);
        scene.add(particle);
    }
}

function updateParticles() {
    // Update dust particles
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const particle = dustParticles[i];
        particle.position.add(particle.velocity);
        particle.velocity.y -= 0.005; // gravity
        particle.velocity.multiplyScalar(0.98); // air resistance
        particle.life -= 0.02;
        particle.material.opacity = (particle.life / particle.maxLife) * 0.8;
        particle.scale.setScalar(1 + (1 - particle.life / particle.maxLife) * 0.5);
        
        if (particle.life <= 0) {
            scene.remove(particle);
            dustParticles.splice(i, 1);
        }
    }
    
    // Update explosion particles
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        particle.position.add(particle.velocity);
        particle.velocity.multiplyScalar(0.95);
        particle.life -= 0.04;
        particle.material.opacity = particle.life / particle.maxLife;
        particle.scale.setScalar(1 + (1 - particle.life / particle.maxLife) * 2);
        
        if (particle.life <= 0) {
            scene.remove(particle);
            explosionParticles.splice(i, 1);
        }
    }
} 