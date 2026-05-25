// Crear textura de flecha
const canvas = document.getElementById('arrow-texture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = "#ffffff"; ctx.beginPath();
ctx.moveTo(64, 15); ctx.lineTo(15, 85); ctx.lineTo(48, 85); ctx.lineTo(48, 115);
ctx.lineTo(80, 115); ctx.lineTo(80, 85); ctx.lineTo(113, 85); ctx.closePath(); ctx.fill();

// --- SISTEMA GENERADOR DE RÁFAGAS INFINITAS DE BLOQUES (STREAM ENGINE) ---
// Configuración dinámica por nivel para garantizar que NUNCA deje de haber bloques en pantalla.
const levels = {
    1: { audioId: 'track-shiver', decorId: 'decor-shiver', speed: 0.5, spawnInterval: 220 }, // Cada 220ms cae una nota (Ritmo Shiver)
    2: { audioId: 'track-something', decorId: 'decor-something', speed: 0.75, spawnInterval: 140 } // Cada 140ms (Locura extrema Backrooms)
};

let activeLevel = null;
let gameStarted = false;
let activeCubes = [];
let lastSpawnTime = 0;
let totalSpawned = 0;

const container = document.getElementById('note-container');
const hitSound = document.getElementById('hit-sound');

document.getElementById('btn-lvl1').addEventListener('click', () => launchLevel(1));
document.getElementById('btn-lvl2').addEventListener('click', () => launchLevel(2));

function launchLevel(lvlId) {
    if (gameStarted) return;
    activeLevel = levels[lvlId];
    gameStarted = true;

    document.getElementById('main-menu').setAttribute('visible', 'false');
    document.getElementById(activeLevel.decorId).setAttribute('visible', 'true');

    // Desactivar punteros láser interactivos
    document.getElementById('leftHand').removeAttribute('raycaster');
    document.getElementById('leftHand').removeAttribute('laser-controls');
    document.getElementById('rightHand').removeAttribute('raycaster');
    document.getElementById('rightHand').removeAttribute('laser-controls');
    
    // Encender las espadas neón de combate
    document.getElementById('saber-l').setAttribute('visible', 'true');
    document.getElementById('saber-r').setAttribute('visible', 'true');

    // Reproducción forzada de música
    const music = document.getElementById(activeLevel.audioId);
    music.currentTime = 0;
    music.volume = 1.0;
    music.play();
    
    lastSpawnTime = performance.now();
    runEngine();
}

function runEngine() {
    if (!gameStarted) return;
    let now = performance.now();

    // GENERADOR AUTOMÁTICO DE BLOQUES EN CADENA (Sincronizado con el Reloj del Sistema)
    if (now - lastSpawnTime >= activeLevel.spawnInterval) {
        // Alternar carriles e inclinaciones de flechas de manera aleatoria pero rítmica
        let positionsX = [-0.6, -0.2, 0.2, 0.6];
        let positionsY = [1.0, 1.3, 1.6];
        let rotations = [0, 90, 180, 270];
        
        let randomTrack = {
            x: positionsX[Math.floor(Math.random() * positionsX.length)],
            y: positionsY[Math.floor(Math.random() * positionsY.length)],
            rot: rotations[Math.floor(Math.random() * rotations.length)],
            type: totalSpawned % 2 // Alterna estrictamente entre mano izquierda (0) y derecha (1)
        };
        
        spawnCube(randomTrack);
        lastSpawnTime = now;
        totalSpawned++;

        // --- EFECTO DE EDICIÓN MÓVIL "BACKROOMS MUTANTES" (Solo Nivel 2) ---
        // Las paredes cambian de tamaño, parpadean y se tuercen imitando el edit glitch del video 3
        if (activeLevel === levels[2] && totalSpawned % 3 === 0) {
            glitchBackrooms();
        }
    }

    // OBTENER POSICIÓN ESPACIAL REAL DE LOS MANDOS DE OCULUS QUEST
    let leftSaberPos = new THREE.Vector3();
    let rightSaberPos = new THREE.Vector3();
    document.getElementById('leftHand').object3D.getWorldPosition(leftSaberPos);
    document.getElementById('rightHand').object3D.getWorldPosition(rightSaberPos);

    // BUCLE DE MOVIMIENTO Y COLISIÓN MATEMÁTICA EN ALTA VELOCIDAD
    for (let i = activeCubes.length - 1; i >= 0; i--) {
        let item = activeCubes[i];
        if (!item.el.parentNode) { activeCubes.splice(i, 1); continue; }

        let pos = item.el.getAttribute('position');
        pos.z += activeLevel.speed; // Desplazamiento ultra veloz hacia tu cara
        item.el.setAttribute('position', pos);

        let cubeWorldPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        let distLeft = leftSaberPos.distanceTo(cubeWorldPos);
        let distRight = rightSaberPos.distanceTo(cubeWorldPos);

        // Registro instantáneo del impacto al cruzarse con el rango de la espada (0.7 metros)
        if ((item.type === 0 && distLeft < 0.7) || (item.type === 1 && distRight < 0.7)) {
            hitSound.currentTime = 0; 
            hitSound.play(); // Audio de impacto de sable real
            
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
            continue;
        }

        // Si el bloque pasa de largo, se autodestruye para limpiar memoria en el Oculus Browser
        if (pos.z > 2.0) {
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
        }
    }

    requestAnimationFrame(runEngine);
}

function spawnCube(data) {
    let cubeGroup = document.createElement('a-entity');
    cubeGroup.setAttribute('position', `${data.x} ${data.y} -35`); // Spawn a larga distancia
    cubeGroup.setAttribute('rotation', `0 0 ${data.rot}`);

    let body = document.createElement('a-box');
    body.setAttribute('scale', '0.4 0.4 0.4');
    
    // Si es nivel de Backrooms, cambia el color a Neón Amarillo Eléctrico y Negro glitch
    let colorHex = data.type === 0 ? (activeLevel === levels[1] ? '#ff0055' : '#111111') : (activeLevel === levels[1] ? '#00ffff' : '#ffeb3b');
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

// Mecánica Glitch de los Backrooms: Mueve los cuartos enteros al ritmo salvaje de los bloques
function glitchBackrooms() {
    const wallL = document.getElementById('backroom-wall-l');
    const wallR = document.getElementById('backroom-wall-r');
    const roof = document.getElementById('backroom-roof');

    // Cambios locos de escala y rotación instantáneos (Estilo edición sincopada de video)
    let randomScaleY = 8 + Math.random() * 6;
    let randomZRot = (Math.random() - 0.5) * 15; // Se tuercen las paredes hacia los lados

    wallL.setAttribute('scale', `0.5 ${randomScaleY} 50`);
    wallR.setAttribute('scale', `0.5 ${randomScaleY} 50`);
    roof.setAttribute('rotation', `0 0 ${randomZRot}`);
    
    // Parpadeo de intensidad de luces del techo
    roof.setAttribute('material', `emissive: #ffffee; emissiveIntensity: ${Math.random() * 2}`);
}
