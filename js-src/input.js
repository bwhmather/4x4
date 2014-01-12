"use strict";

var onKeyDown = function(e) {
    if (e.keyCode === 39) {
        rightPressed = true;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = true;
        return false;
    }
};
document.addEventListener('keydown', onKeyDown);

var onKeyUp = function(e) {
    if (e.keyCode === 39) {
        rightPressed = false;
        return false;
    } else if (e.keyCode === 37) {
        leftPressed = false;
        return false;
    }
};
document.addEventListener('keyup', onKeyUp);


if (!!('ontouchstart' in document.documentElement)) {
    var leftPedal = document.getElementById('leftPedal');
    var rightPedal = document.getElementById('rightPedal');

    leftPedal.hidden = rightPedal.hidden = false;


    var leftPedalDown = function(e) {
        leftPressed = true;
        e.preventDefault();
        return false;
    };
    leftPedal.addEventListener('touchstart', leftPedalDown);

    var leftPedalUp = function(e) {
        leftPressed = false;
        e.preventDefault();
        return false;
    };
    leftPedal.addEventListener('touchleave', leftPedalUp);
    leftPedal.addEventListener('touchend', leftPedalUp);

    var rightPedalDown = function(e) {
        rightPressed = true;
        e.preventDefault();
        return false;
    };
    rightPedal.addEventListener('touchstart', rightPedalDown);

    var rightPedalUp = function(e) {
        rightPressed = false;
        e.preventDefault();
        return false;
    }
    rightPedal.addEventListener('touchleave', rightPedalUp);
    rightPedal.addEventListener('touchend', rightPedalUp);
}
