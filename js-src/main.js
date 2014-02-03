"use strict";

var Game = require('./game.js').Game;
var data = require('./data.js');

var canvas = document.getElementsByTagName('canvas')[0];
var game = new Game(canvas, data);
game.run();
