"use strict";

var StateMachine = require('./lib/state-machine.js');

var cp = require('./lib/cp.js');
var v = cp.v;

var Terrain = require('./terrain.js').Terrain;
var Vehicle = require('./vehicle.js').Vehicle;

var input = require('./input.js');
var util = require('./util.js');


var Game = function(canvas, config) {

    StateMachine.create({
        initial: 'loading',
        events: [
            { name: 'loaded', from: 'loading', to: 'mainMenu' },
            { name: 'start', from: 'mainMenu', to: 'game' },
            { name: 'pause', from: 'game', to: 'paused' },
            { name: 'resume', from: 'paused', to: 'game' },
            { name: 'crashed', from: 'game', to: 'mainMenu' }
      ]
    }, this);

    document.getElementById('play-btn').onclick = function() {this.start()}.bind(this);

    /* Initialise Statistics */
    this.lastTime = 0;
    this.fps = 0;
    this.simulationTime = 0;
    this.drawTime = 0;
    /* Initialise Rendering */
    canvas.oncontextmenu = function(e) { e.preventDefault(); }
    canvas.onmousedown = function(e) { e.preventDefault(); };
    canvas.onmouseup = function(e) { e.preventDefault(); };

    this.ctx = canvas.getContext('2d');

    /* Bind callback to resize canvas */
    if (!this.hasOwnProperty('resize')) {
        this.resize = this.resize.bind(this);
    }
    // TODO bind to canvas resize event not windo resize event
    window.addEventListener('resize', this.resize);
    this.resize();

    /* Initialise Chipmunk Physics*/
    var space = this.space = new cp.Space();
    space.iterations = 10;
    space.sleepTimeThreshold = 0.5;
    space.gravity = v(0, -config['gravity']);

    /* Build Scene */
    var giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
    giantInvisibleWall.setElasticity(2);
    space.addShape(giantInvisibleWall);

    this.terrain = new Terrain(space);
    this.vehicle = new Vehicle(space, config['vehicle'], v(100,100));

    this.running = false;
    this.resized = false;

    input.init();

    this.loaded();
};

Game.prototype.requestUpdate = function() {
    if (!this.updateQueued) {
        this.updateQueued = true;
        util.requestAnimationFrame(this.update.bind(this));
    }
}

Game.prototype.loop = function() {
    switch (this.current) {
    case 'game':
        this.requestUpdate();
        break;
    }
}

Game.prototype.update = function(time) {
    this.updateQueued = false;
    switch (this.current) {
    case 'game':
        var dt = time - this.lastTime;

        // Update FPS
        if(dt > 0) {
            this.fps = 0.9*this.fps + 0.1*(1000/dt);
        }

        var lastNumActiveShapes = this.space.activeShapes.count;

        // Handle Input
        if (input.rightPressed() && !input.leftPressed()) {
            this.vehicle.setThrottle(1);
        } else if (input.leftPressed() && !input.rightPressed()) {
            this.vehicle.setThrottle(-1);
        } else {
            this.vehicle.setThrottle(0);
        }

        // Run Physics
        var now = Date.now();
        this.space.step(1/60);
        this.simulationTime += Date.now() - now;

        // Only redraw if the simulation isn't asleep.
        if (lastNumActiveShapes > 0 || this.resized) {
            now = Date.now();
            this.draw();
            this.drawTime += Date.now() - now;
            this.resized = false;
        }

        this.lastTime = time;
        break;
    }

    this.loop();
}


Game.prototype.resize = function() {
    var canvas = this.ctx.canvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.resized = true;
};

Game.prototype.draw = function() {
    var ctx = this.ctx;
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    var viewbox = {};
    viewbox.bottom = -(40 + 40 + 40 + 30 + 10);
    viewbox.top = 2*(40 + 40 + 40 + 30 + 10);

    var scale = height / (viewbox.top - viewbox.bottom)

    viewbox.left = Math.max(0, this.vehicle.chassis.p.x - (width / (3*scale)));
    viewbox.right = viewbox.left + width / scale;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, width, height);
    this.drawInfo();


    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, -scale);
    ctx.translate(-viewbox.left, -viewbox.top);

    this.vehicle.draw(ctx, viewbox);
    this.terrain.draw(ctx, viewbox);
};

Game.prototype.drawInfo = function() {
    var fpsStr = Math.floor(this.fps * 10) / 10;
    if (this.space.activeShapes.count === 0) {
        fpsStr = '--';
    }
    document.getElementById('fps').textContent = ""+fpsStr;
    document.getElementById('step').textContent = ""+this.space.stamp;
    document.getElementById('simulationTime').textContent = ""+this.simulationTime+" ms";
    document.getElementById('drawTime').textContent = ""+this.drawTime+" ms";
};

Game.prototype.onenterstate = function(event, from, to) {
    this.loop();
}

Game.prototype.onentermainMenu = function(event, from, to) {
  document.getElementById('main-menu').classList.remove('hidden');
}

Game.prototype.onleavemainMenu = function(event, from, to) {
  document.getElementById('main-menu').classList.add('hidden');
}


module.exports = {
    'Game': Game
};
