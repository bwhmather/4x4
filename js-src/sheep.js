"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Sheep = function(space, x, y) {
    var spec = {
        "mass": 10,
        "radius": 13,
        "friction": 1.2
    };
    this.spec = spec;

    var body = new cp.Body(
        spec.mass,
        cp.momentForCircle(spec.mass, spec.radius, spec.radius, v(0,0))
    );
    body.setPos(v(x, y))
    space.addBody(body);
    this.body = body;

    var shape = new cp.CircleShape(body, spec.radius, v(0,0));
    shape.setElasticity(1.2);
    shape.setFriction(spec.friction);
    shape.group = Sheep;
    shape.setCollisionType(this);
    space.addShape(shape);
};


Sheep.prototype.draw = function(ctx, viewbox, res) {
    var r = this.spec.radius;

    ctx.save();
    ctx.translate(this.body.p.x, this.body.p.y);
    ctx.rotate(this.body.a);
    ctx.scale(1, -1);
    ctx.drawImage(res.get('sheep'), -r, -r, 512*r/244, 512*r/244);
    ctx.restore();
};


var Pen = function(space, vehicle) {



}


Pen.prototype.update = function(dt) {

}


module.exports = {
    'Sheep': Sheep,
    'Pen': Pen,
};
