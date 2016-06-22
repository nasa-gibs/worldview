var wv = wv || {};
wv.map = wv.map || {};

wv.map.rotate = wv.map.rotate || function(ui, models, map) {
    this.evts = wv.util.events();
    this.intervalId;
    var self = this;
    /*
     * Draws Rotation Widget
     *
     * @method createRotationWidget
     * @static
     *
     * @param map
     *
     */
    this.createRotationWidget = function(map) {
        var $map = $("#" + map.getTarget());

        var $left = $("<button></button>")
            .addClass("wv-map-rotate-left wv-map-zoom")
                .attr("title","You may also rotate by holding Alt and dragging the mouse"),
            $lefticon = $("<i></i>")
                .addClass("fa fa-undo");

        var $right = $("<button></button>")
            .addClass("wv-map-rotate-right wv-map-zoom")
            .attr("title","You may also rotate by holding Alt and dragging the mouse"),
            $righticon = $("<i></i>")
                .addClass("fa fa-repeat");

        var $mid = $("<button></button>")
            .addClass("wv-map-reset-rotation wv-map-zoom")
            .attr("title", "Click to reset")
            .attr("style", "width: 43px");

        $left.append($lefticon); $right.append($righticon);
        $map.append($left).append($mid).append($right);

        var dur = 500;

        var clickManager = function(el, rotation) {
            el.unbind('mousedown')
            self.rotate(rotation, dur, map);
            setTimeout(function() {
                el.bind('mousedown', function() {
                    clickManager(el, rotation)
                })
            }, dur + 25);
        }
        //Set buttons to animate rotation by 18 degrees. use setInterval to repeat the rotation when mouse button is held
        $left.button({
            text: false
        }).bind('mousedown', function() {
          self.intervalId = setInterval(function() {
              self.rotate(10, dur, map);
          }, dur);
          clickManager($left, 10);

        })
        .mouseup(function() {
            clearInterval(self.intervalId);
        });

        $right.button({
            text: false
        }).bind('mousedown', function() {
            self.intervalId = setInterval(function() {
                self.rotate(-10, dur, map);
            }, dur);
            clickManager($right, -10);
        }).mouseup(function() {
            clearInterval(self.intervalId);
        });

        $mid.button({
            label: Number(models.map.rotation * (180/Math.PI)).toFixed()
        }).mousedown(function() { //reset rotation
            clearInterval(self.intervalId); //stop repeating rotation on mobile
            map.beforeRender(ol.animation.rotate({
                duration: 500,
                rotation: map.getView().getRotation()
            }));
            map.getView().rotate(0);

            $mid.button("option", "label", "0");
        });
    };


    //Called as event listener when map is rotated. Update url to reflect rotation reset
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
        //Set reset button content and proper CSS styling to position it correctly
        $(".wv-map-reset-rotation").button("option", "label", Number(deg).toFixed() );

        if(deg >= 100.0)
            $(".wv-map-reset-rotation").find("span").attr("style","padding-left: 9px");
        else if(deg <= -100.0)
            $(".wv-map-reset-rotation").find("span").attr("style","padding-left: 6px");
        else if(deg <= -10.0)
            $(".wv-map-reset-rotation").find("span").attr("style","padding-left: 10px");
        else
            $(".wv-map-reset-rotation").find("span").attr("style","padding-left: 14px");
    };

    this.rotate = function( amount, duration, map) {
        map.beforeRender(ol.animation.rotate({
            duration: duration,
            rotation: map.getView().getRotation()
        }));

        map.getView().rotate(map.getView().getRotation() - (Math.PI / amount));
    }
    this.freezeClick = function( className ) {
        $('.' + className).addClass('ui-button-click-prevent');
    }
    this.removeFreeze = function() {
        var freezeEl = $('.wv-map-zoom.ui-button-click-prevent');
        if(freezeEl) {
            freezeEl.removeClass('ui-button-click-prevent');
        }
    }
}

