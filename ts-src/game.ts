import * as cp from 'chipmunk-ts';
let v = cp.v;

import { Terrain } from './terrain';
import { Vehicle } from './vehicle';
import { Dust } from './dust';
import { ViewPort } from './drawing';

import * as input from './input';


export class Game {
    private config: any;

    private space: cp.Space;

    private terrain: Terrain;
    private vehicle: Vehicle;
    private dust: Dust;

    dirty: boolean;

    onCrashed: () => void = null;

    constructor(config) {
        this.config = config;

        /* Initialise Chipmunk Physics*/
        var space = this.space = new cp.Space();
        space.iterations = 10;
        space.sleepTimeThreshold = 0.5;
        space.gravity = v(0, -config['gravity']);

        /* Build Scene */
        var giantInvisibleWall = new cp.SegmentShape(space.staticBody, v(0, -10000), v(0, 10000), 0);
        giantInvisibleWall.setElasticity(2);
        space.addShape(giantInvisibleWall);

        this.terrain = new Terrain(space);
        this.vehicle = new Vehicle(space, config['vehicle'], v(100,100));
        this.dust = new Dust(space, 1, 2);

        this.dirty = true;

        input.init();
    }

    update(dt: number) {
        /* Handle Input */
        if (input.rightPressed && !input.leftPressed) {
            this.vehicle.setThrottle(1);
        } else if (input.leftPressed && !input.rightPressed) {
            this.vehicle.setThrottle(-1);
        } else {
            this.vehicle.setThrottle(0);
        }

        if (this.vehicle.isCrashed()) {
            this.crashed();
        }

        this.terrain.updateBounds(this.vehicle.p.x - 100, this.vehicle.p.x + 100);

        this.dust.update(dt);

        /* Run Physics */
        this.space.step(dt);

        this.dirty = true;
        //if (this.space.activeShapes.count) {
        //    this.dirty = true;
        //}
        // TODO
        //if (this.dust.particles.length) {
        //    this.dirty = true;
        //}
    }

    crashed() {
        if (this.onCrashed) {
            this.onCrashed();
        }
    };

    draw(ctx, res) {
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;

        /* Figure out where to position the camera */
        let bottom = this.terrain.max - 1.05*(this.terrain.max - this.terrain.min);
        let top = this.terrain.min + 1.5*(this.terrain.max - this.terrain.min);

        let scale = height / (top - bottom);

        let left = Math.max(0, this.vehicle.p.x - (width / (3*scale)));
        let right = left + width / scale;

        let viewport: ViewPort = {
            top: top,
            bottom: bottom,
            left: left,
            right: right,
        };

        /* Clear the screen */
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0, 0, width, height);

        /* Draw everything */
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale, -scale);
        ctx.translate(-viewport.left, -viewport.top);

        this.vehicle.draw(ctx, viewport, res);
        this.terrain.draw(ctx, viewport, res);
        this.dust.draw(ctx, viewport, res);

        this.dirty = false;
    }
};
