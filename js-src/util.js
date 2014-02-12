"use strict";

var requestAnimationFrame = (
        window.requestAnimationFrame
     || window.webkitRequestAnimationFrame
     || window.mozRequestAnimationFrame
     || window.oRequestAnimationFrame
     || window.msRequestAnimationFrame
     || function(callback) {
             return this.setTimeout(callback, 1000 / 60);
     }).bind(window);

var requestFullScreen = (
       document.body.requestFullScreen
    || document.body.mozRequestFullScreen
    || document.body.webkitRequestFullScreen
    || function() {}).bind(document.body)


var cancelFullScreen = (
       document.body.cancelFullScreen
    || document.body.mozCancelFullScreen
    || document.body.webkitCancelFullScreen
    || function() {}).bind(document.body)


module.exports = {
    "requestAnimationFrame": requestAnimationFrame,
    "requestFullScreen": requestFullScreen,
    "cancelFullScreen": cancelFullScreen
};
