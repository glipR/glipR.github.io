const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');

canvas.tabIndex = 1000;
canvas.style.outline = 'none';
canvas.focus();

HEADING_MARGIN_Y = 66;
BOTTOM_Y = 100;

const SIDEBAR_WIDTH = 200;
const MARGIN = 20;

function drawLine(context, startPosition, endPosition, color, lineWidth) {
  context.beginPath();
  context.moveTo(startPosition.x, startPosition.y);
  context.lineTo(endPosition.x, endPosition.y);
  context.strokeStyle = color;
  context.lineWidth = lineWidth || 1;
  context.stroke();
}

let EDGES = [];
let NODES = [];
let CLICK_AREAS = [];
let SAVES = [];

function toDrawSpace(x, y, viewport, canvasX, canvasY) {
  return {
    x: (x - viewport.x) / viewport.width * canvasX,
    y: (y - viewport.y) / viewport.height * canvasY
  }
}

function toDrawMagnitude(x, y, viewport, canvasX, canvasY) {
  const p1 = toDrawSpace(0, 0, viewport, canvasX, canvasY);
  const p2 = toDrawSpace(x, y, viewport, canvasX, canvasY);
  return {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
  }
}

function toGameMagnitude(x, y, viewport, canvasX, canvasY) {
  const p1 = toGameSpace(0, 0, viewport, canvasX, canvasY);
  const p2 = toGameSpace(x, y, viewport, canvasX, canvasY);
  return {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
  }
}

function toGameSpace(x, y, viewport, canvasX, canvasY) {
  return {
    x: x / canvasX * viewport.width + viewport.x,
    y: y / canvasY * viewport.height + viewport.y
  }
}

function inBounds(position, canvasX, canvasY) {
  return position.x >= 0 && position.x <= canvasX && position.y >= 0 && position.y <= canvasY;
}

function fitPosition(position, canvasX, canvasY) {
  return {
    x: Math.min(Math.max(position.x, 0), canvasX),
    y: Math.min(Math.max(position.y, 0), canvasY)
  }
}

class Node {
  constructor (x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw(context, viewport, canvasX, canvasY, startX, startY) {
    const position = toDrawSpace(this.x, this.y, viewport, canvasX, canvasY);
    const rad = toDrawMagnitude(this.radius, 0, viewport, canvasX, canvasY);
    if (inBounds(position, canvasX, canvasY)) {
      context.beginPath();
      context.arc(position.x + startX, position.y + startY, rad.x, 0, 2 * Math.PI);
      context.fillStyle = this.color;
      context.fill();
    }
  }

  deepcopy () {
    return new Node(this.x, this.y, this.radius, this.color);
  }
}

class Edge {
  constructor (startPos, endPos, color, lineWidth) {
    this.startPos = startPos;
    this.endPos = endPos;
    this.color = color;
    this.lineWidth = lineWidth;
    this.key = `${startPos.x}, ${startPos.y} <-> ${endPos.x}, ${endPos.y}`;
  }

  equation (x, y) {
    const c = (this.endPos.x * this.startPos.y - this.startPos.x * this.endPos.y) * this.endPos.x;
    const a = this.startPos.y * this.endPos.x - this.endPos.y * this.endPos.x;
    return a*x + y * (this.endPos.x - this.startPos.x) * this.endPos.x - c // This is 0 for the line points.
  }

