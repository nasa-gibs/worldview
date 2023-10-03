

export function convert(lat, long, extent) {
  const TILE_HEIGHT_WIDTH = 512;
  const long0 = extent[0];
  const lat0 = extent[1];

  const dxExtent = Math.abs(extent[0] - extent[2]);
  const dyExtent = Math.abs(extent[1] - extent[3]);

  const x = TILE_HEIGHT_WIDTH * ((long0 - long) / dxExtent);
  const y = TILE_HEIGHT_WIDTH * ((lat0 - lat) / dyExtent);

  return {
    x,
    y,
  };
}
// const scale = Math.floor(Math.pow(255, 2) / Math.max(512, 512) / 3);
export function encode(value, scale) {
  const b = 255;
  value = (value * scale + b * b) / 2;
  const pair = [
    Math.floor((value % b) / (b * 255)),
    Math.floor(Math.floor(value / b) / (b * 255)),
  ];
  return pair;
}

export function decode(pair, scale) {
  const b = 255;
  const calc = (((pair[0] / 255) * b + (pair[1] / 255) * b * b) - (b * b) / 2) / scale;
  return calc;
}

// https://codepen.io/SitePoint/pen/RRLVAL?editors=1010
export function throttle(fn, wait) {
  let time = Date.now();
  return function() {
    if ((time + wait - Date.now()) < 0) {
      fn();
      time = Date.now();
    }
  };
}

// Establish color gradient to differentiate lower & higher magnitudes
export function colorGradient(pointMagnitude) {
  let color1 = {
    red: 0, green: 255, blue: 0, // green
  };
  let color2 = {
    red: 255, green: 255, blue: 0, // yellow
  };
  const color3 = {
    red: 255, green: 0, blue: 0, // red
  };
  // console.log('pointMagnitude', pointMagnitude);
  let fade = pointMagnitude * 2;

  if (fade >= 1) {
    // console.log('fade is 1+', fade);
    fade -= 1;
    color1 = color2;
    color2 = color3;
  }
  const diffRed = color2.red - color1.red;
  const diffGreen = color2.green - color1.green;
  const diffBlue = color2.blue - color1.blue;

  const gradient = {
    red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
    green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
    blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
  };
  return [gradient.red, gradient.green, gradient.blue];
}
