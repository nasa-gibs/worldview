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
var wv = wv || {};
wv.map = wv.map || {};

/*
 * @Class
 */
wv.map.datelinebuilder = wv.map.ui || function(models, config) {
	var self = {};
	var line1, line2, overlay1, overlay2, textArray, svg1, svg2, textOverlay1, textOverlay2;

	

	self.init = function(Parent, map, date) {
		textArray = [];
    	drawDatelines(map, date);

    	Parent.events.on('moveend', function() {
			position(map);
    	});
    	Parent.events.on('drag', function() {
			position(map);
    	});
    };

    var drawLines = function(classes, map) {
        var svg, line;
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        line = document.createElementNS("http://www.w3.org/2000/svg","line");
        svg.setAttribute('width', '5');

        setLineDefaults(line);


        svg.addEventListener("mouseover", function( event ) {
		    line.setAttribute('stroke-dasharray', 'none');
		    line.setAttribute('stroke-width', '5');
		    line.setAttribute('opacity', '1');
		    offsetText(map);
		});
		svg.addEventListener("mouseout", function( event ) {
		    line.setAttribute('stroke-dasharray', '10, 5');
		    line.setAttribute('stroke-width', '3');
		    line.setAttribute('opacity', '0.7');
		});


        svg.appendChild(line);

        svg.setAttribute('class', classes);
        return [svg, line];
    };
    var drawText = function(date) {
    	var leftText, rightText, svg;

    	svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    	leftText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        rightText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svg.setAttribute('style','transform: translate(-100px,0);');
        svg.setAttribute('width', '200');
        rightText.append(document.createTextNode(wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', 1))));
        leftText.append(document.createTextNode(wv.util.toISOStringDate(date)));


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
        svgEl.setAttribute('stroke-dasharray', '10, 5');
        svgEl.setAttribute('stroke', 'white');
        svgEl.setAttribute('opacity', '0.7');
    };
    var setTextDefaults = function(svgEl, x) {
        svgEl.setAttribute('y', 10);
        svgEl.setAttribute('x', x);
        svgEl.setAttribute('fill', 'white');
        svgEl.setAttribute('stroke', 'black');
        svgEl.setAttribute('stroke-width', '0.5');
        svgEl.setAttribute('opacity', '1');
    };
    var positionTextVertically = function(textEl, y2) {
    	textEl.setAttribute('y', y2);
    };
    var drawDatelines = function(map, date) {
        var $obj1, $obj2, viewport, defaultCoord;
        
        defaultCoord = [-180, 90];
        obj1 = drawLines('dateline_left dateline');
        obj2 = drawLines('dateline_right dateline');
        line1 = obj1[1];
        line2 = obj2[1];
        svg1 = obj1[0];
        svg2 = obj2[0];
        overlay1 = drawOverlay(defaultCoord, obj1[0]);
        overlay2 = drawOverlay(defaultCoord, obj2[0]);
        textOverlay1 = drawOverlay(defaultCoord,drawText(date));
        textOverlay2 = drawOverlay(defaultCoord, drawText(wv.util.dateAdd(date, 'day', -1)));

        map.addOverlay(overlay1);
        map.addOverlay(overlay2);
        map.addOverlay(textOverlay1);
        map.addOverlay(textOverlay2);
    };
    var position = function(map) {
    	var extent, top, topY, bottomY, bottom, height, startY, ninetyDegreePixel, topExtent, bottomExtent, halfHeight, halfStart;

    	if(map.getSize()[0] === 0) {
    		return;
    	}
    	extent = map.getView().calculateExtent(map.getSize());
    	top = [extent[2] -1, extent[3]];
    	bottom = [extent[2] -1, extent[1]];
    	topExtent = map.getPixelFromCoordinate([extent[2] -1, extent[3] - 1]);
    	bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
    	topY = Math.round(topExtent[1]);
    	bottomY = Math.round(bottomExtent[1]);
    	startY = Math.round(extent[3]);

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
    	textOverlay1.setPosition([-180, halfStart]);
    	textOverlay2.setPosition([180,  halfStart]);
    	update(height);
    };
    var drawOverlay = function(coordinate, el) {
        var overlay = new ol.Overlay({
            element: el
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