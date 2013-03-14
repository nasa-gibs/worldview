
(function(ns) {
    
    ns.repaint = function(layer) {
        $.each(layer.grid, function(index, row) {
            $.each(row, function(index, tile) {
                tile.repaint();
            });
        });
    };
    
})(Worldview.Map.PaletteSupport);
