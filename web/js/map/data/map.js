import OlStyleStyle from 'ol/style/Style';
import OlStyleIcon from 'ol/style/Icon';
import OlStyleText from 'ol/style/Text';
import OlStyleFill from 'ol/style/Fill';
import OlStyleStroke from 'ol/style/Stroke';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlGeomLineString from 'ol/geom/LineString';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFeature from 'ol/Feature';
import { find as lodashFind, each as lodashEach } from 'lodash';
import { toggleGranule } from '../../modules/data/actions';

import { CRS_WGS_84, mapToPolys, mapDistanceX } from '../map';

export default function dataMap(store, maps, dataUi, ui) {
  const self = {};

  let map = null;
  let results = [];
  let granules = [];
  let hoverLayer = null;
  let buttonLayer = null;
  let selectionLayer = null;
  let gridLayer = null;
  let swathLayer = null;
  let hovering = null;
  let selectedFeatures = null;
  const init = function() {
    dataUi.events
      .on('activate', updateProjection)
      .on('query', clear)
      .on('queryResults', updateGranules)
      .on('projectionUpdate', updateProjection)
      .on('granuleSelect', selectGranule)
      .on('granuleUnselect', unselectGranule);
    updateProjection();
  };

  const buttonStyle = function(feature) {
    const dataState = store.getState().data;
    const dimensions = getButtonDimensions(feature);
    let image;
    if (lodashFind(dataState.selectedGranules, { id: feature.granule.id })) {
      image = 'images/data.minus-button.png';
    } else {
      image = 'images/data.plus-button.png';
    }

    return [
      new OlStyleStyle({
        image: new OlStyleIcon({
          src: image,
          scale: dimensions.scale,
        }),
      }),
    ];
  };

  const hoverStyle = function(feature) {
    const dataState = store.getState().data;
    const dimensions = getButtonDimensions(feature);
    const offset = -(dimensions.size / 2.0 + 14);
    const textStyle = new OlStyleText({
      overflow: true,
      font: 'bold 14px ‘Lucida Sans’, Arial, Sans-Serif',
      text: feature.granule.label,
      fill: new OlStyleFill({
        color: '#ffffff',
      }),
      stroke: new OlStyleStroke({
        color: 'rgba(0, 0, 0, .7)',
        width: 5,
      }),
      offsetY: offset,
    });
    if (!lodashFind(dataState.selectedGranules, { id: feature.granule.id })) {
      return [
        new OlStyleStyle({
          fill: new OlStyleFill({
            color: 'rgba(181, 158, 50, 0.25)',
          }),
          stroke: new OlStyleStroke({
            color: 'rgb(251, 226, 109)',
            width: 3,
          }),
          text: textStyle,
        }),
      ];
    }
    return [
      new OlStyleStyle({
        fill: new OlStyleFill({
          color: 'rgba(242, 12, 12, 0.25)',
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(255, 6, 0)',
          width: 3,
        }),
        text: textStyle,
      }),
    ];
  };

  const createButtonLayer = function() {
    buttonLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false,
      }),
      style: buttonStyle,
    });
    map.addLayer(buttonLayer);
  };

  const createHoverLayer = function() {
    hoverLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false,
      }),
      style: hoverStyle,
    });
    map.addLayer(hoverLayer);
  };

  const createSelectionLayer = function() {
    selectionLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false,
      }),
      style: new OlStyleStyle({
        fill: new OlStyleFill({
          color: 'rgba(127, 127, 127, 0.2)',
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(127, 127, 127)',
          width: 3,
        }),
        opacity: 0.6,
      }),
    });
    map.addLayer(selectionLayer);
  };

  const createSwathLayer = function() {
    swathLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false,
      }),
      style: new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: 'rgba(195, 189, 123, 0.75)',
          width: 2,
        }),
      }),
    });
    map.addLayer(swathLayer);
  };

  const createGridLayer = function() {
    gridLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false,
      }),
      style: new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: 'rgba(186, 180, 152, 0.6)',
          width: 1.5,
        }),
      }),
    });
    map.addLayer(gridLayer);
  };

  const create = function() {
    createGridLayer();
    createSwathLayer();
    createButtonLayer();
    createHoverLayer();
    createSelectionLayer();
    $(maps.selected.getViewport()).on('mousemove', hoverCheck);
    $(maps.selected.getViewport()).on('click', clickCheck);
  };

  const dispose = function() {
    if (map) {
      map.removeLayer(selectionLayer);
      map.removeLayer(gridLayer);
      map.removeLayer(swathLayer);
      map.removeLayer(hoverLayer);
      map.removeLayer(buttonLayer);
    }
    selectedFeatures = [];
    $(maps.selected.getViewport()).off('mousemove', hoverCheck);
    $(maps.selected.getViewport()).off('click', clickCheck);
  };
  self.dispose = dispose;

  const updateGranules = function(r) {
    const dataState = store.getState().data;
    results = r;
    granules = r.granules;
    updateButtons();
    updateSwaths();
    updateGrid();
    lodashEach(dataState.selectedGranules, (granule) => {
      if (selectedFeatures[granule.id]) {
        selectionLayer.getSource().removeFeature(selectedFeatures[granule.id]);
        delete selectedFeatures[granule.id];
      }
      selectGranule(granule);
    });
  };

  const updateButtons = function() {
    const state = store.getState();
    const projCrs = state.proj.selected.crs;
    buttonLayer.getSource().clear();
    const features = [];
    lodashEach(granules, (granule) => {
      if (!granule.centroid || !granule.centroid[projCrs]) {
        return;
      }
      const centroid = granule.centroid[projCrs];
      const feature = new OlFeature({
        geometry: centroid,
      });
      feature.button = true;
      feature.granule = granule;
      granule.feature = feature;
      features.push(feature);
    });
    buttonLayer.getSource().addFeatures(features);
  };

  const updateSwaths = function() {
    const state = store.getState();
    const projCrs = state.proj.selected.crs;
    swathLayer.getSource().clear();
    const { swaths } = results.meta;
    if (!swaths) {
      return;
    }
    const maxDistance = projCrs === CRS_WGS_84 ? 270 : Number.POSITIVE_INFINITY;
    const features = [];
    lodashEach(swaths, (swath) => {
      let lastGranule = null;
      lodashEach(swath, (granule) => {
        if (!lastGranule) {
          lastGranule = granule;
          return;
        }
        const polys1 = mapToPolys(lastGranule.geometry[projCrs]);
        const polys2 = mapToPolys(granule.geometry[projCrs]);
        lodashEach(polys1, (poly1) => {
          lodashEach(polys2, (poly2) => {
            const c1 = poly1.getInteriorPoint().getCoordinates();
            const c2 = poly2.getInteriorPoint().getCoordinates();
            const distanceX = mapDistanceX(c1[0], c2[0]);
            if (distanceX < maxDistance) {
              const ls = new OlGeomLineString([c1, c2]);
              features.push(new OlFeature(ls));
            }
          });
        });
        lastGranule = granule;
      });
    });
    swathLayer.getSource().addFeatures(features);
  };

  const updateGrid = function() {
    gridLayer.getSource().clear();
    const { grid } = results.meta;
    if (!grid) {
      return;
    }
    const features = [];
    const parser = new OlFormatGeoJSON();
    lodashEach(grid, (cell) => {
      const geom = parser.readGeometry(cell.geometry);
      const feature = new OlFeature(geom);
      features.push(feature);
    });
    gridLayer.getSource().addFeatures(features);
  };

  const selectGranule = function(granule) {
    const state = store.getState();
    const projCrs = state.proj.selected.crs;
    if (!granule.feature) {
      return;
    }
    granule.feature.changed();
    const select = new OlFeature(granule.geometry[projCrs]);
    select.granule = granule;
    selectionLayer.getSource().addFeature(select);
    selectedFeatures[granule.id] = select;
  };

  const unselectGranule = function(granule) {
    if (!granule.feature) {
      return;
    }
    granule.feature.changed();
    const toRemove = selectedFeatures[granule.id];
    if (toRemove) {
      selectionLayer.getSource().removeFeature(toRemove);
      delete selectedFeatures[granule.id];
    }
  };

  const updateProjection = function() {
    dispose();
    map = maps.selected;
    create();
  };

  const clear = function() {
    if (map) {
      swathLayer.getSource().clear();
      gridLayer.getSource().clear();
      hoverLayer.getSource().clear();
      buttonLayer.getSource().clear();
    }
  };

  const hoverCheck = function(event) {
    const pixel = map.getEventPixel(event.originalEvent);
    let newFeature = null;
    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      if (feature.button) {
        newFeature = feature;
      }
    });

    if (hovering) {
      hovering.changed();
    }
    if (newFeature) {
      newFeature.changed();
    }
    if (hovering !== newFeature) {
      if (newFeature) {
        hoverOver(newFeature);
      } else {
        hoverOut(hovering);
      }
    }
    hovering = newFeature;
  };

  const clickCheck = function(event) {
    const pixel = map.getEventPixel(event.originalEvent);
    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      if (feature.button) {
        store.dispatch(toggleGranule(feature.granule));
        hovering = false;
        hoverCheck(event);
      }
    });
  };

  const hoverOver = function(feature) {
    const state = store.getState();
    const projCrs = state.proj.selected.crs;
    const { granule } = feature;
    if (!granule.geometry) {
      return;
    }
    const hover = new OlFeature(granule.geometry[projCrs]);
    hover.granule = granule;
    hoverLayer.getSource().clear();
    hoverLayer.getSource().addFeature(hover);
  };

  const hoverOut = function() {
    hoverLayer.getSource().clear();
  };

  const getButtonDimensions = function(feature) {
    const zoom = map.getView().getZoom();
    // Minimum size of the button is 15 pixels
    const base = 12;
    // Double the size for each zoom level
    const add = 2 ** zoom;
    // Apply size adjustment to the button if specified by TagButtonScale
    const buttonScale = feature.granule.buttonScale || 1;
    let size = (base + add) * buttonScale;
    // But 44 pixels is the maximum size
    size = Math.min(size, base + 32);
    return {
      scale: size / 48,
      size,
    };
  };

  init();
  return self;
}
