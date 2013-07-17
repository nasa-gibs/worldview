$(function() {   
    var ColorBar = Worldview.Palette.ColorBar;
    
    var palettes = [];
    var showBins = [2, 3, 10, 100];
        
    b2w = {
        id: "b2w",
        name: "Black to White",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
        ]
    };
    palettes.push(b2w);
    
    r2g_rgb = {
        id: "r2g_rgb",
        name: "Red to Green, RGB",
        interpolate: "rgb",
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };
    palettes.push(r2g_rgb);

    r2g_rgb = {
        id: "r2g_hsl",
        name: "Red to Green, HSL",
        interpolate: "hsl",
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };
    palettes.push(r2g_rgb);    
    
    g2r = {
        id: "g2r",
        name: "Green to Red",
        stops: [
            { at: 0.0, r: 0x00, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]        
    };
    palettes.push(g2r);
    
    r2g_alpha = {
        id: "r2g_alpha",
        name: "10% Cutoffs",
        min: 0.1,
        max: 0.9,
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };
    palettes.push(r2g_alpha);
    
    byr = {
        id: "byr",
        name: "Blue-Yellow-Red",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.5, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    palettes.push(byr);
    
    byr_right = {
        id: "byr_right",
        name: "Yellow at 80%",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.8, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    palettes.push(byr_right);
    
    bgyr_solid = {
        id: "bgyr_solid",
        name: "BGYR Solid",
        type: "solid",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.6, r: 0x00, g: 0xff, b: 0x00 },
            { at: 0.8, r: 0xff, g: 0xff, b: 0x00 },
            { at: 0.95, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    palettes.push(bgyr_solid);
    
    circle = {
        id: "circle",
        name: "Hue Shortest",
        stops: [
            { at: 0.0, r: 0xec, g: 0x1b, b: 0x1b }, // Hue 0 degrees
            { at: 1.0, r: 0xec, g: 0x1b, b: 0x1e }  // Hue 359 degrees
        ]
    }
    palettes.push(circle);
    
    classified = {
        id: "classified",
        name: "Classified",
        table: [
            { r: 0x18, g: 0x18, b: 0x80 },
            { r: 0x21, g: 0x8a, b: 0x21 },
            { r: 0x32, g: 0xcd, b: 0x31 },
            { r: 0x9a, g: 0xcd, b: 0x32 },
            { r: 0x99, g: 0xf9, b: 0x97 },
            { r: 0x90, g: 0xbb, b: 0x8e },
            { r: 0xbc, g: 0x8e, b: 0x90 },
            { r: 0xf5, g: 0xde, b: 0xb4 },
            { r: 0xda, g: 0xeb, b: 0x9d },
            { r: 0xff, g: 0xd6, b: 0x00 }  
        ]
    }
    palettes.push(classified);
    
    byrStopped = {
        id: "byr-stopped",
        name: "BYR, Stopped",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.5, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    byrBins = [1, 2, 4, 8];
    byrStops = [
        [0.0],
        [0.0, 0.75],
        [0.0, 0.50, 0.80, 0.90],
        [0.0, 0.20, 0.50, 0.70, 0.80, 0.85, 0.90, 0.95] 
    ];
        
    var template = Handlebars.compile([
        '<td>',          
            '<div class="layer">',
                '<span class="name">{{name}}: {{bins}} Bins</span>',
                '<div>',
                    '<canvas class="palette" id="{{id}}-{{bins}}"></canavs>',
                 '</div>',
            '</div>',   
        '</td>'].join("\n"));
    
    var addRow = function(palette, binsArray) {
        var row = "";
        for ( var iBins = 0; iBins < binsArray.length; iBins++ ) {
            var bins = binsArray[iBins];
            row += template({
                id: palette.id,
                name: palette.name,
                bins: bins
            });
        }
        $("#colorBars").append("<tr>" + row + "</tr>");        
    }
    
    for ( var iPalette = 0; iPalette < palettes.length; iPalette++ ) {
        var palette = palettes[iPalette];
        addRow(palette, showBins);
    }
    addRow(byrStopped, [1, 2, 4, 8]);

    for ( var iPalette = 0; iPalette < palettes.length; iPalette++ ) {
        var palette = palettes[iPalette];
        for ( var iBins = 0; iBins < showBins.length; iBins++ ) {
            var bins = showBins[iBins];
            ColorBar({
                selector: "#" + palette.id + "-" + bins,
                bins: bins,
                palette: palette
            });       
        }
    } 
    $.each(byrStops, function(index, stops) {
        var bins = byrBins[index];
        ColorBar({
            selector: "#" + byrStopped.id + "-" + bins,
            bins: bins,
            palette: byrStopped,
            stops: stops
        });    
    });
});
