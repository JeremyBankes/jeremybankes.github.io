import { Clock, PerspectiveCamera, PointLight, Scene, Vector2, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import FallingCube from './FallingCube.js';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const clock = new Clock();

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.75, 0.5, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

const light = new PointLight();
light.position.z = 4;

scene.add(light);

const fallingCubes = /** @type {FallingCube[]} */ ([]);

for (let i = 0; i < 10; i++) {
    const fallingCube = new FallingCube();
    scene.add(fallingCube.mesh);
    fallingCubes.push(fallingCube);
}

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    for (const fallingCube of fallingCubes) {
        fallingCube.update(deltaTime);
    }

    composer.render();
};

animate();

const textCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('textCanvas'));

function updateText() {
    textCanvas.width = textCanvas.clientWidth;
    textCanvas.height = textCanvas.clientHeight;
    const context = textCanvas.getContext('2d');
    context.clearRect(0, 0, textCanvas.width, textCanvas.height);

    context.fillStyle = 'white';
    context.font = '24px monospace';

    context.save();
    context.filter = 'blur(8px)';
    context.fillText('jeremy.bankes' + '@gmail.com', 10, textCanvas.height - 50);
    context.fillText('https://github.com/JeremyBankes', 10, textCanvas.height - 10);

    context.restore();
    context.fillText('jeremy.bankes' + '@gmail.com', 10, textCanvas.height - 50);
    context.fillText('https://github.com/JeremyBankes', 10, textCanvas.height - 10);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    textCanvas.width = textCanvas.clientWidth;
    textCanvas.height = textCanvas.clientHeight;
    camera.updateProjectionMatrix();
    updateText();
});

updateText();
document.body.appendChild(renderer.domElement);