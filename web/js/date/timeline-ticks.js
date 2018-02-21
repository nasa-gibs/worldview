import $ from 'jquery';
import d3 from 'd3';
import util from '../util/util';
/**
 * Perform timeline tick functions
 */
export function timelineTicks(models, config, ui) {
  var tl = ui.timeline;
  var model = models.date;

  var self = {};

  var cancelClick;
  var clicked = true;
  var notClickDelay = 200;

  var notClick = function () {
    clicked = false;
  };

  self.setAll = function () {
    self.all = d3.selectAll('.x.axis>g.tick');
    self.firstElem = self.all[0][0];
    self.firstDate = self.all.data()[0];
    self.lastDate = self.all.data()[self.all.data().length - 1];
    // remove previous classes for labels
    self.all.classed('tick-labeled', false);
  };
  self.normal = {
    setEnds: function () {
      var all = self.normal.all;
      self.normal.all.classed('end-tick', false);
      self.normal.firstDate = all.data()[0];
      self.normal.firstElem = all[0][0];
      self.normal.lastDate = all.data()[all.data().length - 1];
      self.normal.lastElem = all[0][all[0].length - 1];
      d3.select(self.normal.lastElem)
        .classed('end-tick', true);
    },
    update: function () {
      var nWidth;
      var ticks = self.normal.all;

      ticks.each(function () {
        var current = d3.select(this);
        var currentData = current.data()[0];
        var nextData = tl.zoom.current.ticks.normal.next(currentData);
        // var normalTickLine = normalTick.select('line'); What's this for?

        // FIXME: Calculate actual width of tick line
        nWidth = tl.x(nextData) - tl.x(currentData) + 1;

        if (($(this)
          .find('line:first-child')
          .attr('y1') !== '-2')) {
          current.select('line')
            .attr('y1', '-2');
        }
        if (current.classed('end-tick')) {
          if (current.select('line.tick-close')[0][0] === null) {
            d3.select(self.normal.lastElem)
              .append('line')
              .classed('tick-close', true)
              .attr('y2', -tl.height)
              .attr('y1', -2)
              .attr('x1', nWidth - 0.5)
              .attr('x2', nWidth - 0.5);
          }
        }
        if (($(this)
          .find('text')
          .length)) {
          current.select('text')
            .remove();
        }

        if (!$(this)
          .find('rect')
          .length) {
          self.normal.insert.rect(current, nWidth);
        } else {
          current.select('rect.normaltick-background')
            .attr('width', nWidth);
        }
        if (tl.config.currentZoom === 3) {
          if (!$(this)
            .find('line.tick-week')
            .length) {
            let currentTick = d3.select(this);
            let currentTickData = currentTick.data()[0];
            if ((currentTickData.getUTCDay() === 0) &&
              (currentTickData.getUTCDate() !== 1)) {
              currentTick
                .insert('line', 'rect')
                .attr('y1', 0)
                .attr('y2', -10)
                .attr('x2', 0)
                .classed('tick-week', true);
            }
          }
        }
        if (tl.config.currentZoom === 4) {
          if (!$(this)
            .find('line.tick-hour')
            .length) {
            let currentTick = d3.select(this);
            let currentTickData = currentTick.data()[0];
            if (currentTickData.getUTCMinutes() === 0) {
              currentTick
                .insert('line', 'rect')
                .attr('y1', 0)
                .attr('y2', -10)
                .attr('x2', 0)
                .classed('tick-hour', true);
            }
          }
        }
      });

      self.normal.set();
      self.normal.bind();
    },
    init: function () {
      var nWidth;
      var ticks = self.normal.all;

      ticks.selectAll('line')
        .attr('y1', '-2');
      ticks.selectAll('line.tick-week')
        .attr('y1', '0');

      ticks.selectAll('text')
        .remove();

      ticks.each(function () {
        var current = d3.select(this);
        var currentData = current.data()[0];
        var nextData = tl.zoom.current.ticks.normal.next(currentData);
        // var normalTickLine = normalTick.select('line'); What's this for?

        // FIXME: Calculate actual width of tick line
        nWidth = tl.x(nextData) - tl.x(currentData) + 1;

        self.normal.insert.rect(current, nWidth);

        if (current.classed('end-tick')) {
          d3.select(self.normal.lastElem)
            .append('line')
            .classed('tick-close', true)
            .attr('y2', -tl.height)
            .attr('y1', -2)
            .attr('x1', nWidth - 0.5)
            .attr('x2', nWidth - 0.5);
        }
      });
    },
    insert: {
      rect: function (current, nWidth) {
        current.append('svg:rect')
          .attr('class', 'normaltick-background')
          .attr('height', tl.height - 1)
          .attr('y', -tl.height)
          .attr('x', -0.5)
          .attr('width', nWidth);
      }
    },
    set: function () {
      self.normal.background = self.all.selectAll('rect.normaltick-background');
    },
    bind: function () {
      var d;
      self.normal.background
        .on('mouseenter', function () {
          d = d3.select(this.parentNode)
            .data()[0];
          self.normal.hover.call(this, d);
        })
        .on('mouseleave', self.label.remove)
        .on('mousedown', function () {
          cancelClick = setTimeout(notClick, notClickDelay);
        })
        .on('mouseup', function () {
          clearTimeout(cancelClick);
          if (!ui.map.mapIsbeingDragged &&
            clicked) {
            d = d3.select(this.parentNode)
              .data()[0];
            self.normal.click.call(this, d);
          }
          clicked = true;
        });
    },
    hover: function (d) {
      var label = tl.zoom.current.ticks.normal.hover(d);
      self.label.show.call(this, label);
    },
    click: function (d) {
      var date = tl.zoom.current.ticks.normal.clickDate(d);
      model.select(date);
    }

  };
  self.boundary = {
    update: function () {
      var ticks = self.boundary.all;

      ticks.each(function () {
        // This is a repeat, maybe fix?
        var current = d3.select(this);
        var currentData = current.data()[0];
        var nextData = tl.zoom.current.ticks.boundary.next(currentData);
        var nextNormalData = tl.zoom.current.ticks.normal.next(currentData);
        var bWidth = tl.x(nextData) - tl.x(currentData);
        var nWidth = tl.x(nextNormalData) - tl.x(currentData) + 1;
        var subLabel = tl.zoom.current.ticks.boundary.subLabel(currentData);
        // end repeat

        if (($(this)
          .find('line')
          .attr('y1') !== '20')) {
          current.select('line')
            .attr('y1', '20')
            .attr('y2', '-50');
        }
        if (!$(this)
          .find('text')
          .hasClass('tick-label')) {
          current.select('text')
            .attr('class', 'tick-label')
            .attr('x', 7)
            .attr('style', 'text-anchor:left;');
          if (subLabel) {
            current.select('text')
              .append('tspan')
              .text(' ' + subLabel)
              .attr('class', 'sub-label');
          }
        }
        if (!$(this)
          .find('circle')
          .length) {
          current.insert('svg:circle', 'text')
            .attr('r', '6');
        }

        if (!$(this)
          .find('rect')
          .length) {
          self.boundary.insert.rect(current, bWidth, nWidth);
        } else {
          current.select('rect.boundarytick-background')
            .attr('width', bWidth);
          current.select('rect.boundarytick-foreground')
            .attr('width', bWidth);
          current.select('rect.normaltick-background')
            .attr('width', nWidth);
        }
      });

      self.boundary.set();
      self.boundary.bind();
    },
    init: function () {
      var ticks = self.boundary.all;
      ticks.selectAll('line')
        .attr('y1', '20')
        .attr('y2', '-50');

      ticks.insert('svg:circle', 'text')
        .attr('r', '6');

      ticks.each(function () {
        var current = d3.select(this);
        var currentData = current.data()[0];
        var nextData = tl.zoom.current.ticks.boundary.next(currentData);
        var nextNormalData = tl.zoom.current.ticks.normal.next(currentData);
        var bWidth = tl.x(nextData) - tl.x(currentData);
        var nWidth = tl.x(nextNormalData) - tl.x(currentData) + 1;
        var subLabel = tl.zoom.current.ticks.boundary.subLabel(currentData);

        if (currentData < tl.data.end()) {
          self.boundary.insert.rect(current, bWidth, nWidth);
        }
        // TODO: Sublabel
        if (subLabel) {
          current.select('text')
            .append('tspan')
            .text(' ' + subLabel)
            .attr('class', 'sub-label');
        }
      });

      ticks.selectAll('text')
        .attr('class', 'tick-label')
        .attr('x', 7)
        .attr('style', 'text-anchor:left;');
    },
    insert: {
      rect: function (current, bWidth, nWidth) {
        current.insert('svg:rect', 'text')
          .attr('x', '0')
          .attr('y', '0')
          .attr('width', bWidth)
          .attr('height', tl.height)
          .attr('class', 'boundarytick-background');

        current.append('svg:rect')
          .attr('x', '0')
          .attr('y', '0')
          .attr('width', bWidth)
          .attr('height', tl.height)
          .attr('class', 'boundarytick-foreground');
        if (!(current.classed('label-only'))) {
          current.append('svg:rect')
            .attr('class', 'normaltick-background')
            .attr('height', tl.height - 1)
            .attr('y', -tl.height)
            .attr('x', -0.5)
            .attr('width', nWidth);
        }
      }
    },
    set: function () {
      self.boundary.background = self.boundary.all
        .selectAll('rect.boundarytick-foreground');
    },
    bind: function () {
      var d;
      self.boundary.background
        .on('mouseenter', function () {
          d = d3.select(this.parentNode)
            .data()[0];
          self.boundary.hover.call(this, d);
        })
        .on('mouseleave', self.label.remove)
        .on('mousedown', function () {
          cancelClick = setTimeout(notClick, notClickDelay);
        })
        .on('mouseup', function () {
          clearTimeout(cancelClick);
          if (!ui.map.mapIsbeingDragged &&
            clicked) {
            d = d3.select(this.parentNode)
              .data()[0];
            self.boundary.click.call(this, d);
          }
          clicked = true;
        });
    },
    hover: function (d) {
      var label = tl.zoom.current.ticks.boundary.hover(d);
      self.label.show.call(this, label);
    },
    click: function (d) {
      var date = tl.zoom.current.ticks.boundary.clickDate(d);
      model.select(date);
    },
    labelOnly: function (d) {
      // not needed ?!?
      d3.selectAll('.x.axis>g.label-only');
    }
  };

  self.add = function (data, elem, normal) {
    var tick = tl.axis.insert('g', elem)
      .data([data])
      .attr('class', 'tick')
      .attr('transform', 'translate(' + tl.x(data) + ',0)');
    if (!normal) {
      tick.classed('label-only', true); // if add function is for label only
    }
    var text = tl.zoom.current.ticks.boundary.label(data);

    tick.append('line')
      .attr('y2', -tl.height);

    tick.append('text')
      .attr('y', '5')
      .attr('dy', '.71em')
      .text(text);
  };

  self.label = { // TODO: Update, this is just copied over
    show: function (d) {
      var $boundaryTick;
      var tick = this.parentNode;
      var boundaryTick, boundaryTickWidth;
      var hoverDay = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

      // Using jquery to precise select as it's easier than d3
      if (d3.select(tick)
        .classed('tick-labeled')) {
        $boundaryTick = $(tick);
      } else {
        // Grab Boundary Tick if it is a Normal Tick
        $boundaryTick = $(tick)
          .prevAll('g.tick-labeled')
          .first();
      }

      // get width from one boundary to the next
      boundaryTickWidth = $boundaryTick
        .find('rect.boundarytick-background')
        .attr('width');

      // Convert jquery selection back to d3 selection
      boundaryTick = d3.select($boundaryTick[0]);

      // hide current labels
      boundaryTick
        .selectAll('.tick-label, .sub-label')
        .attr('visibility', 'hidden');

      // trigger hover state
      boundaryTick.select('rect.boundarytick-background')
        .classed('bg-hover', true);
      boundaryTick.append('svg:text')
        .attr('class', 'hover-tick-label')
        .attr('y', '15')
        .attr('x', boundaryTickWidth / 2)
        .attr('style', 'text-anchor:middle')
        .attr('width', boundaryTickWidth)
        .text(d.getUTCFullYear() +
          ' ' + model.monthAbbr[d.getUTCMonth()] +
          ' ' + d.getUTCDate() +
          ' (' + util.daysInYear(hoverDay) + ')'); // Add hover Label
    },
    remove: function () { // TODO: update
      tl.boundary.selectAll('.tick-label, .sub-label')
        .attr('visibility', '');
      tl.boundary.selectAll('.hover-tick-label, .hover-sub-label')
        .remove();
      tl.boundary.selectAll('rect.boundarytick-background.bg-hover')
        .classed('bg-hover', false);
    }
  };

  self.removePaddingData = function () {
    self.all.each(function () {
      if (((d3.select(this)
        .data()[0] < tl.data.start()) ||
          (d3.select(this)
            .data()[0] > tl.data.end()))) {
        if (!d3.select(this)
          .classed('tick-labeled')) {
          d3.select(this)
            .remove();
        } else {
          d3.select(this)
            .selectAll('rect')
            .remove();
        }
      }
    });
  };

  self.check = function () {
    var proto, end, protoNorm;
    self.setAll();
    tl.ticks.removePaddingData();
    self.setAll();

    // Checks to see if all of the ticks fit onto the timeline space
    // and if so check to see that first normal tick is printed
    if (!tl.isCropped) {
      if (self.firstDate > tl.data.start()) {
        protoNorm = tl.zoom.current.ticks.normal.first();
        self.add(protoNorm, 'g.tick', true);
      }
    }
    self.setAll();
    // set normal ticks
    tl.zoom.current.ticks.normal.all();

    // FIXME: Section below is terrible {
    // For determining needed boundary ticks
    self.all.classed('label-only', false);

    if ($(self.normal.firstElem)
      .is(':nth-child(2)')) {
      proto = tl.zoom.current.ticks.boundary.first();
      self.add(proto, 'g.tick');
    }

    // FIXME: Passing from d3 to jQuery to d3 in order to check if its the last tick elem.  WAT.
    // Select element that follows last non-boundary tick
    var sibElem = d3.select($(self.normal.lastElem)
      .next()[0]);

    if (sibElem.classed('domain')) {
      end = tl.zoom.current.ticks.boundary.last();
      self.add(end, 'path.domain');
    }
    // } End terrible

    self.setAll();

    // update boundary ticks
    tl.zoom.current.ticks.boundary.all();

    self.boundary.all.classed('tick-labeled', true);
  };

  var init = function () {

  };

  init();
  return self;
};
