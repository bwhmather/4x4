"use strict";

var v = cp.v;
var raf = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback) {
                return window.setTimeout(callback, 1000 / 60);
        };



var data = {
    "chassis": {
        "mass": 5,
        "width": 80,
        "height": 20,

        "cab": {
            "bottom": 22, // length of bottom of cab
            "lead": 8, // offset of start of top of cab from front of bottom
            "top": 14, // length of top of cab
            "front": 25,
            "height":17
        }
    },

    "front_wheel": {
        "mass": 0.15,
        "radius": 13,
        "friction": 1.2
    },
    "front_suspension": {
        "stiffness": 450,
        "damping": 12,
        "spring_anchor": v(30, 5),
        "spring_length": 20,
        "arm_anchor": v(0, -10)
    },
    "front_motor": {
       "torque":7500,
        "rate": 20 * Math.PI
    },

    "back_wheel": {
        "mass": 0.15,
        "radius": 13,
        "friction": 1.2
    },
    "back_suspension": {
        "stiffness": 450,
        "damping": 12,
        "spring_anchor": v(-30, 5),
        "spring_length": 20,
        "arm_anchor": v(0, -10)
    },
    "back_motor": {
       "torque": 7500,
        "rate": 20 * Math.PI
    },

    "differential": {
        "torque": 7500
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
    ctx.scale(scale, scale);
    ctx.drawImage(this.image, -r, -r, 2*r, 2*r);
    ctx.restore();

};


var Vehicle = function(space, spec, offset) {
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
}

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
}

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
}


var Terrain = function(space) {
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
    for (var x=0; x<10000; x+=20) {
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
}


Terrain.prototype.draw = function(ctx, scale, point2canvas) {
    if (!this.borderImage) {
        this.borderImage = document.getElementById('borderImage');
    }
    if (!this.borderPattern) {
        this.borderPattern = ctx.createPattern(this.borderImage, 'repeat-x');
    }
    if (!this.groundImage) {
        this.groundImage = document.getElementById('groundImage');
    }
    if (!this.groundPattern) {
        this.groundPattern = ctx.createPattern(this.groundImage, 'repeat');
    }


    ctx.save();
    ctx.fillStyle = this.groundPattern;
    ctx.beginPath();

    ctx.moveTo(0, ctx.canvas.height);
    for (var i=0; i<this.terrainVerts.length; i++) {
        var p = point2canvas(this.terrainVerts[i]);
        ctx.lineTo(p.x, p.y + 2);
    }
    ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
    ctx.fill();
    ctx.restore();


    ctx.fillStyle = this.borderPattern;
    var borderHeight = 12;
    var borderScale = scale * borderHeight / this.borderImage.height;
    for (var i=0; i<(this.terrainVerts.length - 1); i++) {
        ctx.save();
        var a = point2canvas( this.terrainVerts[i]);
        var b = point2canvas(this.terrainVerts[i+1]);

        var gradient = (b.y - a.y) / (b.x - a.x);

        // TODO it seems unlikely that this is the most efficient way to use the gpu
        // skew in the y direction by the gradient of the line with
        ctx.transform(1, gradient, 0, 1, 0, a.y -2 - a.x * gradient);
        ctx.scale(borderScale, borderScale);
        ctx.fillRect(a.x / borderScale, 0, (b.x - a.x) / borderScale, this.borderImage.height);

        ctx.restore();
    }
}


/* Initialise Statistics */
var fps = 0;
var simulationTime = 0;
var drawTime = 0;

/* Initialise Chipmunk Physics*/
var space = new cp.Space();

space.iterations = 10;
space.gravity = v(0, -200);
space.sleepTimeThreshold = 0.5;


/* Initialise Rendering */
var canvas = document.getElementsByTagName('canvas')[0];

canvas.oncontextmenu = function(e) { e.preventDefault(); }
canvas.onmousedown = function(e) { e.preventDefault(); };
canvas.onmouseup = function(e) { e.preventDefault(); };

var ctx = canvas.getContext('2d');

/* Build Scene */
var giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
giantInvisibleWall.setElasticity(2);
space.addShape(giantInvisibleWall);

var vehicle = new Vehicle(space, data, v(100,100));
var terrain = new Terrain(space);


var running = false;
var resized = false;

var leftPressed = false;
var rightPressed = false;

var run = function() {
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
            raf(step);
        }
    };

    step(0);
};

var stop = function() {
    running = false;
};

var draw = function() {
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    var min = -(40 + 40 + 40 + 30 + 10);
    var max = -2 * min;

    var scale = height / (max - min)

    var start = Math.max(0, (scale * vehicle.chassis.p.x) - (width / 3));

    var point2canvas = function(point) {
        return v(point.x * scale, -point.y * scale);
    }

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, width, height);

    // identity + translation
    ctx.scale(1, 1);
    ctx.translate(-start, 2 * height /3);

    vehicle.draw(ctx, scale, point2canvas);
    terrain.draw(ctx, scale, point2canvas)

}

var onKeyDown = function(e) {
    if (e.keyCode === 39) {
        rightPressed = true;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = true;
        return false;
    }
};
document.addEventListener('keydown', onKeyDown);

var onKeyUp = function(e) {
    if (e.keyCode === 39) {
        rightPressed = false;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = false;
        return false;
    }
};
document.addEventListener('keyup', onKeyUp);

var onResize = function(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resized = true;
};
window.addEventListener('resize', onResize);
window.onResize();




if (!!('ontouchstart' in document.documentElement)) {
    var leftPedal = document.getElementById('leftPedal');
    var rightPedal = document.getElementById('rightPedal');

    leftPedal.hidden = rightPedal.hidden = false;


    var leftPedalDown = function(e) {
        leftPressed = true;
        e.preventDefault();
        return false;
    };
    leftPedal.addEventListener('touchstart', leftPedalDown);

    var leftPedalUp = function(e) {
        leftPressed = false;
        e.preventDefault();
        return false;
    };
    leftPedal.addEventListener('touchleave', leftPedalUp);
    leftPedal.addEventListener('touchend', leftPedalUp);

    var rightPedalDown = function(e) {
        rightPressed = true;
        e.preventDefault();
        return false;
    };
    rightPedal.addEventListener('touchstart', rightPedalDown);

    var rightPedalUp = function(e) {
        rightPressed = false;
        e.preventDefault();
        return false;
    }
    rightPedal.addEventListener('touchleave', rightPedalUp);
    rightPedal.addEventListener('touchend', rightPedalUp);

}

run();
