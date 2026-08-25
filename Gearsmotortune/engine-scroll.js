/*
 * Legacy engine-scroll entry point.
 *
 * The site now uses engine-webgl.js as the single engine renderer.
 * This file intentionally does nothing so older script references in the
 * existing HTML cannot start a second PNG/WebGL renderer and cause lag.
 */
(() => {
  'use strict';
})();
