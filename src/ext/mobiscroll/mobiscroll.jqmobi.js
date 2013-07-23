/*jslint eqeq: true, plusplus: true, undef: true, sloppy: true, vars: true, forin: true */
if (!window['jQuery']) {

    var jQuery = jq;

    (function ($) {
        var document = window.document,
            classSelectorRE = /^\.([\w-]+)$/,
            idSelectorRE = /^#([\w-]+)$/,
            tagSelectorRE = /^[\w-]+$/,
            tempParent = document.createElement('div'),
            emptyArray = [],
            slice = emptyArray.slice;

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function matches(element, selector) {
            if (!element || element.nodeType !== 1) {
                return false;
            }

            var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                                  element.oMatchesSelector || element.matchesSelector;

            if (matchesSelector) {
                return matchesSelector.call(element, selector)
            }
            // fall back to performing a selector:
            var match, parent = element.parentNode, temp = !parent
            if (temp) (parent = tempParent).appendChild(element)
            match = ~qsa(parent, selector).indexOf(element)
            temp && tempParent.removeChild(element)
            return match
        }

        function qsa(element, selector){
            var found
            return (element === document && idSelectorRE.test(selector)) ?
            ( (found = element.getElementById(RegExp.$1)) ? [found] : emptyArray ) :
            (element.nodeType !== 1 && element.nodeType !== 9) ? emptyArray :
            slice.call(
                classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
                tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
                element.querySelectorAll(selector)
                )
        }

        function camelize(str) {
            return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
        }

        ['width', 'height'].forEach(function(dimension){
            $.fn[dimension] = function(value){

                var body = document.body,
                    html = document.documentElement,
                    offset, Dimension = dimension.replace(/./, function(m){return m[0].toUpperCase()})
                if (value === undefined) return this[0] == window ? document.documentElement['client' + Dimension] :
                    this[0] == document ? Math.max(body['scroll' + Dimension], body['offset' + Dimension], html['client' + Dimension], html['scroll' + Dimension], html['offset' + Dimension]) : //document.documentElement['offset' + Dimension] :
                    (offset = this.offset()) && offset[dimension]
                else return this.each(function(idx){
                    var el = $(this)
                    el.css(dimension, value)
                })
            }
        });

        ['width', 'height'].forEach(function(dimension) {
            var offset, Dimension = dimension.replace(/./, function(m) {return m[0].toUpperCase()});
            $.fn['outer' + Dimension] = function(margin) {
                var elem = this;
                if (elem) {
                    var size = elem[0]['offset' + Dimension];
                    var sides = {'width': ['left', 'right'], 'height': ['top', 'bottom']};
                    sides[dimension].forEach(function(side) {
                        if (margin) size += parseInt(elem.css(camelize('margin-' + side)), 10);
                    });
                    return size;
                }
                else {
                    return null;
                }
            };
        });

        ["Left", "Top"].forEach(function(name, i) {
            var method = "scroll" + name;
            function isWindow( obj ) {
                return obj && typeof obj === "object" && "setInterval" in obj;
            }
            function getWindow( elem ) {
                return isWindow( elem ) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
            }

            $.fn[method] = function( val ) {
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
                this.each(function() {
                    win = getWindow(this);
                    if (win) {
                        var xCoord = !i ? val : $(win).scrollLeft();
                        var yCoord = i ? val : $(win).scrollTop();
                        win.scrollTo(xCoord, yCoord);
                    }
                    else {
                        this[method] = val;
                    }
                });
            }
        });

        $.fn.is = function (selector) {
            return this.length > 0 && matches(this[0], selector);
        };

        $.fn.prop = function (name, value) {
            return (value === undefined) ? (this[0] ? this[0][name] : undefined) : this.each(function (idx) { this[name] = value; });
        };

        $.fn.focus = function (handler) {
            if (handler === undefined) {
                $(this).trigger('focus');
            } else {
                $(this).bind('focus', handler);
            }
        };

        $.fn.blur = function (handler) {
            if (handler === undefined) {
                $(this).trigger('blur');
            } else {
                $(this).bind('blur', handler);
            }
        };

        $.fn.click = function (handler) {
            if (handler === undefined) {
                $(this).trigger('click');
            } else {
                $(this).bind('click', handler);
            }
        };

        $.fn.eq = function (i) {
            return $($(this).get(i));
        };

        $.fn.index = function (element) {
            return element ? this.indexOf($(element)[0]) : this.length ? this.parent().children().indexOf(this[0]) : -1;
        };

        $.fn.slice = function () {
            return $(slice.apply(this, arguments));
        };

        $.fn.before = function (elm) {
            $(elm).insertBefore(this);
            return this;
        };

        $.fn.appendTo = function (elm) {
            $(elm).append(this);
            return this;
        };

        $.fn.pluck = function (property) {
            return this.map(function () { return this[property]; });
        };

        $.fn.prev = function () {
            var p = this.pluck('previousElementSibling');
            return p[0][0] ? $(p[0]) : $([]);
        };

        $.fn.next = function () {
            var n = this.pluck('nextElementSibling');
            return n[0][0] ? $(n[0]) : $([]);
        };

        $.inArray = function (value, array, fromIndex) {
            var i = fromIndex || 0;
            while (i < array.length) {
                if (array[i++] == value) {
                    return --i;
                }
            }
            return -1;
        };

        $.isPlainObject = function (v) {
            return $.isObject(v);
        };

        $.fn._css = $.fn.css;
        $.fn.css = function (attr, val, obj) {
            if ($.isObject(attr)) {
                var i;
                for (i in attr) {
                    $(this)._css(i, isNumeric(attr[i]) ? attr[i] + 'px' : attr[i], obj);
                }
                return this;
            } else {
                return $(this)._css(attr, isNumeric(val) ? val + 'px' : val, obj);
            }
        };

        $._extend = $.extend;
        $.extend = function () {
            arguments[0] = arguments[0] || {};
            return $._extend.apply(this, arguments);
        };

    })(jQuery);

}
