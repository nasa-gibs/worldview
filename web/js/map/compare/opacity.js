var map;
var slider;
var value = '50';
export class Opacity {
  constructor(olMap) {
    map = olMap;
    this.create();
  }
  create() {
    slider = this.createSlider(map, map.getLayers().getArray()[1]);
  }
  update() {
    this.destroy();
    slider = this.createSlider(map, map.getLayers().getArray()[1]);
  }
  destroy() {
    slider.remove();
  }
  createSlider(map, secondLayer) {
    var sliderCaseEl = document.createElement('div');
    var sliderInputEl = document.createElement('input');
    var firstLabel = document.createElement('span');
    var secondLabel = document.createElement('span');
    firstLabel.className = 'ab-opacity-span left-label';
    secondLabel.className = 'ab-opacity-span right-label';
    var mapCase = document.getElementById('wv-map');
    firstLabel.appendChild(document.createTextNode('A'));
    secondLabel.appendChild(document.createTextNode('B'));

    sliderCaseEl.className = 'ab-slider-case';
    sliderInputEl.className = 'slider ab-slider-input';
    sliderInputEl.type = 'range';
    sliderInputEl.min = '0';
    sliderInputEl.max = '100';
    sliderInputEl.value = value;
    secondLayer.setOpacity(value / 100);

    sliderCaseEl.appendChild(firstLabel);
    sliderCaseEl.appendChild(sliderInputEl);
    sliderCaseEl.appendChild(secondLabel);
    mapCase.appendChild(sliderCaseEl);

    sliderInputEl.oninput = function() {
      value = this.value;
      secondLayer.setOpacity(this.value / 100);
    };
    return sliderCaseEl;
  }
}
