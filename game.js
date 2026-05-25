const canvas = document.getElementById('arrow-texture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = "#ffffff"; ctx.beginPath();
ctx.moveTo(64, 15); ctx.lineTo(15, 85); ctx.lineTo(48, 85); ctx.lineTo(48, 115);
ctx.lineTo(80, 115); ctx.lineTo(80, 85); ctx.lineTo(113, 85); ctx.closePath(); ctx.fill();

const levels = {
    1: {
        audioId: 'track-shiver',
        decorId: 'decor-shiver',
        speed: 0.65,
        tracks: [
            { time: 800, x: -0.4, y: 1.1, rot: 0, type: 0 },
            { time: 1100, x: 0.4, y: 1.1, rot: 0, type: 1 },
            { time: 1400, x: -0.4, y: 1.5, rot: 180, type: 0 },
            { time: 1700, x: 0.4, y: 1.5, rot: 180, type: 1 },
            { time: 2000, x: -0.6, y: 1.3, rot: 90, type: 0 },
            { time: 2200, x: 0.6, y: 1.3, rot: 270, type: 1 },
            { time: 2400, x: -0.2, y: 1.6, rot: 180, type: 0 },
            { time: 2600, x: 0.2, y: 1.0, rot: 0, type: 1 },
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
        speed: 0.85,
        tracks: [
            { time: 500, x: -0.3, y: 1.4, rot: 180, type: 0 },
            { time: 700, x: 0.3, y: 1.4, rot: 180, type: 1 },
            { time: 1000, x: -0.6, y: 1.0, rot: 90, type: 0 },
            { time: 1200, x: 0.6, y: 1.6, rot: 90, type: 1 },
            { time: 1500, x: -0.2, y: 1.5, rot: 0, type: 1 }, 
            { time: 1700, x: 0.2, y: 1.1, rot: 180, type: 0 },
            { time: 2200, x: -0.5, y: 1.6, rot: 45, type: 0 },
            { time: 2350, x: 0.5, y: 1.0, rot: 225, type: 1 },
            { time: 2500, x: -0.5, y: 1.0, rot: 135, type: 0 },
            { time: 2650, x: 0.5, y: 1.6, rot: 315, type: 1 }
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

// Eventos de selección con el puntero láser de los mandos
document.getElementById('btn-lvl1').addEventListener('click', () => launchLevel(1));
document.getElementById('btn-lvl2').addEventListener('click', () => launchLevel(2));

function launchLevel(lvlId) {
    if (gameStarted) return;
    activeLevel = levels[lvlId];
    gameStarted = true;

    // Ocultar el menú 
    document.getElementById('main-menu').setAttribute('visible', 'false');
    document.getElementById(activeLevel.decorId).setAttribute('visible', 'true');
    
    if(lvlId === 2) {
        document.getElementById('rail-l').setAttribute('color', '#78350f');
        document.getElementById('rail-r').setAttribute('color', '#ca8a04');
    }

    // --- TRANSICIÓN: APAGAR LÁSER Y PRENDER SABLES ---
    // Quitamos el componente del puntero para que no estorbe al jugar
    document.getElementById('leftHand').removeAttribute('raycaster');
    document.getElementById('leftHand').removeAttribute('laser-controls');
    document.getElementById('rightHand').removeAttribute('raycaster');
    document.getElementById('rightHand').removeAttribute('laser-controls');
    
    // Hacemos visibles los modelos 3D de los sables de neón
    document.getElementById('saber-l').setAttribute('visible', 'true');
    document.getElementById('saber-r').setAttribute('visible', 'true');

    // Arrancar la canción seleccionada
    const music = document.getElementById(activeLevel.audioId);
    music.volume = 0.9;
    music.play();
    
    startTime = performance.now();
    runEngine();
}

function runEngine() {
    if (!gameStarted) return;
    let elapsed = performance.now() - startTime;

    if (trackIndex < activeLevel.tracks.length && elapsed >= activeLevel.tracks[trackIndex].time) {
        spawnCube(activeLevel.tracks[trackIndex]);
        trackIndex++;
    }

    let leftSaberPos = new THREE.Vector3();
    let rightSaberPos = new THREE.Vector3();
    document.getElementById('leftHand').object3D.getWorldPosition(leftSaberPos);
    document.getElementById('rightHand').object3D.getWorldPosition(rightSaberPos);

    for (let i = activeCubes.length - 1; i >= 0; i--) {
        let item = activeCubes[i];
        if (!item.el.parentNode) { activeCubes.splice(i, 1); continue; }

        let currentPos = item.el.getAttribute('position');
        currentPos.z += activeLevel.speed;
        item.el.setAttribute('position', currentPos);

        let cubeWorldPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
        let distLeft = leftSaberPos.distanceTo(cubeWorldPos);
        let distRight = rightSaberPos.distanceTo(cubeWorldPos);

        if ((item.type === 0 && distLeft < 0.65) || (item.type === 1 && distRight < 0.65)) {
            hitSound.currentTime = 0;
            hitSound.play();
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
            continue;
        }

        if (currentPos.z > 1.5) {
            item.el.parentNode.removeChild(item.el);
            activeCubes.splice(i, 1);
        }
    }

    requestAnimationFrame(runEngine);
}

function spawnCube(data) {
    let cubeGroup = document.createElement('a-entity');
    cubeGroup.setAttribute('position', `${data.x} ${data.y} -40`);
    cubeGroup.setAttribute('rotation', `0 0 ${data.rot}`);

    let body = document.createElement('a-box');
    body.setAttribute('scale', '0.42 0.42 0.42');
    
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

    activeCubes.push({ el: cubeGroup, type: data.type });
}
