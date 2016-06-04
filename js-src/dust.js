"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Dust = function(space, a, b) {
    space.addCollisionHandler(a, b, false, false, this.onPostSolve.bind(this), false);
    this.particles = [];
};


Dust.prototype.onPostSolve = function(arb, space) {
    for (var i in arb.contacts) {
        var contact = arb.contacts[i];

        // only emit dust once every ten or so frames
        if (!Math.floor(Math.random()* 10)) {
            // Approximately 1 or 2 while driving, 20 on heavy acceleration,
            // up to about 100 when crashing
            var acc = contact.jtAcc;
            this.particles.push({
                p: v(contact.p.x, contact.p.y),
                strength: Math.sqrt(acc),
                age: 0
            });
        }
    }
};


Dust.prototype.draw = function(ctx, box, res) {
    ctx.save()
    var sprite = res.get("dust");
    for (var i in this.particles) {
        var particle = this.particles[i];
        var radius = 30 * particle.age;
        ctx.globalAlpha = 1 - 0.25*particle.age;
        ctx.drawImage(sprite,
            particle.p.x - radius, particle.p.y,
            radius, radius);
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
