$(function() {    
    var ColorBar = Worldview.Visual.ColorBar;

    var onLoad = function(data, textStatus, jqXHR) {
        var colorBarTemplate = Handlebars.compile([
            '<div class="layer">',
                '<span class="name">{{name}}</span>',
                '<div>',
                    '<canvas class="palette" id="{{id}}"></canavs>',
                '</div>',
            '</div>'   
        ].join("\n"));
        
        for ( var i = 0; i < data.length; i++ ) {
            var entry = data[i];
            $("#palettes").append(colorBarTemplate({
                name: entry.name,
                id: entry.id
            }));
            ColorBar({
                selector: "#" + entry.id,
                bins: 255,
                palette: entry
            });
        }
    }
    
    var onError = function(jqXHR, textStatus, errorThrown) {
        console.log("onError");
        alert("ERROR: " + errorThrown);
    }
    
    $.ajax({
        url: "../../../data/palettes",
        dataType: "json",
        success: onLoad,
        error: onError
    });       
    
})

