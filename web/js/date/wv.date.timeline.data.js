/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.date.timeline
 */
var wv = wv || {};
wv.date = wv.date || {};
wv.date.timeline = wv.date.timeline || {};

/**
 * Perform timeline data functions
 *
 * @class wv.date.timeline.data
 */
wv.date.timeline.data = wv.date.timeline.data || function(models, config, ui) {

  var tl = ui.timeline;
  var model = models.date;

  var self = {};

  self.start = function() {
    return new Date(config.startDate);
  };

  self.end = function() {
    return new Date(
      new Date(wv.util.today())
        .setUTCDate(wv.util.today()
          .getUTCDate()));
  };

  self.set = function() {

    var activeLayers = models.layers.get();
    var activeLayersDynamic = activeLayers.filter(function(al) {
      return al.startDate;
    });
    /* var activeLayersInvisible = activeLayers.filter(function(al){
        return al.visible === false;
    });*/
    var activeLayersTitles = [];
    var layerCount = activeLayersDynamic.length;

    tl.dataBars.selectAll('rect')
      .remove();

    $(activeLayersDynamic)
      .each(function(i) {
        activeLayersTitles[i] = this.id;
      });

    tl.y = d3.scale.ordinal()
      .domain(activeLayersTitles)
      .rangeBands([5, tl.height - 12]);

    tl.yAxis = d3.svg.axis()
      .scale(tl.y)
      .orient("left")
      .ticks(layerCount);

    $(activeLayersDynamic)
      .each(function(al) {
        var layerStart, layerEnd, layerXY;
        var layerVisible = true;
        var staticLayer = true;
        var layerId = this.id;

        if (this.startDate) {
          layerStart = new Date(this.startDate);
          staticLayer = false;
        } else {
          layerStart = self.start();
        }
        if (this.inactive === true) {
          layerEnd = new Date(this.endDate);
        } else {
          layerEnd = new Date(self.end()
            .setUTCDate(self.end()
              .getUTCDate() + 1));
        }

        var currentDB = tl.dataBars.append("svg:rect")
          .attr('x', tl.x(layerStart))
          .attr('width', tl.x(layerEnd) - tl.x(layerStart))
          //.attr('height',2)
          .attr('y', tl.y(layerId) - 2.5)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('data-layer', layerId)
          .attr("class", "data-bar");
        //                .attr("d", selection);
        if (!staticLayer) {
          currentDB.classed('data-bar-dyn', true);
        }
        if (this.visible === false) {
          layerVisible = false;
          currentDB.classed('data-bar-invisible', true);
        }

      });
    tl.dataBars.selectAll('rect')
      .attr('height', (tl.height - 22) / layerCount);

    if (tl.verticalAxis) {
      tl.verticalAxis.call(tl.yAxis);
    }
  };

  var init = function() {


  };

  init();
  return self;
};
