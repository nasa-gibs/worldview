$(function() {    
    var ColorBar = Worldview.Palette.ColorBar;

    var onLoad = function(data, textStatus, jqXHR) {
        var colorBarTemplate = Handlebars.compile([
            '<div class="layer">',
                '<span class="name">{{name}}</span>',
                '<div>',
                    '<canvas class="palette" id="{{id}}"></canavs>',
                '</div>',
            '</div>'   
        ].join("\n"));
        
        var palettes = data.palettes;
        $.each(palettes, function(name, palette) {
            $("#palettes").append(colorBarTemplate({
                name: name,
                id: name
            }));
            ColorBar({
                selector: "#" + name,
                bins: 255,
                palette: palette
            });            
        });
    }
    
    var onError = function(jqXHR, textStatus, errorThrown) {
        console.log("onError");
        alert("ERROR: " + errorThrown);
    }
    
    $.ajax({
        url: "../../../data/config",
        dataType: "json",
        success: onLoad,
        error: onError
    });       
    
})

