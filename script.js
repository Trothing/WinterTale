const canvas = document.getElementById('magic-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: -100, y: -100 };
let isLightOn = false;
let gameStep = 0;

const audio = document.getElementById('bg-audio');

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 800;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initWorld();
}
window.addEventListener('resize', resize);


function updatePos(x, y) {
    mouse.x = x;
    mouse.y = y;

    if (gameStep === 2) {
        checkTreeInteraction(x, y);
    }
}

window.addEventListener('mousemove', e => updatePos(e.clientX, e.clientY));
window.addEventListener('touchmove', e => {
    updatePos(e.touches[0].clientX, e.touches[0].clientY);
});

class Snowflake {
    constructor() {
        this.reset();
        this.y = Math.random() * height;
    }

    reset() {
        this.x = Math.random() * width;
        this.y = -10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 1 + 0.2;
        this.sway = Math.random() * 0.02;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.5 + 0.3;
    }

    update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * this.sway + this.swayOffset) * 0.5;

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        let renderAlpha = this.alpha;

        if (gameStep > 0 && isLightOn) {
            if (dist < 150) renderAlpha = 1.0; 
        }

        if (this.y > height) this.reset();
        return renderAlpha;
    }

    draw(alpha) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class WarmParticle {
    constructor() {
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = Math.random() * 3;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.01;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 2;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed - 1;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 200, 50, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class TreeBranch {
    constructor(x, y, length, angle, depth) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = angle;
        this.depth = depth;
        this.endX = x + Math.cos(angle) * length;
        this.endY = y + Math.sin(angle) * length;

        this.lit = false;
        this.litProgress = 0;
        this.hasLight = (depth < 2 || Math.random() > 0.6);
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.endX, this.endY);

        if (this.lit) {
            ctx.strokeStyle = `rgba(255, 220, 100, ${0.4 + this.litProgress * 0.6})`;
            ctx.lineWidth = this.depth * (isMobile ? 0.6 : 0.8) + 0.5; 
        } else {
            const dist = Math.hypot(this.x - mouse.x, this.y - mouse.y);
            const alpha = Math.max(0, 0.2 - dist/300);
            ctx.strokeStyle = `rgba(100, 100, 120, ${alpha})`;
            ctx.lineWidth = this.depth * 0.5;
        }
        ctx.stroke();

        if (this.lit && this.hasLight && this.litProgress > 0.8) {
            ctx.beginPath();
            ctx.arc(this.endX, this.endY, (isMobile ? 1.5 : 2) + Math.random(), 0, Math.PI*2);
            ctx.fillStyle = '#ffca28'; 
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff6f00';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}


let snow = [];
let particles = [];
let tree = [];

function generateTree(x, y, length, angle, depth) {
    if (depth === 0) return;

    const branch = new TreeBranch(x, y, length, angle, depth);
    tree.push(branch);

    const branchCount = 2;
    for (let i = 0; i < branchCount; i++) {
        const spread = isMobile ? 0.33 : 0.45; 
        
        const newLength = length * 0.75;
        const newAngle = angle + (i === 0 ? spread : -spread) + (Math.random()*0.1 - 0.05);
        generateTree(branch.endX, branch.endY, newLength, newAngle, depth - 1);
    }
}

function initWorld() {
    snow = [];
    tree = [];
    particles = [];
    
    for(let i=0; i<150; i++) snow.push(new Snowflake());


    let treeBaseLength;
    let startY = height; 
    
    if (isMobile) {.
        treeBaseLength = height * 0.17; 
    } else {
        treeBaseLength = height / 4.5;
    }

    generateTree(width/2, startY, treeBaseLength, -Math.PI/2, 10);
}

function checkTreeInteraction(mx, my) {
    let hit = false;
    tree.forEach(branch => {
        if (branch.lit) return;

        const dx = mx - branch.endX;
        const dy = my - branch.endY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        const hitRadius = isMobile ? 100 : 80;

        if (dist < hitRadius) {
            branch.lit = true;
            hit = true;
        }
    });

    if (hit) {
        for(let k=0; k<2; k++) particles.push(new WarmParticle());

        const litCount = tree.filter(b => b.lit).length;
        const totalCount = tree.length;
        const progress = litCount / totalCount;

        if (progress > 0.85 && gameStep === 2) {
            startFinale();
        }
    }
}


const startTrigger = document.getElementById('start-trigger');
const startScreen = document.getElementById('start-screen');
const dynamicStory = document.getElementById('dynamic-story');
const hintText = document.getElementById('hint-text');

startTrigger.addEventListener('click', () => {
    audio.volume = 0;
    audio.play().catch(e=>console.log(e));
    let vol = 0;
    let fade = setInterval(() => { if(vol<0.5) { vol+=0.02; audio.volume=vol; } else clearInterval(fade); }, 200);

    startScreen.style.opacity = '0';
    setTimeout(() => {
        startScreen.style.display = 'none';
        startGame();
    }, 1000);
});

function startGame() {
    isLightOn = true;
    gameStep = 1;

    showText("Зима приховує казку...", 3000, () => {
        showText("Вона чекає лише на тебе.", 3000, () => {
            showText("Зігрій цей світ.<br>Проведи вогнем по гілках.", 0, () => {
                gameStep = 2;
                hintText.textContent = "Води пальцем/мишкою, щоб зігріти гілки";
                hintText.style.opacity = '1';
            });
        });
    });
}

function showText(html, duration, callback) {
    dynamicStory.innerHTML = html;
    dynamicStory.classList.add('active');

    if (duration > 0) {
        setTimeout(() => {
            dynamicStory.classList.remove('active');
            setTimeout(callback, 1500);
        }, duration);
    } else {
        callback();
    }
}

function startFinale() {
    gameStep = 3;
    dynamicStory.classList.remove('active');
    hintText.style.opacity = '0';
    tree.forEach(b => b.lit = true);
    document.getElementById('finale-container').style.opacity = '1';
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    if (isLightOn) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
        gradient.addColorStop(0, 'rgba(23, 30, 60, 1)');
        gradient.addColorStop(1, 'rgba(9, 10, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    tree.forEach(branch => {
        if (branch.lit && branch.litProgress < 1) branch.litProgress += 0.05;
        branch.draw();
    });

    snow.forEach(flake => {
        let a = flake.update();
        flake.draw(a);
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (isLightOn) {
        ctx.beginPath();
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 120);
        glow.addColorStop(0, 'rgba(255, 200, 50, 0.6)'); 
        glow.addColorStop(0.3, 'rgba(255, 250, 200, 0.2)'); 
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
        
        ctx.fillStyle = glow;
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI*2);
        ctx.fill();
    }

    requestAnimationFrame(animate);
}

resize();
animate();
