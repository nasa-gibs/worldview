
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

Run end-to-end tests using `npm run e2e`

To run the end-to-end tests using Firefox in a docker container, create an image using `npm run docker:image`. Start the container with `npm run docker:start` and run the tests with `npm run docker:e2e`. See the [Docker](docker.md) page for more information.

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

## Debug Parameters

| Parameter | Type | Value | Description |
| --------- | ----- | ----- | ----------- |
| `mockCMR` | boolean | *`true` or `false`* | Do not query CMR and fetch the static JSON file found at mock/cmr.cgi-X |
| `timeoutCMR` | ms | *`N`* | Override the CMR timeout value in milliseconds |
| `mockEvents` | boolean | *`true` or `false`* | Use the static JSON file with event feeds found at mock/events\_data.json-X |
| `mockCategories` | boolean | *`true` or `false`* | Use the static JSON file with categories feeds found at mock/categories\_data.json-X |
| `mockSources` | boolean | *`true` or `false`* | Use the static JSON file with sources feeds found at mock/sources\_data.json-X |
| `mockAlerts` | string | **`alert`**, **`message`**, **`outage`**, **`no_types`**, or **`all_types`** | Use a static JSON file by passing the notification type. Local sources can be found at mock/notify_{string}.json |
| `modalView` | string | **`categories`**, **`measurements`**, or **`layers`** | Forces the 'Add Layers' modal to display categories, measurements, or layers. By default Artic/Antarctic shows measurements and Geographic shows categories. |
| `loadDelay` | ms | *`N`* | After loading all resources, wait X milliseconds before starting. |
| `now` | date | *`YYYY-MM-DDThh:mm:ssZ`* | Overrides the current date and time. This only works when using the `now()` function from `js/util/util.js`. |
| `showError` | boolean | *`true` or `false`* | If any value is specified, an error dialog will be shown on startup. |
| `showSubdaily` | boolean | *`true` or `false`* | If any value is specified, the hour input, minute input and "minutes" timeline zoom option will be shown. |
