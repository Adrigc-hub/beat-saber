// Inicializar textura de flecha para bloques
const canvas = document.getElementById('arrow-texture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = "#ffffff"; ctx.beginPath();
ctx.moveTo(64, 15); ctx.lineTo(15, 85); ctx.lineTo(48, 85); ctx.lineTo(48, 115);
ctx.lineTo(80, 115); ctx.lineTo(80, 85); ctx.lineTo(113, 85); ctx.closePath(); ctx.fill();

// --- MAPAS DE RITMO ULTRA RÁPIDOS (HARDCORE) ---
// Estructura densa para imitar los movimientos frenéticos de sables cruzados del video 1.
const levels = {
    1: {
        audioId: 'track-shiver',
        decorId: 'decor-shiver',
        envPreset: 'snowy',
        speed: 0.65, // Velocidad extrema por frame
        tracks: [
            { time: 800, x: -0.4, y: 1.1, rot: 0, type: 0 },
            { time: 1100, x: 0.4, y: 1.1, rot: 0, type: 1 },
            { time: 1400, x: -0.4, y: 1.5, rot: 180, type: 0 },
            { time: 1700, x: 0.4, y: 1.5, rot: 180, type: 1 },
            { time: 2000, x: -0.6, y: 1.3, rot: 90, type: 0 },
            { time: 2200, x: 0.6, y: 1.3, rot: 270, type: 1 },
            { time: 2400, x: -0.2, y: 1.6, rot: 180, type: 0 },
            { time: 2600, x: 0.2, y: 1.0, rot: 0, type: 1 },
            // Ráfaga cruzada rápida (Stream)
            { time: 3000, x: -0.5, y: 1.2, rot: 0, type: 0 },
            { time: 3150, x: 0.5, y: 1.4, rot: 180, type: 1 },
            { time: 3300, x: -0.3, y: 1.5, rot: 180, type: 0 },
            { time: 3450, x: 0.3, y: 1.1, rot: 0, type: 1 },
            { time: 3800, x: -0.6, y: 1.0, rot: 270, type: 0 },
            { time: 3800, x: 0.6, y: 1.0, rot: 90, type: 1 }
        ]
    },
    2: {
        audioId: 'track-something',
        decorId: 'decor-something',
        envPreset: 'goldrush',
        speed: 0.85, // Modo Dios - Bloques casi instantáneos
        tracks: [
            { time: 500, x: -0.3, y: 1.4, rot: 180, type: 0 },
            { time: 700, x: 0.3, y: 1.4, rot: 180, type: 1 },
            { time: 1000, x: -0.6, y: 1.0, rot: 90, type: 0 },
            { time: 1200, x: 0.6, y: 1.6, rot: 90, type: 1 },
            { time: 1500, x: -0.2, y: 1.5, rot: 0, type: 1 }, 
            { time: 1700, x: 0.2, y: 1.1, rot: 180, type: 0 },
            // Patrón saltarín síncopado del video 3
            { time: 2200, x: -0.5, y: 1.6, rot: 45, type: 0 },
            { time: 2350, x: 0.5, y: 1.0, rot: 225, type: 1 },
            { time: 2500, x: -0.5, y: 1.0, rot: 135, type: 0 },
            { time: 2650, x: 0.5, y: 1.6, rot: 315, type: 1 },
            { time: 3100, x: -0.3, y: 1.3, rot: 0, type: 0 },
            { time: 3100, x: 0.3, y: 1.3, rot: 0, type: 1 }
        ]
    }
};

let activeLevel = null;
let gameStarted = false;
let startTime = 0;
let trackIndex = 0;
let activeCubes = [];

const container = document.getElementById('note-container');
const hitSound = document.getElementById('hit-sound');

// Soportar clics en PC y selección mediante Raycaster/Gatillo en Oculus Quest
document.getElementById('btn-lvl1').addEventListener('click', () => launchLevel(1));
document.getElementById('btn-lvl2').addEventListener('click', () => launchLevel(2));

function launchLevel(lvlId) {
    if (gameStarted) return;
    activeLevel = levels[lvlId];
    gameStarted = true;

    // Ajustar interfaces y entornos
    document.getElementById('main-menu').setAttribute('visible', 'false');
    document.getElementById(activeLevel.decorId).setAttribute('visible', 'true');
    if(lvlId === 2) {
        document.getElementById('rail-l').setAttribute('color', '#78350f');
        document.getElementById('rail-r').setAttribute('color', '#ca8a04');
    }

    // Arrancar música y bucle
    const music = document.getElementById(activeLevel.audioId);
    music.volume = 0.9;
    music.play();
    
    startTime = performance.now();
    runEngine();
}

function runEngine() {
    if (!gameStarted) return;
    let elapsed = performance.now() - startTime;

    // Generar nuevos bloques basados en el tiempo exacto
    if (trackIndex < activeLevel.tracks.length && elapsed >= activeLevel.tracks[trackIndex].time) {
        spawnCube(activeLevel.tracks[trackIndex]);
        trackIndex++;
    }

    // Obtener posiciones actuales de los sables en el espacio 3D de las Quest
    let leftSaberPos = new THREE.Vector3();
    let rightSaberPos = new THREE.Vector3();
    document.getElementById('leftHand').object3D.getWorldPosition(leftSaberPos);
    document.getElementById('rightHand').object3D.getWorldPosition(rightSaberPos);

    // Mover cubos de manera lineal súper veloz y calcular colisiones directas por distancia
    for (let i = activeCubes.length - 1; i >= 0; i--) {
        let item = activeCubes[i];
        if (!item.el.parentNode) { activeCubes.splice(i, 1); continue; }

        let currentPos = item.el.getAttribute('position');
        currentPos.z += activeLevel.speed; // Movimiento por cuadro de actualización
        item.el.setAttribute('position', currentPos);

        // VECTOR FÍSICO 3D DEL BLOQUE ACTUAL
        let cubeWorldPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

        // DISTANCIA MATEMÁTICA EXACTA (Solución definitiva para alta velocidad)
        let distLeft = leftSaberPos.distanceTo(cubeWorldPos);
        let distRight = rightSaberPos.distanceTo(cubeWorldPos);

        // Rango de acierto estricto (0.65 metros a la redonda del sable)
        if ((item.type === 0 && distLeft < 0.65) || (item.type === 1 && distRight < 0.65)) {
            // Reproducir sonido de impacto del sable real de manera asíncrona inmediata
            hitSound.currentTime = 0;
            hitSound.play();
            
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
            continue;
        }

        // Si sobrepasa la línea del cuerpo del jugador, desaparece
        if (currentPos.z > 1.5) {
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
        }
    }

    requestAnimationFrame(runEngine);
}

function spawnCube(data) {
    let cubeGroup = document.createElement('a-entity');
    cubeGroup.setAttribute('position', `${data.x} ${data.y} -40`); // Aparecen a lo lejos en el túnel
    cubeGroup.setAttribute('rotation', `0 0 ${data.rot}`);

    let body = document.createElement('a-box');
    body.setAttribute('scale', '0.42 0.42 0.42');
    
    // Asignar colores según el nivel (Rojo/Azul clásicos para Nivel 1, Marrón/Oro para Nivel 2)
    let colorHex = data.type === 0 ? (activeLevel === levels[1] ? '#ff0055' : '#78350f') : (activeLevel === levels[1] ? '#00ffff' : '#facc15');
    body.setAttribute('color', colorHex);
    body.setAttribute('material', `emissive: ${colorHex}; emissiveIntensity: 2.2; roughness: 0`);

    let arrowFace = document.createElement('a-plane');
    arrowFace.setAttribute('position', '0 0 0.22');
    arrowFace.setAttribute('scale', '0.32 0.32 0.32');
    arrowFace.setAttribute('material', 'src: #arrow-texture; transparent: true; shader: flat');

    cubeGroup.appendChild(body);
    cubeGroup.appendChild(arrowFace);
    container.appendChild(cubeGroup);

    // Guardar referencia en el motor de colisiones de alta frecuencia
    activeCubes.push({ el: cubeGroup, type: data.type });
}
