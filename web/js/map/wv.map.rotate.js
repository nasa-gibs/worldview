var wv = wv || {};

wv.map = wv.map || {};
/*
 * class that 
 *
 * @Class wv.map.rotate
 *
 * @param ui
 *
 */
wv.map.rotate = wv.map.rotate || function(ui, models, map) {
    this.evts = wv.util.events();
    this.intervalId;
    var self = this;


    /*
     * Initializes by triggering build methods 
     *
     * @method init
     * @static
     *
     * @param {object} openLayers map object
     *
     *
     * @returns {void}
     */
    this.init = function(map) {
        this.buildRotationWidget(map);
        this.setRotationEvents(map)
    }
    /*
     * Draws Rotation Widget
     *
     * @method createRotationWidget
     * @static
     *
     * @param {object} openLayers map object
     *
     *
     * @returns {void}
     */
    this.buildRotationWidget = function(map) {
        var $map = $("#" + map.getTarget());

        this.rotateLeftButton = $("<button></button>")
            .addClass("wv-map-rotate-left wv-map-zoom")
                .attr("title","You may also rotate by holding Alt and dragging the mouse"),
            $lefticon = $("<i></i>")
                .addClass("fa fa-undo");

        this.rotateRightButton = $("<button></button>")
            .addClass("wv-map-rotate-right wv-map-zoom")
            .attr("title","You may also rotate by holding Alt and dragging the mouse"),
            $righticon = $("<i></i>")
                .addClass("fa fa-repeat");

        this.resetButton = $("<button></button>")
            .addClass("wv-map-reset-rotation wv-map-zoom")
            .attr("title", "Click to reset")
            .attr("style", "width: 43px");

        this.rotateLeftButton.append($lefticon);
        this.rotateRightButton.append($righticon);
        $map.append(this.rotateLeftButton).append(this.resetButton).append(this.rotateRightButton);
    }
    /*
     * Applies Jquery click events to rotation-widget
     *
     * @method setRotationEvents
     * @static
     *
     * @param {object} openLayers map object
     *
     *
     * @returns {void}
     */
    this.setRotationEvents = function(map) {
        var dur = 500;

        var clickManager = function(el, rotation) {
            el.unbind('mousedown')
            self.rotate(rotation, dur, map);
            setTimeout(function() {
                el.bind('mousedown', function() {
                    clickManager(el, rotation)
                })
            }, dur + 10);
        }
        //Set buttons to animate rotation by 18 degrees. use setInterval to repeat the rotation when mouse button is held
        this.rotateLeftButton.button({
            text: false
        }).bind('mousedown', function() {
          self.intervalId = setInterval(function() {
              self.rotate(10, dur, map);
          }, dur);
          clickManager(self.rotateLeftButton, 10);

        })
        .mouseup(function() {
            clearInterval(self.intervalId);
        });

        this.rotateRightButton.button({
            text: false
        }).bind('mousedown', function() {
            self.intervalId = setInterval(function() {
                self.rotate(-10, dur, map);
            }, dur);
            clickManager(self.rotateRightButton, -10);
        }).mouseup(function() {
            clearInterval(self.intervalId);
        });

        this.resetButton.button({
            label: Number(models.map.rotation * (180/Math.PI)).toFixed()
        }).mousedown(function() { //reset rotation
            clearInterval(self.intervalId); //stop repeating rotation on mobile
            map.beforeRender(ol.animation.rotate({
                duration: 500,
                rotation: map.getView().getRotation()
            }));
            map.getView().rotate(0);

            self.resetButton.button("option", "label", "0");
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
        var deg, radians;
        radians = ui.selected.getView().getRotation();
        models.map.rotation = radians;

        window.history.replaceState("", "@OFFICIAL_NAME@","?" + models.link.toQueryString());
        deg = ((radians) * (180.0 / Math.PI));

        if(Math.abs(deg) >= 360) {
            clearInterval(self.intervalId);
            if(deg > 0) {
                self.evts.trigger('rotate-right-max');
            } else {
                self.evts.trigger('rotate-left-max');
            }   
        } else {
            self.evts.trigger('remove-freeze');
        }        
        self.setResetButton(deg)
    };


    /*
     * examines the number of characters present in the reset button and reassigns padding accordingly
     *
     * @method setResetButtonWidth
     * @static
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
    }

    /*
     * Called as event listener when map is rotated. Update url to reflect rotation reset
     *
     * @method rotate
     * @static
     *
     * @returns {void}
     */
    this.rotate = function( amount, duration, map) {
        map.beforeRender(ol.animation.rotate({
            duration: duration,
            rotation: map.getView().getRotation()
        }));

        map.getView().rotate(map.getView().getRotation() - (Math.PI / amount));
    }


    /*
     * Adds 'freeze' class to rotate button that has reached it's limit
     *
     * @method freezeClick
     * @static
     *
     * @returns {void}
     */
    this.freezeClick = function( className ) {
        $('.' + className).addClass('ui-button-click-prevent');
    }


    /*
     * Removes freeze class to rotate button that has reached it's limit
     *
     * @method freezeClick
     * @static
     *
     * @returns {void}
     */
    this.removeFreeze = function() {
        var freezeEl = $('.wv-map-zoom.ui-button-click-prevent');
        if(freezeEl) {
            freezeEl.removeClass('ui-button-click-prevent');
        }
    }
}

