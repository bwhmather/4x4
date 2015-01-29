"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Terrain = function(space) {
    this.space = space;

    this.components = [
        { f: 1/30, a: 10 },
        { f: 1/70, a: 30 },
        { f: 1/150, a: 40 },
        { f: 1/190, a: 40 },
        { f: 1/310, a: 40 }
    ];

    this.max = 0;
    for (var i in this.components) {
        this.max += Math.abs(this.components[i].a);
    }
    this.min = -this.max;

    this.shapes = [];
};


Terrain.prototype.getHeight = function(x) {
    var height = 0;

    // height is built as the sum of a load of sin functions
    for (var i in this.components) {
        height += this.components[i].a * Math.sin(x * this.components[i].f);
    }

    // flatten out valleys and sharpen peaks
    height = (Math.pow(height - this.min, 2) / (this.max - this.min)) + this.min;

    // smooth out start of course
    if (x < 600) {
        height *= 0.5 * (1 - Math.cos(x * Math.PI / 600));
    }


    return height;
};


Terrain.prototype.updateBounds = function(left, right) {
    var added_left=0, removed_left=0, added_right=0, removed_right = 0;

    var step = 20;

    var space = this.space;
    var shapes = this.shapes;
    var shape;

    var start, end;
    var i, x;

    var a, b;

    var makeSegment = function(a, b) {
        var shape = new cp.SegmentShape(space.staticBody, a, b, 0);
        shape.setCollisionType(1);
        shape.setElasticity(1);
        shape.setFriction(0.9);

        return shape;
    }

    // prune end
    for (i=shapes.length-1; i>=0; i--) {
        shape = shapes[i];
        if (shape.a.x > right) {
            space.removeShape(shape);
        } else {
            break;
        }
    }
    shapes.splice(i + 1, shapes.length - i - 1);

    // prune beginning
    for (i=0; i<shapes.length; i++) {
        shape = shapes[i];
        if (shape.b.x < left) {
            space.removeShape(shape);
        } else {
            break;
        }
    }
    shapes.splice(0, i);

    // add segments to end
    if (shapes.length) {
        start = shapes[shapes.length-1].b.x;
    } else {
        start = left - (left % step);
    }

    end = right + step;

    a = v(start, this.getHeight(start));
    for (x=start + step; x<end; x+=step) {
        b = v(x, this.getHeight(x));

        shape = makeSegment(a, b);

        shapes.push(shape);
        space.addShape(shape);

        a = b;
    }

    // add segments to beginning
    start = left - (left % step) - step;

    if (shapes.length) {
        end = shapes[0].a.x;
    } else {
        // already failed to add anything to the end
        return;
    }

    b = v(end, this.getHeight(end));
    for (x=end - step; x>start; x-=step) {
        a = v(x, this.getHeight(x));

        shape = makeSegment(a, b);

        shapes.unshift(shape);
        space.addShape(shape);

        b = a;
    }
};


Terrain.prototype.drawFill = function(ctx, box, res) {

    var step = 20;

    ctx.save();
    ctx.fillStyle = ctx.createPattern(res.get('ground'), 'repeat');
    ctx.beginPath();

    ctx.moveTo(box.left, box.bottom);
    for (var x=box.left - (box.left % step); x<box.right + step; x+=step) {
        ctx.lineTo(x, this.getHeight(x));
    }
    ctx.lineTo(box.right, box.bottom);
    ctx.fill();
    ctx.restore();
};


Terrain.prototype.drawBorder = function(ctx, box, res) {
    var borderImage = res.get('border');
    var borderHeight = 24;
    var borderScale = borderHeight / borderImage.height;
    var borderRepeat = borderImage.width * borderScale;

    var step = 20;

    for (var x=box.left - (box.left % step); x<box.right; x+=step) {
        ctx.save();

        var a = v(x, this.getHeight(x));
        var b = v(x+step, this.getHeight(x+step));

        var gradient = (b.y - a.y) / (b.x - a.x);

        // TODO it seems unlikely that this is the most efficient way to use the gpu
        ctx.transform(1, gradient, 0, 1, 0, a.y + 2 - a.x * gradient);
        ctx.scale(1, -1);

        var sectionStart = x - (x % borderRepeat);
        var sectionFinish = sectionStart + borderRepeat;

        while (sectionStart < b.x) {
            var canvasStart = Math.max(a.x, sectionStart);
            var canvasWidth = Math.min(b.x, sectionFinish) - canvasStart;

            var imageStart = Math.floor((canvasStart / borderScale) % borderImage.width);
            var imageWidth = Math.ceil(canvasWidth / borderScale);
            if (!imageWidth) {
                break;
            }

            ctx.drawImage(borderImage,
                imageStart, 0,
                imageWidth, borderImage.height,

                canvasStart, -0.5*borderHeight,
                canvasWidth, borderHeight);

            sectionStart += borderRepeat;
            sectionFinish += borderRepeat;
        }

        ctx.restore();
    }
};


Terrain.prototype.draw = function(ctx, box, res) {
    this.drawFill(ctx, box, res);
    this.drawBorder(ctx, box, res);
};


module.exports = {
    'Terrain': Terrain
};
