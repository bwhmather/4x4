var v = cp.v;

var ctx;

var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var Demo = function() {
        var space = this.space = new cp.Space();
        this.fps = 0;
        this.simulationTime = 0;
        this.drawTime = 0;

        this.canvas.oncontextmenu = function(e) { e.preventDefault(); }
        this.canvas.onmousedown = function(e) { e.preventDefault(); };
        this.canvas.onmouseup = function(e) { e.preventDefault(); };
};

var canvas = Demo.prototype.canvas = document.getElementsByTagName('canvas')[0];

var ctx = Demo.prototype.ctx = canvas.getContext('2d');

var raf = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback) {
                return window.setTimeout(callback, 1000 / 60);
        };

// These should be overridden by the demo itself.
Demo.prototype.update = function(dt) {
        this.space.step(dt);
};

Demo.prototype.run = function() {
        this.running = true;

        var self = this;

        var lastTime = 0;
        var step = function(time) {
                self.step(time - lastTime);
                lastTime = time;

                if (self.running) {
                        raf(step);
                }
        };

        step(0);
};

var soon = function(fn) { setTimeout(fn, 1); };

Demo.prototype.stop = function() {
        this.running = false;
};

Demo.prototype.step = function(dt) {
        // Update FPS
        if(dt > 0) {
                this.fps = 0.9*this.fps + 0.1*(1000/dt);
        }

        var lastNumActiveShapes = this.space.activeShapes.count;

        var now = Date.now();
        this.update(1/60);
        this.simulationTime += Date.now() - now;

        // Only redraw if the simulation isn't asleep.
        if (lastNumActiveShapes > 0 || Demo.resized) {
                now = Date.now();
                this.draw();
                this.drawTime += Date.now() - now;
                Demo.resized = false;
        }
};


window.onresize = function(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
window.onresize();


