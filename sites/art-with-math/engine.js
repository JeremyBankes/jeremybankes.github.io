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

class Texture {

    /**
     * @param {object} options
     * @param {string} options.source
     */
    constructor(options) {
        this.context = null;
        this.imageData = null;
        this.loaded = new Promise((resolve, reject) => {
            const image = new Image();
            image.src = options.source;
            image.onload = () => { this._onLoad(image); resolve(); };
            image.onerror = () => reject();
        });
    }

    get width() { return this.imageData.width; }
    get height() { return this.imageData.height; }

    /**
     * @param {Image} image 
     */
    _onLoad(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        this.context = canvas.getContext('2d');
        this.context.drawImage(image, 0, 0);
        this.imageData = this.context.getImageData(0, 0, image.width, image.height);
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
     * @param {Texture} texture
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} anchor 
     */
    drawTexture(texture, x, y, width, height, anchor = Anchor.TOP_LEFT) {
        [x, y] = Anchor.apply(anchor, x, y, width, height);
        [x, y, width, height] = this.camera.toScreen(x, y, width, height);
        this.context.drawImage(texture.context.canvas, x, y, width, height);
    }

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
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius
     * @param {number} anchor 
     */
    fillCircle(x, y, radius, anchor = Anchor.TOP_LEFT) {
        [x, y] = Anchor.apply(anchor, x, y, radius * 2, radius * 2);
        [x, y, radius, radius] = this.camera.toScreen(x, y, radius * 2, radius * 2);
        radius /= 2;
        this.context.beginPath();
        this.context.arc(x + radius - 0.5, y + radius - 0.5, radius - 0.5, 0, Math.PI * 2);
        this.context.fill();
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

export {
    Game,
    Renderer,
    Texture,
    Camera,
    Vector,
    Anchor
};