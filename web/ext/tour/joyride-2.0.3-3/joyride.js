/*jshint eqnull:true */
/*!
 * jQuery Cookie Plugin v1.2
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function ($, document, undefined) {

  var pluses = /\+/g;

  function raw(s) {
    return s;
  }

  function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
  }

  $.cookie = function (key, value, options) {

    // key and at least value given, set cookie...
    if (value !== undefined && !/Object/.test(Object.prototype.toString.call(value))) {
      options = $.extend({}, $.cookie.defaults, options);

      if (value === null) {
        options.expires = -1;
      }

      if (typeof options.expires === 'number') {
        var days = options.expires, t = options.expires = new Date();
        t.setDate(t.getDate() + days);
      }

      value = String(value);

      return (document.cookie = [
        encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
        options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
        options.path    ? '; path=' + options.path : '',
        options.domain  ? '; domain=' + options.domain : '',
        options.secure  ? '; secure' : ''
      ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || $.cookie.defaults || {};
    var decode = options.raw ? raw : decoded;
    var cookies = document.cookie.split('; ');
    for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')); i++) {
      if (decode(parts.shift()) === key) {
        return decode(parts.join('='));
      }
    }

    return null;
  };

  $.cookie.defaults = {};

  $.removeCookie = function (key, options) {
    if ($.cookie(key, options) !== null) {
      $.cookie(key, null, options);
      return true;
    }
    return false;
  };

})(jQuery, document);
/*
 * jQuery Foundation Joyride Plugin 2.0.3
 * http://foundation.zurb.com
 * Copyright 2012, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, undefined) {
  'use strict';

  var defaults = {
      'version'              : '2.0.3',
      'tipLocation'          : 'bottom',  // 'top' or 'bottom' in relation to parent
      'nubPosition'          : 'auto',    // override on a per tooltip bases
      'scrollSpeed'          : 300,       // Page scrolling speed in milliseconds
      'timer'                : 0,         // 0 = no timer , all other numbers = timer in milliseconds
      'startTimerOnClick'    : true,      // true or false - true requires clicking the first button start the timer
      'startOffset'          : 0,         // the index of the tooltip you want to start on (index of the li)
      'nextButton'           : true,      // true or false to control whether a next button is used
      'prevButton'           : false,     // true or false to control whether a previous button is used
      'tipAnimation'         : 'fade',    // 'pop' or 'fade' in each tip
      'pauseAfter'           : [],        // array of indexes where to pause the tour after
      'tipAnimationFadeSpeed': 300,       // when tipAnimation = 'fade' this is speed in milliseconds for the transition
      'cookieMonster'        : false,     // true or false to control whether cookies are used
      'cookieName'           : 'joyride', // Name the cookie you'll use
      'cookieDomain'         : false,     // Will this cookie be attached to a domain, ie. '.notableapp.com'
      'tipContainer'         : 'body',    // Where will the tip be attached
      'postRideCallback'     : $.noop,    // A method to call once the tour closes (canceled or complete)
      'postStepCallback'     : $.noop,    // A method to call after each step
      'bordered'             : false,     // true or false to control whether a border is shown
      'includepage'          : false,     // true or false to control whether a page number is shown under the next button
      'adjustForPhone'       : true,      // change window position for phones (if false, windows show in default position)
      'template' : { // HTML segments for tip layout
        'link'       : '<a href="#close" class="joyride-close-tip">X</a>',
        'timer'      : '<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',
        'tip'        : '<div class="joyride-tip-guide"></div>',
        'nub'        : '<span class="joyride-nub"></span>',
        'tipborder'  : '<span class="joyride-nub-border"></span>',
        'wrapper'    : '<div class="joyride-content-wrapper"></div>',
        'button'     : '<a href="#" class="joyride-next-tip"></a>',
        'prevbutton' : '<a href="#" class="joyride-prev-tip"></a>'
      }
    },

    Modernizr = Modernizr || false,

    settings = {},

    methods = {

      init : function (opts) {
        return this.each(function () {

          if ($.isEmptyObject(settings)) {
            settings = $.extend(true, defaults, opts);

            // non configurable settings
            settings.document = window.document;
            settings.$document = $(settings.document);
            settings.$window = $(window);
            settings.$content_el = $(this);
            settings.body_offset = $(settings.tipContainer).position();
            settings.$tip_content = $('> li', settings.$content_el);
            settings.paused = false;
            settings.attempts = 0;

            settings.tipLocationPatterns = {
              top: ['bottom'],
              bottom: [], // bottom should not need to be repositioned
              left: ['right', 'top', 'bottom'],
              right: ['left', 'top', 'bottom']
            };

            // are we using jQuery 1.7+
            methods.jquery_check();

            // can we create cookies?
            if (!$.isFunction($.cookie)) {
              settings.cookieMonster = false;
            }

            // generate the tips and insert into dom.
            if (!settings.cookieMonster || !$.cookie(settings.cookieName)) {

              settings.$tip_content.each(function (index) {
                methods.create({$li : $(this), index : index});
              });

              // show first tip
              if (!settings.startTimerOnClick && settings.timer > 0) {
                methods.show('init');
                methods.startTimer();
              } else {
                methods.show('init');
              }

            }

            settings.$document.on('click', '.joyride-next-tip, .joyride-modal-bg', function (e) {
              if(e.target.text === "Next" || e.target.text === "Finish") {
              	e.preventDefault();
              	e.stopImmediatePropagation();
              	if (settings.$li.next().length < 1) {
               		methods.end("next");
              	} else if (settings.timer > 0) {
                	clearTimeout(settings.automate);
                	methods.hide("next");
                	methods.show();
                	methods.startTimer();
              	} else {
                	methods.hide("next");
                	methods.show();
              	}}
            });

			//BETH
			settings.$document.on('click.joyride', '.joyride-prev-tip, .joyride-modal-bg', function (e) {
              if(e.target.text === "Prev") {
              	e.preventDefault();
              	e.stopImmediatePropagation();
              	if (settings.$li.prev().length < 1) {
                	methods.end("previous");
              	} else if (settings.timer > 0) {
                	clearTimeout(settings.automate);
                	methods.hideNoCallback();
               	 	methods.showPrev();
                	methods.startTimer();
              	} else {
                	//methods.hideNoCallback();
                	methods.hide("previous");
                	methods.showPrev();
              }}

            });
			//END BETH

            settings.$document.on('click.joyride', '.joyride-close-tip', function (e) {
              if(e.target.text === "X") {
              	e.preventDefault();
              	methods.endNoCallback();
              }
            });

            settings.$window.bind('resize.joyride', function (e) {
              if (methods.is_phone()) {
                methods.pos_phone();
              } else {
                methods.pos_default();
              }
            });
          } else {
            methods.restart();
          }

        });
      },

      // call this method when you want to resume the tour
      resume : function () {
        methods.set_li();
        methods.show();
      },

      tip_template : function (opts) {
        var $blank, content;

		// vars
      	var opts_arr = (opts.li.data('options') || ':').split(';');
        var opts_len = opts_arr.length;
		var ii, p;
		var isBordered = settings.bordered;
		var isShifted = settings.shiftedArrow;
		var usePage = settings.includepage;

        opts.tip_class = opts.tip_class || '';
        if(isBordered) {
        	opts.tip_class += " bordered";
        }

        $blank = $(settings.template.tip).addClass(opts.tip_class);

        content = $.trim($(opts.li).html()) +
          methods.button_text(opts.button_text, opts.li) +
          settings.template.link +
          methods.timer_instance(opts.index);
        if(usePage) {
        	var numpages = settings.$content_el[0].children.length;
			var page = opts.index + 1;
			var pagestr = "<p class='wv-tour-page-count'>(page " + page + " of " + numpages + ")</p>"
			content += pagestr;
        }
        if(isBordered) {
        	$blank.append($(settings.template.tipborder));
        }
        $blank.append($(settings.template.nub));
        $blank.append($(settings.template.wrapper));
        $blank.first().attr('data-index', opts.index);
        $('.joyride-content-wrapper', $blank).append(content);

        return $blank[0];
      },

      timer_instance : function (index) {
        var txt;

        if ((index === 0 && settings.startTimerOnClick && settings.timer > 0) || settings.timer === 0) {
          txt = '';
        } else {
          txt = methods.outerHTML($(settings.template.timer)[0]);
        }
        return txt;
      },

      button_text : function (txt, li) {
      	//BETH
      	// vars
      	var opts_arr = (li.data('options') || ':').split(';');
        var opts_len = opts_arr.length;
		var ii, p;
		var hasPrev, hasNext, prev;

        // parse options
        for (ii = opts_len - 1; ii >= 0; ii--) {
        	p = opts_arr[ii].split(':');

        	if (p.length === 2) {
             	if(p[0] == "prevButton") {
            		if(p[1] == "true") {
            			hasPrev = true;
            		}
            		else {
            			hasPrev = false;
            		}
            	}
            	if(p[0] == "nextButton") {
            		if(p[1] == "true") {
            			hasNext = true;
            		}
            		else {
            			hasNext = false;
            		}
            	}
        	}
        }

        // fill in defaults if buttons were not specified
      	if(hasPrev === undefined) {
      		hasPrev = settings.prevButton;
      	}
      	if(hasNext === undefined) {
      		hasNext = settings.nextButton;
      	}

      	// construct and return button string
      	if (hasPrev) {
      		prev = 'Prev';
      		prev = methods.outerHTML($(settings.template.prevbutton).append(prev)[0]);
      	} else {
      		prev = '';
      	}
        if (hasNext) {
          txt = $.trim(txt) || 'Next';
          txt = methods.outerHTML($(settings.template.button).append(txt)[0]);
        } else {
          txt = '';
        }
        return prev + txt + "</br></br>";
        //END BETH
      },

      create : function (opts) {
        // backwards compatibility with data-text attribute
        var buttonText = opts.$li.attr('data-button') || opts.$li.attr('data-text'),
          tipClass = opts.$li.attr('class'),
          $tip_content = $(methods.tip_template({
            tip_class : tipClass,
            index : opts.index,
            button_text : buttonText,
            li : opts.$li,
          }));

        $(settings.tipContainer).append($tip_content);
      },

      show : function (init) {
        var opts = {}, ii, opts_arr = [], opts_len = 0, p,
            $timer = null;

        // are we paused?
        if (settings.$li === undefined || ($.inArray(settings.$li.index(), settings.pauseAfter) === -1)) {

          // don't go to the next li if the tour was paused
          if (settings.paused) {
            settings.paused = false;
          } else {
            methods.set_li(init);
          }

          settings.attempts = 0;
          if (settings.$li.length && settings.$target.length > 0) {
            opts_arr = (settings.$li.data('options') || ':').split(';');
            opts_len = opts_arr.length;

            // parse options
            for (ii = opts_len - 1; ii >= 0; ii--) {
              p = opts_arr[ii].split(':');

              if (p.length === 2) {
                opts[$.trim(p[0])] = $.trim(p[1]);
              }
            }

            settings.tipSettings = $.extend({}, settings, opts);

            settings.tipSettings.tipLocationPattern = settings.tipLocationPatterns[settings.tipSettings.tipLocation];

            // scroll if not modal
            if (!/body/i.test(settings.$target.selector)) {
              methods.scroll_to();
            }

            if (methods.is_phone()) {
              methods.pos_phone(true);
            } else {
              methods.pos_default(true);
            }
            $timer = $('.joyride-timer-indicator', settings.$next_tip);

            if (/pop/i.test(settings.tipAnimation)) {
              $timer.outerWidth(0);

              if (settings.timer > 0) {

                settings.$next_tip.show();
                $timer.animate({
                  width: $('.joyride-timer-indicator-wrap', settings.$next_tip).outerWidth()
                }, settings.timer);

              } else {
                settings.$next_tip.show();

              }


            } else if (/fade/i.test(settings.tipAnimation)) {
              $timer.outerWidth(0);

              if (settings.timer > 0) {

                settings.$next_tip.fadeIn(settings.tipAnimationFadeSpeed);
                settings.$next_tip.show();
                $timer.animate({
                  width: $('.joyride-timer-indicator-wrap', settings.$next_tip).outerWidth()
                }, settings.timer);

              } else {
                settings.$next_tip.fadeIn(settings.tipAnimationFadeSpeed);

              }
            }

            settings.$current_tip = settings.$next_tip;

          // skip non-existent targets
          } else if (settings.$li && settings.$target.length < 1) {
			//console.log("showNext2 nubposition = " + settings.tipSettings.nubPosition);
            methods.show();

          } else {

            methods.end("next");

          }
        } else {

          settings.paused = true;

        }

      },

	  //BETH
	  showPrev : function (init) {
        var opts = {}, ii, opts_arr = [], opts_len = 0, p,
            $timer = null;

        // are we paused?
        if (settings.$li === undefined || ($.inArray(settings.$li.index(), settings.pauseAfter) === -1)) {
          // don't go to the next li if the tour was paused
          if (settings.paused) {
            settings.paused = false;
          } else {
            methods.set_li_prev(init);
          }

          settings.attempts = 0;

          if (settings.$li.length && settings.$target.length > 0) {
            opts_arr = (settings.$li.data('options') || ':').split(';');
            opts_len = opts_arr.length;

            // parse options
            for (ii = opts_len - 1; ii >= 0; ii--) {
              p = opts_arr[ii].split(':');

              if (p.length === 2) {
                opts[$.trim(p[0])] = $.trim(p[1]);
              }
            }

            settings.tipSettings = $.extend({}, settings, opts);

            settings.tipSettings.tipLocationPattern = settings.tipLocationPatterns[settings.tipSettings.tipLocation];

            // scroll if not modal
            if (!/body/i.test(settings.$target.selector)) {
              methods.scroll_to();
            }

            if (methods.is_phone()) {
              methods.pos_phone(true);
            } else {
              methods.pos_default_prev(true);
            }
            $timer = $('.joyride-timer-indicator', settings.$prev_tip);

            if (/pop/i.test(settings.tipAnimation)) {

              $timer.outerWidth(0);

              if (settings.timer > 0) {

                settings.$prev_tip.show();
                $timer.animate({
                  width: $('.joyride-timer-indicator-wrap', settings.$prev_tip).outerWidth()
                }, settings.timer);

              } else {

                settings.$prev_tip.show();

              }


            } else if (/fade/i.test(settings.tipAnimation)) {

              $timer.outerWidth(0);

              if (settings.timer > 0) {

                settings.$prev_tip.fadeIn(settings.tipAnimationFadeSpeed);

                settings.$prev_tip.show();
                $timer.animate({
                  width: $('.joyride-timer-indicator-wrap', settings.$prev_tip).outerWidth()
                }, settings.timer);

              } else {

                settings.$prev_tip.fadeIn(settings.tipAnimationFadeSpeed);

              }
            }

            settings.$current_tip = settings.$prev_tip;

          // skip non-existent targets
          } else if (settings.$li && settings.$target.length < 1) {

            methods.showPrev();

          } else {

            methods.end("previous");

          }
        } else {

          settings.paused = true;

        }

      },
      //END BETH

      // detect phones with media queries if supported.
      is_phone : function () {
      	if(settings.adjustForPhone) {
      		//console.log("adjustForPhone");
        	if (Modernizr) {
          	return Modernizr.mq('only screen and (max-width: 767px)');
        	}

        	return (settings.$window.width() < 767) ? true : false;
       	}
       	else {
            //console.log("no adjustForPhone");
       		return false;
       	}
      },

      hide : function (button) {
        settings.postStepCallback(settings.$li.index(), settings.$current_tip, button);
        $('.joyride-modal-bg').hide();
        settings.$current_tip.hide();
      },

	  hideNoCallback : function () {
        $('.joyride-modal-bg').hide();
        settings.$current_tip.hide();
	  },

      set_li : function (init) {
        if (init) {
          settings.$li = settings.$tip_content.eq(settings.startOffset);
          methods.set_next_tip();
          settings.$current_tip = settings.$next_tip;
        } else {
          settings.$li = settings.$li.next();
          methods.set_next_tip();
        }

        methods.set_target();
      },

      //BETH
      set_li_prev : function (init) {
        if (init) {
          settings.$li = settings.$tip_content.eq(settings.startOffset);
          methods.set_prev_tip();
          settings.$current_tip = settings.$prev_tip;
        } else {
          settings.$li = settings.$li.prev();
          methods.set_prev_tip();
        }

        methods.set_target();
      },
      //END BETH

      set_next_tip : function () {
        settings.$next_tip = $('.joyride-tip-guide[data-index=' + settings.$li.index() + ']');
      },

	  //BETH
	  set_prev_tip : function () {
	  	settings.$prev_tip = $('.joyride-tip-guide[data-index=' + settings.$li.index() + ']');
	  },
	  //END BETH

      set_target : function () {
        var cl = settings.$li.attr('data-class'),
            id = settings.$li.attr('data-id'),

            $sel = function () {
              if (id) {
                return $(settings.document.getElementById(id));
              } else if (cl) {
                return $('.' + cl).first();
              } else {
                return $('body');
              }
            };

        settings.$target = $sel();
      },

      scroll_to : function () {
        var window_half, tipOffset;

        window_half = settings.$window.height() / 2;
        tipOffset = Math.ceil(settings.$target.offset().top - window_half + settings.$next_tip.outerHeight());

        $("html, body").stop().animate({
          scrollTop: tipOffset
        }, settings.scrollSpeed);
      },

      paused : function () {
        if (($.inArray((settings.$li.index() + 1), settings.pauseAfter) === -1)) {
          return true;
        }

        return false;
      },

      destroy : function () {
        settings.$document.off('.joyride');
        $(window).off('.joyride');
        $('.joyride-close-tip, .joyride-next-tip, .joyride-modal-bg').off('.joyride');
        $('.joyride-tip-guide, .joyride-modal-bg').remove();
        clearTimeout(settings.automate);
        settings = {};
      },

      restart : function () {
        methods.hide("restart");
        settings.$li = undefined;
        methods.show('init');
      },

      pos_default : function (init) {
        var half_fold = Math.ceil(settings.$window.height() / 2),
            tip_position = settings.$next_tip.offset(),
            $nub = $('.joyride-nub', settings.$next_tip),
            $border = $('.joyride-nub-border', settings.$next_tip),
            nub_height = Math.ceil($nub.outerHeight() / 2),
            toggle = init || false;

		settings.$next_tip.removeClass("mobile");

        // tip must not be "display: none" to calculate position
        if (toggle) {
          settings.$next_tip.css('visibility', 'hidden');
          settings.$next_tip.show();
        }

        if (!/body/i.test(settings.$target.selector)) {

            if (methods.bottom()) {

              settings.$next_tip.css({
                top: (settings.$target.offset().top + nub_height + settings.$target.outerHeight()),
                left: settings.$target.offset().left});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'top');

            } else if (methods.top()) {

              settings.$next_tip.css({
                top: (settings.$target.offset().top - settings.$next_tip.outerHeight() - nub_height),
                left: settings.$target.offset().left});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'bottom');

            } else if (methods.right()) {
              settings.$next_tip.css({
                top: settings.$target.offset().top,
                left: (settings.$target.outerWidth() + settings.$target.offset().left + 20)});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'left');

            } else if (methods.left()) {

              settings.$next_tip.css({
                top: settings.$target.offset().top,
                left: (settings.$target.offset().left - settings.$next_tip.outerWidth() - nub_height)});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'right');

            }

            if (!methods.visible(methods.corners(settings.$next_tip)) && settings.attempts < settings.tipSettings.tipLocationPattern.length) {
              $nub.removeClass('bottom')
                .removeClass('top')
                .removeClass('right')
                .removeClass('left');

              settings.tipSettings.tipLocation = settings.tipSettings.tipLocationPattern[settings.attempts];

              settings.attempts++;

              methods.pos_default(true);

            }

        } else if (settings.$li.length) {

          methods.pos_modal($nub);

        }

        if (toggle) {
          settings.$next_tip.hide();
          settings.$next_tip.css('visibility', 'visible');
        }

      },

      pos_default_prev : function (init) {
        var half_fold = Math.ceil(settings.$window.height() / 2),
            tip_position = settings.$prev_tip.offset(),
            $nub = $('.joyride-nub', settings.$prev_tip),
            $border = $('.joyride-nub-border', settings.$prev_tip),
            nub_height = Math.ceil($nub.outerHeight() / 2),
            toggle = init || false;

		settings.$next_tip.addClass("mobile");

        // tip must not be "display: none" to calculate position
        if (toggle) {
          settings.$prev_tip.css('visibility', 'hidden');
          settings.$prev_tip.show();
        }

        if (!/body/i.test(settings.$target.selector)) {

            if (methods.bottom()) {
              settings.$prev_tip.css({
                top: (settings.$target.offset().top + nub_height + settings.$target.outerHeight()),
                left: settings.$target.offset().left});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'top');

            } else if (methods.top()) {

              settings.$prev_tip.css({
                top: (settings.$target.offset().top - settings.$prev_tip.outerHeight() - nub_height),
                left: settings.$target.offset().left});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'bottom');

            } else if (methods.right()) {

              settings.$prev_tip.css({
                top: settings.$target.offset().top,
                left: (settings.$target.outerWidth() + settings.$target.offset().left + 20)});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'left');

            } else if (methods.left()) {

              settings.$prev_tip.css({
                top: settings.$target.offset().top,
                left: (settings.$target.offset().left - settings.$prev_tip.outerWidth() - nub_height)});
              methods.nub_position($nub, $border, settings.tipSettings.nubPosition, 'right');

            }

            if (!methods.visible(methods.corners(settings.$prev_tip)) && settings.attempts < settings.tipSettings.tipLocationPattern.length) {
              $nub.removeClass('bottom')
                .removeClass('top')
                .removeClass('right')
                .removeClass('left');

              settings.tipSettings.tipLocation = settings.tipSettings.tipLocationPattern[settings.attempts];

              settings.attempts++;

              methods.pos_default_prev(true);

            }

        } else if (settings.$li.length) {

          methods.pos_modal($nub);

        }

        if (toggle) {
          settings.$prev_tip.hide();
          settings.$prev_tip.css('visibility', 'visible');
        }

      },

      pos_phone : function (init) {
      	//console.log("pos_phone");
        var tip_height = settings.$next_tip.outerHeight(),
            tip_offset = settings.$next_tip.offset(),
            target_height = settings.$target.outerHeight(),
            $nub = $('.joyride-nub', settings.$next_tip),
            nub_height = Math.ceil($nub.outerHeight() / 2),
            toggle = init || false;

        $nub.removeClass('bottom')
          .removeClass('top')
          .removeClass('right')
          .removeClass('left');

		settings.$next_tip.addClass("mobile");

        if (toggle) {
          settings.$next_tip.css('visibility', 'hidden');
          settings.$next_tip.show();
        }

        if (!/body/i.test(settings.$target.selector)) {

          if (methods.top()) {

              settings.$next_tip.offset({top: settings.$target.offset().top - tip_height - nub_height});
              $nub.addClass('bottom');

          } else {

            settings.$next_tip.offset({top: settings.$target.offset().top + target_height + nub_height});
            $nub.addClass('top');

          }

        } else if (settings.$li.length) {

          methods.pos_modal($nub);

        }

        if (toggle) {
          settings.$next_tip.hide();
          settings.$next_tip.css('visibility', 'visible');
        }
      },

      pos_modal : function ($nub) {
        methods.center();
        $nub.hide();

        if ($('.joyride-modal-bg').length < 1) {
          $('body').append('<div class="joyride-modal-bg">').show();
        }

        if (/pop/i.test(settings.tipAnimation)) {
          $('.joyride-modal-bg').show();
        } else {
          $('.joyride-modal-bg').fadeIn(settings.tipAnimationFadeSpeed);
        }
      },

      center : function () {
        var $w = settings.$window;

        settings.$next_tip.css({
          top : ((($w.height() - settings.$next_tip.outerHeight()) / 2) + $w.scrollTop()),
          left : ((($w.width() - settings.$next_tip.outerWidth()) / 2) + $w.scrollLeft())
        });

        return true;
      },

      bottom : function () {
        return /bottom/i.test(settings.tipSettings.tipLocation);
      },

      top : function () {
        return /top/i.test(settings.tipSettings.tipLocation);
      },

      right : function () {
        return /right/i.test(settings.tipSettings.tipLocation);
      },

      left : function () {
        return /left/i.test(settings.tipSettings.tipLocation);
      },

      corners : function (el) {
        var w = settings.$window,
            right = w.width() + w.scrollLeft(),
            bottom = w.height() + w.scrollTop();

        return [
          el.offset().top <= w.scrollTop(),
          right <= el.offset().left + el.outerWidth(),
          bottom <= el.offset().top + el.outerHeight(),
          w.scrollLeft() >= el.offset().left
        ];
      },

      visible : function (hidden_corners) {
        var i = hidden_corners.length;

        while (i--) {
          if (hidden_corners[i]) return false;
        }

        return true;
      },

      nub_position : function (nub, border, pos, def) {
        if (pos === 'auto') {
          nub.addClass(def);
          border.addClass(def);
        } else {
          nub.addClass(pos);
          border.addClass(pos);
        }
      },

      startTimer : function () {
        if (settings.$li.length) {
          settings.automate = setTimeout(function () {
            methods.hide("timer");
            methods.show();
            methods.startTimer();
          }, settings.timer);
        } else {
          clearTimeout(settings.automate);
        }
      },

      end : function (button) {
        if (settings.cookieMonster) {
          $.cookie(settings.cookieName, 'ridden', { expires: 365, domain: settings.cookieDomain });
        }

        if (settings.timer > 0) {
          clearTimeout(settings.automate);
        }

        $('.joyride-modal-bg').hide();
        settings.$current_tip.hide();
        settings.postStepCallback(settings.$li.index(), settings.$current_tip, button);
        settings.postRideCallback(settings.$li.index(), settings.$current_tip, button);
        methods.destroy();
      },

	  endNoCallback : function() {
	  	        if (settings.cookieMonster) {
          $.cookie(settings.cookieName, 'ridden', { expires: 365, domain: settings.cookieDomain });
        }

        if (settings.timer > 0) {
          clearTimeout(settings.automate);
        }

        $('.joyride-modal-bg').hide();
        settings.$current_tip.hide();
        methods.destroy();
	  },

      jquery_check : function () {
        // define on() and off() for older jQuery
        if (!$.isFunction($.fn.on)) {

          $.fn.on = function (types, sel, fn) {

            return this.delegate(sel, types, fn);

          };

          $.fn.off = function (types, sel, fn) {

            return this.undelegate(sel, types, fn);

          };

          return false;
        }

        return true;
      },

      outerHTML : function (el) {
        // support FireFox < 11
        return el.outerHTML || new XMLSerializer().serializeToString(el);
      },

      version : function () {
        return settings.version;
      }

    };

  $.fn.joyride = function (method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.joyride');
    }
  };

}(jQuery, this));

/* Modernizr 2.6.1 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-mq-teststyles
 */
;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.1',

    Modernizr = {},


    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node,
          div = document.createElement('div'),
                body = document.body,
                fakeBody = body ? body : document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
                fakeBody.style.background = "";
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        !body ? fakeBody.parentNode.removeChild(fakeBody) : div.parentNode.removeChild(div);

      return !!ret;

    },

    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }


    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }



     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; 
     };


    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;


    Modernizr.mq            = testMediaQuery;
    Modernizr.testStyles    = injectElementWithStyles;
    return Modernizr;

})(this, this.document);
;