  draw(context, viewport, canvasX, canvasY, startX, startY) {
    const start = toDrawSpace(this.startPos.x, this.startPos.y, viewport, canvasX, canvasY);
    const end = toDrawSpace(this.endPos.x, this.endPos.y, viewport, canvasX, canvasY);
    const lw = toDrawMagnitude(this.lineWidth, this.lineWidth, viewport, canvasX, canvasY);
    if (start.x == end.x) {
      // No gradient. Just figure out whether to draw based on the inBounds stuff
      const startFit = fitPosition(start, canvasX, canvasY);
      const endFit = fitPosition(end, canvasX, canvasY);
      if (startFit.x === start.x && startFit.y !== endFit.y) {
        // The line is vertical and crossing the viewport.
        drawLine(context, {
          x: startFit.x + startX,
          y: startFit.y + startY,
        }, {
          x: endFit.x + startX,
          y: endFit.y + startY,
        }, this.color, lw.x);
      }
    } else if (start.y == end.y) {
      // No gradient. Just figure out whether to draw based on the inBounds stuff
      const startFit = fitPosition(start, canvasX, canvasY);
      const endFit = fitPosition(end, canvasX, canvasY);
      if (startFit.y === start.y && startFit.x !== endFit.x) {
        // The line is horizontal and crossing the viewport.
        drawLine(context, {
          x: startFit.x + startX,
          y: startFit.y + startY,
        }, {
          x: endFit.x + startX,
          y: endFit.y + startY,
        }, this.color, lw.x);
      }
    } else {
      // startX + mult * (endX - startX) = leftViewport x
      // mult = (leftViewport x - startX) / (endX - startX)

      const leftBoxMult = (-start.x) / (end.x - start.x);
      const rightBoxMult = (canvasX - start.x) / (end.x - start.x);
      const topBoxMult = (-start.y) / (end.y - start.y);
      const bottomBoxMult = (canvasY - start.y) / (end.y - start.y);

      const lineStart = Math.max(0, end.x > start.x ? leftBoxMult : rightBoxMult, end.y > start.y ? topBoxMult : bottomBoxMult);
      const lineEnd = Math.min(1, end.x > start.x ? rightBoxMult : leftBoxMult, end.y > start.y ? bottomBoxMult : topBoxMult);

      if (lineStart < lineEnd) {
        const drawStart = {
          x: start.x + lineStart * (end.x - start.x) + startX,
          y: start.y + lineStart * (end.y - start.y) + startY
        }
        const drawEnd = {
          x: start.x + lineEnd * (end.x - start.x) + startX,
          y: start.y + lineEnd * (end.y - start.y) + startY
        }
        drawLine(context, drawStart, drawEnd, this.color, lw.x);
      }
    }
  }

  deepcopy () {
    return new Edge({...this.startPos}, {...this.endPos}, this.color, this.lineWidth);
  }
}

class ClickArea {
  constructor (position, width, height, onClick, pxOffset) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.pxOffset = pxOffset;
    this.onClick = onClick;
  }

  isClicked (x, y, viewport, canvasX, canvasY) {
    const {x: newX, y: newY} = toGameSpace(x, y, viewport, canvasX, canvasY);
    const diff = toGameMagnitude(this.pxOffset, this.pxOffset, viewport, canvasX, canvasY);
    return newX >= this.position.x - diff.x && newX <= this.position.x + this.width + diff.x && newY >= this.position.y - diff.y && newY <= this.position.y + this.height + diff.y;
  }

  deepcopy () {
    // onClick isn't deepcopied but I'm fine with that.
    return new ClickArea({...this.position}, this.width, this.height, this.onClick, this.pxOffset);
  }
}

class TreeNode {
  constructor (position, parent) {
    this.key = `${position.x}, ${position.y}`;
    this.position = position;
    this.parent = parent;
    this.parents = [];
    if (parent) {
      this.parents.push(parent);
    }
    this.children = [];
  }

  deepcopy (treeMap) {
    if (treeMap === null) {
      treeMap = {};
    }
    if (treeMap[this.key] !== undefined) return treeMap[this.key];
    const newNode = new TreeNode({...this.position}, null);
    treeMap[newNode.key] = newNode;

    this.children.forEach(child => {
      const newChild = child.child.deepcopy(treeMap);
      newNode.addChild(newChild, child.childEdge ? child.childEdge.deepcopy() : null);
    });
    this.parents.forEach(parent => {
      const newParent = parent.deepcopy(treeMap);
      newNode.parents.push(newParent);
    })
    if (this.parent) {
      newNode.parent = this.parent.deepcopy(treeMap);
    }
    if (this.node) {
      newNode.setNode(this.node.deepcopy());
    }
    if (this.clickArea) {
      newNode.setClickArea(this.clickArea.deepcopy());
    }
    return newNode;
  }

  addChild(child, childEdge) {
    if (child != this) {
      this.children.push({child, childEdge});
      child.parents.push(this);
      console.log(this, child);
    }
    if (childEdge) {
      childEdge.startNode = this;
      childEdge.endNode = child;
    }
  }

