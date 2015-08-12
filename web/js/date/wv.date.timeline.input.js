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

/**
 * @module wv.date.timeline
 */
var wv = wv || {};
wv.date = wv.date || {};
wv.date.timeline = wv.date.timeline || {};

/**
 * Implements the date input
 *
 * @class wv.date.timeline.input
 */
wv.date.timeline.input = wv.date.timeline.input || function(models, config, ui) {

    var tl = ui.timeline;
    var model = models.date;

    var self = {};
    self.fromDate = undefined;
    self.toDate = undefined;

    var timer, rollingDate;

    //vars for dialog dates and time interval
    var interval = 'day';

    var $incrementBtn = $("#right-arrow-group");
    var $decrementBtn = $("#left-arrow-group");
	var $animateBtn   = $("#animate-button");
    var resumeButton, pauseButton, playButton, GIFButton;

    var forwardNextDay = function(){
        var nextDay = new Date(new Date(model.selected)
                               .setUTCDate(model.selected.getUTCDate()+1));
        if(nextDay <= wv.util.today())
            animateForward("day");
        else
            animateEnd();
    };

    var reversePrevDay = function(){
         var prevDay = new Date(new Date(model.selected)
                               .setUTCDate(model.selected.getUTCDate()-1));
        if(prevDay >= tl.data.start() )
            animateReverse("day");
        else
            animateEnd();
    };

    var animateForward = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, 1);
        ui.anim.interval = interval;
        ui.anim.play("forward");
    };

    var animateReverse = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, -1);
        ui.anim.interval = interval;
        ui.anim.play("reverse");
    };

    var animateEnd = function() {
        ui.anim.stop();
    };

    var roll = function(dataInterval, amt) {
        if ( timer ) {
            clearTimeout(timer);
            timer = null;
        }
        var interval = $(this).attr("data-interval") || dataInterval;
        var amount = _.parseInt($(this).attr("data-value")) || amt;
        var date = rollingDate || models.date.selected;
        var min = models.date.minDate();
        var max = models.date.maxDate();
        var newDate = wv.util.rollDate(date, interval, amount, min, max);

        if ( newDate !== date ) {
            rollingDate = newDate;
            $(this).parent().css("border-color", "");
            updateDateInputs(rollingDate);
            var that = this;
            timer = setTimeout(function() {
                model.select(rollingDate);
                $(that).parent().find('input').select();
                rollingDate = null;
                timer = null;
            }, 400);
        }
    };

    var validateInput = function(event) {
        var kc = event.keyCode || event.which;
        var entered = (kc == 13) || (kc === 9);
        if ( event.type == "focusout" || entered ) {
            if ( entered )
                event.preventDefault();
            
            var selected = $(this);
            var YMDInterval = selected.attr('id');
            var newInput = selected.val();
            var selectedDateObj = null;

            switch( YMDInterval ) {
            case 'year-input-group':
                if ((newInput > 1000) && (newInput < 9999))
                    selectedDateObj = new Date((new Date(model.selected)).setUTCFullYear(newInput));
                break;
            case 'month-input-group':
                if (($.isNumeric(newInput)) && (newInput < 13) && ( newInput > 0))
                    selectedDateObj = new Date((new Date(model.selected)).setUTCMonth(newInput - 1));
                else {
                    var validStr = false;
                    var newIntInput;
                    newInput = newInput.toUpperCase();

                    var len = model.monthAbbr.length;
                    for (var i=0; i < len; i++)
                        if (newInput === model.monthAbbr[i]) {
                            validStr = true;
                            newIntInput = i;
                        }

                    if (validStr)
                        selectedDateObj = new Date((new Date(model.selected )).setUTCMonth(newIntInput ));
                }
                break;
            case 'day-input-group':
                if(newInput > 0 && newInput <= (new Date(model.selected.getYear(), model.selected.getMonth()+1,0).getDate()))
                    selectedDateObj = new Date((new Date(model.selected)).setUTCDate(newInput));
                break;
            }

            if((selectedDateObj > tl.data.start()) && (selectedDateObj <= wv.util.today()))
            {
                var sib =  selected.parent().next('div.input-wrapper')
                    .find('input.button-input-group');

                if (entered && sib.length < 1)
                    $('#focus-guard-2').focus();

                model.select(selectedDateObj);

                $('.button-input-group').parent().css('border-color','');

                selected.parent().removeClass('selected');

                if (entered)
                    sib.select().addClass('selected');
            }
            else {
                selected.parent().css('border-color','#ff0000');
                if ( event.type !== "focusout" ) {
                    selected.select();
                } else {
                    if (document.selection)
                        document.selection.empty();
                    else
                        window.getSelection().removeAllRanges();
					
                    selected.parent().animate({
                        borderColor: "rgba(40, 40, 40, .9)"
                    }, {
                        complete: function() {
                            selected.parent().css("border-color", "");
                        }
                    });
                    self.update();
                }
            }
        }
    };

    //TODO: Combine with self.update
    var updateDateInputs = function(date) {
        date = date || models.selected.date;
        $("#year-input-group").val(date.getUTCFullYear());
        $("#month-input-group").val(model.monthAbbr[date.getUTCMonth()]);
        var day = date.getUTCDate();
        $("#day-input-group").val(wv.util.pad(date.getUTCDate(), 2, "0"));
    };

    //TODO: Cleanup
    self.update = function(date){
        var ms = date || new Date( model.selected );
        var nd = new Date(ms.setUTCDate(ms.getUTCDate()+1));
        var pd = new Date(ms.setUTCDate(ms.getUTCDate()-1));

        //Update fields
        $('#year-input-group').val( model.selected.getUTCFullYear() );
        $('#month-input-group').val( model.monthAbbr[ model.selected.getUTCMonth() ] );
        if ( model.selected.getUTCDate() < 10 ) 
            $('#day-input-group').val("0" + model.selected.getUTCDate());
        else 
            $('#day-input-group').val(model.selected.getUTCDate());

        //Disable arrows if nothing before/after selection
        if( nd > wv.util.today() ) 
            $incrementBtn.addClass('button-disabled');
        else
            $incrementBtn.removeClass('button-disabled');

        if(pd.toUTCString() === tl.data.start().toUTCString())
            $decrementBtn.addClass('button-disabled');
        else
            $decrementBtn.removeClass('button-disabled');

        tl.pick.update();
    };

    self.restoreDialog = function() {
        $(".wv-datepicker").datepicker("option", "disabled", false);
        $("#dialog").dialog("option", "buttons", [
            playButton, GIFButton
        ]);
        ui.timeline.pick.turnOnDrag();
    };

    //Prepare animation when button pressed
    var prepareAnim = function(speedSlider) {
        ui.anim.doAnimation = true;
        ui.anim.delay = parseFloat(1000 / speedSlider.val());

        if(document.getElementById("loopcheck").checked) {  //check for loop
            ui.anim.initDate = new Date(model.selected.valueOf()); //clone date from picker
            console.log(model.selected);
            console.log(ui.anim.initDate);
        }
    };

    //When the Go button is pressed, the dates are checked to make sure they exist and are valid
    var animDateCheck = function() {
        return self.fromDate !== undefined && self.toDate.getTime() !== self.fromDate.getTime();
    };

    //TODO: Cleanup
    var init = function(){
        var $dialog_sel = $("#dialog");

        $incrementBtn
            .mousedown(function(e) {
                e.preventDefault();
                forwardNextDay();
            })
            .mouseup(animateEnd);

        $decrementBtn
            .mousedown(function(e) {
                e.preventDefault();
                reversePrevDay();
            })
            .mouseup(animateEnd);

        $animateBtn.click(function(event) {
            animateEnd(); //Let the animation end when another one is being set
            wv.ui.closeDialog(); //Close any active dialog

            $dialog_sel.dialog("open");
            event.preventDefault();
        });

        //Add slider, labels, and input elements to dialog area
        var $speedHeader = $("<div></div>")
            .html("Speed")
            .addClass("wv-header"),
            speedHTML = "<li>Slow <span id='wv-whitespace'>Fast</span></li>";

        var $speedSlider = $("<div></div>")
            .noUiSlider({
                start: 2,
                step: 1,
                range: {
                    min: 1,
                    max: 30
                }
            }).on("slide", function() { //update animation speed when slider moves
                $speedLabel.addClass("wv-label-opacity").html(parseFloat($speedSlider.val()) + ' frames per second');
                ui.anim.delay = parseFloat(1000 / $speedSlider.val());
            }).on("set", function() { //show slow/fast when slider released
                setTimeout(function() {$speedLabel.removeClass("wv-label-opacity").html(speedHTML).attr("id", "wv-label-speed");}, 1000);
                ui.anim.delay = parseFloat(1000 / $speedSlider.val());
            });

        var $loopCheck = $("<input />")
            .addClass("wv-header").attr("type", "checkbox").attr("id", "loopcheck"),

        $speedLabel = $("<ul></ul>") //Show user what is fast/slow first
            .html(speedHTML).attr("id", "wv-label-speed"),

        $toLabel = $("<label></label>")
            .html(' to ').attr("for", "to"),

        $fromDate = $("<input />")
            .addClass("wv-datepicker").attr("id", "from").attr("type", "text").attr("name", "from").attr("readonly","true"),
        $toDate = $("<input />")
            .addClass("wv-datepicker").attr("id", "to").attr("type", "text").attr("name", "to").attr("readonly", "true");

        resumeButton = {
            text: "Play",
            click: function() { //Resume animation, update speed, restore pause button
                ui.anim.delay = parseFloat(1000 / $speedSlider.val());
                ui.anim.resume();
                $dialog_sel.dialog("option", "buttons",[
                    pauseButton, GIFButton
                ]);
            }
        };

        pauseButton = {
            text: "Pause",
            click: function() { //Resume animation, replace with resume button
                ui.anim.pause();
                $dialog_sel.dialog("option", "buttons",[
                    resumeButton, GIFButton
                ]);
            }
        };

        playButton = {
            text: "Play",
            click: function() {
                prepareAnim($speedSlider);

                //Compare the two dates in terms of milliseconds to determine the end animation date
                if(animDateCheck()) {
                    //Get the time difference. Negative ranges are supported
                    var to = self.toDate.getTime(), from = self.fromDate.getTime(), animDuration;

                    //Get the number of frames to animate, just to check if loop should be applied
                    animDuration = to > from ? ((to - from) / (86400 * 1000)) + 1 : ((from - to) / (86400 * 1000)) + 1;
                    if (interval === 'month') {
                        if(Math.abs(animDuration) <= 30) //if date range is smaller than interval, animate once
                            document.getElementById("loopcheck").checked = false;
                    } else if(interval === 'year') {
                        if(Math.abs(animDuration) <= 365) //one frame, don't loop
                            document.getElementById("loopcheck").checked = false;
                    }

                    //initDate needs to be set separately
                    model.selected = new Date(self.fromDate.valueOf()); //clone fromDate
                    ui.anim.initDate = new Date(model.selected.valueOf());
                    ui.anim.endDate = new Date(self.toDate.valueOf());

                    //Set pause button
                    $dialog_sel.dialog("option", "buttons", [
                        pauseButton, GIFButton
                    ]);

                    //Disable datepickers and slider drag behaviour
                    $fromDate.datepicker("option", "disabled", true);
                    $toDate.datepicker("option", "disabled", true);
                    d3.select("#fromPick").on(".drag", null);
                    d3.select("#toPick").on(".drag", null);

                    if(to > from) { //set it back because animation needs to "animate" to the right date
                        if(interval === 'year')
                            model.selected.setUTCFullYear(model.selected.getUTCFullYear()-1);
                        else if(interval === 'month')
                            model.selected.setUTCMonth(model.selected.getUTCMonth()-1);
                        else
                            model.selected.setUTCDate(model.selected.getUTCDate()-1);
                        animateForward(interval);
                    }
                    else {
                        if(interval === 'year')
                            model.selected.setUTCFullYear(model.selected.getUTCFullYear()+1);
                        else if(interval === 'month')
                            model.selected.setUTCMonth(model.selected.getUTCMonth()+1);
                        else
                            model.selected.setUTCDate(model.selected.getUTCDate()+1);
                        animateReverse(interval);
                    }
                } else
                    wv.ui.notify("Invalid date range, please make sure the start date is before the end date");
            }
        };

        GIFButton = {
            text: "Share GIF",
            click: function() {
                $dialog_sel.dialog("close");
                if(gifshot.isExistingImagesGIFSupported()) {
                    var from, to, jStart, jDate;
                    //Parse the fromDate and toDates to Julian time
                    jStart = wv.util.parseDateUTC(self.fromDate.getUTCFullYear() + "-01-01");
                    jDate = "00" + (1 + Math.ceil((self.fromDate.getTime() - jStart) / 86400000));
                    from = self.fromDate.getUTCFullYear() + (jDate).substr((jDate.length) - 3);

                    jStart = wv.util.parseDateUTC(self.toDate.getUTCFullYear() + "-01-01");
                    jDate = "00" + (1 + Math.ceil((self.toDate.getTime() - jStart) / 86400000));
                    to = self.toDate.getUTCFullYear() + (jDate).substr((jDate.length) - 3);

                    //Determine interval for updating date
                    var delta;
                    if (interval === 'month')
                        delta = 30;
                    else if (interval === 'year')
                        delta = 365;
                    else
                        delta = 1;

                    ui.rubberband.animToggle(from, to, delta, (1 / $speedSlider.val()).toPrecision(3));
                } else
                    wv.ui.notify("Sorry, but this feature is not supported in your browser (typically Internet Explorer)");
            }
        };

        //set up the datepickers
        $fromDate.datepicker({
            changeMonth: true,
            changeYear: true,
            maxDate: 0, //can't choose date after today
            onSelect: function() {
                self.fromDate = $fromDate.datepicker("getDate");
                console.log(self.fromDate);
                //Move animation date picker in timeline according to the new date
                d3.select("#fromPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.fromDate));
            }
        });

        $toDate.datepicker({
            changeMonth: true,
            changeYear: true,
            maxDate: 0,
            onSelect: function() {
                self.toDate = $toDate.datepicker("getDate");
                console.log(self.toDate);
                //Move animation date picker in timeline according to the new date
                d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.toDate));
            }
        });

        $dialog_sel.append($speedHeader).append($speedSlider).append($speedLabel)
                    .append($fromDate).append($toLabel).append($toDate).append("<br />").append($loopCheck).append('<label class="wv-header">Loop</label> <br />')
            .dialog({
            autoOpen: false,
            dialogClass: "wv-panel",
            title: "Setup Animation",
            width: 300,
            show: { effect: "slide", direction: "down" },
            position: {
                my: "left bottom",
                at: "left top",
                of: $("#timeline-header")
            },
            open: function(event) {
                $(".ui-dialog-content").find("img").remove(); //remove generated gif

                //Show datepickers and set date range to be two weeks
                if(self.fromDate === undefined) { //once per session
                    self.fromDate = new Date(model.selected.valueOf());
                    self.fromDate.setUTCDate(self.fromDate.getUTCDate() - 14);
                    self.toDate = new Date(model.selected.valueOf());

                    //HACK: Weird functionality with Date objects mean to show the right date, need to offset it by one
                    var tempFrom = new Date(self.fromDate), tempTo = new Date(self.toDate);
                    tempFrom.setUTCDate(tempFrom.getUTCDate() + 1); tempTo.setUTCDate(tempTo.getUTCDate() + 1);

                    $fromDate.datepicker("setDate", tempFrom);
                    $toDate.datepicker("setDate", tempTo);
                }

                //update the datepickers before showing them (account for zoom changes)
                d3.select("#fromPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.fromDate));
                d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.toDate));
                $(".animpick").show();
            },
            close: function() {
                //Hide datepickers
                if(!ui.anim.doAnimation)
                    $(".animpick").hide();
            },
            buttons: [ //Go button controls date range animation, share controls gif generation
                playButton, GIFButton
            ]
        });

        //Create the interval radio buttons here
        var intervalHTML = "<input type='radio' id='wv-day' class='wv-interval' name='radios' value='day' checked/>" +
                                "<label for='wv-day' class='ui-button ui-widget'>Day</label>" +
                            "<input type='radio' id='wv-month' class='wv-interval' name='radios' value='month'/>" +
                                "<label for='wv-month' class='ui-button ui-widget'>Month</label>" +
                            "<input type='radio' id='wv-year' class='wv-interval' name='radios' value='year'/>" +
                                "<label for='wv-year' class='ui-button ui-widget'>Year</label>";
        $dialog_sel.append(intervalHTML);
        $(".wv-interval").click(function() {
            interval = $(this).attr("value");
        });

        $(document)
            .mouseleave(function() {
                if ( ui.anim.active )
                    animateEnd();
                })
            .keydown(function(event) {
                switch ( event.keyCode ) {
                    case wv.util.key.LEFT:
                        animateReverse(interval);
                        event.preventDefault();
                        break;
                    case wv.util.key.RIGHT:
                        animateForward(interval);
                        event.preventDefault();
                        break;
                }
            })
            .keyup(function(event) {
                if ( event.target.nodeName === "INPUT" ) {
                    return;
                }
                switch ( event.keyCode ) {
                    case wv.util.key.LEFT:
                    case wv.util.key.RIGHT:
                        animateEnd();
                        event.preventDefault();
                        break;
                }
            });
        // bind click action to interval radio buttons
        var $buttons = $('.button-input-group');
        $buttons.unbind();

        // FIXME: Quick fix for fixing the propagation
        // of events with arrow keys and input field
        $buttons.keydown(function(event){
            var interval = $(this).attr('id').split('-')[0];
            event.stopPropagation();
            if( event.keyCode === (wv.util.key.LEFT || wv.util.key.RIGHT) ) {
                event.preventDefault();
                $(this).select().focus();
            }
            else if ( event.keyCode === (wv.util.key.UP) ) {
                event.preventDefault();
                roll(interval, 1);
                $(this).select().focus();
            }
            else if ( event.keyCode === (wv.util.key.DOWN) ) {
                event.preventDefault();
                roll(interval, -1);
                $(this).select().focus();
            }
            
        });

        $buttons.on('focus',function(e){
            e.preventDefault();
            $buttons.siblings('.date-arrows').css('visibility','');
            $buttons.parent().removeClass('selected');
            $(this).parent().addClass('selected');
            $(this).siblings('.date-arrows').css('visibility','visible');
        });

        $buttons.focusout(function(){
            $buttons.siblings('.date-arrows').css('visibility','');
            $buttons.parent().removeClass('selected');
        });

        var $incrementIntDate = $('.date-arrow-up');
        $incrementIntDate.click(roll);
        $incrementIntDate.mousedown(function(e){
            e.preventDefault();
        });

        var $decrementIntDate = $('.date-arrow-down');
        $decrementIntDate.click(roll);
        $decrementIntDate.mousedown(function(e){
            e.preventDefault();
        });

        //select all input on focus
        $('input').focus(function(){
            $(this).select();
        }).mouseup(function(e){
            e.preventDefault();
        });

        $buttons
            .keydown(validateInput)
            .focusout(function(event) {
                if ( $(this).hasClass("focus") ) {
                    $(this).removeClass("focus");
                    validateInput.call(this, event);
                }
            })
            .focus(function() {
                $(this).addClass("focus");
            });

        $("#focus-guard-1").on('focus',function(){
            $("#day-input-group").focus().select();
        });
        $("#focus-guard-2").on('focus',function(){
           $("#year-input-group").focus().select();
        });

        if (wv.util.browser.tests.touchDevice()){
            $buttons.prop('disabled', true);
        }

        self.update();

    };

    init();
    return self;
};
