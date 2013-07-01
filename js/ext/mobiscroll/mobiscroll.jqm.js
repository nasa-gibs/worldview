(function ($) {

    $.mobiscroll.themes.jqm = {
        defaults: {
            jqmBorder: 'a',
            jqmBody: 'c',
            jqmHeader: 'b',
            jqmWheel: 'd',
            jqmClickPick: 'c',
            jqmSet: 'b',
            jqmCancel: 'c'
        },
        init: function (elm, inst) {
            var s = inst.settings;
            $('.dw', elm).removeClass('dwbg').addClass('ui-overlay-shadow ui-corner-all ui-body-' + s.jqmBorder);
            $('.dwb-s span', elm).attr('data-role', 'button').attr('data-theme', s.jqmSet);
            $('.dwb-n span', elm).attr('data-role', 'button').attr('data-theme', s.jqmCancel);
            $('.dwb-c span', elm).attr('data-role', 'button').attr('data-theme', s.jqmCancel);
            $('.dwwb', elm).attr('data-role', 'button').attr('data-theme', s.jqmClickPick);
            $('.dwv', elm).addClass('ui-header ui-bar-' + s.jqmHeader);
            $('.dwwr', elm).addClass('ui-body-' + s.jqmBody);
            $('.dwpm .dwwl', elm).addClass('ui-body-' + s.jqmWheel);
            $('.dwpm .dwl', elm).addClass('ui-body-' + s.jqmBody);
            elm.trigger('create');
            // Hide on overlay click
            $('.dwo', elm).click(function () { inst.cancel(); });
        }
    };

})(jQuery);
