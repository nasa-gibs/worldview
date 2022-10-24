

export function convert(lat, long, extent){
    const TILE_HEIGHT_WIDTH = 512;
    const long0 = extent[0];
    const lat0 = extent[1];
    
    const dxExtent = Math.abs(extent[0] - extent[2]);
    const dyExtent = Math.abs(extent[1] - extent[3]);

    const x = TILE_HEIGHT_WIDTH * ((long0 - long) / dxExtent)
    const y = TILE_HEIGHT_WIDTH * ((lat0 - lat) / dyExtent)

    return {
        x:x,
        y:y
    };
}
// const scale = Math.floor(Math.pow(255, 2) / Math.max(512, 512) / 3);
export function encode(value, scale) {
    var b = 255;
    value = value * scale + b * b / 2;
    var pair = [
        Math.floor((value % b) / b * 255),
        Math.floor(Math.floor(value / b) / b * 255)
    ];
    return pair;
}

export function decode(pair, scale) {
    var b = 255;
    return (((pair[0] / 255) * b +
        (pair[1] / 255) * b * b) - b * b / 2) / scale;
}

// https://codepen.io/SitePoint/pen/RRLVAL?editors=1010
export function throttle(fn, wait) {
    var time = Date.now();
    return function() {
      if ((time + wait - Date.now()) < 0) {
        fn();
        time = Date.now();
      }
    }
}