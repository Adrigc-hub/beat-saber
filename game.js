<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Beat Saber VR - Código Limpio</title>
    <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
    <script src="https://unpkg.com/aframe-environment-component@1.3.2/dist/aframe-environment-component.min.js"></script>
</head>
<body>

    <a-scene id="game-scene">
        <a-light type="ambient" color="#666"></a-light>
        <a-light type="directional" color="#fff" intensity="1" position="-1 4 2"></a-light>

        <a-entity id="env" environment="preset: starry; skyType: gradient; skyColor: #020205; horizonColor: #050510; grid: cross; gridColor: #111a2e"></a-entity>

        <a-entity id="decor-shiver" visible="false">
            <a-sphere id="shiver-moon" position="0 20 -60" radius="18" color="#ff0055" material="shader: flat; fog: false"></a-sphere>
            <a-entity id="boss-mesh" position="0 5 -25">
                <a-octahedron scale="3 5 3" color="#ff0055" material="wireframe: true; wireframeLineWidth: 5"></a-octahedron>
            </a-entity>
        </a-entity>

        <a-entity id="decor-something" visible="false">
            <a-sky id="backroom-sky" color="#111405"></a-sky>
            <a-box id="backroom-wall-l" position="-7 4 -20" scale="0.5 14 60" color="#dddd88" material="shader: flat"></a-box>
            <a-box id="backroom-wall-r" position="7 4 -20" scale="0.5 14 60" color="#dddd88" material="shader: flat"></a-box>
            <a-box id="backroom-roof" position="0 11 -20" scale="15 0.5 60" color="#ffffee" material="shader: flat"></a-box>
            
            <a-box id="backroom-p1" position="-3.5 4 -15" scale="1.8 8 1.8" color="#ffeb3b" material="shader: flat"></a-box>
            <a-box id="backroom-p2" position="3.5 4 -25" scale="1.8 8 1.8" color="#ffeb3b" material="shader: flat"></a-box>
        </a-entity>

        <a-entity id="neon-rails" position="0 0 -20">
            <a-box position="-2 0.05 0" scale="0.15 0.15 40" color="#ff0055" material="shader: flat"></a-box>
            <a-box position="2 0.05 0" scale="0.15 0.15 40" color="#00ffff" material="shader: flat"></a-box>
        </a-entity>

        <a-entity id="rig">
            <a-entity camera position="0 1.6 0" look-controls></a-entity>
            
            <a-entity id="leftHand" oculus-touch-controls="hand: left" laser-controls="hand: left" raycaster="objects: .menu-btn; far: 8">
                <a-entity id="saber-l" visible="false">
                    <a-cylinder rotation="90 0 0" radius="0.03" height="0.15" color="#333"></a-cylinder>
                    <a-cylinder position="0 0 -0.6" radius="0.02" height="1.2" rotation="90 0 0" color="#ff0055" material="shader: flat"></a-cylinder>
                </a-entity>
            </a-entity>

            <a-entity id="rightHand" oculus-touch-controls="hand: right" laser-controls="hand: right" raycaster="objects: .menu-btn; far: 8">
                <a-entity id="saber-r" visible="false">
                    <a-cylinder rotation="90 0 0" radius="0.03" height="0.15" color="#333"></a-cylinder>
                    <a-cylinder position="0 0 -0.6" radius="0.02" height="1.2" rotation="90 0 0" color="#00ffff" material="shader: flat"></a-cylinder>
                </a-entity>
            </a-entity>
        </a-entity>

        <a-entity id="note-container"></a-entity>

        <a-entity id="main-menu" position="0 1.6 -2.2">
            <a-plane width="2.5" height="1.5" color="#070a14" opacity="0.95">
                <a-text value="BEAT SABER VR CUSTOM" align="center" color="#00ffff" position="0 0.5 0.05" scale="0.5 0.5 0.5"></a-text>
                
                <a-plane id="btn-lvl1" width="2" height="0.3" position="0 0.05 0.05" color="#1e293b" class="menu-btn">
                    <a-text value="1. SHIVER (Geometry Dash)" align="center" color="#fff" position="0 0 0.02" scale="0.35 0.35 0.35"></a-text>
                </a-plane>

                <a-plane id="btn-lvl2" width="2" height="0.3" position="0 -0.4 0.05" color="#1e293b" class="menu-btn">
                    <a-text value="2. I FOUND SOMETHING" align="center" color="#fff" position="0 0 0.02" scale="0.35 0.35 0.35"></a-text>
                </a-plane>
            </a-plane>
        </a-entity>
    </a-scene>

    <script src="game.js"></script>
</body>
</html>
