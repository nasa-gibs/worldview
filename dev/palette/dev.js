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
        method: "rgb",
        stops: [
            { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
            { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
        ]        
    };

    r2g_hsl = {
        method: "hsl",
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

    /** Red to Green */
    new ColorBar({
        selector: "#r2g-2",
        bins: 2,
        palette: r2g
    });
    new ColorBar({
        selector: "#r2g-3",
        bins: 3,
        palette: r2g
    });
    new ColorBar({
        selector: "#r2g-10",
        bins: 10,
        palette: r2g
    });
    new ColorBar({
        selector: "#r2g-100",
        bins: 100,
        palette: r2g
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
   
});
