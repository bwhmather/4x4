import { typestate } from 'typestate';


import { Game } from './game';
import { data } from './data';

import * as resources from './resources';


enum State {
    Loading,
    MainMenu,
    Game,
    Paused,
}


export class Application {
    private fsm: typestate.FiniteStateMachine<State>;
    private textureManager: resources.TextureManager;

    private updateQueued: boolean;

    private lastTime: number;

    private simulationTime: number;
    private drawTime: number;
    private fps: number;

    private ctx: CanvasRenderingContext2D;

    private resized: boolean;

    private get state(): State {
        return this.fsm.currentState;
    }

    private game?: Game = null;

    constructor(canvas: HTMLCanvasElement) {
        this.fsm = new typestate.FiniteStateMachine<State>(State.Loading);

        this.fsm.from(State.Loading).to(State.MainMenu);
        this.fsm.from(State.MainMenu).to(State.Game);
        this.fsm.from(State.Game).to(State.Paused);
        this.fsm.from(State.Paused).to(State.Game);
        this.fsm.from(State.Game).to(State.MainMenu);

        this.fsm.onEnter(State.MainMenu, this.onEnterMainMenu.bind(this));
        this.fsm.onExit(State.MainMenu, this.onLeaveMainMenu.bind(this));
        this.fsm.onEnter(State.Game, this.onEnterGame.bind(this));
        this.fsm.on(State.Game, (from: State, event: any) => {this.loop()});

        // StateMachine.create({
        //     initial: 'loading',
        //     events: [
        //         { name: 'loaded', from: 'loading', to: 'mainMenu' },
        //         { name: 'start', from: 'mainMenu', to: 'game' },
        //         { name: 'pause', from: 'game', to: 'paused' },
        //         { name: 'resume', from: 'paused', to: 'game' },
        //         { name: 'crashed', from: 'game', to: 'mainMenu' }
        //     ]
        // }, this);


        document.getElementById('play-btn').onclick = () => {this.start();};

        this.lastTime = 0;

        /* Initialise Statistics */
        this.simulationTime = 0;
        this.drawTime = 0;
        this.fps = 0;

        /* Initialise Rendering */
        canvas.oncontextmenu = function(e) { e.preventDefault(); };
        canvas.onmousedown = function(e) { e.preventDefault(); };
        canvas.onmouseup = function(e) { e.preventDefault(); };

        this.ctx = canvas.getContext('2d');

        /* Bind callback to resize canvas */
        if (!this.hasOwnProperty('resize')) {
            this.resize = this.resize.bind(this);
        }
        // TODO bind to canvas resize event not windo resize event
        window.addEventListener('resize', this.resize);
        this.resize();

        this.textureManager = new resources.TextureManager({
            'wheel': 'img/wheel.png',
            'body': 'img/body.png',
            'driver': 'img/driver.png',
            'ground': 'img/ground.png',
            'border': 'img/border.png',
            'dust': 'img/dust.png'
        });

        this.textureManager.onLoad = this.loaded.bind(this);
    }

    private loaded() {
        this.fsm.go(State.MainMenu);
    }

    private start() {
        this.fsm.go(State.Game);
    }

    private pause() {
        this.fsm.go(State.Paused);
    }

    private resume() {
        this.fsm.go(State.Game);
    }

    private crashed() {
        this.fsm.go(State.MainMenu);
    }

    private onEnterState(event, from, to) {
        this.loop();
    };

    private onEnterMainMenu(from: State, event: any): boolean {
        document.getElementById('main-menu').classList.remove('hidden');
        return true;
    };

    private onLeaveMainMenu(to: State) {
        document.getElementById('main-menu').classList.add('hidden');
        return true;
    };

    private onEnterGame(from: State, event: any): boolean {
        if (from == State.MainMenu) {
            this.game = new Game(data);
            this.game.onCrashed = () => { this.crashed(); }
        }
        return true;
    };

    requestUpdate() {
        if (!this.updateQueued) {
            this.updateQueued = true;
            window.requestAnimationFrame(this.update.bind(this));
        }
    };

    loop() {
        switch (this.state) {
        case State.Game:
            this.requestUpdate();
            break;
        }
    }

    update(time: number) {
        this.updateQueued = false;

        var now;
        var dt = time - this.lastTime;
        this.lastTime = time;

        // Update FPS
        if(dt > 0) {
            this.fps = 0.9*this.fps + 0.1*(1000/dt);
        }

        switch (this.state) {
        case State.Game:

            now = Date.now();
            this.game.update(Math.max(1/60, Math.min(0.001*dt, 1/30)));
            this.simulationTime += Date.now() - now;

            if (this.game.dirty || this.resized) {
                this.resized = false;
                now = Date.now();
                this.game.draw(this.ctx, this.textureManager);
                this.drawTime += Date.now() - now;
            }

            break;
        }
        this.drawInfo();

        this.loop();
    }

    resize() {
        var canvas = this.ctx.canvas;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.resized = true;
    };

    drawInfo() {
        var fpsStr = Math.floor(this.fps * 10) / 10;
        document.getElementById('fps').textContent = ""+fpsStr;
        // document.getElementById('step').textContent = ""+this.game.space.stamp;
        document.getElementById('simulationTime').textContent = ""+this.simulationTime+" ms";
        document.getElementById('drawTime').textContent = ""+this.drawTime+" ms";
    };
}


