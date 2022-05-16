class Game {

    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.hitSound = new Audio('audio/hit.wav');
        this.breakSound = new Audio('audio/break.wav');
        this.missSound = new Audio('audio/miss.wav');

        this.input = new Input(canvas);
        this.scoreboard = new Scoreboard();

        const onCanvasResize = () => {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        };

        this.canvas.addEventListener('resize', () => onCanvasResize());
        onCanvasResize();
    }

    async start() {
        await this.initialize();
        let lastTime = performance.now();
        const update = (/** @type {number} */ currentTime) => {
            this.update(this.context, (currentTime - lastTime) / 1000);
            lastTime = currentTime;
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    setup() {
        /**
         * @type {Target[]}
         */
        this.targets = [];
        /**
         * @type {any[]}
         */
        this.particles = [];

        this.hits = 0;
        this.score = 0;
        this.hurt = 0;
        this.bonus = 0;
        this.spawnInterval = 0;
        this.lives = 3;
        this.restarting = false;
        this.playAgain = false;
        this.highscore = false;

        const target = this.spawnTarget();
        target.lifetime = 0xFFFFFF;
    }

    spawnTarget() {
        const radius = 20 + Math.random() * 10;
        const x = radius + (this.canvas.width - radius * 2) * Math.random();
        const y = radius + (this.canvas.height - radius * 2) * Math.random();
        const target = new Target([x, y], radius);
        this.targets.push(target);
        return target;
    }

    async initialize() {
        this.setup();

        const getDistance = (/** @type {number[]} */ a, /** @type {number[]} */ b) => {
            return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
        }

        const spawnCycle = () => {
            if (this.restarting) return;
            this.spawnTarget();
            setTimeout(spawnCycle, this.spawnInterval);
        }

        this.input.mouseEventListeners.push((/** @type {Event} */ event) => {
            if (event.type === 'mousedown') {
                if (this.restarting) {
                    if (this.playAgain) {
                        this.setup();
                    }
                    return;
                }
                let hit = false;
                for (const target of this.targets) {
                    const distance = getDistance(target.position, this.input.cursorPosition);
                    if (distance < target.radius) {
                        if (this.hits == 0) spawnCycle();

                        this.hits++;
                        this.spawnInterval = 1900 * Math.pow(Math.E, Math.log(0.015) * this.hits / 299) + 100;

                        const accuracy = 1 - (distance / target.radius);

                        let points = 100 + (accuracy * accuracy * target.getProgress()) * 100;

                        if (accuracy > 0.95) {
                            points += 100;
                            this.bonus = 1;
                            this.lives++;
                        }

                        this.score += points;
                        this.hitSound.play();

                        this.particles.push(new WordEffect([target.position[0], target.position[1] - 50], `+${points.toFixed(0)}`, 'white'));

                        hit = true;
                        target.removed = true;
                        target.pop(this.particles, true, accuracy);
                        if (this.targets.length < 2) this.spawnTarget();
                        break;
                    }
                }

                if (!hit) {
                    this.score = Math.max(0, this.score * 0.95);
                    this.missSound.play();
                    this.hurt = 1;
                    this.lives--;
                    if (this.lives == 0) this.lose();
                }
            }
        });
    }

    /**
     * @param {CanvasRenderingContext2D} context 
     * @param {number} deltaTime 
     */
    update(context, deltaTime) {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.targets = this.targets.filter((/** @type {{ removed: any; isAlive: () => any; pop: (arg0: any, arg1: boolean) => void; }} */ target) => {
            if (target.removed) {
                if (!target.isAlive()) {
                    target.pop(this.particles, false);
                    this.breakSound.play();
                    this.hurt = 1;
                    this.lives--;
                    if (this.lives == 0) this.lose();
                }
                return false;
            } else {
                return true;
            }
        });

        this.targets.forEach((/** @type {{ update: (arg0: CanvasRenderingContext2D, arg1: number) => any; }} */ target) => target.update(context, this.restarting ? 0 : deltaTime));

        this.particles = this.particles.filter((/** @type {{ isAlive: () => any; }} */ particle) => particle.isAlive());
        this.particles.forEach((/** @type {{ update: (arg0: CanvasRenderingContext2D, arg1: number) => any; }} */ particle) => particle.update(context, deltaTime));

        context.fillStyle = '#FFFFFF';
        context.font = '48px monospace';
        context.textAlign = 'center';
        context.fillText('Score: ' + Math.round(this.score), this.canvas.width / 2, this.canvas.height / 2);
        context.fillText('Lives: ' + this.lives, this.canvas.width / 2, this.canvas.height / 2 + 50);

        if (this.restarting) {
            context.fillStyle = '#AA0000';
            context.font = '64px monospace';
            context.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 200);

            if (this.highscore) {
                context.fillStyle = '#00AA00';
                context.font = '32px monospace';
                context.fillText('!!! NEW HIGHSCORE !!!', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height / 8);
            }

            if (this.playAgain) {
                context.fillStyle = '#AAAA00';
                context.font = '32px monospace';
                context.fillText('Click anywhere to play again', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height * 2 / 8);
            }
        }

        if (this.hurt > 0) {
            context.fillStyle = `rgba(255, 0, 0, ${this.hurt * 0.5})`;
            context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.hurt -= deltaTime;
            if (this.hurt < 0) this.hurt = 0;
        }

        if (this.bonus > 0) {
            context.fillStyle = `rgba(0, 255, 0, ${this.bonus * 0.5})`;
            context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.bonus -= deltaTime;
            if (this.bonus < 0) this.bonus = 0;
        }

        this.scoreboard.update(context, deltaTime);
    }

    lose() {
        this.restarting = true;
        if (this.scoreboard.isWorthy(this.score)) {
            this.scoreboard.newScore(this.score);
            this.highscore = true;
        }
        setTimeout(() => {
            this.playAgain = true;
        }, 2000);
    }

}

