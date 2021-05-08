class Game {

    /**
     * @param {object} options
     * @param {HTMLCanvasElement} options.canvas
     */
    constructor(options) {
        this.canvas = options.canvas;
        this.renderer = new Renderer({ context: this.canvas.getContext('2d') });
        this._age = 0;

        Input.register(this.canvas);
    }

    get age() { return this._age; }

    start() {
        this._run();
    }

    async initialize() { }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        renderer.clear();
        this._age += deltaTime;
    }

    async _run() {
        await this.initialize();
        let lastUpdateTime = performance.now();
        const update = currentTime => {
            this.update(this.renderer, (currentTime - lastUpdateTime) / 1000);
            lastUpdateTime = currentTime;
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

}

class Physics {

    static isOverlapping(x1, y1, width1, height1, x2, y2, width2, height2) {
        return x1 - width1 / 2 < x2 + width2 / 2 && x1 + width1 / 2 > x2 - width2 / 2 && y1 - height1 / 2 < y2 + height2 / 2 && y1 + height1 / 2 > y2 - height2 / 2;
    }

}

class Input {

    static register(element) {
        Input.element = element;
        Input.element.addEventListener('mousemove', event => Input.onMouseEvent(event));
        Input.element.addEventListener('mousedown', event => Input.onMouseEvent(event));
        Input.element.addEventListener('mouseup', event => Input.onMouseEvent(event));

        Input.element.addEventListener('keypress', event => Input.onKeyEvent(event));
        Input.element.addEventListener('keydown', event => Input.onKeyEvent(event));
        Input.element.addEventListener('keyup', event => Input.onKeyEvent(event));

        Input._cursor = new Vector();
        Input.pressed = new Set();
    }

    static get cursor() {
        return new Vector(
            Input._cursor.x * Input.element.width / Input.element.clientWidth,
            Input._cursor.y * Input.element.height / Input.element.clientHeight
        );
    }

    /**
     * @param {MouseEvent} event 
     */
    static onMouseEvent(event) {
        if (event.type === 'mousemove') {
            const bounds = event.target.getBoundingClientRect();
            Input._cursor.x = event.clientX - bounds.left;
            Input._cursor.y = event.clientY - bounds.top;
        }
    }

    /**
     * @param {KeyboardEvent} event 
     */
    static onKeyEvent(event) {
        if (event.type === 'keydown') {
            Input.pressed.add(event.key);
        } else if (event.type === 'keyup') {
            Input.pressed.delete(event.key);
        }
    }

    /**
     * @param {string} key 
     * @returns {bool}
     */
    static isKeyPressed(key) {
        return Input.pressed.has(key);
    }

}

class Anchor {

    static TOP = 0;
    static TOP_RIGHT = 1;
    static RIGHT = 2;
    static BOTTOM_RIGHT = 3;
    static BOTTOM = 4;
    static BOTTOM_LEFT = 5;
    static LEFT = 6;
    static TOP_LEFT = 7;
    static CENTER = 8;

    /**
     * @param {number} anchor
     * @param {number} x
     * @param {number} y
     * @param {number} width 
     * @param {number} height 
     */
    static apply(anchor, x, y, width, height) {
        switch (anchor) {
            case Anchor.TOP_LEFT: break;
            case Anchor.TOP: x -= width / 2; break;
            case Anchor.TOP_RIGHT: x -= width; break;
            case Anchor.RIGHT: x -= width; y -= height / 2; break;
            case Anchor.BOTTOM_RIGHT: x -= width; y -= height; break;
            case Anchor.BOTTOM: x -= width / 2; y -= height; break;
            case Anchor.BOTTOM_LEFT: y -= height; break;
            case Anchor.LEFT: y -= height / 2; break;
            case Anchor.CENTER: x -= width / 2; y -= height / 2; break;
            default: throw 'invalid anchor constant';
        }
        return [x, y];
    }

    static opposite(anchor) { return (anchor + 4) % 8; }

}

class Vector {

    constructor(x = 0, y = x) { this.x = x; this.y = y; }

    set(vector) { this.x = vector.x; this.y = vector.y; return this; }
    add(vector) { this.x += vector.x; this.y += vector.y; return this; }
    subtract(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
    multiply(vector) { this.x *= vector.x; this.y *= vector.y; return this; }
    divide(vector) { this.x /= vector.x; this.y /= vector.y; return this; }

    distance(vector) { return Math.sqrt((this.x - vector.x) * (this.x - vector.x) + (this.y - vector.y) * (this.y - vector.y)); }
    magnitude() { return this.distance(new Vector()); }
    normalize() { return this.divide(new Vector(this.magnitude())); }
    equals(vector) { return this.x === vector.x && this.y === vector.y; }
    isZero() { return this.x === 0 && this.y === 0; }
    clone() { return new Vector(this.x, this.y); }

}

class Camera {

    toScreen(x, y, width, height) { return [Math.round(x), Math.round(y), Math.round(width), Math.round(height)]; }

    fromScreen(x, y, width, height) { return [x, y, width, height]; }

}

class WorldCamera extends Camera {

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

class Renderer {

    /**
     * @param {object} options 
     * @param {CanvasRenderingContext2D} options.context
     * @param {Camera} options.camera
     */
    constructor(options) {
        this.context = options.context;
        this.imageData = this.context.getImageData(0, 0, this.width, this.height);
        this.camera = options.camera || new Camera();
    }

    set style(style) {
        this.context.fillStyle = style;
        this.context.strokeStyle = style;
    }

    get width() { return this.context.canvas.width; }

    get height() { return this.context.canvas.height; }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} anchor 
     */
    drawRectangle(x, y, width, height, anchor = Anchor.TOP_LEFT) {
        [x, y] = Anchor.apply(anchor, x, y, width, height);
        [x, y, width, height] = this.camera.toScreen(x, y, width, height);
        this.context.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} anchor 
     */
    fillRectangle(x, y, width, height, anchor = Anchor.TOP_LEFT) {
        [x, y] = Anchor.apply(anchor, x, y, width, height);
        [x, y, width, height] = this.camera.toScreen(x, y, width, height);
        this.context.fillRect(x, y, width, height);
    }

    /**
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     */
    drawLine(x1, y1, x2, y2) {
        [x1, y1] = this.camera.toScreen(x1, y1);
        [x2, y2] = this.camera.toScreen(x2, y2);
        this.context.beginPath();
        this.context.moveTo(x1 + 0.5, y1 + 0.5);
        this.context.lineTo(x2 + 0.5, y2 + 0.5);
        this.context.stroke();
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius
     * @param {number} anchor 
     */
    drawCircle(x, y, radius, anchor = Anchor.TOP_LEFT) {
        [x, y] = Anchor.apply(anchor, x, y, radius * 2, radius * 2);
        [x, y, radius, radius] = this.camera.toScreen(x, y, radius * 2, radius * 2);
        radius /= 2;
        this.context.beginPath();
        this.context.arc(x + radius - 0.5, y + radius - 0.5, radius - 0.5, 0, Math.PI * 2);
        this.context.stroke();
    }

    /**
     * @param {Vector} vector 
     * @param {number} x 
     * @param {number} y 
     */
    drawVector(vector, x, y) {
        this.drawLine(x, y, x + vector.x, y + vector.y);
        const head = this.camera.fromScreen(0, 0, 3, 3);
        this.fillRectangle(x + vector.x, y + vector.y, head[2], head[3], Anchor.CENTER);
    }

    /**
     * 
     * @param {string} string 
     * @param {number} x 
     * @param {number} y 
     * @param {number} anchor 
     */
    drawString(string, x, y, anchor = Anchor.TOP_LEFT) {
        const metrics = this.context.measureText(string);
        let width = metrics.width;
        let height = metrics.actualBoundingBoxAscent;
        [x, y] = Anchor.apply(anchor, x, y, width, height);
        [x, y] = this.camera.toScreen(x, y, width, height);
        this.context.font = '12px monospace';
        this.context.textAlign = 'left';
        this.context.fillText(string, x, y + metrics.actualBoundingBoxAscent);
    }

    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

}

class Chunk {

    static TILE_SIZE = 1 / 4;

    /**
     * @param {object} options 
     * @param {string} options.source
     * @param {number} options.width
     * @param {number} options.height
     */
    constructor(options) {
        this.width = options.width * Chunk.TILE_SIZE;
        this.height = options.height * Chunk.TILE_SIZE;
        this.collisionObjects = [];
        this.loaded = fetch(options.source).then(response => response.text()).then(data => {
            const lines = data.split('\n');
            for (let i = 0; i < options.height; i++) {
                const line = lines[i];
                for (let j = 0; j < options.width; j++) {
                    const solid = line.charAt(j) === '#';

                    if (solid) {
                        const tileX = Math.floor(j * Chunk.TILE_SIZE);
                        const tileY = Math.floor(i * Chunk.TILE_SIZE);

                        const index = tileY * this.width + tileX;
                        if (!(index in this.collisionObjects)) {
                            this.collisionObjects[index] = [];
                        }

                        const x = j * Chunk.TILE_SIZE;
                        const y = i * Chunk.TILE_SIZE;

                        this.collisionObjects[index].push([x, y]);
                    }
                }
            }
        });
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height
     */
    getCollisionObjects(x, y, width, height) {
        const collisionObjects = [];
        const topLeft = [Math.floor(x - width / 2), Math.floor(y - height / 2)];
        const bottomRight = [Math.floor(x + width / 2), Math.floor(y + height / 2)];
        for (let i = topLeft[1]; i <= bottomRight[1]; i++) {
            for (let j = topLeft[0]; j <= bottomRight[0]; j++) {
                const objects = this.collisionObjects[i * this.width + j];
                if (objects) {
                    for (const object of objects) {
                        if (Physics.isOverlapping(...object, Chunk.TILE_SIZE, Chunk.TILE_SIZE, x, y, width, height)) {
                            collisionObjects.push([...object, Chunk.TILE_SIZE, Chunk.TILE_SIZE]);
                        }
                    }
                }
            }
        }
        return collisionObjects;
    }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        renderer.style = `hsl(0, 50%, 50%)`;
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const objects = this.collisionObjects[i * this.width + j];
                if (objects && objects.length > 0) {
                    for (const object of objects) {
                        renderer.drawRectangle(object[0], object[1], Chunk.TILE_SIZE, Chunk.TILE_SIZE, Anchor.CENTER);
                    }
                }
            }
        }
    }

}

class Entity {

    /**
     * @param {Chunk} chunk 
     */
    constructor(chunk) {
        this.position = new Vector();
        this.velocity = new Vector();
        this.birth = Date.now() / 1000;
        this.chunk = chunk;
    }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        const movement = new Vector(deltaTime).multiply(this.velocity);
        this.position.add(movement);
    }

}

