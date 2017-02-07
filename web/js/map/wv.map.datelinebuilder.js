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
	var line1, line2, hiddenLine1, hiddenLine2, map, overlay1, overlay2, svg1, svg2, moving, lineBeingHovered;

	self.init = function(Parent, olMap, date) {
		map = olMap;
        drawDatelines(map, date);

        Parent.events.on('moveend', function() {
            if(lineBeingHovered) {
                toggleLineOpactiy(lineBeingHovered, '0.5');
            }
			position(map);
        });
        Parent.events.on('drag', function() {
			position(map);
        });
        Parent.events.on('movestart', function() {
            if(lineBeingHovered) {
                toggleLineOpactiy(lineBeingHovered, '0');
            }
        });
    };

    var drawLines = function(classes, map) {
        var svg, line, hiddenLine;
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        line = document.createElementNS("http://www.w3.org/2000/svg","line");
        hiddenLine = document.createElementNS("http://www.w3.org/2000/svg","line");
        svg.setAttribute('width', '10');
        svg.setAttribute('style', 'padding: 0 40px 0 40px; transform: translateX(-43px);');

        setLineDefaults(line, 6);
        setHiddenLineDefaults(hiddenLine, 6);
        svg.appendChild(line);
        svg.appendChild(hiddenLine);
        svg.setAttribute('class', classes);

        return [svg, line, hiddenLine];
    };
    var toggleLineOpactiy = function(svgEL, opacity) {
        svgEL.setAttribute('opacity', opacity);
    };
    var drawText = function(date) {
        var leftText, rightText, svg, rightBG, leftBG, x1, x2, textWidth, textHeight, recRadius;

        x1 = 45;
        x2 = 155;
        textWidth = 80;
        textHeight = 20;
        recRadius = 3;

        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        leftText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        rightText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        rightBG = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        leftBG = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        rightBG.setAttribute('fill','rgba(40,40,40,0.5)');
        leftBG.setAttribute('fill','rgba(40,40,40,0.5)');
        rightBG.setAttribute('width', textWidth);
        leftBG.setAttribute('width', textWidth);
        rightBG.setAttribute('height', textHeight);
        leftBG.setAttribute('height', textHeight);
        rightBG.setAttribute('x', x2);
        leftBG.setAttribute('x', x1);
        rightBG.setAttribute('rx', recRadius);
        leftBG.setAttribute('ry', recRadius);

        svg.setAttribute('style','transform: translate(-140px,0);');
        svg.setAttribute('class', 'dateline-text');
        svg.setAttribute('width', '300');
        svg.setAttribute('class', 'dateline-text hidden');
        svg.appendChild(leftBG);
        svg.appendChild(rightBG);
        leftText.appendChild(document.createTextNode(wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', 1))));
        rightText.appendChild(document.createTextNode(wv.util.toISOStringDate(date)));

        setTextDefaults(rightText, x2 + 3);
        setTextDefaults(leftText, x1 + 3);

        svg.appendChild(rightText);
        svg.appendChild(leftText);

        return svg;
    };
    var setLineDefaults = function(svgEl, strokeWidth) {
        var offset = strokeWidth / 2;
        svgEl.setAttribute('x1', offset);
        svgEl.setAttribute('x2', offset);
        svgEl.setAttribute('y1', '0');
        svgEl.setAttribute('y2', '0');
        svgEl.setAttribute('opacity', '0');
        svgEl.setAttribute('stroke-width', strokeWidth);
        svgEl.setAttribute('stroke-dasharray', '10, 5');
        svgEl.setAttribute('stroke', 'white');
    };
    var setHiddenLineDefaults = function(svgEl, strokeWidth) {
        var offset = strokeWidth / 2;
        svgEl.setAttribute('x1', offset);
        svgEl.setAttribute('x2', offset);
        svgEl.setAttribute('y1', '0');
        svgEl.setAttribute('y2', '0');
        svgEl.setAttribute('opacity', '0');
        svgEl.setAttribute('stroke-width', strokeWidth);
        svgEl.setAttribute('stroke', 'white');

    };
    var setTextDefaults = function(svgEl, x) {
        svgEl.setAttribute('y', 14);
        svgEl.setAttribute('x', x);
        svgEl.setAttribute('fill', 'white');
        svgEl.setAttribute('opacity', '0.7');
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
        hiddenLine1 = obj1[2];
        hiddenLine2 = obj2[2];
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

        setListeners(svg1, textSvg1, textOverlay1, -180, hiddenLine1);
        setListeners(svg2, textSvg2, textOverlay2, 180, hiddenLine2);
    };
    var setListeners = function(lineSVG, textSVG, overlay, lineX, hidden) {
        var line = lineSVG.childNodes[0];
        var pixels, coords;
        lineSVG.addEventListener("mouseover", function(e) {
            pixels =  [e.pageX,e.pageY];
            coords = map.getCoordinateFromPixel(pixels);
            line.setAttribute('opacity', '0.5');
            overlay.setPosition([lineX, coords[1]]);
            lineBeingHovered = line;
        });
        lineSVG.addEventListener("mousemove", function(e) {
            pixels =  [e.pageX,e.pageY];
            coords = map.getCoordinateFromPixel(pixels);
            overlay.setPosition([lineX, coords[1]]);
        });
        lineSVG.addEventListener("mouseout", function( event ) {
            line.setAttribute('opacity', '0');
            lineBeingHovered = false;
        });
        hidden.addEventListener("mouseover", function(e) {
            textSVG.setAttribute('class', 'dateline-text');
        });
        hidden.addEventListener("mouseout", function(e) {
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
        height = Math.round(Math.abs(bottomY - topY));
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
        hiddenLine1.setAttribute('y2', height);
        hiddenLine2.setAttribute('y2', height);
        svg1.setAttribute('height', height);
        svg2.setAttribute('height', height);
    };
    return self;
};