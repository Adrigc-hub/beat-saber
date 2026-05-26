// --- MOTOR DE GENERACIÓN SINTETIZADA POR BLOQUES DE AUDIO ---
const AudioEngine = {
    ctx: null,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    // Crea bloques de notas musicales puras por código
    playBlockNote(freq, type, duration, volume = 0.25) {
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        
        osc.type = type; // sawtooth = Nivel 1 (Shiver), square = Nivel 2 (Something)
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playHitSound() {
        // Sonido de rebanado agudo e instantáneo
        this.playBlockNote(950, 'triangle', 0.06, 0.4);
    }
};

// Configuración de velocidad, ritmo de bloques y arreglos de notas clonadas de los videos
const levels = {
    1: { 
        name: "shiver", 
        speed: 0.40, 
        spawnInterval: 220,
        // Escala melódica rápida e intensa sacada del Video 1
        melody: [130, 147, 165, 196, 220, 196, 165, 147],
        wave: "sawtooth"
    },
    2: { 
        name: "something", 
        speed: 0.60, 
        spawnInterval: 160,
        // Ritmo "I found something / In the store" del Video 2
        melody: [90, 120, 90, 150, 110, 110, 160, 80],
        wave: "square"
    }
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
    AudioEngine.init(); // Inicializar contexto de audio al interactuar
    activeLevel = levels[lvlId];
    gameStarted = true;

    // Ocultar menú y activar la decoración elegida
    document.getElementById('main-menu').setAttribute('visible', 'false');
    document.getElementById(lvlId === 1 ? 'decor-shiver' : 'decor-something').setAttribute('visible', 'true');

    // Cambiar mandos de modo puntero a modo Sables de Combate
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

    // TEMPORIZADOR SÍNCRONO: Genera un bloque y una nota de forma idéntica
    if (now - lastSpawnTime >= activeLevel.spawnInterval) {
        let positionsX = [-0.6, -0.2, 0.2, 0.6];
        let positionsY = [1.1, 1.4, 1.7];
        
        let randomTrack = {
            x: positionsX[Math.floor(Math.random() * positionsX.length)],
            y: positionsY[Math.floor(Math.random() * positionsY.length)],
            type: totalSpawned % 2 // Alterna entre bloque rojo (0) y cian (1)
        };
        
        spawnPhysicalCube(randomTrack);
        
        // --- SECUENCIADOR EN BLOQUE DE LA CANCIÓN ---
        // Extrae secuencialmente las notas del arreglo melódico del nivel activo
        let noteIdx = totalSpawned % activeLevel.melody.length;
        let currentNote = activeLevel.melody[noteIdx];
        
        // Toca la nota melódica y le añade un bajo de fondo simultáneo
        AudioEngine.playBlockNote(currentNote, activeLevel.wave, 0.18);
        AudioEngine.playBlockNote(currentNote / 2, 'sine', 0.25, 0.3); // Sub-bass

        // Forzar cambio visual radical en la decoración en cada nota musical
        mutateDecorations();

        lastSpawnTime = now;
        totalSpawned++;
    }

    // Coordenadas espaciales exactas de los mandos en las gafas VR
    let leftSaberPos = new THREE.Vector3();
    let rightSaberPos = new THREE.Vector3();
    document.getElementById('leftHand').object3D.getWorldPosition(leftSaberPos);
    document.getElementById('rightHand').object3D.getWorldPosition(rightSaberPos);

    // Mover los bloques por el eje Z hacia el jugador y calcular impactos
    for (let i = activeCubes.length - 1; i >= 0; i--) {
        let item = activeCubes[i];
        if (!item.el.parentNode) { activeCubes.splice(i, 1); continue; }

        let pos = item.el.getAttribute('position');
        pos.z += activeLevel.speed; // Movimiento fluido hacia tu posición
        item.el.setAttribute('position', pos);

        let cubeWorldPos = new THREE.Vector3();
        item.el.object3D.getWorldPosition(cubeWorldPos);

        let distLeft = leftSaberPos.distanceTo(cubeWorldPos);
        let distRight = rightSaberPos.distanceTo(cubeWorldPos);

        // Control de Colisión por cercanía matemática (Alcance: 0.75 metros)
        if ((item.type === 0 && distLeft < 0.75) || (item.type === 1 && distRight < 0.75)) {
            AudioEngine.playHitSound(); // Respuesta de audio inmediata al romper
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
            continue;
        }

        // Auto-limpieza si el bloque se pasa de largo para que el Oculus Browser no se sature
        if (pos.z > 2.5) {
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
        }
    }

    requestAnimationFrame(runEngine);
}

// CONSTRUCTOR DE BLOQUES DE COLOR PLANO (Sólidos y 100% estables en Quest VR)
function spawnPhysicalCube(data) {
    let cube = document.createElement('a-box');
    
    // Nace a 30 metros al fondo del túnel
    cube.setAttribute('position', `${data.x} ${data.y} -30`);
    cube.setAttribute('scale', '0.4 0.4 0.4');
    
    // Color de asignación estricta para emparejar con el sable
    let colorHex = data.type === 0 ? '#ff0055' : '#00ffff';
    cube.setAttribute('color', colorHex);
    cube.setAttribute('material', 'shader: flat'); // Desactiva cálculos complejos de sombras pesadas

    container.appendChild(cube);

    // Guardar referencia del elemento en el bucle de físicas
    activeCubes.push({ el: cube, type: data.type });
}

// MUTACIÓN SÍNCRONA DE LOS ESCENARIOS AL RITMO DE LA MÚSICA
function mutateDecorations() {
    let colors = ["#ff0055", "#00ffff", "#ffeb3b", "#9c27b0", "#ff5722"];
    let randomColor = colors[Math.floor(Math.random() * colors.length)];
    let scalePulse = 1 + (Math.random() * 0.35);

    if (activeLevel.name === "shiver") {
        let moon = document.getElementById('shiver-moon');
        let boss = document.getElementById('boss-mesh');
        if (moon) {
            moon.setAttribute('color', randomColor);
            moon.setAttribute('scale', `${scalePulse} ${scalePulse} ${scalePulse}`);
        }
        if (boss) {
            boss.setAttribute('rotation', `${totalSpawned * 15} ${totalSpawned * 25} 0`);
        }
    } else {
        let p1 = document.getElementById('backroom-p1');
        let p2 = document.getElementById('backroom-p2');
        let sky = document.getElementById('backroom-sky');
        let roof = document.getElementById('backroom-roof');

        if (p1 && p2) {
            p1.setAttribute('color', randomColor);
            p2.setAttribute('color', randomColor);
            p1.setAttribute('scale', `1.8 ${8 * scalePulse} 1.8`);
            p2.setAttribute('scale', `1.8 ${8 * (2 - scalePulse)} 1.8`);
        }
        if (sky) {
            sky.setAttribute('color', totalSpawned % 2 === 0 ? "#111405" : "#2a2205");
        }
        if (roof) {
            roof.setAttribute('color', totalSpawned % 3 === 0 ? "#ffffee" : "#cccc77");
        }
    }
}
