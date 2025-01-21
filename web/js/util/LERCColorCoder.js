/*
* This is the basic client that will attempt to get data out of LERC tiles.
* The data from each tile of the LERC data set is stored into an array under the
* correct layer during tile load, and each time the map is moved around, zoomed, etc.,
* the visible lerc tiles are drawn based on user given parameters like color and
* range.
*/
import LERC from "./LercCodec";
import * as colorScales from "./color_scales";
import {
    getPalette,
    getPaletteLegend,
  } from '../modules/palettes/selectors';

/* Stores all the pixel data for each layer */
var layer_array = new Array();
//var defaultNoDataValue = -3.4027999387901484e38;
// 65535 is the default for VIIRS Nighttime
var defaultNoDataValue = 65535;
var DEFAULT_MIN_RANGE = 0;
var DEFAULT_MAX_RANGE = 300;

/*
* Given the name of the layer (will be the key) and the array of values of a
* tile, it will store it in the layer_array. How to access an element of layer_array:
* layer_array[layer_name]
* Each element of layer_array[layer_name] is a tile, which has the accessible properties
* coord and values, accessible by tile["coord"] and tile["values"]
*/

/* Stores the tile into the layer_array */
function storePixels(tile, layer_name) {
    var layer_exists = false;
    for (let key in layer_array) {
        if (key == layer_name) {
            layer_exists = true;
        }
    }
    /* If the layer does not exist yet, create it */
    if (!layer_exists) {
        layer_array[layer_name] = [];
    }
    layer_array[layer_name].push(tile);
}

/**
 * @param {any} value Could be a string like "[25]" or "[1,2)" or could just be a
 *  regular "5" in which case just return 5
 * @param {num} min true for min and false for max
 */
function parseMinOrMax(value, min) {
    if (Array.isArray(value)) {
        return min ? value[0] : value[value.length - 1];
    } else {
        return value;
    }
}

/**
 * GRACEAL add comment here
 * @param {*} tile
 * @param {*} src
 * @param {*} layer
 * @param {*} map
 * @param {*} state
 * @param {*} tilegrid
 */
