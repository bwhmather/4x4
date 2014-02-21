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

    /* Initialise Statistics */
    this.simulationTime = 0;
    this.drawTime = 0;

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

    this.resized = false;

    input.init();
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

Game.prototype.update = function(dt) {

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

}

Game.prototype.draw = function(ctx) {
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, -scale);
    ctx.translate(-viewbox.left, -viewbox.top);

    this.vehicle.draw(ctx, viewbox);
    this.terrain.draw(ctx, viewbox);
};

module.exports = {
    'Game': Game
};
