import {createNoise2D} from 'https://cdn.skypack.dev/simplex-noise@4.0.0';
import hsl from 'https://cdn.skypack.dev/hsl-to-hex';
import debounce from 'https://cdn.skypack.dev/debounce';
import yaml from "../js/js-yaml.mjs";

const noise2D = createNoise2D();

var p = document.getElementById("flow-1");
var w = p.offsetWidth;
var h = p.offsetHeight;

if (w >= 799) {

var graph = yaml.load(p.getElementsByTagName("p")[0].innerHTML.trim());
p.innerHTML = "";

const app = new PIXI.Application({
    antialias: true,
    autoDensity: true,
    resolution: 2,
    width: w,
    height: h,
    backgroundColor: 0x000000,
    backgroundAlpha: 0
});

p.appendChild(app.view);

app.stage.interactive = true;
app.stage.dragging_items = [];
app.stage.on('mousemove', event => {
    app.stage.dragging_items.forEach(i => {
        i.wanted = new Vector(event.data.global.x, event.data.global.y);
    })
})
app.stage.on('mouseup', event => {
    app.stage.dragging_items.forEach(el => {
        el.wanted = new Vector(event.data.global.x, event.data.global.y);
        el.dragging = false;
    })
    app.stage.dragging_items = [];
})

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }

    normalise() {
        const len = this.length();
        return new Vector(this.x/len, this.y/len);
    }

    normal() {
        return new Vector(-this.y, this.x);
    }

    add(v) {
        return new Vector(this.x+v.x, this.y+v.y);
    }

    sub(v) {
        return new Vector(this.x-v.x, this.y-v.y);
    }

    mult(s) {
        return new Vector(this.x*s, this.y*s);
    }
}