  setClickArea (clickArea) {
    this.clickArea = clickArea;
    clickArea.treeNode = this;
  }

  setNode (node) {
    this.node = node;
    node.treeNode = this;
  }

  collectEdges () {
    let edges = [];
    this.children.forEach(child => {
      if (child.childEdge) {
        edges.push(child.childEdge);
      }
      if (child.child.parent.key === this.key) {
        edges = edges.concat(child.child.collectEdges());
      }
    });
    return edges;
  }

  collectNodes () {
    let nodes = [];
    if (this.node) {
      nodes.push(this.node);
    }
    this.children.forEach(child => {
      if (child.child.parent.key === this.key) {
        nodes = nodes.concat(child.child.collectNodes());
      }
    })
    return nodes;
  }

  collectClickAreas () {
    let click_areas = [];
    if (this.clickArea) {
      click_areas.push(this.clickArea);
    }
    this.children.forEach(child => {
      if (child.child.parent.key === this.key) {
        click_areas = click_areas.concat(child.child.collectClickAreas());
      }
    })
    return click_areas;
  }

  shift (dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
    if (this.node) {
      this.node.x += dx;
      this.node.y += dy;
    }
    if (this.clickArea) {
      this.clickArea.position.x += dx;
      this.clickArea.position.y += dy;
    }
    this.children.forEach(child => {
      if (child.childEdge) {
        child.childEdge.startPos.x += dx;
        child.childEdge.startPos.y += dy;
        child.childEdge.endPos.x += dx;
        child.childEdge.endPos.y += dy;
      }
      if (child.child.parent.key === this.key) {
        child.child.shift(dx, dy)
      }
    })
  }

  invert () {
    this.children.forEach(child => {
      if (child.childEdge) {
        if (child.childEdge.color === 'blue') {
          child.childEdge.color = 'red';
        } else if (child.childEdge.color === 'red') {
          child.childEdge.color = 'blue';
        }
      }
      if (child.child.parent.key === this.key) {
        child.child.invert();
      }
    })
  }

  markFalse (indexMapping, edgeArray) {
    // Check we have no edges coming in still on in the edgeArray
    let covered = false;
    this.parents.forEach(parent => {
      parent.children.forEach(child => {
        if (child.child.key === this.key && edgeArray[indexMapping[child.childEdge.key]]) {
          covered = true;
        }
      })
    })
    if (covered) return;
    this.children.forEach(child => {
      if (child.childEdge) {
        edgeArray[indexMapping[child.childEdge.key]] = false;
      }
      if (child.child.parent.key === this.key) {
        child.child.markFalse(indexMapping, edgeArray);
      }
    });
  }

  deleteEdge(edge) {
    let removed = null;
    this.children.forEach(child => {
      if (child.childEdge.key === edge.key) {
        removed = child;

        child.child.parents = child.child.parents.filter(par => par.key !== this.key);
        if (child.child.parent.key === this.key && child.child.parents.length > 0) {
          child.child.parent = child.child.parents[0];
        } else {
          child.child.dropDownReassign();
        }
      }
    });
    if (removed !== null) {
      this.children = this.children.filter(child => child.child.key !== removed.child.key);
    }
    this.children.forEach(child => {
      if (!child.child.parent) {
        console.log(baseNode.deepcopy(null))
      }
      if (child.child.parent.key === this.key) {
        child.child.deleteEdge(edge);
      }
    })
  }

  dropDownReassign() {
    this.children.forEach(child => {
      if (child.child.parent.key === this.key) {
        child.child.parents = child.child.parents.filter(par => par !== this);
        if (child.child.parents.length === 0) {
          child.child.dropDownReassign();
        } else {
          child.child.parent = child.child.parents[0];
        }
      }
    })
  }

