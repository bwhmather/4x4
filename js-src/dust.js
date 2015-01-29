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
        var radius = 10 * particle.age;
        ctx.ellipse(particle.p.x, particle.p.y, radius, radius, 0, 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
};


Dust.prototype.update = function(dt) {
    for (var i in this.particles) {
        this.particles[i].age += dt;
    }
    this.particles = this.particles.filter(function(p) {return p.age < 4;})
};


module.exports = {
    'Dust': Dust
}
