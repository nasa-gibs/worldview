import $ from 'jquery';
import lodashEach from 'lodash/each';
import OlStyleStyle from 'ol/style/style';
import OlStyleIcon from 'ol/style/icon';
import OlStyleText from 'ol/style/text';
import OlStyleFill from 'ol/style/fill';
import OlStyleStroke from 'ol/style/stroke';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlGeomLineString from 'ol/geom/linestring';
import OlFormatGeoJSON from 'ol/format/geojson';
import OlFeature from 'ol/feature';

import { CRS_WGS_84, mapToPolys, mapDistanceX } from '../map/map';

export function dataMap(model, maps, config) {
  var self = {};

  var map = null;
  var results = [];
  var granules = [];
  var hoverLayer = null;
  var buttonLayer = null;
  var selectionLayer = null;
  var gridLayer = null;
  var swathLayer = null;
  var hovering = null;
  var selectedFeatures = null;

  var init = function () {
    model.events
      .on('activate', updateProjection)
      .on('query', clear)
      .on('queryResults', updateGranules)
      .on('projectionUpdate', updateProjection)
      .on('granuleSelect', selectGranule)
      .on('granuleUnselect', unselectGranule);
    updateProjection();
  };

  var buttonStyle = function (feature) {
    var dimensions = getButtonDimensions(feature);
    var image;
    if (model.isSelected(feature.granule)) {
      image = 'images/data.minus-button.png';
    } else {
      image = 'images/data.plus-button.png';
    }

    return [new OlStyleStyle({
      image: new OlStyleIcon({
        src: image,
        scale: dimensions.scale
      })
    })];
  };

  var hoverStyle = function (feature) {
    var dimensions = getButtonDimensions(feature);
    var offset = -(dimensions.size / 2.0 + 14);
    var textStyle = new OlStyleText({
      exceedLength: true,
      font: 'bold 14px ‘Lucida Sans’, Arial, Sans-Serif',
      text: feature.granule.label,
      fill: new OlStyleFill({
        color: '#ffffff'
      }),
      stroke: new OlStyleStroke({
        color: 'rgba(0, 0, 0, .7)',
        width: 5
      }),
      offsetY: offset
    });
    if (!model.isSelected(feature.granule)) {
      return [new OlStyleStyle({
        fill: new OlStyleFill({
          color: 'rgba(181, 158, 50, 0.25)'
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(251, 226, 109)',
          width: 3
        }),
        text: textStyle
      })];
    } else {
      return [new OlStyleStyle({
        fill: new OlStyleFill({
          color: 'rgba(242, 12, 12, 0.25)'
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(255, 6, 0)',
          width: 3
        }),
        text: textStyle
      })];
    }
  };

  var createButtonLayer = function () {
    buttonLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false
      }),
      style: buttonStyle
    });
    map.addLayer(buttonLayer);
  };

  var createHoverLayer = function () {
    hoverLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false
      }),
      style: hoverStyle
    });
    map.addLayer(hoverLayer);
  };

  var createSelectionLayer = function () {
    selectionLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false
      }),
      style: new OlStyleStyle({
        fill: new OlStyleFill({
          color: 'rgba(127, 127, 127, 0.2)'
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(127, 127, 127)',
          width: 3
        }),
        opacity: 0.6
      })
    });
    map.addLayer(selectionLayer);
  };

  var createSwathLayer = function () {
    swathLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false
      }),
      style: new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: 'rgba(195, 189, 123, 0.75)',
          width: 2
        })
      })
    });
    map.addLayer(swathLayer);
  };

  var createGridLayer = function () {
    gridLayer = new OlLayerVector({
      source: new OlSourceVector({
        wrapX: false
      }),
      style: new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: 'rgba(186, 180, 152, 0.6)',
          width: 1.5
        })
      })
    });
    map.addLayer(gridLayer);
  };

  var create = function () {
    createSelectionLayer();
    createGridLayer();
    createSwathLayer();
    createButtonLayer();
    createHoverLayer();
    $(maps.selected.getViewport())
      .on('mousemove', hoverCheck);
    $(maps.selected.getViewport())
      .on('click', clickCheck);
  };

  var dispose = function () {
    if (map) {
      map.removeLayer(selectionLayer);
      map.removeLayer(gridLayer);
      map.removeLayer(swathLayer);
      map.removeLayer(hoverLayer);
      map.removeLayer(buttonLayer);
    }
    selectedFeatures = [];
    $(maps.selected.getViewport())
      .off('mousemove', hoverCheck);
    $(maps.selected.getViewport())
      .off('click', clickCheck);
  };
  self.dispose = dispose;

  var updateGranules = function (r) {
    results = r;
    granules = r.granules;
    updateButtons();
    updateSwaths();
    updateGrid();
    lodashEach(model.selectedGranules, function (granule) {
      if (selectedFeatures[granule.id]) {
        selectionLayer.getSource()
          .removeFeature(selectedFeatures[granule.id]);
        delete selectedFeatures[granule.id];
      }
      selectGranule(granule);
    });
  };

  var updateButtons = function () {
    buttonLayer.getSource()
      .clear();
    var features = [];
    lodashEach(granules, function (granule) {
      if (!granule.centroid || !granule.centroid[model.crs]) {
        return;
      }
      var centroid = granule.centroid[model.crs];
      var feature = new OlFeature({
        geometry: centroid
      });
      feature.button = true;
      feature.granule = granule;
      granule.feature = feature;
      features.push(feature);
    });
    buttonLayer.getSource()
      .addFeatures(features);
  };

  var updateSwaths = function () {
    swathLayer.getSource()
      .clear();
    var swaths = results.meta.swaths;
    if (!swaths) {
      return;
    }
    var maxDistance = (model.crs === CRS_WGS_84)
      ? 270 : Number.POSITIVE_INFINITY;
    var features = [];
    lodashEach(swaths, function (swath) {
      var lastGranule = null;
      lodashEach(swath, function (granule) {
        if (!lastGranule) {
          lastGranule = granule;
          return;
        }
        var polys1 = mapToPolys(lastGranule.geometry[model.crs]);
        var polys2 = mapToPolys(granule.geometry[model.crs]);
        lodashEach(polys1, function (poly1) {
          lodashEach(polys2, function (poly2) {
            var c1 = poly1.getInteriorPoint()
              .getCoordinates();
            var c2 = poly2.getInteriorPoint()
              .getCoordinates();
            var distanceX = mapDistanceX(c1[0], c2[0]);
            if (distanceX < maxDistance) {
              var ls = new OlGeomLineString([c1, c2]);
              features.push(new OlFeature(ls));
            }
          });
        });
        lastGranule = granule;
      });
    });
    swathLayer.getSource()
      .addFeatures(features);
  };

  var updateGrid = function () {
    gridLayer.getSource()
      .clear();
    var grid = results.meta.grid;
    if (!grid) {
      return;
    }
    var features = [];
    var parser = new OlFormatGeoJSON();
    lodashEach(grid, function (cell) {
      var geom = parser.readGeometry(cell.geometry);
      var feature = new OlFeature(geom);
      features.push(feature);
    });
    gridLayer.getSource()
      .addFeatures(features);
  };

  var selectGranule = function (granule) {
    if (!granule.feature) {
      return;
    }
    granule.feature.changed();
    var select = new OlFeature(granule.geometry[model.crs]);
    select.granule = granule;
    // granule.selectedFeature = select;
    selectionLayer.getSource()
      .addFeature(select);
    selectedFeatures[granule.id] = select;
  };

  var unselectGranule = function (granule) {
    if (!granule.feature) {
      return;
    }
    granule.feature.changed();
    // selectionLayer.getSource().removeFeature(granule.selectedFeature);
    // delete granule.selectedFeature;
    selectionLayer.getSource()
      .removeFeature(selectedFeatures[granule.id]);
    delete selectedFeatures[granule.id];
  };

  var updateProjection = function () {
    dispose();
    map = maps.selected;
    create();
  };

  var clear = function () {
    if (map) {
      swathLayer.getSource()
        .clear();
      gridLayer.getSource()
        .clear();
      hoverLayer.getSource()
        .clear();
      buttonLayer.getSource()
        .clear();
    }
  };

  var hoverCheck = function (event) {
    var pixel = map.getEventPixel(event.originalEvent);
    var newFeature = null;
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
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

  var clickCheck = function (event) {
    var pixel = map.getEventPixel(event.originalEvent);
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
      if (feature.button) {
        model.toggleGranule(feature.granule);
        hovering = false;
        hoverCheck(event);
      }
    });
  };

  var hoverOver = function (feature) {
    var granule = feature.granule;
    if (!granule.geometry) {
      return;
    }
    var hover = new OlFeature(granule.geometry[model.crs]);
    hover.granule = granule;
    hoverLayer.getSource()
      .clear();
    hoverLayer.getSource()
      .addFeature(hover);
  };

  var hoverOut = function () {
    hoverLayer.getSource()
      .clear();
  };

  var getButtonDimensions = function (feature) {
    var zoom = map.getView()
      .getZoom();
    // Minimum size of the button is 15 pixels
    var base = 12;
    // Double the size for each zoom level
    var add = Math.pow(2, zoom);
    // Apply size adjustment to the button if specified by TagButtonScale
    var buttonScale = feature.granule.buttonScale || 1;
    var size = (base + add) * buttonScale;
    // But 44 pixels is the maximum size
    size = Math.min(size, base + 32);
    return {
      scale: size / 48,
      size: size
    };
  };

  init();
  return self;
};
