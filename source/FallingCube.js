import { BoxGeometry, Color, Mesh, MeshStandardMaterial, TetrahedronGeometry } from 'three';

export default class FallingCube {

    static OFFSCREEN = 5;

    constructor() {
        this.material = new MeshStandardMaterial({ opacity: 0.5 });
        this.mesh = new Mesh(new BoxGeometry(1, 1, 1), this.material);
        this.mesh.position.z = 0;
        this.age = 0;
        this.seed();
    }

    /**
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.mesh.rotation.x += this.speed * 0.5 * deltaTime;
        this.mesh.position.y -= this.speed * deltaTime;

        if (this.mesh.position.y < -FallingCube.OFFSCREEN) {
            this.seed();
            this.mesh.position.y = FallingCube.OFFSCREEN;
        }

        this.age += deltaTime;
    }

    seed() {
        const scale = Math.random() * 0.5 + 0.5;
        this.mesh.scale.x = scale;
        this.mesh.scale.y = scale;
        this.mesh.scale.z = scale;
        this.mesh.position.x = (Math.random() * 2 - 1) * 4;
        this.mesh.position.y = (Math.random() * 2 - 1) * 4;
        this.mesh.rotation.x = Math.PI * 2 * Math.random();
        this.mesh.rotation.y = Math.PI * 2 * Math.random();
        this.mesh.rotation.z = Math.PI * 2 * Math.random();
        this.material.color = new Color(`hsl(${(this.age * 30 + Math.random() * 60) % 360}, 25%, 50%)`);
        this.speed = 1 + Math.random() * 3;
    }

}