class Character extends Entity {

    /**
     * @param {Chunk} chunk 
     */
    constructor(chunk) {
        super(chunk);
        this.direction = new Vector();
        this.radius = 0.5;
    }

    /**
     * @returns {Vector}
     */
    findResolutionPoint() {
        const objects = this.chunk.getCollisionObjects(this.position.x, this.position.y, this.radius * 3, this.radius * 3);
        let point = null;
        for (const object of objects) {
            const left = object[0] - object[2] / 2;
            const right = object[0] + object[2] / 2;
            const top = object[1] - object[3] / 2;
            const bottom = object[1] + object[3] / 2;

            let option = new Vector();
            if (this.position.x < left) option.x = Math.max(this.position.x, left);
            else option.x = Math.min(this.position.x, right);
            if (this.position.y < top) option.y = Math.max(this.position.y, top);
            else option.y = Math.min(this.position.y, bottom);
            const distance = option.distance(this.position);
            if (distance < this.radius && (point == null || distance < point.distance(this.position))) point = option;
        }
        return point;
    }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        this.direction.x = 0;
        this.direction.y = 0;

        if (Input.isKeyPressed('w')) this.direction.y -= 1;
        if (Input.isKeyPressed('s')) this.direction.y += 1;
        if (Input.isKeyPressed('d')) this.direction.x += 1;
        if (Input.isKeyPressed('a')) this.direction.x -= 1;
        if (!this.direction.isZero()) {
            this.direction.normalize();
            this.velocity.add(this.direction);
        }
        this.velocity.multiply(new Vector(0.75));
        
