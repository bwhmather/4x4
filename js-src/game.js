"use strict";

var StateMachine = require('./lib/state-machine.js');

var cp = require('./lib/cp.js');
var v = cp.v;

var Terrain = require('./terrain.js').Terrain;
var Vehicle = require('./vehicle.js').Vehicle;

var input = require('./input.js');
var util = require('./util.js');


var Game = function(config) {
    this.config = config;


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

    this.dirty = true;

    input.init();
};

Game.prototype.update = function(dt) {

    /* Handle Input */
    if (input.rightPressed() && !input.leftPressed()) {
        this.vehicle.setThrottle(1);
    } else if (input.leftPressed() && !input.rightPressed()) {
        this.vehicle.setThrottle(-1);
    } else {
        this.vehicle.setThrottle(0);
    }

    /* Run Physics */
    this.space.step(dt);

    if (this.space.activeShapes.count) {
        this.dirty = true;
    }
};

Game.prototype.draw = function(ctx) {

    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    /* Figure out where to position the camera */
    var viewbox = {};
    viewbox.bottom = this.terrain.min;
    viewbox.top = 2*(this.terrain.max - this.terrain.min) + this.terrain.min;

    var scale = height / (viewbox.top - viewbox.bottom);

    viewbox.left = Math.max(0, this.vehicle.chassis.p.x - (width / (3*scale)));
    viewbox.right = viewbox.left + width / scale;

    /* Clear the screen */
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, width, height);

    /* Draw everything */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, -scale);
    ctx.translate(-viewbox.left, -viewbox.top);

    this.vehicle.draw(ctx, viewbox);
    this.terrain.draw(ctx, viewbox);

    this.dirty = false;
};

module.exports = {
    'Game': Game
};
