import {createNoise2D} from 'https://cdn.skypack.dev/simplex-noise@4.0.0';
import hsl from 'https://cdn.skypack.dev/hsl-to-hex';
import debounce from 'https://cdn.skypack.dev/debounce';
import yaml from "../js/js-yaml.mjs";

const noise2D = createNoise2D();

// UTILS
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

// CLASSES
class Action {
  constructor(start_time, end_time, detail) {
    this.start_time = start_time;
    this.end_time = end_time;
    this.detail = detail;
  }
}

class Vertex {
  // Class Constants
  DRAG_ACCEL_MULT = 0.2;   // How fast to accelerate towards drag point
  ACCEL_DROP_MULT = 0.5;   // How fast acceleration tapers off
  VEL_DROP_MULT = 0.5;     // How fast velocity tapers off
  ACCEL_THRESHOLD = 0.2    // Under what length should we remove acceleration
  VEL_THRESHOLD = 0.2      // Under what length should we remove velocity
  DEFAULT_SIZE = 20;

  // Pixi takes hex colors as hexidecimal literals (0x rather than a string with '#')
  constructor(key, position) {
      this.key = key;

      // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
      this.graphics = new PIXI.Graphics();
      this.graphics.alpha = 1;
      this.graphics.x = position.x;
      this.graphics.y = position.y;
      this.position = position;
      this.changed = true;

      // Mouse drag variables
      this.dragging = false;
      this.wanted = null;
      this.graphics.interactive = true;
      this.cur_vel = new Vector(0, 0);
      this.cur_acc = new Vector(0, 0);

      this.fill = "#ff00ff"

      const self = this;

      this.graphics.on('mousedown', event => {
          self.wanted = new Vector(event.data.global.x, event.data.global.y);
          self.dragging = true;
          app.stage.dragging_items.push(self);
      })
  }

  update(dt) {
      if (this.dragging) {
          const diff = this.wanted.sub(this.position);
          this.cur_acc = diff.mult(this.DRAG_ACCEL_MULT);
      }
      this.position = this.position.add(this.cur_vel);
      if (this.cur_vel.length() > 0) {
          this.changed = true;
      }
      this.cur_vel = this.cur_vel.add(this.cur_acc);
      this.cur_acc = this.cur_acc.mult(this.ACCEL_DROP_MULT);
      if (this.cur_acc.length() < this.ACCEL_THRESHOLD) {
          this.cur_acc = new Vector(0, 0);
      }
      this.cur_vel = this.cur_vel.mult(this.VEL_DROP_MULT);
      if (this.cur_vel.length() < this.VEL_THRESHOLD) {
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
          // draw a circle at { 0, 0 } with it's size set by radius
          this.graphics.drawCircle(0, 0, this.DEFAULT_SIZE);
          // let graphics know we won't be filling in any more shapes
          this.graphics.endFill();
          this.changed = false;
      }
  }

  collectGraphics() {
    return [this.graphics];
  }
}

class Edge {
  // CLASS CONSTANTS
  BORDER_WIDTH = 3;         // How thick to draw the edge borders
  EMITTER_FRONT_ARGS = {
    "alpha": {
        "start": 0.9,
        "end": 0.1
    },
    "scale": {
        "start": 0.8,
        "end": 0.2,
        "minimumScaleMultiplier": 0.5
    },
    "color": {
        "start": "#eeeeff",
        "end": "#40a0ff"
    },
    "speed": {
        "start": 2,
        "end": -1,
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
        "min": 20,
        "max": 80
    },
    "blendMode": "normal",
    "frequency": 0.003,
    "emitterLifetime": -1,
    "maxParticles": 500,
    "pos": { // Will be updated
        "x": 0,
        "y": 0
    },
    "addAtBack": true,
    "spawnType": "rect",
    "spawnRect": {
        "x": -10,
        "y": 8,
        "w": 30,
        "h": 0
    }
  }
  EMITTER_BACK_ARGS = {
    "alpha": {
        "start": 1,
        "end": 0
    },
    "scale": {
        "start": 0.8,
        "end": 0.2,
        "minimumScaleMultiplier": 0.5
    },
    "color": {
        "start": "#ffffff",
        "end": "#ffffff"
    },
    "speed": {
        "start": -2,
        "end": 1,
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
        "min": 10,
        "max": 40
    },
    "blendMode": "normal",
    "frequency": 0.003,
    "emitterLifetime": -1,
    "maxParticles": 500,
    "pos": {   // Will be updated later
        "x": 0,
        "y": 0
    },
    "addAtBack": true,
    "spawnType": "rect",
    "spawnRect": {
        "x": -10,
        "y": -30,
        "w": 30,
        "h": 0
    }
  }