        renderer.style = 'white';
        renderer.drawVector(this.velocity.clone().multiply(new Vector(0.25)), this.position.x, this.position.y);
        renderer.drawCircle(this.position.x, this.position.y, this.radius, Anchor.CENTER);
        super.update(renderer, deltaTime);

        let point;
        let count = 0;
        while ((point = this.findResolutionPoint(renderer)) && count++ < 3) {
            const distance = this.position.clone().subtract(point);
            const resolution = new Vector(this.radius - distance.magnitude()).multiply(distance.clone().normalize());
            this.position.add(resolution);
            renderer.style = 'red';
            renderer.drawVector(resolution.multiply(new Vector(10)), point.x, point.y);
        }
    }

}

class DemoGame extends Game {

    async initialize() {
        this.fixedCamera = new Camera();
        this.worldCamera = new WorldCamera({
            screenWidth: this.renderer.width,
            screenHeight: this.renderer.height,
            pixelsPerUnit: 64
        });

        this.chunk = new Chunk({ width: 32, height: 32, source: 'world.txt' });
        await this.chunk.loaded;

        this.player = new Character(this.chunk);
        this.player.position.x = 0.625;
        this.player.position.y = 0.625;
    }

    /**
     * @param {Renderer} renderer 
     * @param {number} deltaTime 
     */
    update(renderer, deltaTime) {
        super.update(renderer, deltaTime);

        this.renderer.camera = this.fixedCamera;
        for (let i = -1; i < 3; i++) {
            for (let j = -1; j < 3; j++) {
                let x = i + this.worldCamera.position.x - this.worldCamera.position.x % 1;
                let y = j + this.worldCamera.position.y - this.worldCamera.position.y % 1;
                let labelX = Math.round(x).toString();
                let labelY = Math.round(y).toString();
                [x, y] = this.worldCamera.toScreen(x, y);
                this.renderer.style = 'rgba(255, 255, 255, 0.01)';
                renderer.drawLine(0, y, this.renderer.width, y);
                renderer.drawLine(x, 0, x, this.renderer.height);
                this.renderer.style = 'white';
                this.renderer.drawString(labelX, x, 10, Anchor.TOP);
                this.renderer.drawString(labelY, 10, y, Anchor.LEFT);
            }
        }

        this.renderer.camera = this.worldCamera;
        this.chunk.update(renderer, deltaTime);
        this.player.update(renderer, deltaTime);
        this.renderer.camera.position.set(this.player.position);

        this.renderer.camera = this.fixedCamera;
        this.renderer.style = 'white';
        this.renderer.drawString(`ft: ${(deltaTime * 1000).toFixed(2)}ms`, 10, 10, Anchor.TOP_LEFT);
        this.renderer.drawString(`x: ${this.player.position.x.toFixed(3)} y: ${this.player.position.y.toFixed(3)}`, 10, 20, Anchor.TOP_LEFT);
    }

}

const game = new DemoGame({
    canvas: document.getElementById('game')
});

game.start();

game.canvas.focus();