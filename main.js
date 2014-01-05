"use strict";

var data = {
    "chassis": {
        "mass": 5,
        "width": 80,
        "height": 25,

        "cab": {
            "bottom": 30, // length of bottom of cab
            "lead": 10, // offset of start of top of cab from front of bottom
            "top": 20, // length of top of cab
            "front": 25,
            "height":20
        }
    },

    "front_wheel": {
        "mass": 0.2,
        "radius": 20,
        "friction": 0.9,
        "torque": 2000,
        "dtheta": 10 * Math.PI
    },
    "front_suspension": {
        "stiffness": 100,
        "damping": 10,
        "spring_anchor": v(-30, 10),
        "spring_length": 35,
        "arm_anchor": v(0, -10)
    },

    "back_wheel": {
        "mass": 0.2,
        "radius": 20,
        "friction": 0.9,
        "torque": 2000,
        "dtheta": 10 * Math.PI
    },
    "back_suspension": {
        "stiffness": 100,
        "damping": 10,
        "spring_anchor": v(30, 10),
        "spring_length": 35,
        "arm_anchor": v(0, -10)
    }
};


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
    ctx.drawImage(this.image, -0.5 * r, -0.5 * r, r, r);
    ctx.restore();

};


var Pickup = function(space, spec, offset) {
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
    this.differential.maxForce = 10000; /* min(front_motor_torque, back_motor_torque) */
    space.addConstraint(this.differential);
}

Pickup.prototype.setThrottle = function(throttle) {
    var dtheta = 20 * Math.PI;
    var torque = 10000;

    this.frontMotor.rate = (throttle < 0 ? -1 : 1) * dtheta;
    this.frontMotor.maxForce = Math.abs(throttle) * torque;

    this.backMotor.rate = (throttle < 0 ? -1 : 1) * dtheta;
    this.backMotor.maxForce = Math.abs(throttle) * torque;

    if (throttle !== 0) {
        this.frontMotor.activateBodies();
        this.backMotor.activateBodies();
    }
}

Pickup.prototype.draw = function(ctx, scale, point2canvas) {
    this.frontWheel.draw(ctx, scale, point2canvas, this.frontWheel);
    this.backWheel.draw(ctx, scale, point2canvas, this.backWheel);
}

var Game = function() {
    Demo.call(this);

    this.scale = 0.5;
    var space = this.space;

    space.iterations = 10;
    space.gravity = v(0, -200);
    space.sleepTimeThreshold = 0.5;

    var staticBody = space.staticBody;
    var shape;

    var boxOffset = v(100,100);

    var pickup = this.pickup = new Pickup(space, data, boxOffset);

    var components = [
        { f: 1/30, a: 10 },
        { f: 1/70, a: 30 },
        { f: 1/150, a: 40 },
        { f: 1/190, a: 40 },
        { f: 1/310, a: 40 }
    ]

    var terrain_verts = this.terrainVerts = [
        v(0,0)
    ];
    this.borderImage = document.getElementById('borderImage');
    this.borderPattern = this.ctx.createPattern(this.borderImage, 'repeat');
    this.groundImage = document.getElementById('groundImage');
    this.groundPattern = this.ctx.createPattern(this.groundImage, 'repeat');

    for (var x=0; x<10000; x+=40) {
        var y = 0;
        for (var i in components) {
            y += components[i].a * Math.sin(x * components[i].f)
        }
        terrain_verts.push(v(x + 200, y));
    }

    for(var i=0; i<(terrain_verts.length - 1); i++){
        var a = terrain_verts[i], b = terrain_verts[i+1];
        var shape = space.addShape(new cp.SegmentShape(space.staticBody, a, b, 0));
        shape.setElasticity(1);
        shape.setFriction(0.9);
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.onKeyDown);

    this.onKeyUp = this.onKeyUp.bind(this);
    document.addEventListener('keyup', this.onKeyUp);
};

Game.prototype = Object.create(Demo.prototype);

Game.prototype.onKeyDown = function(e) {
    if (e.keyCode === 39) {
        this.pickup.setThrottle(1);
        return false;
    } else if (e.keyCode === 37) {
        this.pickup.setThrottle(-1);
        return false;
    }
};

Game.prototype.onKeyUp = function(e) {
    if (e.keyCode === 39 || e.keyCode === 37) {
        this.pickup.setThrottle(0);
        return false;
    }
};

Game.prototype.draw = function() {
    Demo.prototype.draw.call(this);

    var self = this;

    var ctx = self.ctx;
    var scale = self.scale;
    var point2canvas = self.point2canvas;

    self.pickup.draw(ctx, scale, point2canvas);

    ctx.save();
    ctx.fillStyle = self.groundPattern;
    ctx.beginPath();

    ctx.moveTo(point2canvas(self.terrainVerts[0]).x, 500);
    for (var i=0; i<self.terrainVerts.length; i++) {
        var p = point2canvas(self.terrainVerts[i]);
        ctx.lineTo(p.x, p.y + 2);
    }
    ctx.lineTo(point2canvas(self.terrainVerts[self.terrainVerts.length - 1]).x, 500);
    ctx.fill();
    ctx.restore();


    ctx.fillStyle = self.borderPattern;
    for (var i=0; i<(this.terrainVerts.length - 1); i++) {
        ctx.save();
        var a = point2canvas( self.terrainVerts[i]);
        var b = point2canvas(self.terrainVerts[i+1]);

        var gradient = (b.y - a.y) / (b.x - a.x);

        // TODO it seems unlikely that this is the most efficient way to use the gpu
        // skew in the y direction by the gradient of the line with
        ctx.transform(1, gradient, 0, 1, 0, a.y - a.x * gradient);
        ctx.fillRect(a.x, 0, b.x - a.x, 16);

        ctx.restore();
    }
}

var pu = new Game();
pu.run();

