"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Dust = function(space, a, b) {
    space.addCollisionHandler(a, b, false, this.onPreSolve.bind(this), false, false);
    this.particles = [];
};


Dust.prototype.onPreSolve = function(arb, space) {
    for (var i in arb.contacts) {
        this.particles.push({
            p: v(arb.contacts[i].p.x, arb.contacts[i].p.y),
            radius: 10,
            age: 0
        });
    }

    return true;
};


Dust.prototype.draw = function(ctx, box, res) {
    ctx.save()
    ctx.fillStyle = "blue";
    for (var i in this.particles) {
        var particle = this.particles[i];
        ctx.beginPath();
        ctx.ellipse(particle.p.x, particle.p.y, particle.radius, particle.radius, 0, 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
};


Dust.prototype.update = function(dt) {
    for (var i in this.particles) {
        this.particles[i].radius += 10*dt;
    }
};


module.exports = {
    'Dust': Dust
}
