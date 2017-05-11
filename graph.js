/**
 * Represents the node graph. It will be wrapping a canvas to control all the
 * clicks on the nodes and managing all the connections between them. It also
 * populates the properties div that exposes all the options the nodes offer.
 * @class
 * @param {string} id Id of the canvas to wrap.
 * @property {string} color Background colour of the node graph.
 * @property {number} width Horizontal dimension of the canvas.
 * @property {number} height Vertical dimension of the canvas.
 * @property {object} ctx Holds the context to draw the graph to.
 * @property {list} nodes Contains all the Node objects that populate the graph.
 * @property {list} connections List of connections between nodes represented as
 * [inputNode, outputNode] both elements of the array being the index in the
 * nodes property of this class.
 * @property {number} startX Holds the actual position where the mouse was. Used
 * for moving nodes thorugh click and dragging.
 * @property {number} startY Holds the actual position where the mouse was. Used
 * for moving nodes thorugh click and dragging.
 * @property {number} mouseX Holds the actual position where the mouse is. Used
 * for moving nodes thorugh click and dragging.
 * @property {number} mouseY Holds the actual position where the mouse is. Used
 * for moving nodes thorugh click and dragging.
 * @property {boolean} mousePressed Whether LMB is being clicked or not.
 * @property {Node} activeNode Node that is currently being dragged.
 * @property {boolean} dragging Whether dragging is happening or not on canvas.
 * @property {obejct} pullLink Contains <code>from</code> and <code>to</code>
 * properties used for drawing links between inputs/outputs. It also has the
 * <code>type</code> property that can be either **inwards** or **outwards**.
 * @property {nodes} zoomFactor Determines the size of new nodes and the size of
 * links. zoomFactor is changed when the mouse wheel scrolls.
 */
function Graph(id) {
  this.id = id;
  this.color = '#333';
  this.width = 0;
  this.height = 0;
  this.ctx = null;
  this.nodes = [];
  this.connections = [];
  this.startX = 0;
  this.startY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.mousePressed = false;
  this.activeNode = null;
  this.dragging = false;
  this.pullLink = null;
  this.zoomFactor = 1;
}

/**
 * Prepares the graph by setting dimensions, context to draw to, and event
 * handlers  for the clicks and drags.
 */
Graph.prototype.initialize = function() {
  this.canvas = document.getElementById(this.id);

  this.canvas.style.width = `${this.canvas.parentNode.offsetWidth}px`;
  this.canvas.style.height = `${this.canvas.parentNode.offsetHeight}px`;
  
  this.canvas.width = this.canvas.offsetWidth;
  this.canvas.height = this.canvas.offsetHeight;
  this.canvas.style.height = this.canvas.offsetHeight

  this.width  = this.canvas.width;
  this.height = this.canvas.height;
  this.ctx    = this.canvas.getContext("2d");

  var resizeCallback = function () {
    // todo
  }

  var mouseMoveCallback = function(e) {
    this.mouseX = e.offsetX;
    this.mouseY = e.offsetY;
  }

  var mouseDownCallback = function() {
    this.mousePressed = true;
  }

  var mouseUpCallback = function() {
    this.mousePressed = false;
    this.dragging = false;
    
    this.nodes.forEach(function (inode, i) {
      if (inode.beingPulled) {
        // Check against each other node to see if need to make connection
        this.nodes.forEach(function (jnode, j) {

          switch (this.pullLink.type) { 
            case 'inwards':
              if (jnode.outputHit(this.mouseX, this.mouseY, this.width, this.height) && i !== j) {
                this.connections.push([j, i]);
              }
  
              break;
            case 'outwards':
              if (jnode.inputHit(this.mouseX, this.mouseY, this.width, this.height) && i !== j) {
                this.connections.push([i, j]);
              }
              break;
          }
        }, this);
        inode.beingPulled = false;
      }
    }, this);
    this.pullLink = null;
  }

  var mouseWheelCallback = function (wheelEvent) {
    if (wheelEvent.deltaY > 0) {
      var muliplier = 0.9;
    } else {
      var muliplier = 1 / 0.9;
    }

    this.zoomFactor *= muliplier;

    this.nodes.forEach(function(node, i) {
      var w = node.w * muliplier;
      var h = node.h * muliplier;
      node.resize(w, h);
      var dx = this.mouseX + (node.x - this.mouseX) * muliplier - node.x;
      var dy = this.mouseY + (node.y - this.mouseY) * muliplier - node.y;
      node.move(dx, dy);
    }, this);
  }

  var newNodeCallback = function () {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVXYZ";
    var randomLetter = alphabet[(Math.floor(Math.random() * alphabet.length))];
    var newNode = new Node(randomLetter, 500, 200, 75 * this.zoomFactor, 35 * this.zoomFactor);
    this.addNode(newNode);
  }

  window.onresize = resizeCallback.bind(this);  
  this.canvas.onmousemove = mouseMoveCallback.bind(this);
  this.canvas.onmousedown = mouseDownCallback.bind(this);
  this.canvas.onmouseup = mouseUpCallback.bind(this);
  this.canvas.onwheel = mouseWheelCallback.bind(this);
  document.getElementById('add-node').addEventListener(
    'click',
    newNodeCallback.bind(this)
  );
}

