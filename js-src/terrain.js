"use strict";

var cp = require('./lib/cp.js');
var v = cp.v;


var Terrain = function(space) {
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

    var a = v(0, this.getHeight(0));
    var b = v(0,0);
    for(var x=20; x<10000; x+=20) {
        b = v(x, this.getHeight(x));

        var shape = space.addShape(new cp.SegmentShape(space.staticBody, a, b, 0));
        shape.setElasticity(1);
        shape.setFriction(0.9);

        a = b;
    }
};


Terrain.prototype.getHeight = function(x) {
    var height = 0;
    if (x > 200) {
        for (var i in this.components) {
            height += this.components[i].a * Math.sin((x-200) * this.components[i].f);
        }
    }
    height = (Math.pow(height - this.min, 2) / (this.max - this.min)) + this.min;
    return height;
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
