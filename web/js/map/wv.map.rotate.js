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

var wv = wv || {};

wv.map = wv.map || {};
/*
 * @Class
 */
wv.map.rotate = wv.map.rotate || function(ui, models, map) {
    this.evts = wv.util.events();
    var model = models.map;
    this.intervalId = null;
    var self = this;


    /*
     * Initializes by triggering build methods 
     *
     * @method init
     * @static
     *
     * @param {object} map - openLayers map object
     *
     * @param {string} d - projection id string
     *
     * @returns {void}
     */
    this.init = function(map, id) {
        this.buildRotationWidget(map);
        this.setRotationEvents(map, id);
    };
    /*
     * Draws Rotation Widget
     *
     * @method createRotationWidget
     * @static
     *
     * @param {object} map - openLayers map object
     *
     * @returns {void}
     */
    this.buildRotationWidget = function(map) {
        var $map = $("#" + map.getTarget());
        var $rotateLeftButton = $("<button></button>")
            .addClass("wv-map-rotate-left wv-map-zoom")
            .attr("title","You may also rotate by holding Alt and dragging the mouse");
        var $lefticon = $("<i></i>").addClass("fa fa-undo");

        var $rotateRightButton = $("<button></button>")
            .addClass("wv-map-rotate-right wv-map-zoom")
            .attr("title","You may also rotate by holding Alt and dragging the mouse");
        var $righticon = $("<i></i>").addClass("fa fa-repeat");

        var $resetButton = $("<button></button>")
            .addClass("wv-map-reset-rotation wv-map-zoom")
            .attr("title", "Click to reset")
            .attr("style", "width: 43px");

        $rotateLeftButton.append($lefticon);
        $rotateRightButton.append($righticon);
        $map.append($rotateLeftButton).append($resetButton).append($rotateRightButton);
    };
    /*
     * Applies Jquery click events to rotation-widget
     *
     * @method setRotationEvents
     * @static
     *
     * @param {object} map - openLayers map object
     *
     * @param {string} d - projection id string
     *
     * @returns {void}
     */
    this.setRotationEvents = function(map, id) {
        var dur = 500;
        var $leftButton = $('#wv-map-' + id + ' .wv-map-rotate-left');
        var $rightButton = $('#wv-map-' + id + ' .wv-map-rotate-right');
        var $resetButton = $('#wv-map-' + id + ' .wv-map-reset-rotation');

        //Set buttons to animate rotation by 18 degrees. use setInterval to repeat the rotation when mouse button is held
        $leftButton.button({
            text: false
        }).mousedown(function() {
          self.intervalId = setInterval(function() {
              self.rotate(10, dur, map);
          }, dur);
          self.rotate(10, dur, map);

        })
        .mouseup(function() {
            clearInterval(self.intervalId);
        });

        $rightButton.button({
            text: false
        }).mousedown(function() {
            self.intervalId = setInterval(function() {
                self.rotate(-10, dur, map);
            }, dur);
            self.rotate(-10, dur, map);

        }).mouseup(function() {
            clearInterval(self.intervalId);
        });

        $resetButton.button({
            label: Number(models.map.rotation * (180/Math.PI)).toFixed()
        }).mousedown(function() { //reset rotation
            clearInterval(self.intervalId); //stop repeating rotation on mobile
            map.getView().animate({
                duration: 500,
                rotation: 0
            });

            $resetButton.button("option", "label", "0");
        });
    };


    /*
     * Called as event listener when map is rotated. Update url to reflect rotation reset
     *
     * @method updateRotation
     * @static
     *
     * @returns {void}
     */
    this.updateRotation = function() {
        var deg, radians, view;
        view = ui.selected.getView();
        radians = view.getRotation();
        deg = radians * (180.0 / Math.PI);
        models.map.rotation = radians;
        self.setResetButton(deg);
        model.update();
    };


    /*
     * examines the number of characters present in the 
     * reset button and reassigns padding accordingly
     *
     * @method setResetButtonWidth
     * @static
     *
     * @param {number} deg - map rotation degree value
     *
     * @returns {void}
     */
    this.setResetButton = function(deg) {
        var button = $(".wv-map-reset-rotation");
        //Set reset button content
        button.button("option", "label", Number(deg).toFixed());
        switch (true) {
            case (deg >= 100.0):
                button.find("span").attr("style","padding-left: 9px");
                break;
            case(deg <= -100.0):
                button.find("span").attr("style","padding-left: 6px");
                break;
            case(deg <= -10.0):
                button.find("span").attr("style","padding-left: 10px");
                break;
            default:
                button.find("span").attr("style","padding-left: 14px");
                break;
        }
    };

    /*
     * Called as event listener when map is rotated. Update url to reflect rotation reset
     *
     * @method rotate
     * @static
     *
     * @param {number} amount - value of degrees to rotate
     *
     * @param {number} duration - how long the animation should last
     *
     * @param {object} map - openLayers map object
     *
     * @returns {void}
     */
    this.rotate = function(amount, duration, map) {
        
        var currentDeg = (map.getView().getRotation() * (180.0 / Math.PI));
        if(Math.abs(currentDeg) === 360){
            map.getView().setRotation(0);
        } else if(Math.abs(currentDeg) >= 360) {
            var newNadVal = ((360 - Math.abs(currentDeg)) * (Math.PI/180));
            if(currentDeg < 0) {
                map.getView().setRotation(newNadVal);
            } else {
                map.getView().setRotation(-newNadVal);
            }
        }
        map.getView().animate({
            rotation: map.getView().getRotation() - (Math.PI / amount),
            duration: duration,
        });
    };
};

