$(function() {    
    var ColorBar = SOTE.widget.palette.ColorBar;
    
    b2w = {
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
        ]
    };
    
    r2g = {
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };

    r2g_rgb = {
        interpolate: "rgb",
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };

    r2g_hsl = {
        interpolate: "hsl",
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };
    
    r2g_alpha = {
        min: 0.1,
        max: 0.9,
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };
            
    g2r = {
        stops: [
            { at: 0.0, r: 0x00, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]        
    };
    
    b2y2r = {
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.5, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };

    b2y2r_right = {
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.8, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    
    bgyr_solid = {
        type: "solid",
        stops: [
            { at: 0.0, r: 0x00, g: 0x00, b: 0xff },
            { at: 0.6, r: 0x00, g: 0xff, b: 0x00 },
            { at: 0.8, r: 0xff, g: 0xff, b: 0x00 },
            { at: 1.0, r: 0xff, g: 0x00, b: 0x00 }
        ]
    };
    
    circle = {
        stops: [
            { at: 0.0, r: 0xec, g: 0x1b, b: 0x1b }, // Hue 0 degrees
            { at: 1.0, r: 0xec, g: 0x1b, b: 0x1e }  // Hue 359 degrees
        ]
    }
           
   indexed = {
        type: "index",
        stops: [
            { at: 0, r: 0x00, g: 0x00, b: 0x00 },
            { at: 2, r: 0xff, g: 0x00, b: 0x00 },
            { at: 5, r: 0xff, g: 0x00, b: 0xff },
            { at: 9, r: 0xff, g: 0xff, b: 0xff },
        ]
    }
    
    /* Black to White */
    new ColorBar({
        selector: "#b2w-2",
        bins: 2,
        palette: b2w
    });
    new ColorBar({
        selector: "#b2w-3",
        bins: 3,
        palette: b2w
    });
    new ColorBar({
        selector: "#b2w-10",
        bins: 10,
        palette: b2w
    });
    new ColorBar({
        selector: "#b2w-100",
        bins: 100,
        palette: b2w
    });
    
    /** Red to Green, RGB */
    new ColorBar({
        selector: "#r2g-rgb-2",
        bins: 2,
        palette: r2g_rgb
    });
    new ColorBar({
        selector: "#r2g-rgb-3",
        bins: 3,
        palette: r2g_rgb
    });
    new ColorBar({
        selector: "#r2g-rgb-10",
        bins: 10,
        palette: r2g_rgb
    });
    new ColorBar({
        selector: "#r2g-rgb-100",
        bins: 100,
        palette: r2g_rgb
    });
    
    /** Red to Green, HSL */
    new ColorBar({
        selector: "#r2g-hsl-2",
        bins: 2,
        palette: r2g_hsl
    });
    new ColorBar({
        selector: "#r2g-hsl-3",
        bins: 3,
        palette: r2g_hsl
    });
    new ColorBar({
        selector: "#r2g-hsl-10",
        bins: 10,
        palette: r2g_hsl
    });
    new ColorBar({
        selector: "#r2g-hsl-100",
        bins: 100,
        palette: r2g_hsl
    });
    
    /* Red to Green, with Alpha */
    new ColorBar({
        selector: "#r2g-alpha-2",
        bins: 2,
        palette: r2g_alpha
    });
    new ColorBar({
        selector: "#r2g-alpha-3",
        bins: 3,
        palette: r2g_alpha
    });
    new ColorBar({
        selector: "#r2g-alpha-10",
        bins: 10,
        palette: r2g_alpha
    });
    new ColorBar({
        selector: "#r2g-alpha-100",
        bins: 100,
        palette: r2g_alpha
    });
    
    
    /** Green to Red */
    new ColorBar({
        selector: "#g2r-2",
        bins: 2,
        palette: g2r
    });
    new ColorBar({
        selector: "#g2r-3",
        bins: 3,
        palette: g2r
    });
    new ColorBar({
        selector: "#g2r-10",
        bins: 10,
        palette: g2r
    });
    new ColorBar({
        selector: "#g2r-100",
        bins: 100,
        palette: g2r
    });
    
    /* Blue to Yellow to Red */
   new ColorBar({
        selector: "#b2y2r-2",
        bins: 2,
        palette: b2y2r
   });
   new ColorBar({
        selector: "#b2y2r-3",
        bins: 3,
        palette: b2y2r
   });
   new ColorBar({
        selector: "#b2y2r-10",
        bins: 10,
        palette: b2y2r
   });
   new ColorBar({
        selector: "#b2y2r-100",
        bins: 100,
        palette: b2y2r
   });
   
    /* Blue to Yellow to Red - Mid to Right */
   new ColorBar({
        selector: "#b2y2r-right-2",
        bins: 2,
        palette: b2y2r_right
   });
   new ColorBar({
        selector: "#b2y2r-right-3",
        bins: 3,
        palette: b2y2r_right
   });
   new ColorBar({
        selector: "#b2y2r-right-10",
        bins: 10,
        palette: b2y2r_right
   });
   new ColorBar({
        selector: "#b2y2r-right-100",
        bins: 100,
        palette: b2y2r_right
   });
   
    /* Blue-Green-Yellow-Red Solid */
   new ColorBar({
        selector: "#bgyr-solid-2",
        bins: 2,
        palette: bgyr_solid
   });
   new ColorBar({
        selector: "#bgyr-solid-3",
        bins: 3,
        palette: bgyr_solid
   });
   new ColorBar({
        selector: "#bgyr-solid-10",
        bins: 10,
        palette: bgyr_solid
   });
   new ColorBar({
        selector: "#bgyr-solid-100",
        bins: 100,
        palette: bgyr_solid
   });
      
    /* Indexed */
   new ColorBar({
        selector: "#indexed-2",
        bins: 2,
        palette: indexed
   });
   new ColorBar({
        selector: "#indexed-3",
        bins: 3,
        palette: indexed
   });
   new ColorBar({
        selector: "#indexed-10",
        bins: 10,
        palette: indexed
   });
   new ColorBar({
        selector: "#indexed-100",
        bins: 100,
        palette: indexed
   });
   
    /* Hue Circle Test */
   new ColorBar({
        selector: "#circle",
        bins: 100,
        palette: circle
   });
   
   
   
});