export function tileLoader(tile, src, layer, map, state, tilegrid) {
    console.log("graceal1 in tileloader function");
    console.log(tile);
    console.log(src);
    console.log(layer);
    console.log(map);
    console.log(tilegrid);
    console.log(layer.title);
    const lercCodec = new LERC();
    const img = tile.getImage();
    const STATE_LOADING = 1;
    const STATE_LOADED = 2;
    const STATE_ERROR = 3;
    // load in the image with crossOrigin allowances
    tile.state = STATE_LOADING;
    tile.changed();
    let view = map.getView();
    console.log("graceal1 map view is ");
    console.log(view);
    fetch(src)
        .then(response => {
            return response.arrayBuffer();
        })
        .then(buffer => {
            console.log("graceal1 successfully got the lerc layer request");
            // graceal how do I find no data value?
            //let noDataValue = determineNoDataValue(layer.get("id"));
            const decodedData = lercCodec.decode(buffer, { returnMask: true });
            const { pixelData, width, height } = decodedData;
            /*console.log("graceal1 checking pixelData for no data values");
            pixelData.forEach(pixel => {
                if (pixel == noDataValue) console.log("graceal1 match found with no data value");
            })*/
            var tileStoring = [];
            tileStoring["coord"] = tile.getTileCoord();
            //storePixels(tileStoring, layer.get("id"));

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            /*const imageData = ctx.createImageData(width, height);
            for (let i = 0; i < pixelData.length; i++) {
                imageData.data[i * 4] = pixelData[i]; // Red
                imageData.data[i * 4 + 1] = pixelData[i]; // Green
                imageData.data[i * 4 + 2] = pixelData[i]; // Blue
                imageData.data[i * 4 + 3] = 255; // Alpha
            }*/
            //let tilegrid = mapLayer.getSource().getTileGrid();
            let zoom = tilegrid.getZForResolution(view.getResolution(), 0);

            /*console.log("graceal1 pixelData");
            console.log(pixelData);
            console.log(src);
            let valuesOver400 = 0;
            let locations = [];
            let index = 0;
            pixelData.forEach(value => {
                if (value > 1000 && value != defaultNoDataValue) {
                    valuesOver400 += 1;
                    locations.push(index);
                }
                index+=1;
            });
            console.log("graceal1 pixel values over 1000");
            console.log(valuesOver400);
            console.log(locations);
            let locations = [];
            let count = 0;
            let index = 0;
            let maximum = 0;
            console.log("graceal1 locations that match number:")
            pixelData.forEach(value => {
                if (value == 583) {
                    count+=1;
                    locations.push(index);
                    console.log("i="+index+" col= "+(parseInt(index/tilegrid.getTileSize(zoom)))+ " row= "+(index%tilegrid.getTileSize(zoom)));
                }
                if (value > maximum && value!=defaultNoDataValue) maximum = value;
                index+=1;
            });
            console.log("graceal1 pixel values that equal 583");
            console.log(count);
            console.log(locations);
            console.log("graceal1 maximum is ");
            console.log(maximum);*/

            // copy pixelData to new array with a deep copy, and pass that into drawTiles

            let size = tilegrid.getTileSize(zoom);
            let difference = false; // graceal this might need to change at some point
            let average = false; // graceal this might need to change at some point
            let opacity = 255;
            let filter = false;
            console.log("graceal1 layer is ");
            console.log(layer);
            const palette = getPalette(layer.id, 0, "active", state);
            const legend = getPaletteLegend(layer.id, 0, "active", state);
            console.log("graceal1 trying to get palette and legend");
            console.log(palette);
            console.log(legend);
            let color_scale = palette.legend.colors;
            console.log("graceal1 color_scale is ");
            console.log(color_scale);

            const max = palette.legend.colors.length - 1;
            const start = palette.min ? legend.refs.indexOf(palette.entries.refs[palette.min]) : 0;
            const end = palette.max ? legend.refs.indexOf(palette.entries.refs[palette.max]) : max;
            console.log("graceal1 min and max are");
            console.log(start);
            console.log(end);
            console.log(max);

            drawTile(
                pixelData,
                ctx,
                tile, //or maybe img? was visibleTiles before
                tilegrid,
                size,
                color_scale,
                start /*this is wrong range[0], 0 works well*/,
                end /*this is wrong range[1], 300 works well*/,
                opacity, // this could be adjusted one day, but fine for now
                filter, // this could be adjusted one day, but fine for now (this would mean range values need to be correct)
                difference,
                average,
                map
            );
            //ctx.putImageData(imageData, 0, 0);
            img.decodedPixels = pixelData;
            img.src = canvas.toDataURL();
            tile.state = STATE_LOADED;
            tile.changed();
            //time_elapsed = new Date().getTime() - time_elapsed;
            //console.log("GRACEAL" + time_elapsed);
        })
        .catch(error => {
            console.error("Tile loading error:", error);
            tile.state = STATE_ERROR;
            tile.changed();
        });
}

function determineNoDataValue(id) {
    if (id === "VIIRS_VNP46A1_LERC_v1" || id === "humanCflux") {
        return 65535;
    } else {
        return 1000000000000000;
    }
}

/* Given an array, stores all tiles within the extent of the foreachtileinextent loop within the array */
function findTilesInExtent(tile_coord, layer_name, tile_array) {
    var tiles = layer_array[layer_name];
    for (let i = 0; i < tiles.length; i++) {
        var coord = tiles[i]["coord"];
        if (coord[0] == tile_coord[0] && coord[1] == tile_coord[1] && coord[2] == tile_coord[2]) {
            tile_array.push(tiles[i]);
            break;
        }
    }
}

