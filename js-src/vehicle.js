"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Wheel = function(space, spec) {
    this.spec = spec;

    cp.Body.call(
        this,
        spec.mass,
        cp.momentForCircle(spec.mass, spec.radius, spec.radius, v(0,0))
    );
    space.addBody(this);

    var shape = new cp.CircleShape(this, spec.radius, v(0,0));
    shape.setElasticity(0);
    shape.setFriction(spec.friction);
    shape.group = 1;
    space.addShape(shape);
};

Wheel.prototype = Object.create(cp.Body.prototype);


Wheel.prototype.draw = function(ctx, viewbox, res) {
    var r = this.spec.radius;

    ctx.save();
    ctx.translate(this.p.x, this.p.y);
    ctx.rotate(this.a);
    ctx.scale(1, -1);
    ctx.drawImage(res.get('wheel'), -r, -r, 2*r, 2*r);
    ctx.restore();

};


var Vehicle = function(space, spec, offset) {
    this.spec = spec;

    var makeChassis = function(space, spec) {
        var body = new cp.Body(
            spec.mass,
            cp.momentForBox(spec.mass, 80, 40)
        );
        space.addBody(body);

        var bodyShape = new cp.PolyShape(
            body,
            spec.body_outline.map(function(c) {
                return c * spec.body_outline_scale;
            }),
            v.mult(spec.body_outline_offset, spec.body_outline_scale));
        bodyShape.setFriction(1.2);
        bodyShape.group = 1;
        space.addShape(bodyShape);

        var cabShape = new cp.PolyShape(
            body,
            spec.cab_outline.map(function(c) {
                return c * spec.cab_outline_scale;
            }),
            v.mult(spec.cab_outline_offset, spec.body_outline_scale));
        cabShape.setFriction(1.2);
        cabShape.group = 1;
        space.addShape(cabShape);

        return body;
    };

    var makeSuspension = function(space, spec, chassis, wheel) {
        wheel.setPos(v(
            chassis.p.x + spec.spring_anchor.x,
            chassis.p.y + spec.spring_anchor.y - spec.spring_length
        ));

        var arm = new cp.PinJoint(chassis, wheel, spec.arm_anchor, v(0,0));
        space.addConstraint(arm);

        var spring = new cp.DampedSpring(
            chassis, wheel,
            spec.spring_anchor, v(0,0),
            spec.spring_length,
            spec.stiffness, spec.damping
        );
        space.addConstraint(spring);
    };

    this.chassis = makeChassis(space, spec);
    this.chassis.setPos(offset);

    this.frontWheel = new Wheel(space, spec.front_wheel);
    makeSuspension(space, spec.front_suspension, this.chassis, this.frontWheel);

    this.backWheel = new Wheel(space, spec.back_wheel);
    makeSuspension(space, spec.back_suspension, this.chassis, this.backWheel);

    this.frontMotor = new cp.SimpleMotor(this.chassis, this.frontWheel, 0);
    this.frontMotor.maxForce = 0;
    space.addConstraint(this.frontMotor);

    this.backMotor = new cp.SimpleMotor(this.chassis, this.backWheel, 0);
    this.backMotor.maxForce = 0;
    space.addConstraint(this.backMotor);

    // TODO make this work for different sized wheels
    this.differential = new cp.SimpleMotor(this.frontWheel, this.backWheel, 0);
    this.differential.maxForce = spec.differential.torque;
    space.addConstraint(this.differential);
};


Vehicle.prototype.setThrottle = function(throttle) {
    var spec = this.spec;

    if (throttle) {
        this.frontMotor.rate = (throttle < 0 ? -1 : 1) * spec.front_motor.rate;
        this.frontMotor.maxForce = Math.abs(throttle) * spec.front_motor.torque;

        this.backMotor.rate = (throttle < 0 ? -1 : 1) * spec.back_motor.rate;
        this.backMotor.maxForce = Math.abs(throttle) * spec.back_motor.torque;

        this.frontMotor.activateBodies();
        this.backMotor.activateBodies();
    } else {
        this.frontMotor.rate = 0;
        this.frontMotor.maxForce = 0.03 * spec.front_motor.torque;

        this.backMotor.rate = 0;
        this.backMotor.maxForce = 0.03 * spec.back_motor.torque;
    }
};


Vehicle.prototype.isCrashed = function() {
    var crashed = false;
    // vehicle has stopped moving
    if (this.chassis.isSleeping()) {
        var angle = Math.abs(this.chassis.a % (2*Math.PI));
        if ((angle > 0.5*Math.PI) && (angle < 1.5*Math.PI)) {
            // vehicle is in contact with ground
            this.chassis.eachArbiter(function(arb) {
                crashed = true;
            });
        }
    }
    return crashed;
};


Vehicle.prototype.draw = function(ctx, viewbox, res) {
    var spec = this.spec;

    ctx.save();
    var p = this.chassis.p;
    ctx.translate(p.x, p.y);
    ctx.rotate(this.chassis.a);

    ctx.scale(spec.image_scale, spec.image_scale);
    ctx.translate(spec.image_offset.x, spec.image_offset.y);

    ctx.scale(1, -1);
    ctx.drawImage(res.get('body'), 0, 0);
    ctx.restore();

    this.frontWheel.draw(ctx, viewbox, res);
    this.backWheel.draw(ctx, viewbox, res);
};


module.exports = {
    'Vehicle': Vehicle
};
