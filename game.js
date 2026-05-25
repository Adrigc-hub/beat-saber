// Configuración del mapa de ritmo (Tiempo en milisegundos, posición X, posición Y, Color)
// 0 = Izquierda(Rojo), 1 = Derecha(Azul)
const bossLevelTrack = [
    { time: 1000, x: -0.5, y: 1.2, type: 0 },
    { time: 1800, x: 0.5, y: 1.5, type: 1 },
    { time: 2500, x: -0.2, y: 1.0, type: 0 },
    { time: 3200, x: 0.2, y: 1.8, type: 1 },
    { time: 4000, x: -0.8, y: 1.4, type: 0 },
    { time: 4500, x: 0.8, y: 1.4, type: 1 },
    // Agrega aquí tantas notas como quieras siguiendo el ritmo de Shiver
];

let gameStarted = false;
let startTime = 0;
let noteIndex = 0;
const container = document.getElementById('note-container');
const audio = document.getElementById('shiver-music');

// Iniciar juego al presionar cualquier gatillo en el Oculus
window.addEventListener('keydown', startGame); 
window.addEventListener('click', startGame);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    
    // Ocultar menú flotante
    document.getElementById('menu').setAttribute('visible', 'false');
    
    // Reproducir música
    audio.play();
    startTime = performance.now();
    
    // Bucle principal del juego
    animate();
}

function animate() {
    if (!gameStarted) return;
    
    let currentTime = performance.now() - startTime;
    
    // Revisar si corresponde spawnear el siguiente bloque
    if (noteIndex < bossLevelTrack.length && currentTime >= bossLevelTrack[noteIndex].time) {
        spawnCube(bossLevelTrack[noteIndex]);
        noteIndex++;
    }
    
    // Mover los bloques activos hacia el jugador (Eje Z)
    let cubes = document.querySelectorAll('.cube');
    cubes.forEach(cube => {
        let pos = cube.getAttribute('position');
        pos.z += 0.2; // Velocidad del bloque (Ajustable)
        cube.setAttribute('position', pos);
        
        // Si pasa detrás del jugador, se elimina (Fallo)
        if (pos.z > 2) {
            cube.parentNode.removeChild(cube);
            triggerBossAttack(); // Animación de castigo del Jefe
        }
    });
    
    requestAnimationFrame(animate);
}

function spawnCube(data) {
    let cube = document.createElement('a-box');
    cube.setAttribute('class', 'cube');
    cube.setAttribute('position', `${data.x} ${data.y} -30`); // Aparecen desde el fondo del Boss
    cube.setAttribute('scale', '0.3 0.3 0.3');
    
    // Definir color según la mano
    let color = data.type === 0 ? '#ff1744' : '#00e5ff';
    cube.setAttribute('color', color);
    cube.setAttribute('material', `emissive: ${color}; emissiveIntensity: 1`);
    
    // Detectar corte con los sables (Raycaster de las manos de Oculus)
    cube.addEventListener('raycaster-intersection', function () {
        // Efecto visual al destruir
        cube.parentNode.removeChild(cube);
        // Aquí puedes sumar puntos a un marcador
    });

    container.appendChild(cube);
}

// Movimiento estético del Boss cuando fallas una nota
function triggerBossAttack() {
    const boss = document.getElementById('boss');
    boss.setAttribute('animation', 'property: position; to: 0 5 -23; dur: 100; dir: alternate; loop: 2');
}

// --- MODO EDITOR DE NIVELES MANUAL ---
// Si estás probando en PC o con teclado y pulsas 'K' (Mano Izq) o 'L' (Mano Der), 
// imprimirá en la consola del navegador los tiempos exactos para que crees tu propio mapa.
window.addEventListener('keypress', (e) => {
    if(gameStarted) {
        let timestamp = Math.round(performance.now() - startTime);
        if(e.key === 'k') console.log(`{ time: ${timestamp}, x: -0.5, y: 1.4, type: 0 },`);
        if(e.key === 'l') console.log(`{ time: ${timestamp}, x: 0.5, y: 1.4, type: 1 },`);
    }
});
