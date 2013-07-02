/*
Copyright (c) 2012 Sergio Gabriel Teves
All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($, undefined ) {

    $.widget( "mobile.jqmMobiscroll", $.mobile.widget, {
        options: {
            theme: 'jqm',
            preset: 'date',
            animate: 'pop'
        },
        _create: function() {
            var input = this.element,
                o = $.extend(this.options, input.jqmData('options'));
            input.mobiscroll(o);
        }
    });

    $(document).bind("pagebeforecreate", function(c) {
        // Convert date inputs to normal inputs
        $('input[type="date"]:jqmData(role="mobiscroll")', c.target).prop('type', 'text');
    });

    $(document).bind("pagecreate create", function(c) {
        $(document).trigger("mobiscrollbeforecreate");

        $(':jqmData(role="mobiscroll")', c.target).each(function() {
            if (typeof ($(this).data("mobiscroll")) === "undefined") {
                $(this).jqmMobiscroll();
            }
        })
    });

})( jQuery );