class Scoreboard {

    constructor() {
        this.scores = [];
        this.size = 5;


        const pieces = document.cookie.split('=');
        if (pieces.length == 2) {
            this.scores.push(...pieces[1].split(',').map(parseFloat));
        }
    }

    /**
     * @param {number} score
     */
    newScore(score) {
        this.scores.push(score);
        this.scores = this.scores.sort((a, b) => b - a).slice(0, this.size);
        document.cookie = 'scores=' + this.scores.join();
    }

    /**
     * @param {number} score
     */
    isWorthy(score) {
        if (this.scores.length < this.size) return true;
        return score > this.scores[this.scores.length - 1];
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} deltaTime
     */
    update(context, deltaTime) {
        if (this.scores.length > 0) {
            context.textAlign = 'left';
            context.fillStyle = '#FFFF00';
            context.font = '16px monospace';
            context.fillText('Highscores', 10, 20);
            context.fillStyle = '#FFFFFF';
            this.scores.forEach((score, index) => {
                context.fillText(Math.round(score).toFixed(0), 18, 24 + 16 * (index + 1));
            });
        }
    }

}

class Input {

    /**
     * @param {HTMLElement} element 
     */
    constructor(element) {
        this.cursorPosition = [0, 0];
        this.bounds = element.getBoundingClientRect();
        this.mouseEventListeners = [];
        this.element = element;
        element.addEventListener('mousemove', event => this.onMouseEvent(event));
        element.addEventListener('mousedown', event => this.onMouseEvent(event));
        element.addEventListener('mouseup', event => this.onMouseEvent(event));
        element.addEventListener('resize', event => this.onResize(event));
    }

    /**
     * @param {Event} event
     */
    onResize(event) {
        this.bounds = this.element.getBoundingClientRect();
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseEvent(event) {
        if (event.type === 'mousemove') {
            this.cursorPosition[0] = event.clientX - this.bounds.left;
            this.cursorPosition[1] = event.clientY - this.bounds.top;
        } else if (event.type === 'mousedown') {

        }
        this.mouseEventListeners.forEach(listener => listener(event));
    }

}

class Target {

    /**
     * @param {number[]} position 
     * @param {number} radius 
     */
    constructor(position, radius = 10) {
        this.position = position;
        this.radius = radius;
        this.age = 0;
        this.lifetime = 3;
        this.varience = Math.random();
        this.removed = false;
    }

