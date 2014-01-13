"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;

var Terrain = require('./terrain.js').Terrain;
var Vehicle = require('./vehicle.js').Vehicle;
var util = require('./util.js');

var data = require('./data.js');

var ctx;
var draw;
var drawInfo;

var resized;
var onResize;

var fps;
var drawTime;
var simulationTime;

var giantInvisibleWall;
var space;
var terrain;
var vehicle;

var leftPressed;
var rightPressed;
var running;


var run = function() {

    /* Initialise Statistics */
    fps = 0;
    simulationTime = 0;
    drawTime = 0;

    /* Initialise Chipmunk Physics*/
    space = new cp.Space();
    space.iterations = 10;
    space.gravity = v(0, -200);
    space.sleepTimeThreshold = 0.5;


    /* Initialise Rendering */
    var canvas = document.getElementsByTagName('canvas')[0];

    canvas.oncontextmenu = function(e) { e.preventDefault(); }
    canvas.onmousedown = function(e) { e.preventDefault(); };
    canvas.onmouseup = function(e) { e.preventDefault(); };

    ctx = canvas.getContext('2d');

    /* Build Scene */
    giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
    giantInvisibleWall.setElasticity(2);
    space.addShape(giantInvisibleWall);

    vehicle = new Vehicle(space, data.landRover, v(100,100));
    terrain = new Terrain(space);

    running = false;
    resized = false;

    leftPressed = false;
    rightPressed = false;


    window.addEventListener('resize', onResize);
    onResize();

    if (running) {
        throw "already running";
    }
    running = true;

    var lastTime = 0;
    var step = function(time) {
        var dt = time - lastTime;

        // Update FPS
        if(dt > 0) {
            fps = 0.9*fps + 0.1*(1000/dt);
        }

        var lastNumActiveShapes = space.activeShapes.count;

        // Handle Input
        if (rightPressed && !leftPressed) {
            vehicle.setThrottle(1);
        } else if (leftPressed && !rightPressed) {
            vehicle.setThrottle(-1);
        } else {
            vehicle.setThrottle(0);
        }

        // Run Physics
        var now = Date.now();
        space.step(1/60);
        simulationTime += Date.now() - now;

        // Only redraw if the simulation isn't asleep.
        if (lastNumActiveShapes > 0 || resized) {
            now = Date.now();
            draw();
            drawTime += Date.now() - now;
            resized = false;
        }

        lastTime = time;

        if (running) {
            util.requestAnimationFrame(step);
        }
    }.bind(this);

    step(0);
};

var stop = function() {
    running = false;

    window.removeEventListener('resize', onResize);
};

var onResize = function(e) {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    resized = true;
};

var draw = function() {
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    var viewbox = {};
    viewbox.bottom = -(40 + 40 + 40 + 30 + 10);
    viewbox.top = 2*(40 + 40 + 40 + 30 + 10);

    var scale = height / (viewbox.top - viewbox.bottom)

    viewbox.left = Math.max(0, vehicle.chassis.p.x - (width / (3*scale)));
    viewbox.right = viewbox.left + width / scale;

    var point2canvas = function(point) {
        return v(point.x * scale, -point.y * scale);
    }

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, width, height);
    drawInfo();

    ctx.translate(-scale * viewbox.left, scale * viewbox.top);

    vehicle.draw(ctx, scale, point2canvas);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, -scale);
    ctx.translate(-viewbox.left, -viewbox.top);

    terrain.draw(ctx, viewbox);
};

var drawInfo = function() {
    var maxWidth = ctx.canvas.width - 20;

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = "black";
    //ctx.fillText(ctx.font, 100, 100);
    var fpsStr = Math.floor(fps * 10) / 10;
    if (space.activeShapes.count === 0) {
        fpsStr = '--';
    }
    ctx.fillText("FPS: " + fpsStr, 10, 50, maxWidth);
    ctx.fillText("Step: " + space.stamp, 10, 80, maxWidth);

    ctx.fillText("Simulation time: " + simulationTime + " ms", 10, 170, maxWidth);
    ctx.fillText("Draw time: " + drawTime + " ms", 10, 200, maxWidth);
};

module.exports = {
    'run': run,
    'stop': stop,
    'onResize': onResize,
    'draw': draw,
    'drawInfo': drawInfo
};
