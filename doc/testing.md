
# Testing

Run the entire test suite using `npm test`.

## Linting

To check code against the project's style guides, use `npm run lint`.
Use `npm run lint:scss` or `npm run lint:js` to check SCSS or JS files separately.

## Unit Tests

Unit tests are run using the Jest testing framework. Unit tests ran as part of the main testing suite, i.e. `npm test`.
Use `npm test:unit` to run unit tests individually.
_Note:_ Make sure to run `npm run getcapabilities` and
`npm run build:config` first to build the configuration.

To test against a different time zone, run `npm run test:unit:tz`. _Note:_ This currently doesn't work in Windows.

To view the unit test code coverage, run `npm run test:coverage`.
Use `npm run test:unit:coverage` or `npm run test:unit:tz:coverage` to run coverage tests individually.

## End-to-end Tests

End to end tests are integrated into our CI and are required to pass before a submission is accepted. New features should be accompanied by End to End tests to cover any new functionality you add.

Run end-to-end tests using `npm run e2e`

To run the end-to-end tests using Firefox in a docker container, create an image using `npm run docker:image`. Run the tests with `npm run docker:ci`. See the [Docker](docker.md) page for more information.

### Playwright Binaries

Playwright is a powerful end-to-end testing library that provides a high-level API to automate and test web applications in multiple browsers, including Chromium, WebKit, and Firefox.

To perform the testing and automation tasks, Playwright requires browser binaries that are specifically built and configured for use with Playwright.

These binaries are essential for running end-to-end tests using Playwright, as they contain the necessary components for launching and controlling the browsers in a way that is compatible with the Playwright API.

The `postinstall` script automatically installs the Playwright browser binaries for Chromium, WebKit, and Firefox.

## Debug Parameters

| Parameter | Type | Value | Description |
| --------- | ----- | ----- | ----------- |
| `mockEvents` | String | *`20170530`* | Use the static JSON file with event feeds found at mock/events\_data.json-X |
| `mockFutureLayer` | String | *`VIIRS_NOAA20_CorrectedReflectance_TrueColor,5D`*| Pass layer `id` and `futureTime` to be parsed and added to that layer on page load |
| `mockSources` | String | *`20170530`* | Use the static JSON file with sources feeds found at mock/sources\_data.json-X |
| `mockAlerts` | string | *`alert`*, *`message`*, *`outage`*, *`no_types`*, or *`all_types`* | Use a static JSON file by passing the notification type. Local sources can be found at mock/notify_{string}.json |
| `now` | date | *`YYYY-MM-DDThh:mm:ssZ`* | Overrides the current date and time. This can be accessed on `config.initialDate` or `state.date.appNow`. |
| `showError` | boolean | *`true` or `false`* | If any value is specified, an error dialog will be shown on startup. |
| `notificationURL` | string | `https://testing.url.com` | Overrides the notification URL found in the features.json configuration file. |
| `imageDownload` | string | `https://wvs.earthdata.nasa.gov/api/v1/snapshot` | Overrides the image download URL
