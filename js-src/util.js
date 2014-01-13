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

module.exports = {
    "requestAnimationFrame": requestAnimationFrame
};
