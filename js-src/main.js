"use strict";

var StateMachine = require('./lib/state-machine.js');

var Game = require('./game.js').Game;
var data = require('./data.js');

var canvas = document.getElementsByTagName('canvas')[0];
var game = new Game(canvas, data);

var fsm = StateMachine.create({
  initial: 'loading',
  events: [
    { name: 'loaded', from: 'loading', to: 'mainMenu' },
    { name: 'start', from: 'mainMenu', to: 'game' },
    { name: 'pause', from: 'game', to: 'paused' },
    { name: 'resume', from: 'paused', to: 'game' },
    { name: 'crashed', from: 'game', to: 'mainMenu' }
  ],
  callbacks: {
    onstart: function(event, from, to) { game.run(); }
  }
});

document.getElementById('play-btn').onclick = function() {fsm.start()};

fsm.loaded();
