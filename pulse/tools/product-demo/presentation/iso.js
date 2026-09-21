(() => {
  'use strict';
  // Derived from presentation/assets/engine.svg slab polygons so art generators
  // share the same isometric frame as the inlined layer SVGs.
  const C = { x: 750.06, y: 685 };
  const HW = 412.65;   // 750.06 - 337.41
  const HH = 238.25;   // 685 - 446.75
  const DEPTH = 38.2;  // side extrusion (923.22 → 961.42)

  // Unit square [0,1]² → isometric slab coordinates.
  // u increases toward the right face; v toward the bottom face;
  // h > 0 extrudes the slab downward on screen (matches engine.svg side faces).
  function P(u, v, h = 0) {
    return [
      C.x + (u - v) * HW,
      C.y + (u + v - 1) * HH + h * DEPTH
    ];
  }

  function points(...corners) {
    return corners.map(([x, y]) => `${x} ${y}`).join(' ');
  }

  // Top diamond + two side faces for a slab of unit height 1 at height h0.
  function slabFaces(h0 = 0, h1 = 1) {
    const tl = P(0, 0, h0);
    const tr = P(1, 0, h0);
    const br = P(1, 1, h0);
    const bl = P(0, 1, h0);
    const trd = P(1, 0, h1);
    const brd = P(1, 1, h1);
    const bld = P(0, 1, h1);
    return {
      top: points(tl, tr, br, bl, tl),
      right: points(tr, br, brd, trd, tr),
      left: points(bl, br, brd, bld, bl)
    };
  }

  window.PhaeronIso = { C, HW, HH, DEPTH, P, slabFaces };
})();
