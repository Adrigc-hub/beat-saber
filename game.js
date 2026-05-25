// Dibuja una flecha blanca sobre fondo transparente para simular el cubo de Beat Saber
const canvas = document.getElementById('arrow-texture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0)";
ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.moveTo(64, 20);
ctx.lineTo(20, 80);
ctx.lineTo(50, 80);
ctx.lineTo(50, 110);
ctx.lineTo(78, 110);
ctx.lineTo(78, 80);
ctx.lineTo(108, 80);
ctx.closePath();
ctx.fill();

// MAPA DE RITMO AJUSTADO PARA "SHIVER" (Tiempo en ms, Coordenadas X, Y, Dirección de Flecha, Color/Tipo)
// Direcciones (rot): 0=Abajo, 180=Arriba, 90=Izquierda, 270=Derecha
// Type: 0 = Rojo (Mano izq), 1 = Azul (Mano der)
const shiverTrack = [
    { time: 1200, x: -0.6, y: 1.2, rot: 0, type: 0 },
    { time: 2000, x: 0.6, y: 1.2, rot: 0, type: 1 },
    { time: 2800, x: -0.3, y: 1.5, rot: 180, type: 0 },
    { time: 3500, x: 0.3, y: 1.5, rot: 180, type: 1 },
    { time: 4200, x: -0.6, y: 1.0, rot: 90, type: 0 },
    { time: 4600, x: 0.6, y: 1.0, rot: 270, type: 1 },
    { time: 5400, x: -0.4, y: 1.6, rot: 0, type: 0 },
    { time: 5800, x: 0.4, y: 1.6, rot: 0, type: 1 },
    { time: 6500, x: -0.2, y: 1.2, rot: 270, type: 1 },
    { time: 6900, x: 0.2, y: 1.2, rot: 90, type: 0 },
    // Doble golpe rápido sincronizado con el Drop del video
    { time: 7600, x: -0.5, y: 1.3, rot: 180, type: 0 },
    { time: 7600, x: 0.5, y: 1.3, rot: 180, type: 1 }
];

let gameStarted = false;
let startTime = 0;
let trackIndex = 0;
const container = document.getElementById('note-container');
const music = document.getElementById('shiver-music');

// Eventos para iniciar la escena tanto en PC (desarrollo) como en Oculus Quest
window.addEventListener('click', startBeatSaber);
window.addEventListener('touchstart', startBeatSaber);

function startBeatSaber() {
    if (gameStarted) return;
    gameStarted = true;

    // Quitar menú de introducción
    document.getElementById('menu').setAttribute('visible', 'false');

    // Inicializar música
    music.volume = 0.8;
    music.play().catch(e => console.log("Interacción requerida para audio:", e));
    
    startTime = performance.now();
    animateGame();
}

function animateGame() {
    if (!gameStarted) return;

    let elapsed = performance.now() - startTime;

    // Spawnear cubos según el tiempo transcurrido de la canción de False Noise
    if (trackIndex < shiverTrack.length && elapsed >= shiverTrack[trackIndex].time) {
        createBeatCube(shiverTrack[trackIndex]);
        trackIndex++;
    }

    // Mapear y desplazar todos los bloques activos hacia la posición del jugador
    let cubes = document.querySelectorAll('.cube');
    cubes.forEach(cube => {
        let currentPos = cube.getAttribute('position');
        currentPos.z += 0.25; // Velocidad de aproximación (Ajustable para cambiar la dificultad)
        cube.setAttribute('position', currentPos);

        // Si el jugador no corta el bloque y este pasa de largo, se elimina y el Boss reacciona
        if (currentPos.z > 1.8) {
            cube.parentNode.removeChild(cube);
            bossFlashAttack();
        }
    });

    requestAnimationFrame(animateGame);
}

function createBeatCube(data) {
    // Crear el bloque base contenedor
    let cubeGroup = document.createElement('a-entity');
    cubeGroup.setAttribute('class', 'cube');
    cubeGroup.setAttribute('position', `${data.x} ${data.y} -35`);
    cubeGroup.setAttribute('rotation', `0 0 ${data.rot}`); // Aplica la dirección de corte

    // Cuerpo interno del cubo (Estilo original de Beat Saber con bordes oscuros)
    let body = document.createElement('a-box');
    body.setAttribute('scale', '0.4 0.4 0.4');
    let colorHex = data.type === 0 ? '#ff0055' : '#00ffff';
    body.setAttribute('color', colorHex);
    body.setAttribute('material', `emissive: ${colorHex}; emissiveIntensity: 1.5; roughness: 0.1`);

    // Cara frontal que contiene la flecha blanca de dirección de corte
    let arrowFace = document.createElement('a-plane');
    arrowFace.setAttribute('position', '0 0 0.21');
    arrowFace.setAttribute('scale', '0.3 0.3 0.3');
    arrowFace.setAttribute('material', 'src: #arrow-texture; transparent: true; shader: flat');

    cubeGroup.appendChild(body);
    cubeGroup.appendChild(arrowFace);

    // Sistema de Colisión/Corte directo por proximidad de los sables de Oculus
    cubeGroup.addEventListener('raycaster-intersection', function (evt) {
        // Validar si el color del sable coincide con el del bloque destruido
        let handId = evt.detail.el.id;
        if ((data.type === 0 && handId === 'leftHand') || (data.type === 1 && handId === 'rightHand')) {
            // Eliminar elemento de la escena simulando el corte exitoso
            cubeGroup.parentNode.removeChild(cubeGroup);
            triggerVisualPulse(colorHex);
        }
    });

    container.appendChild(cubeGroup);
}

// Efecto visual: Los raíles del escenario brillan intensamente al cortar una nota al ritmo de la música
function triggerVisualPulse(color) {
    let eye = document.getElementById('boss-eye');
    eye.setAttribute('material', `emissive: ${color}; emissiveIntensity: 5`);
    setTimeout(() => {
        eye.setAttribute('material', 'emissive: #00ffff; emissiveIntensity: 3');
    }, 150);
}

// Penalización: El escenario parpadea en rojo si dejas pasar un bloque sin cortarlo
function bossFlashAttack() {
    let leftRail = document.getElementById('left-rail');
    let rightRail = document.getElementById('right-rail');
    
    leftRail.setAttribute('color', '#ffffff');
    rightRail.setAttribute('color', '#ffffff');
    
    setTimeout(() => {
        leftRail.setAttribute('color', '#ff0055');
        rightRail.setAttribute('color', '#00ffff');
    }, 200);
}
