"use strict";

var v = require('./lib/cp.js').v;

module.exports = {
    "gravity": 200,
    "vehicle": {
        "chassis": {
            "mass": 5,
            "width": 80,
            "height": 20,

            "cab": {
                "bottom": 22,
                "lead": 8,
                "top": 14,
                "front": 25,
                "height":17
            }
        },

        "front_wheel": {
            "mass": 0.15,
            "radius": 13,
            "friction": 1.2
        },
        "front_suspension": {
            "stiffness": 450,
            "damping": 12,
            "spring_anchor": v(30, 5),
            "spring_length": 20,
            "arm_anchor": v(0, -10)
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
            "spring_anchor": v(-30, 5),
            "spring_length": 20,
            "arm_anchor": v(0, -10)
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
