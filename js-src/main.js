"use strict";

var StateMachine = require('./lib/state-machine.js');

var Game = require('./game.js').Game;
var data = require('./data.js');

var util = require('./util.js');
var resources = require('./resources.js');


var Application = function(canvas, config) {

    StateMachine.create({
        initial: 'loading',
        events: [
            { name: 'loaded', from: 'loading', to: 'mainMenu' },
            { name: 'start', from: 'mainMenu', to: 'game' },
            { name: 'pause', from: 'game', to: 'paused' },
            { name: 'resume', from: 'paused', to: 'game' },
            { name: 'crashed', from: 'game', to: 'mainMenu' }
        ]
    }, this);

    document.getElementById('play-btn').onclick = function() {this.start();}.bind(this);

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
        'ground': 'img/ground.png',
        'border': 'img/border.png'
    });

    this.textureManager.onLoad = this.loaded.bind(this);
};

Application.prototype.requestUpdate = function() {
    if (!this.updateQueued) {
        this.updateQueued = true;
        util.requestAnimationFrame(this.update.bind(this));
    }
};

Application.prototype.loop = function() {
    switch (this.current) {
    case 'game':
        this.requestUpdate();
        break;
    }
};

Application.prototype.update = function(time) {
    this.updateQueued = false;

    var now;
    var dt = time - this.lastTime;
    this.lastTime = time;

    // Update FPS
    if(dt > 0) {
        this.fps = 0.9*this.fps + 0.1*(1000/dt);
    }

    switch (this.current) {
    case 'game':

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
};

Application.prototype.resize = function() {
    var canvas = this.ctx.canvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.resized = true;
};

Application.prototype.drawInfo = function() {
    var fpsStr = Math.floor(this.fps * 10) / 10;
    document.getElementById('fps').textContent = ""+fpsStr;
    document.getElementById('step').textContent = ""+this.game.space.stamp;
    document.getElementById('simulationTime').textContent = ""+this.simulationTime+" ms";
    document.getElementById('drawTime').textContent = ""+this.drawTime+" ms";
};

Application.prototype.onenterstate = function(event, from, to) {
    this.loop();
};

Application.prototype.onentermainMenu = function(event, from, to) {
    document.getElementById('main-menu').classList.remove('hidden');
};

Application.prototype.onleavemainMenu = function(event, from, to) {
    document.getElementById('main-menu').classList.add('hidden');
};

Application.prototype.onbeforestart = function(event, from, to) {
    this.game = new Game(data);
};


var canvas = document.getElementsByTagName('canvas')[0];
var app = new Application(canvas, data);