    /**
     * @param {(Particle | WordEffect)[]} particles
     */
    pop(particles, good = true, accuracy = 0) {
        if (good) {
            for (let i = 0; i < 10; i++) {
                let velocity = [Math.sin(Math.PI * 2 * Math.random()) * 200, -500 * Math.random()];
                particles.push(new Particle([...this.position], velocity, this.color));
            }

            let word;
            if (accuracy > 0.95) word = 'Perfect!';
            else if (accuracy > 0.80) word = 'Amazing!';
            else if (accuracy > 0.50) word = 'Good';
            else if (accuracy > 0.25) word = 'Decent';
            else word = 'Barely';

            const color = `hsl(${accuracy * 120}, 100%, 50%)`;
            particles.push(new WordEffect(this.position, word, color));

        } else {
            for (let i = 0; i < 15; i++) {
                let velocity = [Math.sin(Math.PI * 2 * Math.random()) * 400, -600 * Math.random()];
                const particle = new Particle([...this.position], velocity, 'red');
                particles.push(particle);
                particle.eccentricity = 0.3 + Math.random() * 0.7;
                particle.bad = true;
            }
        }
    }

    getProgress() {
        return this.age / this.lifetime;
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} deltaTime
     */
    update(context, deltaTime) {
        context.fillStyle = this.color = `hsl(${120 - this.age * 120 / this.lifetime}, ${deltaTime == 0 ? 50 : 75}%, 50%)`;
        context.beginPath();
        context.arc(this.position[0], this.position[1], this.radius, 0, Math.PI * 2, false);
        context.fill();
        this.age += deltaTime;
        if (!this.isAlive()) this.removed = true;
    }

    isAlive() {
        return this.age < this.lifetime;
    }

}

class WordEffect {

    /**
     * @param {number[]} position
     * @param {string} word
     * @param {string} color
     */
    constructor(position, word, color) {
        this.position = position;
        this.word = word;
        this.color = color;

        this.eccentricity = Math.random();

        this.age = 0;
        this.lifetime = 1;
        this.rotation = 0;
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} deltaTime
     */
    update(context, deltaTime) {
        const progress = this.age / this.lifetime;
        context.save();
        context.translate(this.position[0], this.position[1]);
        context.scale(1 - progress, 1 - progress);
        context.rotate(this.rotation);
        this.rotation = ((this.rotation + (deltaTime * (this.age + 2) * (this.eccentricity > 0.5 ? -2 : 2))) % (Math.PI * 2));
        context.fillStyle = this.color;
        context.textAlign = 'center';
        context.font = '32px monospace';
        context.fillText(this.word, 0, 0);
        context.restore();

        this.age += deltaTime;
    }

    isAlive() {
        return this.age < this.lifetime;
    }

}

class Particle {

    /**
     * @param {number[]} position
     * @param {string} color
     */
    constructor(position, velocity = [0, 0], color) {
        this.position = position;
        this.velocity = velocity;
        this.size = 10;
        this.scale = 1;
        this.rotation = Math.PI * 2 * Math.random();
        this.color = color;
        this.age = 0;
        this.lifetime = 1;
        this.eccentricity = Math.random();
        this.bad = false;
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} deltaTime
     */
    update(context, deltaTime) {
        context.strokeStyle = this.eccentricity < 0.3 ? 'white' : this.color;
        context.lineWidth = 2;
        context.save();
        context.translate(this.position[0], this.position[1]);
        context.rotate(this.rotation);
        this.rotation = ((this.rotation + (deltaTime * (this.eccentricity > 0.5 ? -10 : 10))) % (Math.PI * 2));
        if (this.eccentricity < 0.33) {
            context.strokeRect(-this.size * this.scale / 2, -this.size * this.scale / 2, this.size * this.scale, this.size * this.scale);
        } else if (this.eccentricity < 0.66) {
            context.beginPath();
            context.moveTo(0, this.size);
            context.lineTo(this.size / 2, 0);
            context.lineTo(-this.size / 2, 0);
            context.lineTo(0, this.size);
            context.stroke();
        } else {
            if (!this.bad) {
                context.beginPath()
                context.arc(0, 0, this.size / 2 * this.scale, 0, Math.PI * 2);
                context.stroke();
            } else {
                context.beginPath()
                context.moveTo(-this.size / 2, 0);
                context.lineTo(this.size / 2, 0);
                context.stroke();
            }
        }
        context.restore();

        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;

        this.velocity[0] *= 0.98;
        this.velocity[1] += 20;

        this.age += deltaTime;
    }

    isAlive() {
        return this.age < this.lifetime;
    }

}

window.onload = () => {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const game = new Game(canvas);
    game.start();
};