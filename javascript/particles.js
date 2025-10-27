const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Atualiza tamanho do canvas ao redimensionar
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Classe da partícula
class Particle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 1 + 0.5; // partículas menores
    this.speedX = (Math.random() - 0.5) * 0.15;
    this.speedY = (Math.random() - 0.5) * 0.15;
    this.opacity = Math.random() * 0.3 + 0.1; // mais transparente
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(14,165,233,${this.opacity})`;
    ctx.fill();
  }
}

// Cria partículas
for (let i = 0; i < 40; i++) { // menos partículas
  particles.push(new Particle());
}

// Loop de animação
function animate() {
  ctx.clearRect(0, 0, width, height);
  
  for (let p of particles) {
    p.update();
    p.draw();
  }
  
  requestAnimationFrame(animate);
}

animate();