  evaluate () {
    const edges = this.collectEdges();
    const edgeFlags = [];
    const indexMapping = {};
    edges.forEach((edge, index) => {
      edgeFlags.push(true);
      indexMapping[edge.key] = index;
    });
    function evaluatePartial(edgeArray) {
      // Can blue win?
      let blueWin = false;
      edgeArray.every((available, index) => {
        const edge = edges[index];
        if (available && (edge.color === 'blue' || edge.color === 'green')) {
          const newArray = edgeArray.slice();
          newArray[index] = false;
          edge.endNode.markFalse(indexMapping, newArray);
          const result = evaluatePartial(newArray);
          if (result === 'blue' || result === 'zero') {
            blueWin = true;
            return false;
          }
        }
        return true;
      });
      let redWin = false;
      edgeArray.every((available, index) => {
        const edge = edges[index];
        if (available && (edge.color === 'red' || edge.color === 'green')) {
          const newArray = edgeArray.slice();
          newArray[index] = false;
          edge.endNode.markFalse(indexMapping, newArray);
          const result = evaluatePartial(newArray);
          if (result === 'red' || result === 'zero') {
            redWin = true;
            return false;
          }
        }
        return true;
      });

      if (blueWin && redWin) return 'fuzzy';
      if (blueWin) return 'blue';
      if (redWin) return 'red';
      return 'zero';
    }

    return evaluatePartial(edgeFlags);
  }
}

PREVIEW_TEXT_WIDTH = 24;
PREVIEW_MARGIN = 10;
PREVIEW_WIDTH = SIDEBAR_WIDTH - 2 * PREVIEW_MARGIN - PREVIEW_TEXT_WIDTH;
PREVIEW_HEIGHT = 120;

class SavedTree {
  constructor (treeNode, name) {
    this.treeNode = treeNode;
    this.name = name;
    this.edges = this.treeNode.collectEdges();
    this.nodes = this.treeNode.collectNodes();
    this.bounds = {
      sx: 10000000,
      sy: 10000000,
      lx: -10000000,
      ly: -10000000,
    }
    this.edges.forEach(edge => {
      this.bounds.sx = Math.min(this.bounds.sx, edge.startPos.x, edge.endPos.x);
      this.bounds.sy = Math.min(this.bounds.sy, edge.startPos.y, edge.endPos.y);
      this.bounds.lx = Math.max(this.bounds.lx, edge.startPos.x, edge.endPos.x);
      this.bounds.ly = Math.max(this.bounds.ly, edge.startPos.y, edge.endPos.y);
    });
    this.viewport = {
      x: this.bounds.sx - 5,
      y: this.bounds.sy - 5,
      width: this.bounds.lx - this.bounds.sx + 10,
      height: this.bounds.ly - this.bounds.sy + 10,
    }
  }

  deepcopy () {
    return new SavedTree(this.treeNode.deepcopy(null), this.name);
  }
}

const baseNode = new TreeNode({ x: 50, y: 90 }, null);

function startEdge(startX, startY, button, treeBase) {
  dragging = true;
  dragStart = { x: startX, y: startY };
  dragEnd = { x: startX, y: startY };
  switch (button) {
    case 0:
      if (pressed['3']) {
        dragConfig.color = 'red';
      } else if (pressed['2']) {
        dragConfig.color = 'green';
      } else {
        dragConfig.color = 'blue';
      }
      break;
    case 2:
      dragConfig.color = 'red';
      break;
    case 1:
      dragConfig.color = 'green';
      break;
  }
  dragConfig.treeBase = treeBase;
}

// Base
const baseEdge = new Edge({ x: -1000, y: 90 }, { x: 1000, y: 90 }, 'black', 2);
const baseClick = new ClickArea({ x: -1000, y: 89 }, 2000, 2, (x, y, button, c) => {startEdge(x, 90, button, baseNode)}, 5);
CLICK_AREAS.push(baseClick);

let viewport = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};

let pressed = {};

let cutting = false;
let cutPosition = { x: 0, y: 0 };

let dragging = false;
let dragStart = { x: 0, y: 0 };
let dragEnd = { x: 0, y: 0 };
let dragConfig = {
  color: 'blue',
}

let shifting = false;
let shiftPosition = { x: 0, y: 0 };

let savePreviewScroll = 0;

let saveDragging = false;
let saveDraggingTree = null;
let saveDraggingPosition = {
  x: 0,
  y: 0,
}


