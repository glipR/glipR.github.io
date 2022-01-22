import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise';
import hsl from 'https://cdn.skypack.dev/hsl-to-hex';
import debounce from 'https://cdn.skypack.dev/debounce';

var p = document.getElementById("bgcanvas-wrap");
var w = p.offsetWidth;
var h = p.offsetHeight;

if (w >= 799) {

const app = new PIXI.Application({ antialias: true, width: w, height: h, backgroundColor: 0xbbbbbb });

p.appendChild(app.view);

app.stage.interactive = true;

const orbBlur = new PIXI.filters.BlurFilter();
const raindropBlur = new PIXI.filters.BlurFilter();
orbBlur.blur = 40;
raindropBlur.blur = 12;

// return a random number within a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// map a number from 1 range to another
function map(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

// Create a new simplex noise instance
const simplex = new SimplexNoise();

// Orb class
class Orb {
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
        this.graphics.filters = [orbBlur];
        this.graphics.alpha = 0.825;

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
        // self similar "psuedo-random" or noise values at a given point in "time"
        const xNoise = simplex.noise2D(this.xOff, this.xOff);
        const yNoise = simplex.noise2D(this.yOff, this.yOff);
        const scaleNoise = simplex.noise2D(this.xOff, this.yOff);
        const colorNoise = simplex.noise2D(this.yOff, this.xOff);

        var h = this.hue + map(colorNoise, -1, 1, -3000, 3000);
        while (h >= 360) h = h - 360;
        while (h < 0) h = h + 360;
        if (h < 2) h = 2;
        if (h > 358) h = 358;
        this.fill = hsl(h, this.saturation, this.lightness).replace('#','0x');
      
        // map the xNoise/yNoise values (between -1 and 1) to a point within the orb's bounds
        this.x = map(xNoise, -1, 1, this.bounds["x"].min, this.bounds["x"].max);
        this.y = map(yNoise, -1, 1, this.bounds["y"].min, this.bounds["y"].max);
        // map scaleNoise (between -1 and 1) to a scale value somewhere between half of the orb's original size, and 100% of it's original size
        this.scale = map(scaleNoise, -1, 1, 0.5, 1);
      
        // step through "time"
        this.xOff += this.inc;
        this.yOff += this.inc;
    }

    render() {
        // update the PIXI.Graphics position and scale values
        this.graphics.x = this.x;
        this.graphics.y = this.y;
        this.graphics.scale.set(this.scale);
      
        // clear anything currently drawn to graphics
        this.graphics.clear();
      
        // tell graphics to fill any shapes drawn after this with the orb's fill color
        this.graphics.beginFill(this.fill);
        // draw a circle at { 0, 0 } with it's size set by this.radius
        this.graphics.drawCircle(0, 0, this.radius);
        // let graphics know we won't be filling in any more shapes
        this.graphics.endFill();
    }
}

// Orb class
class Raindrop {
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
        this.saturation = 70;
        this.lightness = 65;

        this.fill = hsl(this.hue, this.saturation, this.lightness).replace('#','0x');

        // the original radius of the orb, set relative to window height
        this.radius = random(window.innerHeight / 24, window.innerHeight / 18);

        // starting points in "time" for the noise/self similar random values
        this.xOff = random(0, 1000);
        this.yOff = random(0, 1000);
        // how quickly the noise/self similar random values step through time
        this.inc = 0.00003;
        this.gravity = 3;

        // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
        this.graphics = new PIXI.Graphics();
        this.graphics.filters = [raindropBlur];
        this.graphics.alpha = 0.95;

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
        const maxXDist = window.innerWidth / 2.0;
        const maxYDist = window.innerHeight / 1.5;
        const originX = window.innerWidth / 2.0;
        const originY = window.innerHeight / 2.0;
      
        // allow each orb to move x distance away from it's { x, y }origin
        return {
            x: {
                min: originX - maxXDist,
                max: originX + maxXDist
            },
            y: {
                min: originY - maxYDist,
                max: originY + maxYDist
            }
        };
    }

    update() {
        if (this.y > this.bounds['y'].max) {
            this.y = this.bounds['y'].min;
            this.x = random(this.bounds['x'].min, this.bounds['x'].max);
        }

        // self similar "psuedo-random" or noise values at a given point in "time"
        const colorNoise = simplex.noise2D(this.yOff, this.xOff);

        var h = this.hue + map(colorNoise, -1, 1, -8000, 8000);
        while (h >= 360) h = h - 360;
        while (h < 0) h = h + 360;
        if (h < 2) h = 2;
        if (h > 358) h = 358;
        this.fill = hsl(h, this.saturation, this.lightness).replace('#','0x');
      
        this.y += this.gravity;
      
        // step through "time"
        this.xOff += this.inc;
        this.yOff += this.inc;
    }

    render() {
        // update the PIXI.Graphics position and scale values
        this.graphics.x = this.x;
        this.graphics.y = this.y;
      
        // clear anything currently drawn to graphics
        this.graphics.clear();
      
        // tell graphics to fill any shapes drawn after this with the orb's fill color
        this.graphics.beginFill(this.fill);
        // draw a circle at { 0, 0 } with it's size set by this.radius
        this.graphics.drawCircle(0, 0, this.radius);
        // let graphics know we won't be filling in any more shapes
        this.graphics.endFill();
    }
}

// Create orbs
const orbs = [];
const raindrops = [];

for (let i = 0; i < 100; i++) {
  // each orb will be black, just for now
  const orb = new Orb();
  app.stage.addChild(orb.graphics);

  orbs.push(orb);
}
for (let i = 0; i < 50; i++) {
    const raindrop = new Raindrop();
    app.stage.addChild(raindrop.graphics);

    raindrops.push(raindrop);
}

// Animate!
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    app.ticker.add(() => {
        // update and render each orb, each frame. app.ticker attempts to run at 60fps
        orbs.forEach((orb) => {
            orb.update();
            orb.render();
        });
        raindrops.forEach((raindrop) => {
            raindrop.update();
            raindrop.render();
        });
    });
  } else {
    // perform one update and render per orb, do not animate
    orbs.forEach((orb) => {
        orb.update();
        orb.render();
    });
    raindrops.forEach((raindrop) => {
        raindrop.update();
        raindrop.render();
    });
}

} else {

    // If on phone, use video.

    var el = document.createElement("video");
    el.src = "./assets/videos/bg/phone-video.mp4";
    el.muted = "true";
    el.autoplay = "true";
    el.loop = "true";
    p.appendChild(el);

    var el2 = document.createElement("video");
    el2.src = "./assets/videos/bg/phone-video-big.mp4";
    el2.muted = "true";
    el2.autoplay = "true";
    el2.loop = "true";
    p.appendChild(el2);
}