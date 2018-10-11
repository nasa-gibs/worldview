import d3 from 'd3';
import util from '../util/util';

export function timelineData(models, config, ui) {
  var tl = ui.timeline;
  var self = {};

  self.start = function() {
    return new Date(config.startDate);
  };

  self.end = function() {
    var endDate = models.layers.lastDate();
    return new Date(new Date(endDate).setUTCDate(endDate.getUTCDate()));
  };

  self.set = function() {
    var futureLayers = [];
    var activeLayers = models.layers.get({});
    var activeLayersDynamic = activeLayers.filter(function(al) {
      return al.startDate;
    });
    /* var activeLayersInvisible = activeLayers.filter(function(al){
        return al.visible === false;
    }); */
    var activeLayersTitles = [];
    var layerCount = activeLayersDynamic.length;

    tl.dataBars.selectAll('rect').remove();

    $(activeLayersDynamic).each(function(i) {
      activeLayersTitles[i] = this.id;
      if (this.futureLayer === true) {
        futureLayers.push(this.id);
      }
    });

    tl.y = d3.scale
      .ordinal()
      .domain(activeLayersTitles)
      .rangeBands([5, tl.height - 12]);

    tl.yAxis = d3.svg
      .axis()
      .scale(tl.y)
      .orient('left')
      .ticks(layerCount);

    $(activeLayersDynamic).each(function(al) {
      var layerStart, layerEnd;
      var staticLayer = true;
      var layerId = this.id;

      if (this.startDate) {
        layerStart = new Date(this.startDate);
        staticLayer = false;
      } else {
        layerStart = self.start();
      }

      if (this.inactive === true || this.futureLayer === true) {
        layerEnd = new Date(this.endDate);
        if (this.futureTime) {
          layerEnd = util.now();
          var futureTime = this.futureTime;
          var dateType = futureTime.slice(-1);
          var dateInterval = futureTime.slice(0, -1);
          if (dateType === 'D') {
            layerEnd.setDate(layerEnd.getDate() + parseInt(dateInterval));
          } else if (dateType === 'M') {
            layerEnd.setMonth(layerEnd.getMonth() + parseInt(dateInterval));
          } else if (dateType === 'Y') {
            layerEnd.setYear(layerEnd.getYear() + parseInt(dateInterval));
          }
        }
      } else if (Array.isArray(futureLayers) && futureLayers.length) {
        layerEnd = util.now();
      } else {
        layerEnd = new Date(self.end().setUTCDate(self.end().getUTCDate() + 1));
      }

      var currentDB = tl.dataBars
        .append('svg:rect')
        .attr('x', tl.x(layerStart))
        .attr('width', tl.x(layerEnd) - tl.x(layerStart))
        // .attr('height',2)
        .attr('y', tl.y(layerId) - 2.5)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('data-layer', layerId)
        .attr('class', 'data-bar');
      //                .attr("d", selection);
      if (!staticLayer) {
        currentDB.classed('data-bar-dyn', true);
      }
      if (this.visible === false) {
        currentDB.classed('data-bar-invisible', true);
      }
    });
    tl.dataBars.selectAll('rect').attr('height', (tl.height - 22) / layerCount);

    if (tl.verticalAxis) {
      tl.verticalAxis.call(tl.yAxis);
    }
  };

  var init = function() {};

  init();
  return self;
}
