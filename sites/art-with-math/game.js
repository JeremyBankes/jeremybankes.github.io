import { Game, Renderer, Camera, Vector, Anchor, Texture } from './engine.js'

class ViewCamera extends Camera {

    /**
     * @param {object} options
     * @param {number} options.screenWidth
     * @param {number} options.screenHeight
     * @param {number} options.pixelsPerUnit
     */
    constructor(options) {
        super();
        this.screenWidth = options.screenWidth;
        this.screenHeight = options.screenHeight;
        this.pixelsPerUnit = options.pixelsPerUnit;
        this.position = new Vector();
        this.zoom = 1;
    }

    toScreen(x, y, width, height) {
        x -= this.position.x;
        y -= this.position.y;
        x *= this.pixelsPerUnit * this.zoom;
        y *= this.pixelsPerUnit * this.zoom;
        x += this.screenWidth / 2;
        y += this.screenHeight / 2;
        width *= this.pixelsPerUnit * this.zoom;
        height *= this.pixelsPerUnit * this.zoom;
        return [Math.round(x), Math.round(y), Math.round(width), Math.round(height)];
    }

    fromScreen(x, y, width = 0, height = 0) {
        width /= this.pixelsPerUnit * this.zoom;
        height /= this.pixelsPerUnit * this.zoom;
        x -= this.screenWidth / 2;
        y -= this.screenHeight / 2;
        x /= this.pixelsPerUnit * this.zoom;
        y /= this.pixelsPerUnit * this.zoom;
        x += this.position.x;
        y += this.position.y;
        return [x, y, width, height];
    }

}

class Bone {

    /**
     * @param {object} options 
     * @param {object} options.a
     * @param {object} options.b
     * @param {number} options.a.x
     * @param {number} options.a.y
     * @param {number} options.b.x
     * @param {number} options.b.y
     * @param {Bone} options.parent
     */
    constructor(options) {
        this.a = new Vector();
        this.b = new Vector();
        if (options.a) { this.a.x = options.a.x; this.a.y = options.a.y }
        if (options.b) { this.b.x = options.b.x; this.b.y = options.b.y }

        /** @type {Bone} */
        this.child = null;
        /** @type {Bone} */
        this.parent = null;
        if (options.parent) {
            if (options.parent.child) throw 'bone already has child';
            this.parent = options.parent;
            this.parent.child = this;
        }

    }

    /** @returns {Vector} */
    get absoluteA() { return this.parent ? this.parent.absoluteB : this.a.clone(); }

    /** @returns {Vector} */
    get absoluteB() { return this.parent ? this.parent.absoluteB.add(this.b) : this.b.clone(); }

    /**
     * @param {Renderer} renderer
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        const a = this.absoluteA;
        const b = this.absoluteB;

        renderer.style = 'white';
        renderer.drawLine(a.x, a.y, b.x, b.y);

        renderer.style = 'gray';
        const [, , size,] = renderer.camera.fromScreen(0, 0, 3, 0);

        if (!this.parent) renderer.fillCircle(a.x, a.y, size, Anchor.CENTER);
        renderer.fillCircle(b.x, b.y, size, Anchor.CENTER);

        if (this.child) {
            this.child.update(renderer, deltaTime);
        }
    }

}

class ArenaGame extends Game {

    async initialize() {
        this.camera = new ViewCamera({
            screenWidth: this.renderer.width,
            screenHeight: this.renderer.height,
            pixelsPerUnit: 64
        });

        this.timeScale = 1;

        this.bone1 = new Bone({ a: { x: 0, y: 0 } });
        this.bone2 = new Bone({ parent: this.bone1 });
        this.bone3 = new Bone({ parent: this.bone2 });

        this.bone1Speed = 1.0;
        this.bone2Speed = 1.0;
        this.bone3Speed = 1.0;

        this.bone1Size = 1.0;
        this.bone2Size = 1.0;
        this.bone3Size = 1.0;

        this.dotSize = 1.0;

        this.renderer.camera = this.camera;

        this.points = new Set();
    }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        deltaTime *= this.timeScale;
        super.update(renderer, deltaTime);

        this.bone1.update(renderer, deltaTime);

        this.bone1.b.x = this.bone1Size * Math.sin(this.age * this.bone1Speed);
        this.bone1.b.y = this.bone1Size * Math.cos(this.age * this.bone1Speed);

        this.bone2.b.x = this.bone2Size * Math.sin(this.age * this.bone2Speed);
        this.bone2.b.y = this.bone2Size * Math.cos(this.age * this.bone2Speed);

        this.bone3.b.x = this.bone3Size * Math.sin(this.age * this.bone3Speed);
        this.bone3.b.y = this.bone3Size * Math.cos(this.age * this.bone3Speed);

        const [, , size,] = renderer.camera.fromScreen(0, 0, this.dotSize, 0);
        renderer.style = `hsl(${Math.sin(this.age) * 180 + 180}, 50%, 50%)`;

        let from, to;
        for (const point of this.points) {
            to = point;
            if (from) {
                renderer.drawLine(from.x, from.y, to.x, to.y);
            }
            from = to;
        }

        if (this.timeScale > 0) {
            this.points.add(this.bone3.absoluteB.clone());
        }
    }

}

addEventListener('load', () => {
    const canvas = document.getElementById('game');
    const game = new ArenaGame({ canvas });

    const settings = document.forms.settings;

    const clear = () => game.points.clear();

    settings.timeScale.oninput = event => game.timeScale = parseFloat(event.target.value);

    const sliders = [
        settings.bone1Size,
        settings.bone2Size,
        settings.bone3Size,
        settings.bone1Speed,
        settings.bone2Speed,
        settings.bone3Speed,
        settings.dotSize
    ];

    settings.bone1Size.oninput = event => { game.bone1Size = parseFloat(event.target.value); };
    settings.bone2Size.oninput = event => { game.bone2Size = parseFloat(event.target.value); };
    settings.bone3Size.oninput = event => { game.bone3Size = parseFloat(event.target.value); };

    settings.bone1Speed.oninput = event => { game.bone1Speed = parseFloat(event.target.value); };
    settings.bone2Speed.oninput = event => { game.bone2Speed = parseFloat(event.target.value); };
    settings.bone3Speed.oninput = event => { game.bone3Speed = parseFloat(event.target.value); };

    settings.dotSize.oninput = event => { game.dotSize = parseFloat(event.target.value); };

    settings.onsubmit = () => {
        clear();
        return false;
    };

    game.start();
    canvas.focus();

    sliders.forEach(slider => {
        game[slider.name] = parseFloat(slider.value);
        let timeScaleBefore = game.timeScale;
        slider.onmousedown = () => {
            timeScaleBefore = game.timeScale;
            game.timeScale = 0;
        };
        slider.onmouseup = () => {
            game.timeScale = timeScaleBefore;
            if (slider !== dotSize) clear();
        };
    });
});