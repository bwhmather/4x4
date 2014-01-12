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

    this.image = document.getElementById('wheelImage');
};

Wheel.prototype = Object.create(cp.Body.prototype);

Wheel.prototype.draw = function(ctx, scale, point2canvas) {
    var c = point2canvas(this.p);
    var r = this.spec.radius;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(-this.a);
    ctx.scale(scale, scale);
    ctx.drawImage(this.image, -r, -r, 2*r, 2*r);
    ctx.restore();

};


var Vehicle = module.exports.Vehicle = function(space, spec, offset) {
    this.spec = spec;

    var makeChassis = function(space, spec) {
        var body = new cp.Body(
            spec.mass,
            cp.momentForBox(spec.mass, spec.width, spec.height)
        );
        space.addBody(body);

        var bodyShape = new cp.BoxShape(body, spec.width, spec.height);
        bodyShape.setFriction(1.2);
        bodyShape.group = 1;
        space.addShape(bodyShape);

        var cabShape = new cp.PolyShape(
            body,
            [
                0, 0,
                -spec.cab.bottom, 0,
                -spec.cab.top - spec.cab.lead, spec.cab.height,
                -spec.cab.lead, spec.cab.height
            ],
            v(spec.width / 2 - spec.cab.front, spec.height / 2)
        );
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


    this.chassis = makeChassis(space, spec.chassis);
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

    this.bodyImage = document.getElementById('bodyImage');
};

Vehicle.prototype.setThrottle = function(throttle) {
    var spec = this.spec;

    this.frontMotor.rate = (throttle < 0 ? -1 : 1) * spec.front_motor.rate;
    this.frontMotor.maxForce = Math.abs(throttle) * spec.front_motor.torque;

    this.backMotor.rate = (throttle < 0 ? -1 : 1) * spec.back_motor.rate;
    this.backMotor.maxForce = Math.abs(throttle) * spec.back_motor.torque;

    if (throttle !== 0) {
        this.frontMotor.activateBodies();
        this.backMotor.activateBodies();
    }
};

Vehicle.prototype.draw = function(ctx, scale, point2canvas) {
    var spec = this.spec;

    ctx.save();
    var c = point2canvas(this.chassis.p);
    ctx.translate(c.x, c.y);
    ctx.rotate(-this.chassis.a);
    ctx.scale(scale, scale);
    ctx.drawImage(this.bodyImage,
        -0.55*spec.chassis.width, -0.55*spec.chassis.height - 1.1*spec.chassis.cab.height,
        1.1*spec.chassis.width, 1.1*(spec.chassis.height + spec.chassis.cab.height));
    ctx.restore();

    this.frontWheel.draw(ctx, scale, point2canvas, this.frontWheel);
    this.backWheel.draw(ctx, scale, point2canvas, this.backWheel);
};
