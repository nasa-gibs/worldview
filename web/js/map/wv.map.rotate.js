var wv = wv || {};
wv.map = wv.map || {};

wv.map.rotate = wv.map.rotate || function(ui, models, map) {
  console.log('whatt')
  this.evt = wv.util.events();
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
        var self = this;
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

        var intervalId, dur = 500;

        //Set buttons to animate rotation by 18 degrees. use setInterval to repeat the rotation when mouse button is held
        $left.button({
            text: false
        }).mousedown(function() {
            self.rotate(10, dur, map);
            intervalId = setInterval(function() {
                self.rotate(10, dur, map);
            }, dur);
        }).mouseup(function() {
            clearInterval(intervalId);
        });

        $right.button({
            text: false
        }).mousedown(function() {
            self.rotate(-10, dur, map);
            intervalId = setInterval(function() {
                self.rotate(-10, dur, map);
            }, dur);
        }).mouseup(function() {
            clearInterval(intervalId);
        });

        $mid.button({
            label: Number(models.map.rotation * (180/Math.PI)).toFixed()
        }).mousedown(function() { //reset rotation
            clearInterval(intervalId); //stop repeating rotation on mobile
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

        window.history.replaceState("", "@OFFICIAL_NAME@","?" + models.link.toQueryString());
        deg = ((radians) * (180.0 / Math.PI));

        if(Math.abs(deg) >= 360) {
          
            if(radians > 0) {
                this.evt.trigger('rotate-left-max')
            } else {
                this.evt.trigger('rotate-right-max')
            } 
            models.map.rotation = radians;
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

    this.rotate = function(amount, duration, map) {
        map.beforeRender(ol.animation.rotate({
            duration: duration,
            rotation: map.getView().getRotation()
        }));

        map.getView().rotate(map.getView().getRotation() - (Math.PI / amount));
    }
}