/* Finds the top left pixel that specifies where a tile should be drawn from */
function findDrawTilePixel(tilegrid, tile_coord, map) {
    var extent = tilegrid.getTileCoordExtent(tile_coord);
    var coord = [extent[0], extent[3]];
    var pixel = map.getPixelFromCoordinate(coord);
    return pixel;
}

function getImgData(mapLayer, tileCoord) {
    //var imgData = mapLayer.getSource().a.get(tileCoord.join("/")).g;
    // no .a now, other interesting fields are tileCache
    //return imgData.decodedPixels.pixelData;
    /*for (let i = 0; i < pixelData.length; i++) {
        imageData.data[i * 4] = pixelData[i]; // Red
        imageData.data[i * 4 + 1] = pixelData[i]; // Green
        imageData.data[i * 4 + 2] = pixelData[i]; // Blue
        imageData.data[i * 4 + 3] = 255; // Alpha
    }
    return imageData;*/
    //console.log("graceal1 imageData is ");
    //console.log(mapLayer.getSource().tileCache.get(tileCoord.join("/")).getImage().decodedPixels);
    return mapLayer
        .getSource()
        .tileCache.get(tileCoord.join("/"))
        .getImage().decodedPixels;
}

function getNoDataValue(mapLayer, tileCoord) {
    //var noDataValue = mapLayer.getSource().a.get(tileCoord.join("/")).g;
    //return noDataValue.decodedPixels.noDataValue;
    // graceal this shouldnt be hard coded
    //return -3.4027999387901484e38;
    return 65535;
}

function getRange(pixelData) {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    let tempArray = pixelData.slice();
    tempArray.sort();
    //console.log("graceal1 sorted array is ");
    //console.log(tempArray);
    pixelData.forEach(pixel => {
        if (pixel < min && pixel != defaultNoDataValue) min = pixel;
        if (pixel > max) max = pixel;
    });
    max = tempArray[tempArray.length - 4];
    return [min, max];
}

