"use strict";

var v = require('./lib/cp.js').v;

module.exports = {
    "gravity": 200,
    "vehicle": {
        "mass": 5,

        "image": "",
        "image_scale": 85/256,
        "image_offset": v(-128, 56),

        "body_outline": [
           1,-48,
           165,-48,
           240,-51,
           248,-84,
           155,-106,
           92,-107,
           1,-84
        ],
        "body_outline_scale": 85/256,
        "body_outline_offset": v(-128, 56),

        "cab_outline": [
           72,-48,
           91,-3,
           146,-12,
           165,-48
        ],
        "cab_outline_scale": 85/256,
        "cab_outline_offset": v(-128, 56),

        "front_wheel": {
            "mass": 0.15,
            "radius": 13,
            "friction": 1.2
        },
        "front_suspension": {
            "stiffness": 450,
            "damping": 12,
            "spring_anchor": v(30, 0),
            "spring_length": 25,
            "arm_anchor": v(0, -20)
        },
        "front_motor": {
           "torque":7500,
            "rate": 20 * Math.PI
        },

        "back_wheel": {
            "mass": 0.15,
            "radius": 13,
            "friction": 1.2
        },
        "back_suspension": {
            "stiffness": 450,
            "damping": 12,
            "spring_anchor": v(-30, 0),
            "spring_length": 25,
            "arm_anchor": v(0, -20)
        },
        "back_motor": {
           "torque": 7500,
            "rate": 20 * Math.PI
        },

        "differential": {
            "torque": 7500
        }
    }
};