  LINE_COLOR = "0x000000"
  BACKGROUND = "0xeeeebb"
  PIPE_WIDTH = 30;           // How wide is the pipe

  PARTICLE_TEXTURE = PIXI.Texture.from("../img/particle.png");

  WATER_SPEED_DYNAMIC = 2;
  WATER_SPEED_STATIC = 1/120;

  constructor(start_vertex, end_vertex) {
    this.line_graphics = new PIXI.Graphics();
    this.line_graphics.alpha = 1;
    this.line_graphics.x = 0;
    this.line_graphics.y = 0;
    this.bg_graphics = new PIXI.Graphics();
    this.bg_graphics.alpha = 1;
    this.bg_graphics.x = 0;
    this.bg_graphics.y = 0;
    this.mask_graphics = new PIXI.Graphics();
    this.emitter_graphics = new PIXI.Graphics();
    this.emitter_graphics.alpha = 1;
    this.emitter_graphics.x = 0;
    this.emitter_graphics.y = 0;
    this.emitter_graphics.mask = this.mask_graphics;
    this.water_graphics = new PIXI.Graphics();
    this.water_graphics.alpha = 1;
    this.water_graphics.x = 0;
    this.water_graphics.y = 0;

    this.start_vertex = start_vertex
    this.start_position = start_vertex.position;
    this.end_vertex = end_vertex
    this.end_position = end_vertex.position;

    // Variables for animation.
    this.start_water = 0;
    this.end_water = 0;
    this.goal_water = 0;
    this.edge_dist = 0;
    this.edge_mult = 1;

    this.changed = true;

    this.emitter_front = new PIXI.particles.Emitter(
      this.emitter_graphics,
      PIXI.particles.upgradeConfig(this.EMITTER_FRONT_ARGS, this.PARTICLE_TEXTURE)
    )
    this.emitter_front.emit = false;
    this.emitter_back = new PIXI.particles.Emitter(
      this.emitter_graphics,
      PIXI.particles.upgradeConfig(this.EMITTER_BACK_ARGS, this.PARTICLE_TEXTURE)
    )
    this.emitter_back.emit = false;

    this.actions = [];
  }