/*
* Draws a tile at the starting pixel with the given size, opacity, and
* using the color_scale and min, max specified.
*/
function drawTile(
    pixelData,
    context,
    tile,
    tilegrid,
    size,
    color_scale,
    min,
    max,
    opacity,
    filter,
    difference,
    average,
    map
) {
    /* For each tile, find the pixels it contains and draw the appropriate color in that pixel */
    //for (let i = 0; i < tiles.length; i++) {
    //var tile = tiles[i];
    var tile_coord = tile.getTileCoord(); // was: var tile_coord = tile["coord"];
    var pixel = findDrawTilePixel(tilegrid, tile_coord, map);
    pixel = [Math.round(pixel[0]), Math.round(pixel[1])];
    var image = context.createImageData(size, size);
    // graceal I am not sure if setting values to pixelData is correct
    var values = pixelData; //getImgData(image, pixelData, tile_coord).slice();
    var new_values = values.slice();
    var no_data_value = defaultNoDataValue;

    if (average) {
        // graceal sst_layer needs to be replaced
        var values1 = getImgData(sst_layer, tile_coord);
        var values2 = getImgData(sst_layer_2, tile_coord);
        for (let j = 0; j < values.length; j++) {
            if (values1[j] == no_data_value) {
                if (values2[j] == no_data_value) {
                    new_values[j] = no_data_value;
                } else {
                    new_values[j] = values2[j];
                }
            } else {
                if (values2[j] == no_data_value) {
                    new_values[j] = values1[j];
                } else {
                    new_values[j] = (values1[j] + values2[j]) / 2;
                }
            }
        }
    }

    if (difference) {
        var values1 = getImgData(sst_layer, tile_coord);
        var values2 = getImgData(sst_layer_2, tile_coord);
        for (let j = 0; j < values.length; j++) {
            if (values1[j] == no_data_value) {
                if (values2[j] == no_data_value) {
                    new_values[j] = no_data_value;
                } else {
                    new_values[j] = values2[j];
                }
            } else {
                if (values2[j] == no_data_value) {
                    new_values[j] = values1[j];
                } else {
                    new_values[j] = values1[j] - values2[j];
                }
            }
        }
    }

    if (difference || average) {
        values = new_values;
    }
    /* If the filter is not on, display everything, just make numbers above max max color and below min min color */
    if (!filter) {
        for (let j = 0; j < values.length; j++) {
            var value = values[j];
            if (value != no_data_value) {
                if (value < min) {
                    value = min;
                }
                if (value > max) {
                    value = max;
                }
                var colors = color(color_scale, value, min, max);
                image.data[j * 4] = colors[0];
                image.data[j * 4 + 1] = colors[1];
                image.data[j * 4 + 2] = colors[2];
                image.data[j * 4 + 3] = opacity;
            } else {
                image.data[j * 4] = 0;
                image.data[j * 4 + 1] = 0;
                image.data[j * 4 + 2] = 0;
                image.data[j * 4 + 3] = 0;
            }
        }
    } else {
        /* If the filter is on, do not display pixels below min and above max */
        for (let j = 0; j < values.length; j++) {
            var value = values[j];
            if (value != no_data_value && value > min && value < max) {
                var colors = color(color_scale, value, min, max);
                image.data[j * 4] = colors[0];
                image.data[j * 4 + 1] = colors[1];
                image.data[j * 4 + 2] = colors[2];
                image.data[j * 4 + 3] = opacity;
            } else {
                image.data[j * 4] = 0;
                image.data[j * 4 + 1] = 0;
                image.data[j * 4 + 2] = 0;
                image.data[j * 4 + 3] = 0;
            }
        }
    }
    /* Fixes issues with retina displays by drawing and scaling on a different canvas */
    var new_canvas = document.createElement("canvas");
    new_canvas.width = size * devicePixelRatio;
    new_canvas.height = size * devicePixelRatio;

    context.putImageData(image, 0, 0);
}

/* Judges whether or not two arrays have the same elements */
function isEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    arr1.sort();
    arr2.sort();

    for (var i = arr1.length; i--; ) {
        if (arr1[i][0] !== arr2[i][0] || arr1[i][1] !== arr2[i][1] || arr1[i][2] !== arr2[i][2]) {
            return false;
        }
    }

    return true;
}

/* All of the color functions */
var color = function(color, value, min, max) {
    switch (color) {
        case "Grayscale/Scalar":
            return colorScales.getGreyScalar(value, min, max);
            break;
        case "Grayscale/Logarithmic":
            return colorScales.getGreyLog(value, min, max);
            break;
        case "Jet/Scalar":
            return colorScales.getJetScalar(value, min, max);
            break;
        case "Jet/Logarithmic":
            return colorScales.getJetLog(value, min, max);
            break;
        case "Panoply-diff/Scalar":
            return colorScales.getPanoplyScalar(value, min, max);
            break;
        case "Panoply-diff/Logarithmic":
            return colorScales.getPanoplyLog(value, min, max);
            break;
        case "Parula/Scalar":
            return colorScales.getParulaScalar(value, min, max);
            break;
        case "Parula/Logarithmic":
            return colorScales.getParulaLog(value, min, max);
            break;
        case "Red-Blue/Scalar":
            return colorScales.getRedBlueScalar(value, min, max);
            break;
        case "Red-Blue/Logarithmic":
            return colorScales.getRedBlueLog(value, min, max);
            break;
        case "Cube-Helix/Scalar":
            return colorScales.getCubeHelixScalar(value, min, max);
            break;
        case "Cube-Helix/Logarithmic":
            return colorScales.getCubeHelixLog(value, min, max);
            break;
        case "Diverging":
            return colorScales.getDiverging(value, min, max);
            break;
    }
};

