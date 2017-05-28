(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

// Direct variations of `symbolTriangle` from d3-shape.
var sqrt3 = Math.sqrt(3);

var triangleDown = {
  draw: function(context, size) {
    var y = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(0, -y * 2);
    context.lineTo(-sqrt3 * y, y);
    context.lineTo(sqrt3 * y, y);
    context.closePath();
  }
};

var triangleLeft = {
  draw: function(context, size) {
    var x = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(x * 2, 0);
    context.lineTo(-x, -sqrt3 * x);
    context.lineTo(-x, sqrt3 * x);
    context.closePath();
  }
};

var triangleRight = {
  draw: function(context, size) {
    var x = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(-x * 2, 0);
    context.lineTo(x, -sqrt3 * x);
    context.lineTo(x, sqrt3 * x);
    context.closePath();
  }
};

// Direct variation of `symbolDiamond` from d3-shape.

var tan30 = Math.sqrt(1 / 3);
var tan30_2 = tan30 * 2;

var diamondAlt = {
  draw: function(context, size) {
    var x = Math.sqrt(size / tan30_2);
    var y = x * tan30;

    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);

    context.closePath();
  }
};

var diamondSquare = {
  draw: function(context, size) {
    var w = Math.sqrt(size);
    var d = w / 2 * Math.sqrt(2);

    context.moveTo(0, -d);
    context.lineTo(d, 0);
    context.lineTo(0, d);
    context.lineTo(-d, 0);

    context.closePath();
  }
};

var pi = Math.PI;
var tau = 2 * pi;

function rotatePoint(x, y, theta) {
  return [
    Math.cos(theta) * x + -Math.sin(theta) * y, // x
    Math.sin(theta) * x + Math.cos(theta) * y,  // y
  ];
}

// Pentagon reference: http://mathworld.wolfram.com/Pentagon.html
var circumradiusCoeff = 1/10 * Math.sqrt(50 + 10 * Math.sqrt(5)); // ~ 0.85065080835204

function circumradius(side) { return side * circumradiusCoeff; }

function sideLength(area) {
  var num = 4 * area;
  var denom = Math.sqrt(5 * (5 + 2 * Math.sqrt(5))); // ~ 6.881909602355868

  return Math.sqrt(num / denom);
}

var pentagon = {
  draw: function(context, size) {
    var s = sideLength(size);
    var R = circumradius(s);
    var theta = -tau / 4; // Rotate 1/4 turn back so the shape is oriented with a point upward.

    context.moveTo.apply(context, rotatePoint(R, 0, theta));

    for (var i = 0; i < 5; ++i) {
      var a = tau * i / 5;
      var x = Math.cos(a) * R;
      var y = Math.sin(a) * R;

      context.lineTo.apply(context, rotatePoint(x, y, theta));
    }

    context.closePath();
  }
};

// Hexagon reference: http://mathworld.wolfram.com/Hexagon.html
function sideLength$1(area) {
  var num = 2 * area;
  var denom = 3 * Math.sqrt(3);
  return Math.sqrt(num / denom);
}

function drawBuild(theta) {
  var t = theta || 0;

  return function draw(context, size) {
    var s = sideLength$1(size);
    var R = s;

    context.moveTo.apply(context, rotatePoint(R, 0, t));

    for (var i = 0; i < 6; ++i) {
      var a = tau * i / 6;
      var x = Math.cos(a) * R;
      var y = Math.sin(a) * R;

      context.lineTo.apply(context, rotatePoint(x, y, t));
    }

    context.closePath();
  };
}

var hexagon = {
  draw: drawBuild(tau / 12) // Rotate 1/12 turn back so the shape is oriented with a point upward.
};

var hexagonAlt = {
  draw: drawBuild()
};

// Octagon reference: http://mathworld.wolfram.com/Octagon.html
var circumradiusCoeff$1 = 1/2 * Math.sqrt(4 + 2 * Math.sqrt(2)); // ~ 1.3065629648763766

function circumradius$1(side) { return side * circumradiusCoeff$1; }

function sideLength$2(area) {
  var num = area * (1 - Math.sqrt(2));
  var denom = 2;
  return Math.sqrt(-1 * num / denom);
}

function drawBuild$1(theta) {
  var t = theta || 0;

  return function draw(context, size) {
    var s = sideLength$2(size);
    var R = circumradius$1(s);

    context.moveTo.apply(context, rotatePoint(R, 0, t));

    for (var i = 0; i < 8; ++i) {
      var a = tau * i / 8;
      var x = Math.cos(a) * R;
      var y = Math.sin(a) * R;

      context.lineTo.apply(context, rotatePoint(x, y, t));
    }

    context.closePath();
  };
}

var octagon = {
  draw: drawBuild$1()
};

var octagonAlt = {
  draw: drawBuild$1(tau / 16) // Rotate 1/16 turn back so the shape is oriented with flat top and bottom.
};

// Direct variation of `symbolCross` from d3-shape.
var x = {
  draw: function(context, size) {
    var r = Math.sqrt(size / 5) / 2;
    var theta = tau / 8;

    // Use the same construction points as `symbolCross` and rotate 1/8 turn.
    var points = [
      rotatePoint(-3 * r, -r, theta),
      rotatePoint(-r, -r, theta),
      rotatePoint(-r, -3 * r, theta),
      rotatePoint(r, -3 * r, theta),
      rotatePoint(r, -r, theta),
      rotatePoint(3 * r, -r, theta),
      rotatePoint(3 * r, r, theta),
      rotatePoint(r, r, theta),
      rotatePoint(r, 3 * r, theta),
      rotatePoint(-r, 3 * r, theta),
      rotatePoint(-r, r, theta),
      rotatePoint(-3 * r, r, theta)
    ];

    context.moveTo.apply(context, points.pop());
    
    for (var i = 0; i < points.length; i++) {
      context.lineTo.apply(context, points[i]);
    }

    context.closePath();
  }
};

exports.symbolTriangleDown = triangleDown;
exports.symbolTriangleLeft = triangleLeft;
exports.symbolTriangleRight = triangleRight;
exports.symbolDiamondAlt = diamondAlt;
exports.symbolDiamondSquare = diamondSquare;
exports.symbolPentagon = pentagon;
exports.symbolHexagon = hexagon;
exports.symbolHexagonAlt = hexagonAlt;
exports.symbolOctagon = octagon;
exports.symbolOctagonAlt = octagonAlt;
exports.symbolCrossAlt = x;
exports.symbolX = x;

Object.defineProperty(exports, '__esModule', { value: true });

})));