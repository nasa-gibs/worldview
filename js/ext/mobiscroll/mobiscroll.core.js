/*jslint eqeq: true, plusplus: true, undef: true, sloppy: true, vars: true, forin: true, nomen: true */
/*!
 * jQuery MobiScroll v2.6.0
 * http://mobiscroll.com
 *
 * Copyright 2010-2013, Acid Media
 * Licensed under the MIT license.
 *
 */
(function ($) {

    function Scroller(elem, settings) {
        var m,
            hi,
            v,
            dw,
            ww, // Window width
            wh, // Window height
            rwh,
            mw, // Modal width
            mh, // Modal height
            anim,
            debounce,
            theme,
            lang,
            click,
            scrollable,
            moved,
            start,
            startTime,
            stop,
            p,
            min,
            max,
            target,
            index,
            timer,
            readOnly,
            that = this,
            ms = $.mobiscroll,
            e = elem,
            elm = $(e),
            s = extend({}, defaults),
            pres = {},
            iv = {},
            pos = {},
            pixels = {},
            wheels = [],
            input = elm.is('input'),
            visible = false,
            onStart = function (e) {
                // Scroll start
                if (testTouch(e) && !move && !isReadOnly(this) && !click) {
                    // Prevent scroll
                    e.preventDefault();

                    move = true;
                    scrollable = s.mode != 'clickpick';
                    target = $('.dw-ul', this);
                    setGlobals(target);
                    moved = iv[index] !== undefined; // Don't allow tap, if still moving
                    p = moved ? getCurrentPosition(target) : pos[index];
                    start = getCoord(e, 'Y');
                    startTime = new Date();
                    stop = start;
                    scroll(target, index, p, 0.001);

                    if (scrollable) {
                        target.closest('.dwwl').addClass('dwa');
                    }

                    $(document).bind(MOVE_EVENT, onMove).bind(END_EVENT, onEnd);
                }
            },
            onMove = function (e) {
                if (scrollable) {
                    e.preventDefault();
                    e.stopPropagation();
                    stop = getCoord(e, 'Y');
                    scroll(target, index, constrain(p + (start - stop) / hi, min - 1, max + 1));
                }
                moved = true;
            },
            onEnd = function (e) {
                var time = new Date() - startTime,
                    val = constrain(p + (start - stop) / hi, min - 1, max + 1),
                    speed,
                    dist,
                    tindex,
                    ttop = target.offset().top;

                if (time < 300) {
                    speed = (stop - start) / time;
                    dist = (speed * speed) / s.speedUnit;
                    if (stop - start < 0) {
                        dist = -dist;
                    }
                } else {
                    dist = stop - start;
                }

                tindex = Math.round(p - dist / hi);

                if (!dist && !moved) { // this is a "tap"
                    var idx = Math.floor((stop - ttop) / hi),
                        li = $('.dw-li', target).eq(idx),
                        hl = scrollable;

                    if (event('onValueTap', [li]) !== false) {
                        tindex = idx;
                    } else {
                        hl = true;
                    }

                    if (hl) {
                        li.addClass('dw-hl'); // Highlight
                        setTimeout(function () {
                            li.removeClass('dw-hl');
                        }, 200);
                    }
                }

                if (scrollable) {
                    calc(target, tindex, 0, true, Math.round(val));
                }

                move = false;
                target = null;

                $(document).unbind(MOVE_EVENT, onMove).unbind(END_EVENT, onEnd);
            },
            onBtnStart = function (e) {
                $(document).bind(END_EVENT, onBtnEnd);
                // Active button
                if (!$(this).hasClass('dwb-d')) {
                    $(this).addClass('dwb-a');
                }
                // +/- buttons
                if ($(this).hasClass('dwwb')) {
                    var w = $(this).closest('.dwwl');
                    if (testTouch(e) && !isReadOnly(w) && !w.hasClass('dwa')) {
                        e.stopPropagation();
                        e.preventDefault();
                        click = true;
                        // + Button
                        var t = w.find('.dw-ul'),
                            func = $(this).hasClass('dwwbp') ? plus : minus;

                        setGlobals(t);
                        clearInterval(timer);
                        timer = setInterval(function () { func(t); }, s.delay);
                        func(t);
                    }
                }
            },
            onBtnEnd = function (e) {
                if (click) {
                    clearInterval(timer);
                    click = false;
                }
                $(document).unbind(END_EVENT, onBtnEnd);
                $('.dwb-a', dw).removeClass('dwb-a');
            },
            onScroll = function (e) {
                if (!isReadOnly(this)) {
                    e.preventDefault();
                    e = e.originalEvent;
                    var delta = e.wheelDelta ? (e.wheelDelta / 120) : (e.detail ? (-e.detail / 3) : 0),
                        t = $('.dw-ul', this);

                    setGlobals(t);
                    calc(t, Math.round(pos[index] - delta), delta < 0 ? 1 : 2);
                }
            };

        // Private functions

        function isReadOnly(wh) {
            if ($.isArray(s.readonly)) {
                var i = $('.dwwl', dw).index(wh);
                return s.readonly[i];
            }
            return s.readonly;
        }

        function generateWheelItems(i) {
            var html = '<div class="dw-bf">',
                ww = wheels[i],
                w = ww.values ? ww : convert(ww),
                l = 1,
                values = w.values,
                keys = w.keys || values;

            $.each(values, function (j, v) {
                if (l % 20 == 0) {
                    html += '</div><div class="dw-bf">';
                }
                html += '<div class="dw-li dw-v" data-val="' + keys[j] + '" style="height:' + hi + 'px;line-height:' + hi + 'px;"><div class="dw-i">' + v + '</div></div>';
                l++;
            });

            html += '</div>';
            return html;
        }

        function setGlobals(t) {
            min = $('.dw-li', t).index($('.dw-v', t).eq(0));
            max = $('.dw-li', t).index($('.dw-v', t).eq(-1));
            index = $('.dw-ul', dw).index(t);
        }

        function formatHeader(v) {
            var t = s.headerText;
            return t ? (typeof t === 'function' ? t.call(e, v) : t.replace(/\{value\}/i, v)) : '';
        }

        function read() {
            that.temp = ((input && that.val !== null && that.val != elm.val()) || that.values === null) ? s.parseValue(elm.val() || '', that) : that.values.slice(0);
            setVal();
        }

        function getCurrentPosition(t) {
            var style = window.getComputedStyle ? getComputedStyle(t[0]) : t[0].style,
                matrix,
                px;

            if (has3d) {
                $.each(['t', 'webkitT', 'MozT', 'OT', 'msT'], function (i, v) {
                    if (style[v + 'ransform'] !== undefined) {
                        matrix = style[v + 'ransform'];
                        return false;
                    }
                });
                matrix = matrix.split(')')[0].split(', ');
                px = matrix[13] || matrix[5];
            } else {
                px = style.top.replace('px', '');
            }

            return Math.round(m - (px / hi));
        }

        function ready(t, i) {
            clearTimeout(iv[i]);
            delete iv[i];
            t.closest('.dwwl').removeClass('dwa');
        }

        function scroll(t, index, val, time, active) {

            var px = (m - val) * hi,
                style = t[0].style,
                i;

            if (px == pixels[index] && iv[index]) {
                return;
            }

            if (time && px != pixels[index]) {
                // Trigger animation start event
                event('onAnimStart', [dw, index, time]);
            }

            pixels[index] = px;

            style[pr + 'Transition'] = 'all ' + (time ? time.toFixed(3) : 0) + 's ease-out';

            if (has3d) {
                style[pr + 'Transform'] = 'translate3d(0,' + px + 'px,0)';
            } else {
                style.top = px + 'px';
            }

            if (iv[index]) {
                ready(t, index);
            }

            if (time && active !== undefined) {
                t.closest('.dwwl').addClass('dwa');
                iv[index] = setTimeout(function () {
                    ready(t, index);
                }, time * 1000);
            }

            pos[index] = val;
        }

        function scrollToPos(time, index, manual, dir, active) {

            // Call validation event
            if (event('validate', [dw, index, time]) !== false) {

                // Set scrollers to position
                $('.dw-ul', dw).each(function (i) {
                    var t = $(this),
                        cell = $('.dw-li[data-val="' + that.temp[i] + '"]', t),
                        cells = $('.dw-li', t),
                        v = cells.index(cell),
                        l = cells.length,
                        sc = i == index || index === undefined;

                    // Scroll to a valid cell
                    if (!cell.hasClass('dw-v')) {
                        var cell1 = cell,
                            cell2 = cell,
                            dist1 = 0,
                            dist2 = 0;

                        while (v - dist1 >= 0 && !cell1.hasClass('dw-v')) {
                            dist1++;
                            cell1 = cells.eq(v - dist1);
                        }

                        while (v + dist2 < l && !cell2.hasClass('dw-v')) {
                            dist2++;
                            cell2 = cells.eq(v + dist2);
                        }

                        // If we have direction (+/- or mouse wheel), the distance does not count
                        if (((dist2 < dist1 && dist2 && dir !== 2) || !dist1 || (v - dist1 < 0) || dir == 1) && cell2.hasClass('dw-v')) {
                            cell = cell2;
                            v = v + dist2;
                        } else {
                            cell = cell1;
                            v = v - dist1;
                        }
                    }

                    if (!(cell.hasClass('dw-sel')) || sc) {
                        // Set valid value
                        that.temp[i] = cell.attr('data-val');

                        // Add selected class to cell
                        $('.dw-sel', t).removeClass('dw-sel');
                        cell.addClass('dw-sel');

                        // Scroll to position
                        scroll(t, i, v, sc ? time : 0.1, sc ? active : false);
                    }
                });

                // Reformat value if validation changed something
                v = s.formatResult(that.temp);
                if (s.display == 'inline') {
                    setVal(manual, 0, true);
                } else {
                    $('.dwv', dw).html(formatHeader(v));
                }

                if (manual) {
                    event('onChange', [v]);
                }
            }

        }

        function event(name, args) {
            var ret;
            args.push(that);
            $.each([theme.defaults, pres, settings], function (i, v) {
                if (v[name]) { // Call preset event
                    ret = v[name].apply(e, args);
                }
            });
            return ret;
        }

        function calc(t, val, dir, anim, orig) {
            val = constrain(val, min, max);

            var cell = $('.dw-li', t).eq(val),
                o = orig === undefined ? val : orig,
                idx = index,
                time = anim ? (val == o ? 0.1 : Math.abs((val - o) * s.timeUnit)) : 0;

            // Set selected scroller value
            that.temp[idx] = cell.attr('data-val');

            scroll(t, idx, val, time, orig);

            setTimeout(function () {
                // Validate
                scrollToPos(time, idx, true, dir, orig);
            }, 10);
        }

        function plus(t) {
            var val = pos[index] + 1;
            calc(t, val > max ? min : val, 1, true);
        }

        function minus(t) {
            var val = pos[index] - 1;
            calc(t, val < min ? max : val, 2, true);
        }

        function setVal(fill, time, noscroll, temp) {

            if (visible && !noscroll) {
                scrollToPos(time);
            }

            v = s.formatResult(that.temp);

            if (!temp) {
                that.values = that.temp.slice(0);
                that.val = v;
            }

            if (fill) {
                if (input) {
                    elm.val(v).trigger('change');
                }
            }
        }

        // Public functions

        that.position = function (check) {

            if (s.display == 'inline' || (ww === $(window).width() && rwh === $(window).height() && check) || (event('onPosition', [dw]) === false)) {
                return;
            }

            var w,
                l,
                t,
                aw, // anchor width
                ah, // anchor height
                ap, // anchor position
                at, // anchor top
                al, // anchor left
                arr, // arrow
                arrw, // arrow width
                arrl, // arrow left
                scroll,
                totalw = 0,
                minw = 0,
                st = $(window).scrollTop(),
                wr = $('.dwwr', dw),
                d = $('.dw', dw),
                css = {},
                anchor = s.anchor === undefined ? elm : s.anchor;

            ww = $(window).width();
            rwh = $(window).height();
            wh = window.innerHeight; // on iOS we need innerHeight
            wh = wh || rwh;

            if (/modal|bubble/.test(s.display)) {
                $('.dwc', dw).each(function () {
                    w = $(this).outerWidth(true);
                    totalw += w;
                    minw = (w > minw) ? w : minw;
                });
                w = totalw > ww ? minw : totalw;
                wr.width(w).css('white-space', totalw > ww ? '' : 'nowrap');
            }

            mw = d.outerWidth();
            mh = d.outerHeight(true);

            if (s.display == 'modal') {
                l = (ww - mw) / 2;
                t = st + (wh - mh) / 2;
            } else if (s.display == 'bubble') {
                scroll = true;
                arr = $('.dw-arrw-i', dw);
                ap = anchor.offset();
                at = ap.top;
                al = ap.left;

                // horizontal positioning
                aw = anchor.outerWidth();
                ah = anchor.outerHeight();
                l = al - (d.outerWidth(true) - aw) / 2;
                l = l > (ww - mw) ? (ww - (mw + 20)) : l;
                l = l >= 0 ? l : 20;

                // vertical positioning
                t = at - mh; // above the input
                if ((t < st) || (at > st + wh)) { // if doesn't fit above or the input is out of the screen
                    d.removeClass('dw-bubble-top').addClass('dw-bubble-bottom');
                    t = at + ah; // below the input
                } else {
                    d.removeClass('dw-bubble-bottom').addClass('dw-bubble-top');
                }

                // Calculate Arrow position
                arrw = arr.outerWidth();
                arrl = al + aw / 2 - (l + (mw - arrw) / 2);

                // Limit Arrow position
                $('.dw-arr', dw).css({ left: constrain(arrl, 0, arrw) });
            } else {
                css.width = '100%';
                if (s.display == 'top') {
                    t = st;
                } else if (s.display == 'bottom') {
                    t = st + wh - mh;
                }
            }

            css.top = t < 0 ? 0 : t;
            css.left = l;
            d.css(css);

            // If top + modal height > doc height, increase doc height
            $('.dw-persp', dw).height(0).height(t + mh > $(document).height() ? t + mh : $(document).height());

            // Scroll needed
            if (scroll && ((t + mh > st + wh) || (at > st + wh))) {
                $(window).scrollTop(t + mh - wh);
            }
        };

        /**
        * Enables the scroller and the associated input.
        */
        that.enable = function () {
            s.disabled = false;
            if (input) {
                elm.prop('disabled', false);
            }
        };

        /**
        * Disables the scroller and the associated input.
        */
        that.disable = function () {
            s.disabled = true;
            if (input) {
                elm.prop('disabled', true);
            }
        };

        /**
        * Gets the selected wheel values, formats it, and set the value of the scroller instance.
        * If input parameter is true, populates the associated input element.
        * @param {Array} values - Wheel values.
        * @param {Boolean} [fill=false] - Also set the value of the associated input element.
        * @param {Number} [time=0] - Animation time
        * @param {Boolean} [temp=false] - If true, then only set the temporary value.(only scroll there but not set the value)
        */
        that.setValue = function (values, fill, time, temp) {
            that.temp = $.isArray(values) ? values.slice(0) : s.parseValue.call(e, values + '', that);
            setVal(fill, time, false, temp);
        };

        that.getValue = function () {
            return that.values;
        };

        that.getValues = function () {
            var ret = [],
                i;

            for (i in that._selectedValues) {
                ret.push(that._selectedValues[i]);
            }
            return ret;
        };

        /**
        * Changes the values of a wheel, and scrolls to the correct position
        */
        that.changeWheel = function (idx, time) {
            if (dw) {
                var i = 0,
                    nr = idx.length;

                $.each(s.wheels, function (j, wg) {
                    $.each(wg, function (k, w) {
                        if ($.inArray(i, idx) > -1) {
                            wheels[i] = w;
                            $('.dw-ul', dw).eq(i).html(generateWheelItems(i));
                            nr--;
                            if (!nr) {
                                that.position();
                                scrollToPos(time, undefined, true);
                                return false;
                            }
                        }
                        i++;
                    });
                    if (!nr) {
                        return false;
                    }
                });
            }
        };

        /**
        * Return true if the scroller is currently visible.
        */
        that.isVisible = function () {
            return visible;
        };

        that.tap = function (el, handler) {
            var startX,
                startY;

            if (s.tap) {
                el.bind('touchstart', function (e) {
                    e.preventDefault();
                    startX = getCoord(e, 'X');
                    startY = getCoord(e, 'Y');
                }).bind('touchend', function (e) {
                    // If movement is less than 20px, fire the click event handler
                    if (Math.abs(getCoord(e, 'X') - startX) < 20 && Math.abs(getCoord(e, 'Y') - startY) < 20) {
                        handler.call(this, e);
                    }
                    tap = true;
                    setTimeout(function () {
                        tap = false;
                    }, 300);
                });
            }

            el.bind('click', function (e) {
                if (!tap) {
                    // If handler was not called on touchend, call it on click;
                    handler.call(this, e);
                }
            });

        };

        /**
        * Shows the scroller instance.
        * @param {Boolean} prevAnim - Prevent animation if true
        */
        that.show = function (prevAnim) {
            if (s.disabled || visible) {
                return false;
            }

            if (s.display == 'top') {
                anim = 'slidedown';
            }

            if (s.display == 'bottom') {
                anim = 'slideup';
            }

            // Parse value from input
            read();

            event('onBeforeShow', []);

            // Create wheels
            var l = 0,
                mAnim = '';

            if (anim && !prevAnim) {
                mAnim = 'dw-' + anim + ' dw-in';
            }
            // Create wheels containers
            var html = '<div class="' + s.theme + ' dw-' + s.display + (prefix ? ' dw' + prefix : '') + '">' + (s.display == 'inline' ? '<div class="dw dwbg dwi"><div class="dwwr">' : '<div class="dw-persp">' + '<div class="dwo"></div><div class="dw dwbg ' + mAnim + '"><div class="dw-arrw"><div class="dw-arrw-i"><div class="dw-arr"></div></div></div><div class="dwwr">' + (s.headerText ? '<div class="dwv"></div>' : '')) + '<div class="dwcc">';

            $.each(s.wheels, function (i, wg) { // Wheel groups
                html += '<div class="dwc' + (s.mode != 'scroller' ? ' dwpm' : ' dwsc') + (s.showLabel ? '' : ' dwhl') + '"><div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>';
                $.each(wg, function (j, w) { // Wheels
                    wheels[l] = w;
                    html += '<td><div class="dwwl dwrc dwwl' + l + '">' + (s.mode != 'scroller' ? '<div class="dwb-e dwwb dwwbp" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>+</span></div><div class="dwb-e dwwb dwwbm" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>&ndash;</span></div>' : '') + '<div class="dwl">' + (w.label || j) + '</div><div class="dwww"><div class="dww" style="height:' + (s.rows * hi) + 'px;min-width:' + s.width + 'px;"><div class="dw-ul">';
                    // Create wheel values
                    html += generateWheelItems(l);
                    html += '</div><div class="dwwol"></div></div><div class="dwwo"></div></div><div class="dwwol"></div></div></td>';
                    l++;
                });

                html += '</tr></table></div></div>';
            });

            html += '</div>' + (s.display != 'inline' ? '<div class="dwbc' + (s.button3 ? ' dwbc-p' : '') + '"><span class="dwbw dwb-s"><span class="dwb dwb-e">' + s.setText + '</span></span>' + (s.button3 ? '<span class="dwbw dwb-n"><span class="dwb dwb-e">' + s.button3Text + '</span></span>' : '') + '<span class="dwbw dwb-c"><span class="dwb dwb-e">' + s.cancelText + '</span></span></div></div>' : '') + '</div></div></div>';
            dw = $(html);

            scrollToPos();

            event('onMarkupReady', [dw]);

            // Show
            if (s.display != 'inline') {
                dw.appendTo('body');
                if (anim && !prevAnim) {
                    dw.addClass('dw-trans');
                    // Remove animation class
                    setTimeout(function () {
                        dw.removeClass('dw-trans').find('.dw').removeClass(mAnim);
                    }, 350);
                }
            } else if (elm.is('div')) {
                elm.html(dw);
            } else {
                dw.insertAfter(elm);
            }

            event('onMarkupInserted', [dw]);

            visible = true;

            // Theme init
            theme.init(dw, that);

            if (s.display != 'inline') {
                // Init buttons
                that.tap($('.dwb-s span', dw), function () {
                    if (that.hide(false, 'set') !== false) {
                        setVal(true, 0, true);
                        event('onSelect', [that.val]);
                    }
                });

                that.tap($('.dwb-c span', dw), function () {
                    that.cancel();
                });

                if (s.button3) {
                    that.tap($('.dwb-n span', dw), s.button3);
                }

                // prevent scrolling if not specified otherwise
                if (s.scrollLock) {
                    dw.bind('touchmove', function (e) {
                        if (mh <= wh && mw <= ww) {
                            e.preventDefault();
                        }
                    });
                }

                // Disable inputs to prevent bleed through (Android bug) and set autocomplete to off (for Firefox)
                /*$('input,select,button').each(function () {
                    if (!this.disabled) {
                        $(this).addClass('dwtd').prop('disabled', true).data('autocomplete', $(this).attr('autocomplete')).attr('autocomplete', 'off');
                    }
                });*/

                // Set position
                that.position();
                $(window).bind('orientationchange.dw resize.dw', function () {
                    // Sometimes scrollTop is not correctly set, so we wait a little
                    clearTimeout(debounce);
                    debounce = setTimeout(function () {
                        that.position(true);
                    }, 100);
                });
            }

            // Events
            dw.delegate('.dwwl', 'DOMMouseScroll mousewheel', onScroll).delegate('.dwb-e', START_EVENT, onBtnStart).delegate('.dwwl', START_EVENT, onStart);

            event('onShow', [dw, v]);
        };

        /**
        * Hides the scroller instance.
        */
        that.hide = function (prevAnim, btn) {
            // If onClose handler returns false, prevent hide
            if (!visible || event('onClose', [v, btn]) === false) {
                return false;
            }

            // Re-enable temporary disabled fields
            $('.dwtd').each(function () {
                $(this).prop('disabled', false).removeClass('dwtd');
                if ($(this).data('autocomplete')) {
                    $(this).attr('autocomplete', $(this).data('autocomplete'));
                } else {
                    $(this).removeAttr('autocomplete');
                }
            });
            elm.blur();

            // Hide wheels and overlay
            if (dw) {
                if (s.display != 'inline' && anim && !prevAnim) {
                    dw.addClass('dw-trans').find('.dw').addClass('dw-' + anim + ' dw-out');
                    setTimeout(function () {
                        dw.remove();
                        dw = null;
                    }, 350);
                } else {
                    dw.remove();
                    dw = null;
                }
                visible = false;
                pixels = {};
                // Stop positioning on window resize
                $(window).unbind('.dw');
            }
        };

        /**
        * Cancel and hide the scroller instance.
        */
        that.cancel = function () {
            if (that.hide(false, 'cancel') !== false) {
                event('onCancel', [that.val]);
            }
        };

        /**
        * Scroller initialization.
        */
        that.init = function (ss) {
            // Get theme defaults
            theme = extend({ defaults: {}, init: empty }, ms.themes[ss.theme || s.theme]);

            // Get language defaults
            lang = ms.i18n[ss.lang || s.lang];

            extend(settings, ss); // Update original user settings
            extend(s, theme.defaults, lang, settings);

            that.settings = s;

            // Unbind all events (if re-init)
            elm.unbind('.dw');

            var preset = ms.presets[s.preset];

            if (preset) {
                pres = preset.call(e, that);
                extend(s, pres, settings); // Load preset settings
            }

            // Set private members
            m = Math.floor(s.rows / 2);
            hi = s.height;
            anim = s.animate;

            if (visible) {
                that.hide();
            }

            if (s.display == 'inline') {
                that.show();
            } else {
                read();
                if (input && s.showOnFocus) {
                    // Set element readonly, save original state
                    if (readOnly === undefined) {
                        readOnly = e.readOnly;
                    }
                    e.readOnly = true;
                    // Init show datewheel
                    elm.bind('focus.dw', function () { that.show(); });
                }
            }
        };

        that.trigger = function (name, params) {
            return event(name, params);
        };

        that.option = function (opt, value) {
            var obj = {};
            if (typeof opt === 'object') {
                obj = opt;
            } else {
                obj[opt] = value;
            }
            that.init(obj);
        };

        that.destroy = function () {
            that.hide();
            elm.unbind('.dw');
            delete scrollers[e.id];
            if (input) {
                e.readOnly = readOnly;
            }
        };

        that.getInst = function () {
            return that;
        };

        that.values = null;
        that.val = null;
        that.temp = null;
        that._selectedValues = {};

        that.init(settings);
    }

    function testProps(props) {
        var i;
        for (i in props) {
            if (mod[props[i]] !== undefined) {
                return true;
            }
        }
        return false;
    }

    function testPrefix() {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
            p;

        for (p in prefixes) {
            if (testProps([prefixes[p] + 'Transform'])) {
                return '-' + prefixes[p].toLowerCase();
            }
        }
        return '';
    }

    function testTouch(e) {
        if (e.type === 'touchstart') {
            touch = true;
            /*setTimeout(function () {
                touch = false; // Reset if mouse event was not fired
            }, 500);*/
        } else if (touch) {
            touch = false;
            return false;
        }
        return true;
    }

    function getCoord(e, c) {
        var org = e.originalEvent,
            ct = e.changedTouches;
        return ct || (org && org.changedTouches) ? (org ? org.changedTouches[0]['page' + c] : ct[0]['page' + c]) : e['page' + c];

    }

    function constrain(val, min, max) {
        return Math.max(min, Math.min(val, max));
    }

    function convert(w) {
        var ret = {
            values: [],
            keys: []
        };
        $.each(w, function (k, v) {
            ret.keys.push(k);
            ret.values.push(v);
        });
        return ret;
    }

    function init(that, options, args) {
        var ret = that;

        // Init
        if (typeof options === 'object') {
            return that.each(function () {
                if (!this.id) {
                    uuid += 1;
                    this.id = 'mobiscroll' + uuid;
                }
                scrollers[this.id] = new Scroller(this, options);
            });
        }

        // Method call
        if (typeof options === 'string') {
            that.each(function () {
                var r,
                    inst = scrollers[this.id];

                if (inst && inst[options]) {
                    r = inst[options].apply(this, Array.prototype.slice.call(args, 1));
                    if (r !== undefined) {
                        ret = r;
                        return false;
                    }
                }
            });
        }

        return ret;
    }

    var move,
        tap,
        touch,
        date = new Date(),
        uuid = date.getTime(),
        scrollers = {},
        empty = function () {},
        mod = document.createElement('modernizr').style,
        has3d = testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']),
        prefix = testPrefix(),
        pr = prefix.replace(/^\-/, '').replace('moz', 'Moz'),
        extend = $.extend,
        START_EVENT = 'touchstart mousedown',
        MOVE_EVENT = 'touchmove mousemove',
        END_EVENT = 'touchend mouseup',
        defaults = {
            // Options
            width: 70,
            height: 40,
            rows: 3,
            delay: 300,
            disabled: false,
            readonly: false,
            showOnFocus: true,
            showLabel: true,
            wheels: [],
            theme: '',
            headerText: '{value}',
            display: 'modal',
            mode: 'scroller',
            preset: '',
            lang: 'en-US',
            setText: 'Set',
            cancelText: 'Cancel',
            scrollLock: true,
            tap: true,
            speedUnit: 0.0012,
            timeUnit: 0.1,
            formatResult: function (d) {
                return d.join(' ');
            },
            parseValue: function (value, inst) {
                var val = value.split(' '),
                    ret = [],
                    i = 0,
                    keys;

                $.each(inst.settings.wheels, function (j, wg) {
                    $.each(wg, function (k, w) {
                        w = w.values ? w : convert(w);
                        keys = w.keys || w.values;
                        if ($.inArray(val[i], keys) !== -1) {
                            ret.push(val[i]);
                        } else {
                            ret.push(keys[0]);
                        }
                        i++;
                    });
                });
                return ret;
            }
        };

    $(document).bind('mouseover mouseup mousedown click', function (e) { // Prevent standard behaviour on body click
        if (tap) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    });

    $.fn.mobiscroll = function (method) {
        extend(this, $.mobiscroll.shorts);
        return init(this, method, arguments);
    };

    $.mobiscroll = $.mobiscroll || {
        /**
        * Set settings for all instances.
        * @param {Object} o - New default settings.
        */
        setDefaults: function (o) {
            extend(defaults, o);
        },
        presetShort: function (name) {
            this.shorts[name] = function (method) {
                return init(this, extend(method, { preset: name }), arguments);
            };
        },
        shorts: {},
        presets: {},
        themes: {},
        i18n: {}
    };

    $.scroller = $.scroller || $.mobiscroll;
    $.fn.scroller = $.fn.scroller || $.fn.mobiscroll;

})(jQuery);
