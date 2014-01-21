"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;

var Terrain = require('./terrain.js').Terrain;
var Vehicle = require('./vehicle.js').Vehicle;

var input = require('./input.js');
var util = require('./util.js');

var data = require('./data.js');

var Game = function() {
    /* Initialise Statistics */
    this.fps = 0;
    this.simulationTime = 0;
    this.drawTime = 0;

    /* Initialise Chipmunk Physics*/
    var space = this.space = new cp.Space();
    space.iterations = 10;
    space.gravity = v(0, -200);
    space.sleepTimeThreshold = 0.5;


    /* Initialise Rendering */
    var canvas = document.getElementsByTagName('canvas')[0];

    canvas.oncontextmenu = function(e) { e.preventDefault(); }
    canvas.onmousedown = function(e) { e.preventDefault(); };
    canvas.onmouseup = function(e) { e.preventDefault(); };

    this.ctx = canvas.getContext('2d');

    /* Build Scene */
    var giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
    giantInvisibleWall.setElasticity(2);
    space.addShape(giantInvisibleWall);

    this.vehicle = new Vehicle(space, data.landRover, v(100,100));
    this.terrain = new Terrain(space);

    this.running = false;
    this.resized = false;
};

Game.prototype.run = function() {
    if (!this.hasOwnProperty('onResize')) {
        this.onResize = this.onResize.bind(this);
    }
    window.addEventListener('resize', this.onResize);
    this.onResize();

    input.init();

    if (this.running) {
        throw "already running";
    }
    this.running = true;

    var lastTime = 0;
    var step = function(time) {
        var dt = time - lastTime;

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

        lastTime = time;

        if (this.running) {
            util.requestAnimationFrame(step);
        }
    }.bind(this);

    step(0);
};

Game.prototype.stop = function() {
    this.running = false;

    window.removeEventListener('resize', this.onResize);
};

Game.prototype.onResize = function(e) {
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

module.exports = {
    'Game': Game
};