/* Finds and draws difference between two layers */
function findDifference(layer1, layer2, layer1_name, layer2_name) {
    var tile_array_1 = layer_array[layer1_name];
    var tile_array_2 = layer_array[layer2_name];
    for (i = 0; i < tile_array_1.length; i++) {
        for (j = 0; j < tile_array_2.length; j++) {
            var coord1 = tile_array_1[i]["coord"];
            var coord2 = tile_array_2[j]["coord"];
            if (coord1[0] == coord2[0] && coord1[1] == coord2[1] && coord1[2] == coord2[2]) {
                var tile = [];
                tile["coord"] = tile_array_1[i]["coord"];
                /* Find out if the tile is already in the tile difference array- if not, add it */
                var add_tile = true;
                for (k = 0; k < layer_array["difference"].length; k++) {
                    var coord = layer_array["difference"][k]["coord"];
                    if (
                        coord[0] == tile["coord"][0] &&
                        coord[1] == tile["coord"][1] &&
                        coord[2] == tile["coord"][2]
                    ) {
                        add_tile = false;
                    }
                }
                if (add_tile) {
                    var imgData1 = getImgData(layer1, tile_array_1[i]["coord"]);
                    var imgData2 = getImgData(layer2, tile_array_2[j]["coord"]);
                    var no_data_value = getNoDataValue(layer1, tile_array_1[i]["coord"]);
                    for (k = 0; k < imgData1.length; k++) {
                        var value = imgData1[k] - imgData2[k];
                        if (imgData1[k] == no_data_value) {
                            if (imgData2[k] == no_data_value) {
                                value = no_data_value;
                            } else {
                                value = imgData2[k];
                            }
                        } else {
                            if (imgData2[k] == no_data_value) {
                                value = imgData1[k];
                            }
                        }
                    }
                    layer_array["difference"].push(tile);
                }
            }
        }
    }
}

/* Finds average between two layers */
function findAverage(layer1_name, layer2_name) {
    var tile_array_1 = layer_array[layer1_name];
    var tile_array_2 = layer_array[layer2_name];
    for (i = 0; i < tile_array_1.length; i++) {
        for (j = 0; j < tile_array_2.length; j++) {
            var coord1 = tile_array_1[i]["coord"];
            var coord2 = tile_array_2[j]["coord"];
            if (coord1[0] == coord2[0] && coord1[1] == coord2[1] && coord1[2] == coord2[2]) {
                var tile = [];
                tile["coord"] = tile_array_1[i]["coord"];
                /* Find out if the tile is already in the tile average array- if not, add it */
                var add_tile = true;
                for (k = 0; k < layer_array["average"].length; k++) {
                    var coord = layer_array["average"][k]["coord"];
                    if (
                        coord[0] == tile["coord"][0] &&
                        coord[1] == tile["coord"][1] &&
                        coord[2] == tile["coord"][2]
                    ) {
                        add_tile = false;
                    }
                }
                if (add_tile) {
                    tile["values"] = [];
                    var no_data_value = tile_array_1[i]["no_data_value"];
                    for (k = 0; k < tile_array_1[i]["values"].length; k++) {
                        var value =
                            (tile_array_1[i]["values"][k] + tile_array_2[j]["values"][k]) / 2;
                        /* If both tiles have no value, the average is no value, if only one has a value, average is that value */
                        if (tile_array_1[i]["values"][k] == no_data_value) {
                            if (tile_array_2[j]["values"][k] == no_data_value) {
                                value = no_data_value;
                            } else {
                                value = tile_array_2[j]["values"][k];
                            }
                        } else {
                            if (tile_array_2[j]["values"][k] == no_data_value) {
                                value = tile_array_1[i]["values"][k];
                            }
                        }
                        tile["no_data_value"] = no_data_value;
                        tile["values"].push(value);
                    }
                    layer_array["average"].push(tile);
                }
            }
        }
    }
}

