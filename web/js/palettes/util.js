import lodashEach from 'lodash/each';
export function getCheckerboard() {
  var size = 2;
  var canvas = document.createElement('canvas');

  canvas.width = size * 2;
  canvas.height = size * 2;

  var g = canvas.getContext('2d');

  // g.fillStyle = "rgb(102, 102, 102)";
  g.fillStyle = 'rgb(200, 200, 200)';
  g.fillRect(0, 0, size, size);
  g.fillRect(size, size, size, size);

  // g.fillStyle = "rgb(153, 153, 153)";
  g.fillStyle = 'rgb(240, 240, 240)';
  g.fillRect(0, size, size, size);
  g.fillRect(size, 0, size, size);

  return g.createPattern(canvas, 'repeat');
}
export function palettesTranslate(source, target) {
  var translation = [];
  lodashEach(source, function(color, index) {
    var sourcePercent = index / source.length;
    var targetIndex = Math.floor(sourcePercent * target.length);
    translation.push(target[targetIndex]);
  });
  return translation;
}
