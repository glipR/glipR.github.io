import {createNoise2D} from 'https://cdn.skypack.dev/simplex-noise@4.0.0';
import hsl from 'https://cdn.skypack.dev/hsl-to-hex';
import debounce from 'https://cdn.skypack.dev/debounce';

const noise2D = createNoise2D();

var p = document.getElementById("flow-test");
var w = p.offsetWidth;
var h = p.offsetHeight;

if (w >= 799) {

const app = new PIXI.Application({ antialias: true, width: w, height: h, backgroundColor: 0xbbbbbb });

p.appendChild(app.view);

app.stage.interactive = true;

// return a random number within a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// map a number from 1 range to another
function map(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

class Vertex {
    // Pixi takes hex colors as hexidecimal literals (0x rather than a string with '#')
    constructor() {
        // bounds = the area an orb is "allowed" to move within
        this.bounds = this.setBounds();
        // initialise the orb's { x, y } values to a random point within it's bounds
        this.x = random(this.bounds['x'].min, this.bounds['x'].max);
        this.y = random(this.bounds['y'].min, this.bounds['y'].max);

        // how large the orb is vs it's original radius (this will modulate over time)
        this.scale = 1;

        this.hue = ~~random(0, 360);
        // define a fixed saturation and lightness
        this.saturation = 80;
        this.lightness = 65;

        this.fill = hsl(this.hue, this.saturation, this.lightness).replace('#','0x');

        // the original radius of the orb, set relative to window height
        this.radius = random(window.innerHeight / 6, window.innerHeight / 3);

        // starting points in "time" for the noise/self similar random values
        this.xOff = random(0, 1000);
        this.yOff = random(0, 1000);
        // how quickly the noise/self similar random values step through time
        this.inc = 0.00003;

        // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
        this.graphics = new PIXI.Graphics();
        this.graphics.alpha = 1;

        // 250ms after the last window resize event, recalculate orb positions.
        window.addEventListener(
            'resize',
            debounce(() => {
                this.bounds = this.setBounds();
            }, 250)
        );
    }

    setBounds() {
        // how far from the { x, y } origin can each orb move
        var maxDist = window.innerWidth / 1.2;
        if (window.innerHeight > window.innerWidth)
            maxDist = window.innerHeight / 1.2;
        const originX = window.innerWidth / 2.0;
        const originY = window.innerHeight / 2.0;

        // allow each orb to move x distance away from it's { x, y }origin
        return {
            x: {
                min: originX - maxDist,
                max: originX + maxDist
            },
            y: {
                min: originY - maxDist,
                max: originY + maxDist
            }
        };
    }

    update() {
        this.fill = hsl(0, this.saturation, this.lightness).replace('#','0x');
    }

    render() {
        // update the PIXI.Graphics position and scale values
        this.graphics.x = 50;
        this.graphics.y = 50;
        this.graphics.scale.set(1);

        // clear anything currently drawn to graphics
        this.graphics.clear();

        // tell graphics to fill any shapes drawn after this with the orb's fill color
        this.graphics.beginFill(this.fill);
        // draw a circle at { 0, 0 } with it's size set by this.radius
        this.graphics.drawCircle(0, 0, 20);
        // let graphics know we won't be filling in any more shapes
        this.graphics.endFill();
    }
}

var vertices = [];
vertices.push(new Vertex());
vertices.push(new Vertex());
vertices.push(new Vertex());

// Animate!
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    app.ticker.add(() => {
        // update and render each vertex, each frame. app.ticker attempts to run at 60fps
        vertices.forEach((vertex) => {
            vertex.update();
            vertex.render();
            console.log(vertex.fill);
        });
    });
  } else {
    // perform one update and render per vertex, do not animate
    vertices.forEach((vertex) => {
        vertex.update();
        vertex.render();
    });
}
}
else {
    // phone - do nothing.
}