/**
 * Handles all the logic for when a node or any of its handles is dragged.
 */
Graph.prototype.update = function() {
  if (this.mousePressed) {
    if (!this.dragging) {
      this.startX = this.mouseX;
      this.startY = this.mouseY;
    }
    this.dragging = true;

    if (!!this.activeNode) {
      this.activeNode.move(this.mouseX - this.startX, this.mouseY - this.startY);
      this.startX = this.mouseX;
      this.startY = this.mouseY;
    } else {
      this.nodes.forEach(function (node) {
        if (node.inputHit(this.mouseX, this.mouseY, this.width, this.height) && !this.pullLink) {
          node.beingPulled = true;
          this.pullLink = {
            from: { x: this.mouseX, y: this.mouseY },
            to: { x: this.mouseX, y: this.mouseY },
            type: 'inwards'
          };
        } else if (node.outputHit(this.mouseX, this.mouseY, this.width, this.height) && !this.pullLink) {
          node.beingPulled = true;
          this.pullLink = {
            from: { x: this.mouseX, y: this.mouseY },
            to: { x: this.mouseX, y: this.mouseY },
            type: 'outwards'
          };
        } else if (!!node.beingPulled && !!this.pullLink) {
          this.pullLink.to.x = this.mouseX;
          this.pullLink.to.y = this.mouseY;
        } else if (node.isHit(this.mouseX, this.mouseY, this.width, this.height) & !this.pullLink) {
          this.activeNode = node;
        }
      }, this);
    }
  } else {
    this.activeNode = null;
  }
}

/**
 * Draws the graph and all its contents: nodes, connections, grid...
 * @todo Draw a dim grid.
 */
Graph.prototype.draw = function() {
  this.ctx.fillStyle = this.color;
  this.ctx.fillRect(0, 0, this.width, this.height);
  var ctx = this.ctx;

  this.connections.forEach(function (connection) {
    this.ctx.beginPath();

    var fromNode = this.nodes[connection[0]];
    var toNode = this.nodes[connection[1]];
    
    var from = { x: fromNode.x + fromNode.w, y: fromNode.y + fromNode.h / 2 };
    var to = { x: toNode.x, y: toNode.y + toNode.h / 2 };

    this.ctx.moveTo(from.x + this.width / 2, from.y + this.height / 2);
    this.ctx.lineTo(to.x + this.width / 2, to.y + this.height / 2);
    this.ctx.strokeStyle = '#bb4';
    this.ctx.lineWidth = 4 * this.zoomFactor;
    this.ctx.stroke();
  }, this);

  this.nodes.forEach(function(node) {
    node.draw(ctx, this.width, this.height);
  }, this);

  if (!!this.pullLink) { 
    this.ctx.beginPath();
    this.ctx.moveTo(this.pullLink.from.x, this.pullLink.from.y);
    this.ctx.lineTo(this.pullLink.to.x, this.pullLink.to.y);
    this.ctx.strokeStyle = '#bb4';
    this.ctx.lineWidth = 4 * this.zoomFactor;
    this.ctx.stroke();
  }
}

/**
 * Every time a new node needs to be created is appended in the nodes member of
 * the graph so it can be drawn and interacted with.
 * @param {Node} node Node to add to the graph.
 */
Graph.prototype.addNode = function(node) {
  this.nodes.push(node);
  var newDiv = document.createElement("div"); 
  var newContent = document.createTextNode(node.label); 
  newDiv.appendChild(newContent);
  document.getElementById('properties').appendChild(newDiv);
}