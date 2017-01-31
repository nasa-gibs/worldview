/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
 /*eslint no-unused-vars: "error"*/
var wv = wv || {};
wv.map = wv.map || {};

/*
 * @Class
 */
wv.map.datelinebuilder = wv.map.ui || function(models, config) {
	var self = {};
	var line1, line2, map, overlay1, overlay2, svg1, svg2;

	self.init = function(Parent, olMap, date) {
		map = olMap;
    	drawDatelines(map, date);

    	Parent.events.on('moveend', function() {
            toggleLineOpactiy('0.7');
			position(map);

    	});
    	Parent.events.on('drag', function() {
			position(map);
    	});
        Parent.events.on('movestart', function() {
            toggleLineOpactiy('0');
        });
    };

    var drawLines = function(classes, map) {
        var svg, line;
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        line = document.createElementNS("http://www.w3.org/2000/svg","line");
        svg.setAttribute('width', '3');

        setLineDefaults(line);

        svg.appendChild(line);
        svg.setAttribute('class', classes);

        return [svg, line];
    };
    var toggleLineOpactiy = function(opacity) {
        line1.setAttribute('opacity', opacity);
        line2.setAttribute('opacity', opacity);
    };
    var drawText = function(date) {
    	var leftText, rightText, svg;

    	svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    	leftText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        rightText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svg.setAttribute('style','transform: translate(-100px,0);');
        svg.setAttribute('class', 'dateline-text');
        svg.setAttribute('width', '200');
        svg.setAttribute('class', 'dateline-text hidden');
        leftText.append(document.createTextNode(wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', 1))));
        rightText.append(document.createTextNode(wv.util.toISOStringDate(date)));

        setTextDefaults(rightText, 110);
        setTextDefaults(leftText, 15);

		svg.appendChild(rightText);
		svg.appendChild(leftText);

		return svg;
    };
    var setLineDefaults = function(svgEl) {
        svgEl.setAttribute('x1', '0');
        svgEl.setAttribute('x2', '0');
        svgEl.setAttribute('y1', '0');
        svgEl.setAttribute('y2', '0');
        svgEl.setAttribute('stroke-width', '3');
        svgEl.setAttribute('stroke-dasharray', '5, 5');
        svgEl.setAttribute('stroke', 'white');
        svgEl.setAttribute('opacity', '0.7');
    };
    var setTextDefaults = function(svgEl, x) {
        svgEl.setAttribute('y', 10);
        svgEl.setAttribute('x', x);
        svgEl.setAttribute('fill', 'white');
        svgEl.setAttribute('stroke', 'black');
        svgEl.setAttribute('stroke-width', '0.75');
    };
    var drawDatelines = function(map, date) {
        var $obj1, $obj2, viewport, defaultCoord,  textSvg1, textSvg2,
			textOverlay1, textOverlay2;

        defaultCoord = [-180, 90];
        obj1 = drawLines('dateline_left dateline');
        obj2 = drawLines('dateline_right dateline');
        line1 = obj1[1];
        line2 = obj2[1];
        svg1 = obj1[0];
        svg2 = obj2[0];
        textSvg1 = drawText(date);
        textSvg2 = drawText(wv.util.dateAdd(date, 'day', -1));
        textOverlay1 = drawOverlay(defaultCoord, textSvg1);
        textOverlay2 = drawOverlay(defaultCoord, textSvg2);
        overlay1 = drawOverlay(defaultCoord, obj1[0]);
        overlay2 = drawOverlay(defaultCoord, obj2[0]);


        map.addOverlay(overlay1);
        map.addOverlay(overlay2);
        map.addOverlay(textOverlay1);
        map.addOverlay(textOverlay2);

        setListeners(svg1, textSvg1, textOverlay1, -180);
        setListeners(svg2, textSvg2, textOverlay2, 180);
    };
    var setListeners = function(lineSVG, textSVG, overlay, lineX) {
        var line = lineSVG.childNodes[0];
        lineSVG.addEventListener("mouseover", function(e) {
            var pixels, coords;
            pixels =  [e.pageX,e.pageY];
            coords = map.getCoordinateFromPixel(pixels);
            line.setAttribute('stroke-dasharray', 'none');
            line.setAttribute('opacity', '1');
            textSVG.setAttribute('class', 'dateline-text');
            overlay.setPosition([lineX, coords[1]]);
		});
        lineSVG.addEventListener("mouseout", function( event ) {
            line.setAttribute('stroke-dasharray', '5, 5');
            line.setAttribute('opacity', '0.7');
            textSVG.setAttribute('class', 'dateline-text hidden');
        });
    };
    var position = function(map) {
        var extent, top, topY, bottomY, bottom, height, startY, ninetyDegreePixel, topExtent, bottomExtent, halfHeight, halfStart;

        if(map.getSize()[0] === 0) {
            return;
        }
        extent = map.getView().calculateExtent(map.getSize());
        top = [extent[2] -1, extent[3] + 5];
        bottom = [extent[2] -1, extent[1] - 5];
        topExtent = map.getPixelFromCoordinate([extent[2] -1, extent[3] - 1]);
        bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
        topY = Math.round(topExtent[1] + 5);
        bottomY = Math.round(bottomExtent[1] - 5);
        startY = Math.round(extent[3] + 5);

		if (startY > 90) {
			startY = 90;
			topY = map.getPixelFromCoordinate([extent[2], 90])[1];
		} else {
			topY = map.getPixelFromCoordinate(top)[1];
		}
		if (extent[1] > -90) {
			bottomY = map.getPixelFromCoordinate(bottom)[1];
		} else {
			bottomY = map.getPixelFromCoordinate([extent[2], -90])[1];
		}
    	height = Math.abs(bottomY - topY);
    	halfHeight = Math.round(height / 2);
    	halfStart = map.getCoordinateFromPixel([extent[2], halfHeight])[1];

    	overlay1.setPosition([-180, startY]);
    	overlay2.setPosition([180,  startY]);

    	update(height);
    };
    var drawOverlay = function(coordinate, el) {
        var overlay = new ol.Overlay({
            element: el,
            stopEvent: false
        });
        overlay.setPosition(coordinate);
        return overlay;
    };
	var update = function(height) {
		line1.setAttribute('y2', height);
		line2.setAttribute('y2', height);
		svg1.setAttribute('height', height);
		svg2.setAttribute('height', height);
    };
    return self;
};