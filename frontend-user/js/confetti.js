/**
 * Simple Confetti Animation
 */
const startConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // We'll allow global access or just run it
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ffffff'];

    (function frame() {
        // Create particles
        // Since we are writing a lightweight custom implementation without external libs like canvas-confetti for simplicity and control
        // We will create simple DOM elements for this effect or use a small canvas.
        // Actually, for "High End", canvas-confetti is standard. 
        // Let's write a very small canvas based confetti here to avoid external dependencies failure.
        
        // ...Wait, implementing a full physics engine is too much code.
        // I will use a simple CSS based approach or a very minimal JS one.
        // Let's use a dynamic CSS + JS injection for "Explosion".
        
        createParticles();
    }());

    function createParticles() {
        const particleCount = 100;
        const container = document.body;
        
        for (let i = 0; i < particleCount; i++) {
            const el = document.createElement('div');
            el.style.position = 'fixed';
            el.style.width = '10px';
            el.style.height = '10px';
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.left = '50%';
            el.style.top = '50%';
            el.style.zIndex = '9999';
            el.style.pointerEvents = 'none';
            document.body.appendChild(el);

            const destinationX = (Math.random() - 0.5) * window.innerWidth;
            const destinationY = (Math.random() - 0.5) * window.innerHeight;
            const rotation = Math.random() * 520;
            const delay = Math.random() * 200;

            const anim = el.animate([
                { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${destinationX}px, ${destinationY}px) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 1000,
                delay: delay,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            });

            anim.onfinish = () => el.remove();
        }
    }
};

window.startConfetti = startConfetti;
