/*jslint eqeq: true, plusplus: true, undef: true, sloppy: true, vars: true, forin: true */
if (!window['jQuery']) {
    
    var jQuery = Zepto;
    
    (function ($) {
        
        ['width', 'height'].forEach(function(dimension){
            $.fn[dimension] = function(value){
                var body = document.body,
                    html = document.documentElement,
                    offset, Dimension = dimension.replace(/./, function(m){return m[0].toUpperCase()})
                if (value === undefined) return this[0] == window ? html['client' + Dimension] :
                    this[0] == document ? Math.max(body['scroll' + Dimension], body['offset' + Dimension], html['client' + Dimension], html['scroll' + Dimension], html['offset' + Dimension]) :
                    (offset = this.offset()) && offset[dimension]
                else return this.each(function(idx){
                    var el = $(this)
                    el.css(dimension, value)
                })
            }
        });
    
        ['width', 'height'].forEach(function (dimension) {
            var offset, Dimension = dimension.replace(/./, function (m) { return m[0].toUpperCase(); });
            $.fn['outer' + Dimension] = function (margin) {
                var elem = this;
                if (elem) {
                    var size = elem[0]['offset' + Dimension],
                        sides = {'width': ['left', 'right'], 'height': ['top', 'bottom']};
                    sides[dimension].forEach(function (side) {
                        if (margin) {
                            size += parseInt(elem.css('margin-' + side), 10);
                        }
                    });
                    return size;
                } else {
                    return null;
                }
            };
        });
    
        ["Left", "Top"].forEach(function (name, i) {
            var method = "scroll" + name;
    
            function isWindow(obj) {
                return obj && typeof obj === "object" && "setInterval" in obj;
            }
    
            function getWindow(elem) {
                return isWindow(elem) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
            }
    
            $.fn[method] = function (val) {
                var elem, win;
                if (val === undefined) {
                    elem = this[0];
                    if (!elem) {
                        return null;
                    }
                    win = getWindow(elem);
                    // Return the scroll offset
                    return win ? ("pageXOffset" in win) ? win[i ? "pageYOffset" : "pageXOffset"] :
                            win.document.documentElement[method] ||
                            win.document.body[method] :
                            elem[method];
                }
    
                // Set the scroll offset
                this.each(function () {
                    win = getWindow(this);
                    if (win) {
                        var xCoord = !i ? val : $(win).scrollLeft(),
                            yCoord = i ? val : $(win).scrollTop();
                        win.scrollTo(xCoord, yCoord);
                    } else {
                        this[method] = val;
                    }
                });
            };
        });
        
        // Fix zepto.js extend to work with undefined parameter
        $._extend = $.extend;
        $.extend = function () {
            arguments[0] = arguments[0] || {};
            return $._extend.apply(this, arguments);
        };
    
    })(jQuery);

}