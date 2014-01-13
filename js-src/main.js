"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;

var terrain = require('./terrain.js');
var vehicle = require('./vehicle.js');
var util = require('./util.js');


var data = {
    "chassis": {
        "mass": 5,
        "width": 80,
        "height": 20,

        "cab": {
            "bottom": 22, // length of bottom of cab
            "lead": 8, // offset of start of top of cab from front of bottom
            "top": 14, // length of top of cab
            "front": 25,
            "height":17
        }
    },

    "front_wheel": {
        "mass": 0.15,
        "radius": 13,
        "friction": 1.2
    },
    "front_suspension": {
        "stiffness": 450,
        "damping": 12,
        "spring_anchor": v(30, 5),
        "spring_length": 20,
        "arm_anchor": v(0, -10)
    },
    "front_motor": {
       "torque":7500,
        "rate": 20 * Math.PI
    },

    "back_wheel": {
        "mass": 0.15,
        "radius": 13,
        "friction": 1.2
    },
    "back_suspension": {
        "stiffness": 450,
        "damping": 12,
        "spring_anchor": v(-30, 5),
        "spring_length": 20,
        "arm_anchor": v(0, -10)
    },
    "back_motor": {
       "torque": 7500,
        "rate": 20 * Math.PI
    },

    "differential": {
        "torque": 7500
    }
};


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
    this.giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
    this.giantInvisibleWall.setElasticity(2);
    space.addShape(this.giantInvisibleWall);

    this.vehicle = new vehicle.Vehicle(space, data, v(100,100));
    this.terrain = new terrain.Terrain(space);


    this.running = false;
    this.resized = false;

    this.leftPressed = false;
    this.rightPressed = false;
};

Game.prototype.run = function() {
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.onResize();

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
        if (this.rightPressed && !this.leftPressed) {
            this.vehicle.setThrottle(1);
        } else if (this.leftPressed && !this.rightPressed) {
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
    running = false;
};

Game.prototype.onResize = function(e) {
    this.ctx.canvas.width = window.innerWidth;
    this.ctx.canvas.height = window.innerHeight;
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

    var point2canvas = function(point) {
        return v(point.x * scale, -point.y * scale);
    }

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, width, height);
    this.drawInfo();

    ctx.translate(-scale * viewbox.left, scale * viewbox.top);

    this.vehicle.draw(ctx, scale, point2canvas);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, -scale);
    ctx.translate(-viewbox.left, -viewbox.top);

    this.terrain.draw(ctx, viewbox);
};

Game.prototype.drawInfo = function() {
    var ctx = this.ctx;
    var maxWidth = ctx.canvas.width - 20;

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = "black";
    //this.ctx.fillText(this.ctx.font, 100, 100);
    var fpsStr = Math.floor(this.fps * 10) / 10;
    if (this.space.activeShapes.count === 0) {
        fpsStr = '--';
    }
    ctx.fillText("FPS: " + fpsStr, 10, 50, maxWidth);
    ctx.fillText("Step: " + this.space.stamp, 10, 80, maxWidth);

    ctx.fillText("Simulation time: " + this.simulationTime + " ms", 10, 170, maxWidth);
    ctx.fillText("Draw time: " + this.drawTime + " ms", 10, 200, maxWidth);
};


var game = new Game();
game.run();
