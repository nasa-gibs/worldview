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
    var mapCase = document.getElementById('wv-map');
    sliderCaseEl.className = 'ab-slider-case';
    sliderInputEl.className = 'slider ab-slider-input';
    sliderInputEl.type = 'range';
    sliderInputEl.min = '0';
    sliderInputEl.max = '100';
    sliderInputEl.value = value;

    sliderCaseEl.appendChild(sliderInputEl);
    mapCase.appendChild(sliderCaseEl);
    sliderInputEl.oninput = function() {
      value = this.value;
      secondLayer.setOpacity(this.value / 100);
    };
    return sliderCaseEl;
  }
}
