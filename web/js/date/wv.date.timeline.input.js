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
    var interval = 'day', dialogOpen = false;

    var $incrementBtn = $("#right-arrow-group");
    var $decrementBtn = $("#left-arrow-group");
	var $animateBtn   = $("#animate-arrow-group");

    var forwardNextDay = function(){ //FIXME: Limit animation correctly
        var nextDay = new Date(new Date(model.selected)
                               .setUTCDate(model.selected.getUTCDate()+1));
        if(nextDay <= wv.util.today())
            animateForward("day");
        else
            animateEnd();
    };

    var reversePrevDay = function(){ //FIXME: Limit animation correctly
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

    //TODO: Cleanup
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
                if ( ( newInput > 1000 ) && ( newInput < 9999 ) )
                    selectedDateObj = new Date(
                        ( new Date( model.selected ) )
                            .setUTCFullYear( newInput ) );
                break;
            case 'month-input-group':
                if ( ( $.isNumeric( newInput ) ) &&
                     ( newInput < 13 ) && ( newInput > 0 ) )
                {
                    selectedDateObj = new Date(
                        ( new Date( model.selected ) )
                            .setUTCMonth( newInput - 1 ) );
                }
                else{
                    var validStr = false;
                    var newIntInput;
                    newInput = newInput.toUpperCase();
                    
                    for ( var i=0; i < model.monthAbbr.length; i++ ) {
                        if ( newInput === model.monthAbbr[i] ) {
                            validStr = true;
                            newIntInput = i;
                        }
                    }
                    if ( validStr ){
                        selectedDateObj = new Date(
                            ( new Date( model.selected ) )
                                .setUTCMonth( newIntInput ) );
                    }
                }
                break;
            case 'day-input-group':
                if( newInput > 0 &&
                    newInput <= ( new Date ( model.selected.getYear(),
                                             model.selected.getMonth() + 1 ,0 )
                                  .getDate() ) )
                {
                    selectedDateObj = new Date(
                        ( new Date( model.selected ) ).setUTCDate( newInput ) );
                }
                break;
            }
            if( ( selectedDateObj > tl.data.start() ) &&
                ( selectedDateObj <= wv.util.today() ) )
            {
                var sib =  selected.parent().next('div.input-wrapper')
                    .find('input.button-input-group');

                if ( entered && sib.length < 1 )
                    $('#focus-guard-2').focus();

                model.select(selectedDateObj);

                $('.button-input-group').parent().css('border-color','');

                selected.parent().removeClass('selected');

                if (entered)
                    sib.select().addClass('selected');
            }
            else{
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
            $("#dialog").dialog("open");
            animateEnd(); //Let the animation end when another one is being set
            event.preventDefault();
        });

        //Add slider, labels, and input elements to dialog area
        var $speedHeader = $("<div></div>")
            .html("Speed")
            .addClass("wv-header");

        var $speedSlider = $("<div></div>")
            .noUiSlider({
                start: 2,
                step: 1,
                range: {
                    min: 1,
                    max: 30
                }
            }).on("slide", function() {
                $speedLabel.html(parseFloat($speedSlider.val()) + ' frames per second');
            });

        var $loopCheck = $("<input />")
            .addClass("wv-header")
            .attr("type", "checkbox")
            .attr("id", "loopcheck");

        var $speedLabel = $("<div></div>")
            .html('2 frames per second')
            .addClass("wv-label")
            .addClass("wv-label-speed")
            .addClass("wv-label-opacity");

        var $toLabel = $("<label></label>")
            .html(' to ')
            .attr("for", "to");

        var $fromDate = $("<input />")
            .addClass("wv-datepicker"),
            $toDate = $("<input />")
            .addClass("wv-datepicker");

        $fromDate.attr("id", "from").attr("type", "text").attr("name", "from").attr("readonly","true");
        $toDate.attr("id", "to").attr("type", "text").attr("name", "to").attr("readonly", "true");

        //set up the datepickers
        $fromDate.datepicker({
            changeMonth: true,
            changeYear: true,
            maxDate: 0, //can't choose date after today
            onSelect: function() {
                self.fromDate = $("#from").datepicker("getDate");
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
                self.toDate = $("#to").datepicker("getDate");
                console.log(self.toDate);
                //Move animation date picker in timeline according to the new date
                d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.toDate));
            }
        });

        $("#dialog").append($speedHeader).append($speedSlider).append($speedLabel)
                    .append($fromDate).append($toLabel).append($toDate).append("<br />").append($loopCheck).append('<label class="wv-header">Loop (Press an arrow key to cancel)</label>')
            .dialog({
            autoOpen: false,
            dialogClass: "wv-panel",
            title: "Play Animation",
            width: 300,
            show: { effect: "slide", direction: "down" },
            position: {
                my: "left bottom",
                at: "left top",
                of: $("#timeline-header")
            },
            open: function(event, ui) {
                $("#products").find("img").remove(); //remove generated gifs
                //Show datepickers and set from date range to be two weeks apart
                $(".animpick").show();
                if(self.fromDate === undefined) { //once per session
                    self.fromDate = new Date(model.selected.valueOf());
                    self.fromDate.setUTCDate(self.fromDate.getUTCDate() - 14);
                    $fromDate.datepicker("setDate", self.fromDate);
                    self.toDate = new Date(model.selected.valueOf());
                    $toDate.datepicker("setDate", self.toDate);
                }

                dialogOpen = true;
            },
            close: function(event, ui) {
                //Hide datepickers
                $(".animpick").hide();
                dialogOpen = false;
            },
            buttons: [ //Go button controls date range animation, other two control animation based on Days slider
                {
                    text: "Go",
                    click: function() {
                        prepareAnim($speedSlider);
                        ui.anim.customLoop = true;

                        //Compare the two dates in terms of milliseconds, divide it by milliseconds
                        //in a day to get the number of days to animate
                        if(animDateCheck()) {
                            //Get the time difference. Negative ranges are supported
                            var to = self.toDate.getTime(), from = self.fromDate.getTime();

                            //Get the number of frames to animate. Then divide it by 30 or 365 depending on interval
                            ui.anim.animDuration = to > from ? ((to - from) / (86400 * 1000)) + 1 : ((from - to) / (86400 * 1000)) + 1;
                            if(interval === 'month' && ui.anim.animDuration >= 30)
                                ui.anim.animDuration = Math.floor(ui.anim.animDuration /30) + 1;
                            else if(interval === 'year' && ui.anim.animDuration >= 365)
                                ui.anim.animDuration = Math.floor(ui.anim.animDuration /365) + 1;

                            $(this).dialog("close");

                            //initDate needs to be set separately
                            model.selected = new Date(self.fromDate.valueOf()); //clone fromDate
                            ui.anim.initDate = new Date(model.selected.valueOf());

                            if(to > from) { //set it back so animation starts at right date
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
                },
                {
                    text: "Share",
                    click: function() {
                        $(this).dialog("close"); //avoid error by closing dialog here
                        var a = [], from, to, jStart, jDate;
                        //Parse the fromDate and toDates to Juilan time
                        jStart = wv.util.parseDateUTC(self.fromDate.getUTCFullYear() + "-01-01");
                        jDate = "00" + (1+Math.ceil((self.fromDate.getTime() - jStart) / 86400000));
                        from = self.fromDate.getUTCFullYear()+(jDate).substr((jDate.length)-3);

                        jStart = wv.util.parseDateUTC(self.toDate.getUTCFullYear() + "-01-01");
                        jDate = "00" + (1+Math.ceil((self.toDate.getTime() - jStart) / 86400000));
                        to = self.toDate.getUTCFullYear()+(jDate).substr((jDate.length)-3);

                        //Determine interval for updating date
                        var delta;
                        if(interval === 'month')
                            delta = 30;
                        else if(interval === 'year')
                            delta = 365;
                        else
                            delta = 1;

                        for(var i = parseInt(from); i <= to; i += delta) { //Convert to integer first
                            a.push(wv.util.format('http://map2.vis.earthdata.nasa.gov/image-download?TIME={1}&extent=-2498560,-1380352,983040,2101248&epsg=3413&layers=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines&opacities=1,1&worldfile=false&format=image/jpeg&width=680&height=680', i));
                            //if the interval is in two years, take it to account
                            if(i.toString().indexOf("365") !== -1) //TODO:Better method to do roll over
                                i = parseInt(self.toDate.getUTCFullYear()+ "000");
                        }

                        gifshot.createGIF({
                            gifWidth: 320,
                            gifHeight: 320,
                            images: a
                        }, function (obj) {
                            if (!obj.error) {
                                var animatedImage = document.createElement('img');
                                animatedImage.src = obj.image;
                                $("#products").append(animatedImage); //place it somewhere viewable
                            }
                        });
                    }
                }
            ]
        });

        //Create the selectmenu here
        $('<br /><label>Interval: </label>').appendTo('#dialog');
        $('<select id="interval" />').appendTo('#dialog');
        $('<option value="day" selected="selected">Day</option>').appendTo('#interval');
        $('<option value="month">Month</option>').appendTo('#interval');
        $('<option value="year">Year</option>').appendTo('#interval');
        //Create the Jquery UI element. By default the width is 0px, change it to something more sane
        $("#interval").selectmenu({
            select: function(event, ui) {
                interval = ui.item.value;
            }
        });
        $("#interval-button").attr("style","width: 90px;");

        $(document)
            /*.mouseout(function() { //FIXME:this is a bug! fires far too often than it should when it should only fire when mouse exits browser
                if ( ui.anim.active )
                    animateEnd();
                })*/
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

        $buttons.focusout(function(e){
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
        $('input').focus(function(e){
            $(this).select();
        }).mouseup(function(e){
            e.preventDefault();
        });

        $('.button-input-group')
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
            $('.button-input-group').prop('disabled', true);
        }

        self.update();

    };

    init();
    return self;
};