export function findMatchingCoordinate(map, pixel, layer) {
    console.log("graceal1 in findMatching coordinate");
    let coordChecking = [-95.5941, 29.9202];
    let checkingThreshold = 0.0001;
    // find match with exact coordinate
    for (let i = 0; i < 5; i += 0.00001) {
        let pixel1 = [pixel[0] + i, pixel[1] + i];
        let pixel2 = [pixel[0] - i, pixel[1] + i];
        let pixel3 = [pixel[0] + i, pixel[1] - i];
        let pixel4 = [pixel[0] - i, pixel[1] - i];
        let coordinate1 = map.getCoordinateFromPixel(pixel1);
        let coordinate2 = map.getCoordinateFromPixel(pixel2);
        let coordinate3 = map.getCoordinateFromPixel(pixel3);
        let coordinate4 = map.getCoordinateFromPixel(pixel4);
        if (
            Math.abs(coordinate1[0] - coordChecking[0]) < checkingThreshold &&
            Math.abs(coordinate1[1] - coordChecking[1]) < checkingThreshold
        ) {
            console.warn("graceal1 found match with almost exact coordinate");
            console.log(pixel1);
            console.log(coordinate1);
            console.log(findValue(map, pixel1, layer, false));
        }
        if (
            Math.abs(coordinate2[0] - coordChecking[0]) < checkingThreshold &&
            Math.abs(coordinate2[1] - coordChecking[1]) < checkingThreshold
        ) {
            console.warn("graceal1 found match with almost exact coordinate");
            console.log(pixel2);
            console.log(coordinate2);
            console.log(findValue(map, pixel2, layer, false));
        }
        if (
            Math.abs(coordinate3[0] - coordChecking[0]) < checkingThreshold &&
            Math.abs(coordinate3[1] - coordChecking[1]) < checkingThreshold
        ) {
            console.warn("graceal1 found match with almost exact coordinate");
            console.log(pixel3);
            console.log(coordinate3);
            console.log(findValue(map, pixel3, layer, false));
        }
        if (
            Math.abs(coordinate4[0] - coordChecking[0]) < checkingThreshold &&
            Math.abs(coordinate4[1] - coordChecking[1]) < checkingThreshold
        ) {
            console.warn("graceal1 found match with almost exact coordinate");
            console.log(pixel4);
            console.log(coordinate4);
            console.log(findValue(map, pixel4, layer, false));
        }
    }
}