canvas.onmousedown = function (event) {
  const clickX = event.clientX;
  const clickY = event.pageY - HEADING_MARGIN_Y;

  let clicked = false;

  CLICK_AREAS.forEach(clickArea => {
    if (clickArea.isClicked(clickX, clickY, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height)) {
      const {x: newX, y: newY} = toGameSpace(clickX, clickY, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
      clickArea.onClick(newX, newY, event.button, clickArea);
      clicked = true;
    }
  })

  if (!clicked) {
    if (event.clientX < canvas.width - SIDEBAR_WIDTH) {
      if (event.button === 0) {
        if (event.shiftKey) {
          shifting = true;
          shiftPosition = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
        } else {
          cutting = true;
          cutPosition = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
        }
      }
    } else {
      // reverse index from scroll position.
      const index = Math.floor((clickY + savePreviewScroll) / (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT));
      if (index < SAVES.length) {
        saveDragging = true;
        saveDraggingTree = SAVES[index].deepcopy();
        saveDraggingPosition = { x: clickX, y: clickY };

        if (event.button === 2 || (event.button === 0 && pressed['Shift'])) {
          saveDraggingTree.treeNode.invert();
        }
      }
    }
  }
}

canvas.onkeydown = function (event) {
  pressed[event.key] = true;
}

canvas.onkeyup = function (event) {
  pressed[event.key] = false;
  if ((event.key == 's' || event.key == 'Enter') && document.getElementById('modalDimmer').className === '') {
    showSave();
  }
}

canvas.onmousemove = function (event) {
  if (dragging) {
    const {x, y} = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    dragEnd = { x, y };
  }
  if (shifting) {
    const {x, y} = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    viewport.x += shiftPosition.x - x;
    viewport.y += shiftPosition.y - y;
  }
  if (saveDragging) {
    saveDraggingPosition.x += event.movementX;
    saveDraggingPosition.y += event.movementY;
  }
  if (cutting) {
    const oldCutPosition = cutPosition;
    cutPosition = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    const margin = toGameMagnitude(4, 4, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    let removed = null;
    EDGES.forEach(edge => {
      const old = edge.equation(oldCutPosition.x, oldCutPosition.y);
      const cur = edge.equation(cutPosition.x, cutPosition.y);
      if ((old <= 0 && cur >= 0) || (old >= 0 && cur <= 0)) {
        // Is this in the range of the edge?
        const minx = Math.min(edge.startPos.x, edge.endPos.x);
        const maxx = Math.max(edge.startPos.x, edge.endPos.x);
        const miny = Math.min(edge.startPos.y, edge.endPos.y);
        const maxy = Math.max(edge.startPos.y, edge.endPos.y);

        splits = 5;
        for (let i=1; i<splits; i++) {
          middleCut = {
            x: oldCutPosition.x + (cutPosition.x - oldCutPosition.x) * i / splits,
            y: oldCutPosition.y + (cutPosition.y - oldCutPosition.y) * i / splits,
          }
          if (middleCut.x >= minx - margin.x && middleCut.x <= maxx + margin.x && middleCut.y >= miny - margin.y && middleCut.y <= maxy + margin.y) {
            // Remove the edge and everything above it.
            removed = edge;
          }
        }

      }
    });
    if (removed) {
      baseNode.deleteEdge(removed);

      EDGES = baseNode.collectEdges();
      NODES = baseNode.collectNodes();
      CLICK_AREAS = baseNode.collectClickAreas();
      CLICK_AREAS.push(baseClick);
    }
  }
}

canvas.onmouseup = function (event) {
  if (shifting) {
    shifting = false;
  }
  if (dragging) {
    dragging = false;
    dragEnd = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    gameMargin = toGameMagnitude(10, 10, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    // TODO: Redo detection and also allow merging nodes rather than creation.

    let found_node = null;
    NODES.forEach(node => {
      if (Math.abs(node.x - dragEnd.x) < gameMargin.x + node.radius && Math.abs(node.y - dragEnd.y) < gameMargin.y + node.radius) {
        found_node = node;
        dragEnd = { x: node.x, y: node.y };
      }
    })

    if (dragConfig.treeBase.node === found_node) {
      // Cancel
      return;
    }

    if (found_node) {
      const edge = new Edge(dragStart, dragEnd, dragConfig.color, 2);
      dragConfig.treeBase.addChild(found_node.treeNode, edge);
      EDGES.push(edge);
    } else {
      const treeNode = new TreeNode(dragEnd, dragConfig.treeBase);
      const edge = new Edge(dragStart, dragEnd, dragConfig.color, 2)
      const clickArea = new ClickArea({
          x: dragEnd.x - 1,
          y: dragEnd.y - 1,
        }, 2, 2, (x, y, button, c) => {startEdge(c.treeNode.position.x, c.treeNode.position.y, button, c.treeNode)}, 5);
      const node = new Node(dragEnd.x, dragEnd.y, 1, 'black');
      EDGES.push(edge);
      CLICK_AREAS.push(clickArea);
      NODES.push(node);
      treeNode.setClickArea(clickArea);
      treeNode.setNode(node);

      dragConfig.treeBase.addChild(treeNode, edge);
    }
    makeUnknown();
  }
  if (saveDragging) {
    if (saveDraggingPosition.x < canvas.width - SIDEBAR_WIDTH) {
      // Place the save in the current game, at this position.
      const {x} = toGameSpace(saveDraggingPosition.x, saveDraggingPosition.y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
      // Make x the center of the save.
      const dx = x - saveDraggingTree.viewport.x - saveDraggingTree.viewport.width / 2;
      const newNode = saveDraggingTree.treeNode.deepcopy(null);
      newNode.shift(dx, 0);
      baseNode.addChild(newNode, null);
      EDGES.push(...newNode.collectEdges());
      NODES.push(...newNode.collectNodes());
      CLICK_AREAS.push(...newNode.collectClickAreas());
    }
    saveDragging = false;
  }
  if (cutting) {
    cutting = false;
  }
}

canvas.oncontextmenu = function (event) {
  event.preventDefault();
}

canvas.onwheel = function (event) {
  if (event.clientX < canvas.width - SIDEBAR_WIDTH) {
    const {x, y} = toGameSpace(event.clientX, event.pageY - HEADING_MARGIN_Y, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height);
    const scalar = (event.wheelDeltaY === 0 ? event.wheelDeltaX : event.wheelDeltaY) > 0 ?  0.9 : 1.1;
    // Now we need to place x, y where it was before.
    viewport.x = x - (x - viewport.x) * scalar;
    viewport.y = y - (y - viewport.y) * scalar;
    viewport.width *= scalar;
    viewport.height *= scalar;
  }
  else {
    // Scroll the saves
    savePreviewScroll -= event.wheelDeltaY;
    savePreviewScroll = Math.min(savePreviewScroll, SAVES.length * (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT) - canvas.height);
    savePreviewScroll = Math.max(0, savePreviewScroll);
  }

  event.preventDefault();
}

function canvasUpdate () {

// Set canvas size to match the viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - HEADING_MARGIN_Y - BOTTOM_Y;

EDGES.forEach(edge => edge.draw(context, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height, 0, 0));
if (dragging) {
  let extraEdge = new Edge(dragStart, dragEnd, dragConfig.color, 2);
  extraEdge.draw(context, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height, 0, 0);
}
NODES.forEach(node => node.draw(context, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height, 0, 0));

baseEdge.draw(context, viewport, canvas.width - SIDEBAR_WIDTH, canvas.height, 0, 0);

// Saves
SAVES.forEach((save, save_index) => {
  save.edges.forEach(edge => {
    edge.draw(context, save.viewport,
      PREVIEW_WIDTH, PREVIEW_HEIGHT,
      canvas.width - SIDEBAR_WIDTH + PREVIEW_MARGIN + PREVIEW_TEXT_WIDTH,
      PREVIEW_MARGIN + save_index * (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT) - savePreviewScroll
    );
  });
  save.nodes.forEach(node => {
    node.draw(context, save.viewport,
      PREVIEW_WIDTH, PREVIEW_HEIGHT,
      canvas.width - SIDEBAR_WIDTH + PREVIEW_MARGIN + PREVIEW_TEXT_WIDTH,
      PREVIEW_MARGIN + save_index * (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT) - savePreviewScroll
    );
  });
  baseEdge.draw(context, save.viewport,
    PREVIEW_WIDTH, PREVIEW_HEIGHT,
    canvas.width - SIDEBAR_WIDTH + PREVIEW_MARGIN + PREVIEW_TEXT_WIDTH,
    PREVIEW_MARGIN + save_index * (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT) - savePreviewScroll
  );
  context.font = "36px Roboto sans-serif";
  context.fillText(save.name,
    canvas.width - SIDEBAR_WIDTH + PREVIEW_MARGIN,
    PREVIEW_MARGIN + save_index * (2 * PREVIEW_MARGIN + PREVIEW_HEIGHT) - savePreviewScroll
      + PREVIEW_HEIGHT * 0.4
  );
});

if (saveDragging && saveDraggingPosition.x < canvas.width - SIDEBAR_WIDTH) {
  saveDraggingTree.edges.forEach(edge => {
    edge.draw(context, {
      ...saveDraggingTree.viewport,
      y: viewport.y,
      height: viewport.height,
    },
      PREVIEW_WIDTH * 3, canvas.height,
      saveDraggingPosition.x - 3 * PREVIEW_WIDTH / 2,
      0
    );
  });
  saveDraggingTree.nodes.forEach(node => {
    node.draw(context, {
      ...saveDraggingTree.viewport,
      y: viewport.y,
      height: viewport.height,
    },
      PREVIEW_WIDTH * 3, canvas.height,
      saveDraggingPosition.x - 3 * PREVIEW_WIDTH / 2,
      0
    );
  });
}

// UI Sidebar
drawLine(
  context,
  { x: canvas.width - SIDEBAR_WIDTH, y: 0 },
  { x: canvas.width - SIDEBAR_WIDTH, y: canvas.height },
  '#999',
  2
);
}

setInterval(canvasUpdate, 1000 / 60); // 60 FPS

// Buttons

function reset() {
  NODES.splice(0, NODES.length);
  EDGES.splice(0, EDGES.length);
  CLICK_AREAS.splice(0, CLICK_AREAS.length);
  // Keep the drawing click area.
  CLICK_AREAS.push(baseClick);
  baseNode.children.splice(0, baseNode.children.length);

  makeUnknown();
}

document.getElementById('reset').onclick = function () {
  reset();
  canvas.focus();
}

document.getElementById('calculate').onclick = function () {
  const res = baseNode.evaluate();
  const outcome = document.getElementById('game_outcome');
  const text = document.getElementById('outcome_text');
  if (res === 'blue') {
    outcome.className = 'blue';
    text.innerHTML = 'B';
  } else if (res === 'red') {
    outcome.className = 'red';
    text.innerHTML = 'R';
  } else if (res === 'fuzzy') {
    outcome.className = 'fuzzy';
    text.innerHTML = '||';
  } else {
    outcome.className = 'zero';
    text.innerHTML = '0';
  }
  canvas.focus();
}

function showSave() {
  document.getElementById('modalDimmer').classList.add('active');
  document.getElementById('gameName').focus();
}

document.getElementById('save').onclick = function () {
  showSave();
}

document.getElementById('confirm_cancel').onclick = function () {
  document.getElementById('modalDimmer').className = '';
  canvas.focus();
}

function save() {
  document.getElementById('modalDimmer').className = '';

  const name = document.getElementById('gameName').value;
  document.getElementById('gameName').value = '';

  SAVES.push(new SavedTree(baseNode.deepcopy(null), name));
  reset();
  canvas.focus();
}

document.getElementById('confirm_save').onclick = function () {
  save();
}

document.getElementById('gameName').onkeyup = function (event) {
  if (event.key === "Enter") {
    save();
  }
}

function makeUnknown() {
  const outcome = document.getElementById('game_outcome');
  const text = document.getElementById('outcome_text');
  outcome.className = 'unknown';
  text.innerHTML = '?';
}


document.getElementById('downArrow').onclick = function () {
  // Scroll to below the canvas.
  window.scrollTo({top: document.getElementById('explanation').clientHeight, behavior: 'smooth'});
}
