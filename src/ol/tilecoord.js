goog.provide('ol.TileCoord');
goog.provide('ol.tilecoord');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.extent');


/**
 * An array of three numbers representing the location of a tile in a tile
 * grid. The order is `z`, `x`, and `y`. `z` is the zoom level.
 * @typedef {Array.<number>} ol.TileCoord
 * @api
 */
ol.TileCoord;


/**
 * @enum {number}
 */
ol.QuadKeyCharCode = {
  ZERO: '0'.charCodeAt(0),
  ONE: '1'.charCodeAt(0),
  TWO: '2'.charCodeAt(0),
  THREE: '3'.charCodeAt(0)
};


/**
 * @param {string} quadKey Quad key.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.tilecoord.createFromQuadKey = function(quadKey) {
  var z = quadKey.length, x = 0, y = 0;
  var mask = 1 << (z - 1);
  var i;
  for (i = 0; i < z; ++i) {
    switch (quadKey.charCodeAt(i)) {
      case ol.QuadKeyCharCode.ONE:
        x += mask;
        break;
      case ol.QuadKeyCharCode.TWO:
        y += mask;
        break;
      case ol.QuadKeyCharCode.THREE:
        x += mask;
        y += mask;
        break;
    }
    mask >>= 1;
  }
  return [z, x, y];
};


/**
 * @param {string} str String that follows pattern “z/x/y” where x, y and z are
 *   numbers.
 * @return {ol.TileCoord} Tile coord.
 */
ol.tilecoord.createFromString = function(str) {
  var v = str.split('/');
  goog.asserts.assert(v.length === 3,
      'must provide a string in "z/x/y" format, got "%s"', str);
  v = goog.array.map(v, function(e, i, a) {
    return parseInt(e, 10);
  });
  return v;
};


/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {ol.TileCoord=} opt_tileCoord Tile coordinate.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.tilecoord.createOrUpdate = function(z, x, y, opt_tileCoord) {
  if (goog.isDef(opt_tileCoord)) {
    opt_tileCoord[0] = z;
    opt_tileCoord[1] = x;
    opt_tileCoord[2] = y;
    return opt_tileCoord;
  } else {
    return [z, x, y];
  }
};


/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {string} Key.
 */
ol.tilecoord.getKeyZXY = function(z, x, y) {
  return z + '/' + x + '/' + y;
};


/**
 * @param {ol.TileCoord} tileCoord Tile coord.
 * @return {number} Hash.
 */
ol.tilecoord.hash = function(tileCoord) {
  return (tileCoord[1] << tileCoord[0]) + tileCoord[2];
};


/**
 * @param {ol.TileCoord} tileCoord Tile coord.
 * @return {string} Quad key.
 */
ol.tilecoord.quadKey = function(tileCoord) {
  var z = tileCoord[0];
  var digits = new Array(z);
  var mask = 1 << (z - 1);
  var i, charCode;
  for (i = 0; i < z; ++i) {
    charCode = ol.QuadKeyCharCode.ZERO;
    if (tileCoord[1] & mask) {
      charCode += 1;
    }
    if (tileCoord[2] & mask) {
      charCode += 2;
    }
    digits[i] = String.fromCharCode(charCode);
    mask >>= 1;
  }
  return digits.join('');
};


/**
 * @param {ol.TileCoord} tileCoord Tile coord.
 * @return {string} String.
 */
ol.tilecoord.toString = function(tileCoord) {
  return ol.tilecoord.getKeyZXY(tileCoord[0], tileCoord[1], tileCoord[2]);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.tilecoord.wrapX = function(tileCoord, tileGrid, projection) {
  var z = tileCoord[0];
  var center = tileGrid.getTileCoordCenter(tileCoord);
  var projectionExtent = ol.tilegrid.extentFromProjection(projection);
  if (!ol.extent.containsCoordinate(projectionExtent, center)) {
    var worldWidth = ol.extent.getWidth(projectionExtent);
    var worldsAway = Math.ceil((projectionExtent[0] - center[0]) / worldWidth);
    center[0] += worldWidth * worldsAway;
    return tileGrid.getTileCoordForCoordAndZInternal(center, z);
  } else {
    return tileCoord;
  }
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {!ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {boolean} Tile coordinate is within extent and zoom level range.
 */
ol.tilecoord.withinExtentAndZ = function(tileCoord, tileGrid) {
  var z = tileCoord[0];
  var x = tileCoord[1];
  var y = tileCoord[2];

  if (tileGrid.getMinZoom() > z || z > tileGrid.getMaxZoom()) {
    return false;
  }
  var extent = tileGrid.getExtent();
  var tileRange;
  if (goog.isNull(extent)) {
    tileRange = tileGrid.getFullTileRange(z);
  } else {
    tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
  }
  if (goog.isNull(tileRange)) {
    return true;
  } else {
    return tileRange.containsXY(x, y);
  }
};