/* Finds the value where the mouse currently is */
export function findValue(map, pixel, layer, findMatching = true) {
    //var pixel = [mousePosition[0], mousePosition[1]];
    //if (findMatching) findMatchingCoordinate(map, pixel, layer);
    var coord = map.getCoordinateFromPixel(pixel); // this line seems to be correct
    var tilegrid = layer.getSource().getTileGrid();
    //console.log("graceal1 tilegrid");
    //console.log(tilegrid);
    var tileCoord = tilegrid.getTileCoordForCoordAndResolution(
        coord,
        map.getView().getResolution()
    );
    /*console.log("graceal1 map resolution is");
    console.log(map.getView().getResolution());
    console.log("graceal1 tileCoord is");
    console.log(tileCoord);*/

    var tile_extent = tilegrid.getTileCoordExtent(tileCoord); // this seems right
    //console.log("graceal1 tile_extent is");
    //console.log(tile_extent);
    var tilePixel = map.getPixelFromCoordinate([tile_extent[0], tile_extent[3]]);
    /*console.log("graceal1 tilePixel is ");
    console.log(tilePixel);
    console.log("graceal1 pixel is");
    console.log(pixel);*/
    var row = pixel[0] - tilePixel[0];
    var column = pixel[1] - Math.round(tilePixel[1]);
    var zoom = tilegrid.getZForResolution(map.getView().getResolution()); // this seems to be correct
    /*console.log("graceal1 zoom is ");
    console.log(zoom);
    console.log(tilegrid.getTileSize(zoom));
    console.log("graceal1 row and column are ");
    console.log(column);
    console.log(row);*/
    var i = Math.round(column * tilegrid.getTileSize(zoom) + row);
    //if (row > tilegrid.getTileSize(zoom))
    //    console.warn("graceal1 instance where row is greater than tile size");
    var tile;
    var x = tileCoord[1];
    var y = tileCoord[2];
    var z = tileCoord[0];
    /*var layer_name_1 = layer_name;
    if (layer_name == "difference") {
        layer_name_1 = "sst";
    }
    if (layer_name == "average") {
        layer_name_1 = "sst";
    }
    var tile_array = layer_array[layer_name_1];
    for (j = 0; j < tile_array.length; j++) {
        var coord = tile_array[j]["coord"];
        if (coord[0] == z && coord[1] == x && coord[2] == y) {
            tile = tile_array[j];
            break;
        }
    }*/
    var value = getImgData(layer, tileCoord)[i];
    /*console.log("graceal1 i is ");
    console.log(i);
    console.log(tilegrid.getTileSize(zoom));
    console.log(column);
    console.log(row);
    console.log("graceal1 value is ");
    console.log(value);*/
    /*console.log(" with coord");
    console.log(coord);
    console.log(tileCoord);
    console.log("graceal1 with i");
    console.log(i);*/

    /*if (layer_name == "difference") {
        if (getImgData(sst_layer, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
            if (getImgData(sst_layer_2, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
                value = "N/A";
            } else {
                value = getImgData(sst_layer_2, tileCoord)[i];
            }
        } else {
            if (getImgData(sst_layer_2, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
                value = getImgData(sst_layer, tileCoord)[i];
            }
        }
        value = getImgData(sst_layer, tileCoord)[i] - getImgData(sst_layer_2, tileCoord)[i];
    }

    if (layer_name == "average") {
        if (getImgData(sst_layer, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
            if (getImgData(sst_layer_2, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
                value = "N/A";
            } else {
                value = getImgData(sst_layer_2, tileCoord)[i];
            }
        } else {
            if (getImgData(sst_layer_2, tileCoord)[i] == getNoDataValue(sst_layer, tileCoord)) {
                value = getImgData(sst_layer, tileCoord)[i];
            }
        }
        value = (getImgData(sst_layer, tileCoord)[i] + getImgData(sst_layer_2, tileCoord)[i]) / 2;
    }
    var layer;
    if (layer_name == "carbon") {
        layer = carbon_layer;
    } else {
        layer = sst_layer;
    }*/
    if (value == getNoDataValue(layer, tileCoord)) {
        value = "N/A";
    }

    return value;
}

/* Finds the intersection of two extents and returns the extent of that intersection rectangle */
function findIntersection(box_extent, tile_extent) {
    var x1 = Math.max(box_extent[0], tile_extent[0]);
    var y1 = Math.max(box_extent[1], tile_extent[1]);
    var x2 = Math.min(box_extent[2], tile_extent[2]);
    var y2 = Math.min(box_extent[3], tile_extent[3]);

    return [x1, y1, x2, y2];
}

var csv_data = [];

var data = [];
var dataX = [];
var dataY = [];
var data_exists = false;
var layer_index;

/*
 * Used to turn an array of values into an array of unique values and a corresponding
 * array of occurences of each unique value.
 * Ex.) [1, 2, 2, 3] --> [1, 2, 3], [1, 2, 1]
 */
function sortData(values) {
    var unique_values = [],
        value_counts = [],
        prev;

    values.sort(function(a, b) {
        return a - b;
    });
    for (var i = 0; i < values.length; i++) {
        if (values[i] !== prev) {
            unique_values.push(values[i]);
            value_counts.push(1);
        } else {
            value_counts[value_counts.length - 1]++;
        }
        prev = values[i];
    }

    return [unique_values, value_counts];
}