// return a random number within a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// map a number from 1 range to another
function map(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

const vertices = {};
const edges = [];

var particle = PIXI.Texture.from("../img/particle.png");

class Vertex {
    // Pixi takes hex colors as hexidecimal literals (0x rather than a string with '#')
    constructor(position, size) {
        // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
        this.graphics = new PIXI.Graphics();
        this.graphics.alpha = 1;
        this.graphics.x = position.x;
        this.graphics.y = position.y;
        this.graphics.interactive = true;
        this.dragging = false;
        this.cur_vel = new Vector(0, 0);
        this.cur_acc = new Vector(0, 0);
        this.position = position;
        this.wanted = null;
        this.size = size;
        this.changed = true;

        this.fill = "#ff00ff"

        const self = this;

        this.graphics.on('mousedown', event => {
            self.wanted = new Vector(event.data.global.x, event.data.global.y);
            self.dragging = true;
            app.stage.dragging_items.push(self);
        })
    }

    update() {
        if (this.dragging) {
            const diff = this.wanted.sub(this.position);
            this.cur_acc = diff.mult(0.2);
        }
        this.position = this.position.add(this.cur_vel);
        if (this.cur_vel.length() > 0) {
            this.changed = true;
        }
        this.cur_vel = this.cur_vel.add(this.cur_acc);
        this.cur_acc = this.cur_acc.mult(0.5);
        if (this.cur_acc.length() < 0.2) {
            this.cur_acc = new Vector(0, 0);
        }
        this.cur_vel = this.cur_vel.mult(0.5);
        if (this.cur_vel.length() < 0.2) {
            this.cur_vel = new Vector(0, 0);
        }
    }

    render() {
        if (this.changed) {
            // clear anything currently drawn to graphics
            this.graphics.clear();
            this.graphics.x = this.position.x;
            this.graphics.y = this.position.y;
            // tell graphics to fill any shapes drawn after this with the orb's fill color
            this.graphics.beginFill(this.fill);
            // draw a circle at { 0, 0 } with it's size set by this.radius
            this.graphics.drawCircle(0, 0, this.size);
            // let graphics know we won't be filling in any more shapes
            this.graphics.endFill();
            this.changed = false;
        }
    }
}

class Edge {
    constructor(start_vertex, end_vertex, line_width, pipe_width, ignore_length) {
        // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
        this.graphics = new PIXI.Graphics();
        this.graphics.alpha = 1;
        this.graphics.x = 0;
        this.graphics.y = 0;
        this.mask_graphics = new PIXI.Graphics();
        this.graphics.alpha = 1;
        this.graphics.x = 0;
        this.graphics.y = 0;
        this.emitter_graphics = new PIXI.Graphics();
        this.emitter_graphics.alpha = 1;
        this.emitter_graphics.x = 0;
        this.emitter_graphics.y = 0;
        this.emitter_graphics.mask = this.mask_graphics;
        this.start_vertex = start_vertex
        this.start_position = start_vertex.position;
        this.end_vertex = end_vertex
        this.end_position = end_vertex.position;
        this.line_width = line_width;
        this.pipe_width = pipe_width;
        this.ignore_length = ignore_length;

        this.line_color = "0x000000"
        this.background = "0xeeeeee"
        this.edge_dist = 0;
        this.edge_mult = 1;

        this.changed = true;

        this.emitter = new PIXI.particles.Emitter(
            this.emitter_graphics,
            PIXI.particles.upgradeConfig({
                "alpha": {
                    "start": 1,
                    "end": 0.5
                },
                "scale": {
                    "start": 0.8,
                    "end": 0.2,
                    "minimumScaleMultiplier": 0.5
                },
                "color": {
                    "start": "#b5eaff",
                    "end": "#29cdff"
                },
                "speed": {
                    "start": 0,
                    "end": 0,
                    "minimumSpeedMultiplier": 0.6
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "maxSpeed": 0,
                "startRotation": {
                    "min": -90,
                    "max": -90
                },
                "noRotation": true,
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "lifetime": {
                    "min": 0.2,
                    "max": 0.8
                },
                "blendMode": "normal",
                "frequency": 0.003,
                "emitterLifetime": -1,
                "maxParticles": 500,
                "pos": {
                    "x": start_vertex.position.x,
                    "y": start_vertex.position.y
                },
                "addAtBack": true,
                "spawnType": "rect",
                "spawnRect": {
                    "x": -10,
                    "y": 0,
                    "w": 20,
                    "h": 0
                }
            }, particle)
        )
        var vec = this.end_position.sub(this.start_position);
        var rot = -Math.atan2(-vec.y, vec.x);
        console.log(vec.x, vec.y, rot * 180 / Math.PI)
        this.emitter.rotate(rot - Math.PI/2);
        this.emitter.emit = true;
    }

    update() {
        if (this.start_position != this.start_vertex.position) {
            this.changed = true;
            this.start_position = this.start_vertex.position;
        }
        if (this.end_position != this.end_vertex.position) {
            this.changed = true;
            this.end_position = this.end_vertex.position;
        }

        this.emitter.update(0.01);
        this.emitter_position = this.start_position.add(this.end_position.sub(this.start_position).mult(this.edge_dist));
        this.emitter.updateSpawnPos(this.emitter_position.x, this.emitter_position.y);
        this.edge_dist += 0.01 * this.edge_mult;
        if (this.edge_dist >= 1 || this.edge_dist <= 0) {
            this.edge_mult = this.edge_mult * -1;
            this.emitter.rotate(this.emitter.rotation + Math.PI)
            this.edge_dist = Math.max(0, Math.min(this.edge_dist, 1));
        }
    }

    render() {
        if (this.changed) {
            // clear anything currently drawn to graphics
            this.graphics.clear();

            const offset = this.end_position.sub(this.start_position).normal().normalise().mult(this.pipe_width * 0.5);
            const pipe_1_start = this.start_position.add(offset);
            const pipe_2_start = this.start_position.sub(offset);
            const pipe_1_end = this.end_position.add(offset);
            const pipe_2_end = this.end_position.sub(offset);

            // BG
            this.graphics.beginFill(this.background);
            this.graphics.drawPolygon([
                new PIXI.Point(pipe_1_start.x, pipe_1_start.y),
                new PIXI.Point(pipe_2_start.x, pipe_2_start.y),
                new PIXI.Point(pipe_2_end.x, pipe_2_end.y),
                new PIXI.Point(pipe_1_end.x, pipe_1_end.y),
            ]);
            this.graphics.endFill();
            this.graphics.clear();

            // Mask
            this.mask_graphics.beginFill(this.background);
            this.mask_graphics.drawPolygon([
                new PIXI.Point(pipe_1_start.x, pipe_1_start.y),
                new PIXI.Point(pipe_2_start.x, pipe_2_start.y),
                new PIXI.Point(pipe_2_end.x, pipe_2_end.y),
                new PIXI.Point(pipe_1_end.x, pipe_1_end.y),
            ]);
            this.mask_graphics.endFill();

            // BORDER
            this.graphics.beginFill(this.line_color);
            this.graphics.lineStyle({
                width: this.line_width,
                color: this.line_color,
                cap: PIXI.LineStyle.ROUND,
            })
            this.graphics.moveTo(pipe_1_start.x, pipe_1_start.y);
            this.graphics.lineTo(pipe_1_end.x, pipe_1_end.y);
            this.graphics.moveTo(pipe_2_start.x, pipe_2_start.y);
            this.graphics.lineTo(pipe_2_end.x, pipe_2_end.y);
            this.graphics.endFill();
        }
    }
}

var graph_definition = {
    "vertex_positions": {
        "A": [20, 40],
        "B": [250, 120],
        "C": [100, 300],
    },
    "edges": [
        "AC",
        "AB",
        "BC"
    ]
}

Object.keys(graph.V).forEach(key => {
    let v = new Vertex(
        new Vector(
            graph.V[key][0],
            graph.V[key][1]
        ),
        20
    );
    vertices[key] = v;
    app.stage.addChild(v.graphics);
})
graph.E.forEach(edge => {
    let e = new Edge(
        vertices[edge.start],
        vertices[edge.end],
        5,
        30,
        0
    )
    edges.push(e);
    app.stage.addChildAt(e.graphics, 0);
    app.stage.addChildAt(e.emitter_graphics, 0);
})

const bg = new PIXI.Graphics();
app.stage.addChildAt(bg, 0);
bg.alpha = 0.4;
bg.beginFill(0xffffff);
bg.drawRect(0, 0, w, h);
bg.endFill();

// Animate!
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    app.ticker.add(() => {
        // update and render each vertex, each frame. app.ticker attempts to run at 60fps
        Object.keys(vertices).forEach((vkey) => {
            vertices[vkey].update();
            vertices[vkey].render();
        });
        edges.forEach((edge) => {
            edge.update();
            edge.render();
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
