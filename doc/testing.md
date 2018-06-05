
# Testing

## Linting

To check code against the project's style guides, use `npm run lint`.
Use `npm run lint:css` or `npm run lint:js` to check CSS or JS files separately.

## Unit Tests

Unit tests are run using the BusterJS test runner. To run unit tests, run
`npm test`. Make sure to run `npm run build` or `npm run build:tests` first to
build a testable version of Worldview.

*Note for Windows users:* `npm test` may fail unless you [install PhantomJS manually](http://phantomjs.org/download.html).

## End-to-end Tests
End to end tests are integrated into our CI and are required to pass before a submission is accepted. New features should be accompanied by End to End tests to cover any new functionality you add.

### Browserstack


Run `npm run browserstack`  to test the app in `Chrome(OS X and Windows)`, `Firefox(Windows)`, `Internet Exporer(windows)`, and `Safari(OS X)` on BrowserStack. The tests run the `nightwatch.js` features found in `./e2e/features` using Selenium.

To run tests in BrowserStack from your local machine:

1) Log into [BrowserStack](https://www.browserstack.com/automate) and get your username and access key from the upper left.
2) Add the following to your shell configuration (`.bashrc` or `.profile`);

```bash
export BROWSERSTACK_ACCESS_KEY=yourkeyhere
export BROWSERSTACK_USER=yourusernamehere
```
### Selenium Drivers
 **(Note)** Driver reliability varies between Operating systems. Using local selenium drivers to run tests is more useful as a development tool for creating new tests than it is for verifying if all tests are passing.

To run tests on your machine using a Chrome driver: Run `npm run e2e:chrome`.

To run tests on your machine using a Firefox driver:

1) [Create a new Firefox profile](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles) called 'nightwatch'.
2) Run `npm run e2e:firefox`.

To run tests for both browsers in sequence: `npm run e2e`.

### Developing new End to End Tests
* When creating new tests you will likely want to work locally with a `chrome` or `Firefox` driver to expedite the development process.

* If there is a specific test that you would like to run, you can change the `files` variable found in `./e2e/browserstack.conf.js` to point directly to your test.
* If there is a specific browser that you would like to test, you can specify which in `./e2e/environments.json`

## URL Parameters

### External

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| `map` | `minX`,`minY`,`maxX`,`maxY` | Extent of the map view port in units are based on the projection selected (degrees for EPSG:4326, meters for others) |
| `products` | `baselayers`,`layer1`,`layer2~overlays`,`layer3`,`layer4` | Active layer list where layerX is the identifier of the layer as defined in the configuration file. Any number of layers may be specified in baselayers or overlays. Hidden layers are prefixed with a “!”. Delimiting layers with a “.” is supported but deprecated. |
| `time` | `YYYY-MM-DD` | Selected UTC day. |
| `p` | `geographic`,`arctic`,`antarctic` | Selected projection. |
| `palettes` | `layer1`,`palette1~layer2`,`palette2` | If present, assigns a custom palette to a layer where layerX is the identifier of the layer and paletteX is the identifier of the palette as defined in the configuration file. Any number of layer to palette mappings may be specified. |
| `opacity` | `layer1`,`value1~layer2`,`value2` | (Not officially supported at this time) If present, assigns an opacity value to a layer where layerX is the identifier of the layer as defined in the configuration file, and valueX is a real number in the range of 0 to 1 where 0 is fully transparent and 1 is fully opaque. Any number of layer to opacity value mappings may be specified. |
| `dataDownload` | product identifier | If set, activates the data download tab and selects the product. |

### Internal

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| epsg | `4326` (geographic), `3413` (arctic), `3995` (arctic - old), `3031` (antarctic) | EPSG code for the selected projection |

### Debugging

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| mockCMR | boolean | Do not query CMR and fetch the static JSON file found at mock/cmr.cgi-X |
| timeoutCMR | ms | Override the CMR timeout value in milliseconds |
| mockMap | boolean | If any value is specified, do not fetch tiles from remote sources and display a blank map |
| mockEvents | boolean | Use the static JSON file with event feeds found at mock/events\_data.json-X |
| mockCategories | boolean | Use the static JSON file with categories feeds found at mock/categories\_data.json-X |
| mockSources | boolean | Use the static JSON file with sources feeds found at mock/sources\_data.json-X |
| mockAlerts | string | Use a static JSON file by passing the notification type: `alert`, `message`, `outage`, `no_types`, or `all_types`. Local sources can be found at mock/notify_{string}.json |
| modalView | `categories`, `measurements`, `layers` | Forces the 'Add Layers' modal to display categories, measurements or layers. By default Artic/Antarctic shows measurements and Geographic shows categories. |
| imagegen | boolean | Use the endpoint http://map2.vis.earthdata.nasa.gov/imagegen/index-X.php for image download  |
| loadDelay | ms | After loading all resources, wait X milliseconds before starting. |
| now | `YYYY-MM-DDTHH:MM` | Override the value the Worldview uses for the current date and time. This only works when using the `now()` function from `js/util/util.js`. |
| markPalettes | boolean | If any value is specified, layers with an assigned palette will be marked in red in the Add Layers . |
| markDownloads | boolean | If any value is specified, layers that can be downloaded will be marked in red in the Add Layers tab. |
| debugPalette | boolean | If any value is specified, a black debugging custom palette will be added to assist in finding invalid lookup table mappings. |
| showError | boolean | If any value is specified, an error dialog will be shown on startup. |