  // TODO: Replace most of this logic with a queued animation approach.
  update(dt) {
    if (this.start_position != this.start_vertex.position) {
        this.changed = true;
        this.start_position = this.start_vertex.position;
    }
    if (this.end_position != this.end_vertex.position) {
        this.changed = true;
        this.end_position = this.end_vertex.position;
    }

    if (this.actions.length > 0) {
      this.actions[0].start_time -= dt;
      this.actions[0].end_time -= dt;
      if (this.actions[0].start_time < 0) {
        if (this.actions[0].start_time + dt >= 0) {
          // Start of animation
          if (this.actions[0].detail.fill) {
            this.emitter_front.emit = true;
            this.emitter_back.emit = false;
            if (this.actions[0].detail.start_key == this.start_vertex.key) {
              this.start_water = 0;
              this.end_water = 0;
              this.goal_water = 1;
            } else {
              this.start_water = 1;
              this.end_water = 1;
              this.goal_water = 0;
            }
          } else {
            this.emitter_front.emit = false;
            this.emitter_back.emit = true;
            if (this.actions[0].detail.start_key == this.start_vertex.key) {
              this.start_water = 1;
              this.end_water = 0;
              this.goal_water = 1;
            } else {
              this.start_water = 0;
              this.end_water = 1;
              this.goal_water = 0;
            }
          }
        }
        if (this.actions[0].end_time < 0) {
          // End of animation
          this.end_water = this.goal_water;
          this.actions = this.actions.slice(1);
          this.emitter_front.emit = false;
          this.emitter_back.emit = false;
        } else {
          // Middle of animation
          if (this.actions[0].detail.static) {
            if (this.end_water < this.goal_water) {
              this.end_water += this.WATER_SPEED_STATIC * dt;
            } else {
              this.end_water -= this.WATER_SPEED_STATIC * dt;
            }
          } else {
            if (this.end_water < this.goal_water) {
              this.end_water += this.WATER_SPEED_DYNAMIC * dt / this.end_position.sub(this.start_position).length();
            } else {
              this.end_water -= this.WATER_SPEED_DYNAMIC * dt / this.end_position.sub(this.start_position).length();
            }
          }
        }
      }
    }

    this.emitter_front.update(dt);
    this.emitter_back.update(dt);
    this.emitter_position = this.start_position.add(this.end_position.sub(this.start_position).mult(this.end_water));
    this.emitter_front.updateSpawnPos(this.emitter_position.x, this.emitter_position.y);
    this.emitter_back.updateSpawnPos(this.emitter_position.x, this.emitter_position.y);

    if (this.changed) {
      var vec = this.end_position.sub(this.start_position);
      var rot = -Math.atan2(-vec.y, vec.x);
      const forward = this.actions.length > 0 ? this.actions[0].detail.start_key === this.start_vertex.key : true;
      this.emitter_front.rotate(rot - Math.PI/2 + (forward ? 0 : Math.PI));
      this.emitter_back.rotate(rot - Math.PI/2 + (forward ? Math.PI : 0));
    }

    // Testing - Queue animations
    if (this.actions.length == 0) {
      this.actions.push(new Action(0, this.end_position.sub(this.start_position).length() / this.WATER_SPEED_DYNAMIC, {
        fill: true,
        start_key: this.start_vertex.key,
        end_key: this.end_vertex.key,
        static: false,
      }))
    }
    if (this.actions.length == 1) {
      if (this.actions[0].detail.fill) {
        if (this.actions[0].detail.start_key === this.start_vertex.key) {
          this.actions.push(new Action(0, this.end_position.sub(this.start_position).length() / this.WATER_SPEED_DYNAMIC, {
            fill: false,
            start_key: this.start_vertex.key,
            end_key: this.end_vertex.key,
            static: false,
          }))
        } else {
          this.actions.push(new Action(0, 1 / this.WATER_SPEED_STATIC, {
            fill: false,
            start_key: this.end_vertex.key,
            end_key: this.start_vertex.key,
            static: true,
          }))
        }
      } else {
        if (this.actions[0].detail.start_key !== this.start_vertex.key) {
          this.actions.push(new Action(0, this.end_position.sub(this.start_position).length() / this.WATER_SPEED_DYNAMIC, {
            fill: true,
            start_key: this.start_vertex.key,
            end_key: this.end_vertex.key,
            static: false,
          }))
        } else {
          this.actions.push(new Action(0, 1 / this.WATER_SPEED_STATIC, {
            fill: true,
            start_key: this.end_vertex.key,
            end_key: this.start_vertex.key,
            static: true,
          }))
        }
      }
    }
  }

