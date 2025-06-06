class Joystick {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'joystick-container';
        
        this.base = document.createElement('div');
        this.base.className = 'joystick-base';
        
        this.stick = document.createElement('div');
        this.stick.className = 'joystick-stick';
        
        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);
        document.body.appendChild(this.container);
        
        this.isDragging = false;
        this.maxDistance = 50; // Maximum distance the stick can move from center
        this.currentX = 0;
        this.currentY = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.base.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // Touch events
        this.base.addEventListener('touchstart', this.startDrag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.updateStickPosition(e);
    }
    
    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updateStickPosition(e);
    }
    
    endDrag() {
        this.isDragging = false;
        this.stick.style.transform = 'translate(-50%, -50%)';
        this.currentX = 0;
        this.currentY = 0;
    }
    
    updateStickPosition(e) {
        const rect = this.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If distance is greater than maxDistance, normalize the vector
        if (distance > this.maxDistance) {
            deltaX = (deltaX / distance) * this.maxDistance;
            deltaY = (deltaY / distance) * this.maxDistance;
        }
        
        // Update stick position
        this.stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        
        // Calculate normalized values (-1 to 1)
        this.currentX = deltaX / this.maxDistance;
        this.currentY = deltaY / this.maxDistance;
    }
    
    getValues() {
        return {
            x: this.currentX,
            y: this.currentY
        };
    }
} 