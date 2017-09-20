# Testing
Note: Some of the parameters below may no longer be functional. Please contact us if you have any issues at support@earthdata.nasa.gov.

To run unit tests using Grunt, see the [Grunt Targets](https://github.com/nasa-gibs/worldview/blob/9781bcc3c177338bf3043f59c1ebe1a9d8ae4355/doc/developing.md#unit-tests) documentation

Append the following parameters to the URL to test using mock data.

## Permalinks

### External

<table>
  <colgroup>
    <col width="33%"/>
    <col width="33%"/>
    <col width="33%"/>
  </colgroup>
  <thead>
    <tr class="header">
      <th>Parameter</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="odd">
      <td>map</td>
      <td>
        <p>minX,minY,maxX,maxY</p>
      </td>
      <td>
        <p></p>
        <p>Extent of the map view port in units are based on the projection selected (degrees for EPSG:4326, meters for others)</p>
        <p></p>
      </td>
    </tr>
    <tr class="even">
      <td>products</td>
      <td>
        <p>baselayers,layer1,layer2~overlays,layer3,layer4</p>
      </td>
      <td>
        <p>Active layer list where layerX is the identifier of the layer as defined in the configuration file. Any number of layers may be specified in baselayers or overlays. Hidden layers are prefixed with a “!”. Delimiting layers with a “.” is supported
          but deprecated.</p>
      </td>
    </tr>
    <tr class="odd">
      <td>time</td>
      <td>
        <p>YYYY-MM-DD</p>
      </td>
      <td>
        <p>Selected UTC day.</p>
      </td>
    </tr>
    <tr class="even">
      <td>p</td>
      <td>X</td>
      <td>The selected projection. The value X may be either “geographic”, “arctic”, or “antarctic”</td>
    </tr>
    <tr class="odd">
      <td>palettes</td>
      <td>
        <p>layer1,palette1~layer2,palette2</p>
      </td>
      <td>
        <p>If present, assigns a custom palette to a layer where layerX is the identifier of the layer and paletteX is the identifier of the palette as defined in the configuration file. Any number of layer to palette mappings may be specified.</p>
      </td>
    </tr>
    <tr class="even">
      <td>opacity</td>
      <td>
        <p>layer1,value1~layer2,value2</p>
      </td>
      <td>
        <p>(Not officially supported at this time) If present, assigns an opacity value to a layer where layerX is the identifier of the layer as defined in the configuration file, and valueX is a real number in the range of 0 to 1 where 0 is fully
          transparent and 1 is fully opaque. Any number of layer to opacity value mappings may be specified.</p>
      </td>
    </tr>
    <tr class="odd">
      <td>dataDownload</td>
      <td>X</td>
      <td>
        <p>If preset, activates the data download tab and selects the product X where X is the product identifier as defined in the configuration file.</p>
      </td>
    </tr>
  </tbody>
</table>

### Internal

<table>
  <colgroup>
    <col width="33%"/>
    <col width="33%"/>
    <col width="33%"/>
  </colgroup>
  <thead>
    <tr class="header">
      <th>Parameter</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="odd">
      <td>epsg</td>
      <td>X</td>
      <td>
        <p>The current EPSG code for the selected projection where X is either:</p>
        <ul>
          <li>4326: Geographic</li>
          <li>3413: Arctic</li>
          <li>3995: Arctic (older data)</li>
          <li>3031: Antarctic</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

### Debugging

<table>
  <tbody>
    <tr>
      <th>Parameter</th>
      <th colspan="1">Value</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>mockCMR</td>
      <td colspan="1">X</td>
      <td>Do not query CMR and fetch the static JSON file found at mock/cmr.cgi-X</td>
    </tr>
    <tr>
      <td colspan="1">timeoutCMR</td>
      <td colspan="1">X</td>
      <td colspan="1">Override the CMR timeout value to X milliseconds</td>
    </tr>
    <tr>
      <td colspan="1">mockMap</td>
      <td colspan="1">true</td>
      <td colspan="1">If any value is specified, do not fetch tiles from remote sources and display a blank map</td>
    </tr>
    <tr>
      <td colspan="1">mockEvents</td>
      <td colspan="1">X</td>
      <td colspan="1">Use the static JSON file with event feeds found at mock/events\_data.json-X</td>
    </tr>
    <tr>
      <td colspan="1">mockCategories</td>
      <td colspan="1">X</td>
      <td colspan="1">Use the static JSON file with categories feeds found at mock/categories\_data.json-X</td>
    </tr>
    <tr>
      <td colspan="1">mockSources</td>
      <td colspan="1">X</td>
      <td colspan="1">Use the static JSON file with sources feeds found at mock/sources\_data.json-X</td>
    </tr>
    <tr>
      <td colspan="1">modalView</td>
      <td colspan="1">
        categories,    
        measurements,    
        layers
      </td>
      <td colspan="1">Forces the 'Add Layers' modal to display categories, measurements or layers.   
      By default Artic/Antarctic shows measurements and Geographic shows categories.</td>
    </tr>
    <tr>
      <td colspan="1">imagegen</td>
      <td colspan="1">X</td>
      <td colspan="1">Use the endpoint
        <span class="nolink">http://map2.vis.earthdata.nasa.gov/imagegen/index</span>-X.php for image download
      </td>
    </tr>
    <tr>
      <td colspan="1">loadDelay</td>
      <td colspan="1">X</td>
      <td colspan="1">After loading all resources, wait X milliseconds before starting to simulate loading Worldview over a slow connection.</td>
    </tr>
    <tr>
      <td colspan="1">now</td>
      <td colspan="1">YYYY-MM-DDTHH:MM</td>
      <td colspan="1">Override the value the Worldview uses for the current date and time. This only works when using the Worldview.now() function.</td>
    </tr>
    <tr>
      <td colspan="1">markPalettes</td>
      <td colspan="1">true</td>
      <td colspan="1">If any value is specified, layers with an assigned palette will be marked in red in the Add Layers tab</td>
    </tr>
    <tr>
      <td colspan="1">markDownloads</td>
      <td colspan="1">true</td>
      <td colspan="1">If any value is specified, layers that can be downloaded will be marked in red in the Add Layers tab</td>
    </tr>
    <tr>
      <td colspan="1">debugPalette</td>
      <td colspan="1">true</td>
      <td colspan="1">If any value is specified, a black debugging custom palette will be added to assist in finding invalid lookup table mappings.</td>
    </tr>
    <tr>
      <td colspan="1">showError</td>
      <td colspan="1">true</td>
      <td colspan="1">If any value is specified, an error dialog will be shown on startup.</td>
    </tr>
    <tr>
      <td colspan="1">webmerc</td>
      <td colspan="1"></td>
      <td colspan="1">If found in the query string, a menu item for Web Mercator becomes available.</td>
    </tr>
  </tbody>
</table>