  render() {
    if (this.changed) {
      // clear anything currently drawn to graphics
      this.line_graphics.clear();

      const offset = this.end_position.sub(this.start_position).normal().normalise().mult(this.PIPE_WIDTH * 0.5);
      const pipe_1_start = this.start_position.add(offset);
      const pipe_2_start = this.start_position.sub(offset);
      const pipe_1_end = this.end_position.add(offset);
      const pipe_2_end = this.end_position.sub(offset);

      const emitter_1 = this.emitter_position.add(offset);
      const emitter_2 = this.emitter_position.sub(offset);

      // BG
      this.bg_graphics.clear();
      this.bg_graphics.beginFill(this.BACKGROUND);
      this.bg_graphics.drawPolygon([
        new PIXI.Point(pipe_1_start.x, pipe_1_start.y),
        new PIXI.Point(pipe_2_start.x, pipe_2_start.y),
        new PIXI.Point(pipe_2_end.x, pipe_2_end.y),
        new PIXI.Point(pipe_1_end.x, pipe_1_end.y),
      ]);
      this.bg_graphics.endFill();
      // Water
      this.water_graphics.clear();
      this.water_graphics.beginFill(0x29cdff);
      const start_1_post = pipe_1_start.add(pipe_1_end.sub(pipe_1_start).mult(this.start_water));
      const start_2_post = pipe_2_start.add(pipe_2_end.sub(pipe_2_start).mult(this.start_water));
      const end_1_post = pipe_1_start.add(pipe_1_end.sub(pipe_1_start).mult(this.end_water));
      const end_2_post = pipe_2_start.add(pipe_2_end.sub(pipe_2_start).mult(this.end_water));
      this.water_graphics.drawPolygon([
        new PIXI.Point(start_1_post.x, start_1_post.y),
        new PIXI.Point(start_2_post.x, start_2_post.y),
        new PIXI.Point(end_2_post.x, end_2_post.y),
        new PIXI.Point(end_1_post.x, end_1_post.y),
      ]);
      this.water_graphics.endFill();

      // Mask
      this.mask_graphics.clear();
      this.mask_graphics.beginFill(this.BACKGROUND);
      this.mask_graphics.drawPolygon([
        new PIXI.Point(pipe_1_start.x, pipe_1_start.y),
        new PIXI.Point(pipe_2_start.x, pipe_2_start.y),
        new PIXI.Point(pipe_2_end.x, pipe_2_end.y),
        new PIXI.Point(pipe_1_end.x, pipe_1_end.y),
      ]);
      this.mask_graphics.endFill();

      // BORDER
      this.line_graphics.beginFill(this.LINE_COLOR);
      this.line_graphics.lineStyle({
        width: this.BORDER_WIDTH,
        color: this.LINE_COLOR,
        cap: PIXI.LineStyle.ROUND,
      })
      this.line_graphics.moveTo(pipe_1_start.x, pipe_1_start.y);
      this.line_graphics.lineTo(pipe_1_end.x, pipe_1_end.y);
      this.line_graphics.moveTo(pipe_2_start.x, pipe_2_start.y);
      this.line_graphics.lineTo(pipe_2_end.x, pipe_2_end.y);
      this.line_graphics.endFill();
    }
  }

  collectGraphics() {
    // Order in terms of top-bottom graphic drawing.
    return [
      this.line_graphics,
      this.emitter_graphics,
      this.water_graphics,
      this.bg_graphics,
    ]
  }
}

class ObjectManager {
  constructor() {
    this.vertices = {};
    this.edges = [];
  }

  // TODO: Add depth keyword to sort graphics on.

  load_graph(vertices, edges) {
    Object.keys(vertices).forEach(key => {
      this.add_vertex(key, new Vector(vertices[key][0], vertices[key][1]));
    })
    edges.forEach(edge => {
      this.add_edge(edge.start, edge.end);
    })
  }

  add_vertex(key, position) {
    const v = new Vertex(key, position);
    this.vertices[key] = v;
    v.collectGraphics().forEach(g => {
      app.stage.addChild(g);
    })
  }

  add_edge(start_key, end_key) {
    const e = new Edge(
      this.vertices[start_key],
      this.vertices[end_key]
    );
    this.edges.push(e);
    e.collectGraphics().forEach(g => {
      // Graphics appear on top.
      app.stage.addChildAt(g, 0);
    })
  }

  update(dt) {
    Object.values(this.vertices).forEach(v => v.update(dt));
    this.edges.forEach(e => e.update(dt));
  }

  render() {
    Object.values(this.vertices).forEach(v => v.render());
    this.edges.forEach(e => e.render());
  }
}

// TESTING

var p = document.getElementById("flow-1");
var w = p.offsetWidth;
var h = p.offsetHeight;

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

const OM = new ObjectManager();
OM.load_graph(graph.V, graph.E);

const bg = new PIXI.Graphics();
app.stage.addChildAt(bg, 0);
bg.alpha = 0.4;
bg.beginFill(0xffffff);
bg.drawRect(0, 0, w, h);
bg.endFill();

app.ticker.add((time) => {
  OM.update(time);
  OM.render();
})
