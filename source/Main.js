import * as THREE from 'three';
import { Clock, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import FallingCube from './FallingCube.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const clock = new Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.75, 0.5, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

const light = new THREE.PointLight();
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
});

document.body.appendChild(renderer.domElement);