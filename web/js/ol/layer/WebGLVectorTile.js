import VectorTile from 'ol/layer/VectorTile.js';
import WebGLVectorTileLayerRenderer from 'ol/renderer/webgl/VectorTileLayer.js';
import { asArray } from 'ol/color.js';
import { packColor, parseLiteralStyle } from 'ol/webgl/styleparser.js';

const result = parseLiteralStyle({
  'fill-color': ['get', 'fillColor'],
  'stroke-color': ['get', 'strokeColor'],
  'stroke-width': ['get', 'strokeWidth'],
  'circle-radius': 4,
  'circle-fill-color': '#777',
});

class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      style: {
        builder: result.builder,
        attributes: {
          fillColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getFill()?.getColor() || '#eee');
              return packColor(color);
            },
          },
          strokeColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getStroke()?.getColor() || '#eee');
              return packColor(color);
            },
          },
          strokeWidth: {
            size: 1,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              return style?.getStroke()?.getWidth() || 0;
            },
          },
        },
      },
    });
  }
}

export default WebGLVectorTileLayer;
