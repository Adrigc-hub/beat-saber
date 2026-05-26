// Dibujar flecha en la textura del cubo
const canvas = document.getElementById('arrow-texture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = "#ffffff"; ctx.beginPath();
ctx.moveTo(64, 15); ctx.lineTo(15, 85); ctx.lineTo(48, 85); ctx.lineTo(48, 115);
ctx.lineTo(80, 115); ctx.lineTo(80, 85); ctx.lineTo(113, 85); ctx.closePath(); ctx.fill();

// --- MOTOR DE SINTETIZADOR DE AUDIO DIGITAL DE GITHUB ---
// Esto genera música electrónica hardcore pura por código en tiempo real para saltar bloqueos de red.
const AudioEngine = {
    ctx: null,
    init() { 
        this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
    },
    playNote(freq, type, duration) {
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playHitSound() {
        // Sonido de corte láser de alta velocidad
        this.playNote(800, 'triangle', 0.08);
        this.playNote(1200, 'sine', 0.05);
    }
};

const levels = {
    1: { name: "shiver", speed: 0.55, spawnInterval: 200, baseFreq: 110 },  // Ritmo rápido
    2: { name: "backrooms", speed: 0.80, spawnInterval: 130, baseFreq: 75 } // Locura total de velocidad
};

let activeLevel = null;
let gameStarted = false;
let activeCubes = [];
let lastSpawnTime = 0;
let totalSpawned = 0;

const container = document.getElementById('note-container');

document.getElementById('btn-lvl1').addEventListener('click', () => launchLevel(1));
document.getElementById('btn-lvl2').addEventListener('click', () => launchLevel(2));

function launchLevel(lvlId) {
    if (gameStarted) return;
    AudioEngine.init(); // Inicializa el generador de música por código
    activeLevel = levels[lvlId];
    gameStarted = true;

    // Control de pantallas
    document.getElementById('main-menu').setAttribute('visible', 'false');
    document.getElementById(lvlId === 1 ? 'decor-shiver' : 'decor-something').setAttribute('visible', 'true');

    // Desactivar punteros y activar sables redondos neón
    document.getElementById('leftHand').removeAttribute('raycaster');
    document.getElementById('leftHand').removeAttribute('laser-controls');
    document.getElementById('rightHand').removeAttribute('raycaster');
    document.getElementById('rightHand').removeAttribute('laser-controls');
    
    document.getElementById('saber-l').setAttribute('visible', 'true');
    document.getElementById('saber-r').setAttribute('visible', 'true');

    lastSpawnTime = performance.now();
    runEngine();
}

function runEngine() {
    if (!gameStarted) return;
    let now = performance.now();

    // SPRAWN AUTOMÁTICO DE BLOQUES GARANTIZADO
    if (now - lastSpawnTime >= activeLevel.spawnInterval) {
        let positionsX = [-0.6, -0.2, 0.2, 0.6];
        let positionsY = [1.1, 1.4, 1.7];
        let rotations = [0, 90, 180, 270];
        
        let randomTrack = {
            x: positionsX[Math.floor(Math.random() * positionsX.length)],
            y: positionsY[Math.floor(Math.random() * positionsY.length)],
            rot: rotations[Math.floor(Math.random() * rotations.length)],
            type: totalSpawned % 2 // Alternancia estricta de sables
        };
        
        spawnCube(randomTrack);
        
        // --- MÚSICA ELECTRÓNICA GENERADA POR CÓDIGO ---
        // Sincroniza las notas musicales pesadas con la salida exacta de cada cubo
        let melodyFreq = activeLevel.baseFreq * ((totalSpawned % 4) + 1);
        AudioEngine.playNote(melodyFreq, activeLevel.name === "shiver" ? "sawtooth" : "square", 0.15);
        AudioEngine.playNote(activeLevel.baseFreq, "sine", 0.2); // Bajo pesado de fondo

        // --- ANIMACIÓN MUTANTE DE LA DECORACIÓN (Pulsos Neón de color y tamaño) ---
        mutateEnvironment();

        lastSpawnTime = now;
        totalSpawned++;
    }

    // Posición física 3D de las Quest
    let leftSaberPos = new THREE.Vector3();
    let rightSaberPos = new THREE.Vector3();
    document.getElementById('leftHand').object3D.getWorldPosition(leftSaberPos);
    document.getElementById('rightHand').object3D.getWorldPosition(rightSaberPos);

    // Movimiento lineal continuo y colisión matemática exacta
    for (let i = activeCubes.length - 1; i >= 0; i--) {
        let item = activeCubes[i];
        if (!item.el.parentNode) { activeCubes.splice(i, 1); continue; }

        let pos = item.el.getAttribute('position');
        pos.z += activeLevel.speed; // Avanza hacia la posición del jugador
        item.el.setAttribute('position', pos);

        let cubeWorldPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        let distLeft = leftSaberPos.distanceTo(cubeWorldPos);
        let distRight = rightSaberPos.distanceTo(cubeWorldPos);

        // Registro de colisión milimétrico con los sables cilíndricos (0.75 metros de alcance)
        if ((item.type === 0 && distLeft < 0.75) || (item.type === 1 && distRight < 0.75)) {
            AudioEngine.playHitSound(); // Sonido de impacto real generado al instante
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
            continue;
        }

        if (pos.z > 1.8) {
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
        }
    }

    requestAnimationFrame(runEngine);
}

function spawnCube(data) {
    let cubeGroup = document.createElement('a-entity');
    cubeGroup.setAttribute('position', `${data.x} ${data.y} -35`);
    cubeGroup.setAttribute('rotation', `0 0 ${data.rot}`);

    let body = document.createElement('a-box');
    body.setAttribute('scale', '0.4 0.4 0.4');
    
    let colorHex = data.type === 0 ? '#ff0055' : '#00ffff';
    body.setAttribute('color', colorHex);
    body.setAttribute('material', `emissive: ${colorHex}; emissiveIntensity: 2.5; roughness: 0`);

    let arrowFace = document.createElement('a-plane');
    arrowFace.setAttribute('position', '0 0 0.21');
    arrowFace.setAttribute('scale', '0.3 0.3 0.3');
    arrowFace.setAttribute('material', 'src: #arrow-texture; transparent: true; shader: flat');

    cubeGroup.appendChild(body);
    cubeGroup.appendChild(arrowFace);
    container.appendChild(cubeGroup);

    activeCubes.push({ el: cubeGroup, type: data.type });
}

// --- FUNCIÓN DE MUTACIÓN GENERAL DE ESCENARIOS (Color y deformidad total) ---
function mutateEnvironment() {
    let neonColors = ["#ff0055", "#00ffff", "#ffeb3b", "#9c27b0", "#4caf50"];
    let randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    let pulseScale = 1 + (Math.random() * 0.4);

    if (activeLevel.name === "shiver") {
        // La luna cambia de tamaño y color locamente al ritmo de Shiver
        let moon = document.getElementById('shiver-moon');
        let boss = document.getElementById('boss-mesh');
        moon.setAttribute('color', randomColor);
        moon.setAttribute('material', `emissive: ${randomColor}; emissiveIntensity: 1.5`);
        moon.setAttribute('scale', `${pulseScale} ${pulseScale} ${pulseScale}`);
        
        // El Jefe central gira violentamente
        boss.setAttribute('rotation', `0 ${totalSpawned * 15} ${totalSpawned * 5}`);
    } else {
        // Los Backrooms sufren un glitch severo de color y escala en las columnas
        let p1 = document.getElementById('backroom-p1');
        let p2 = document.getElementById('backroom-p2');
        let sky = document.getElementById('backroom-sky');
        let roof = document.getElementById('backroom-roof');
        
        p1.setAttribute('color', randomColor);
        p2.setAttribute('color', randomColor);
        p1.setAttribute('scale', `2 ${8 * pulseScale} 2`);
        p2.setAttribute('scale', `2 ${8 * (2 - pulseScale)} 2`);
        
        // Parpadeo de luz psicodélica en el cielo y techo de la oficina
        sky.setAttribute('color', totalSpawned % 2 === 0 ? "#111405" : "#220525");
        roof.setAttribute('material', `emissive: ${randomColor}; emissiveIntensity: ${Math.random() * 3}`);
    }
}
