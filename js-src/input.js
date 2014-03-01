"use strict";

var rightPressed = false;
var leftPressed = false;


var onKeyDown = function(e) {
    if (e.keyCode === 39) {
        rightPressed = true;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = true;
        return false;
    }
};

var onKeyUp = function(e) {
    if (e.keyCode === 39) {
        rightPressed = false;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = false;
        return false;
    }
};


var leftPedalDown = function(e) {
    leftPressed = true;
    e.preventDefault();
    return false;
};

var leftPedalUp = function(e) {
    leftPressed = false;
    e.preventDefault();
    return false;
};


var rightPedalDown = function(e) {
    rightPressed = true;
    e.preventDefault();
    return false;
};

var rightPedalUp = function(e) {
    rightPressed = false;
    e.preventDefault();
    return false;
};


var init = function() {
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Touch screen
    if (!!('ontouchstart' in document.documentElement)) {
        var leftPedal = document.getElementById('leftPedal');
        var rightPedal = document.getElementById('rightPedal');

        leftPedal.hidden = false;
        rightPedal.hidden = false;

        leftPedal.addEventListener('touchstart', leftPedalDown);
        leftPedal.addEventListener('touchleave', leftPedalUp);
        leftPedal.addEventListener('touchend', leftPedalUp);

        rightPedal.addEventListener('touchstart', rightPedalDown);
        rightPedal.addEventListener('touchleave', rightPedalUp);
        rightPedal.addEventListener('touchend', rightPedalUp);
    };
};


module.exports = {
    'init': init,
    'leftPressed': function() { return leftPressed; },
    'rightPressed': function() { return rightPressed; },
};
