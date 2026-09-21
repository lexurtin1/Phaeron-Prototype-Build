(() => {
  'use strict';
  // Shared isometric frame for presentation layer art.
  // viewBox="280 285 940 600"; slab top centred at C; sides extrude DEPTH down.
  const C = { x: 750, y: 580 };
  const HW = 412.4;
  const HH = 238;
  const DEPTH = 38;

  // u,v ∈ [-1,1]: P(-1,1)=top  P(1,1)=right  P(1,-1)=bottom  P(-1,-1)=left
  // h > 0 extrudes the slab downward on screen.
  function P(u, v, h = 0) {
    return [
      C.x + (u + v) * (HW / 2),
      C.y + (u - v) * (HH / 2) + h * DEPTH
    ];
  }

  function points(...corners) {
    return corners.map(([x, y]) => `${round(x)} ${round(y)}`).join(' ');
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  // Top diamond + two visible side faces. h0 = top plane, h1 = extruded bottom.
  function slabFaces(h0 = 0, h1 = 1) {
    const top = P(-1, 1, h0);
    const right = P(1, 1, h0);
    const bottom = P(1, -1, h0);
    const left = P(-1, -1, h0);
    const rightDown = P(1, 1, h1);
    const bottomDown = P(1, -1, h1);
    const leftDown = P(-1, -1, h1);
    return {
      top: points(top, right, bottom, left, top),
      right: points(right, bottom, bottomDown, rightDown, right),
      left: points(left, bottom, bottomDown, leftDown, left)
    };
  }

  window.PhaeronIso = { C, HW, HH, DEPTH, P, slabFaces };
})();
