
# Testing

Run the entire test suite using `npm test`.

## Linting

To check code against the project's style guides, use `npm run lint`.
Use `npm run lint:scss` or `npm run lint:js` to check SCSS or JS files separately.

## Unit Tests

Unit tests are run using the Jest testing framework. Unit tests ran as part of the main testing suite, i.e. `npm test`.

To run unit tests individually use the `npm run test:unit:tag` script and provide the unit tag. Ex: `npm run test:unit:tag -- alert-initial-state`. The tags can be found at the end of each test description in square brackets. `'Should return the initial state [alert-initial-state]'`.

To run a batch of unit tests you can use the `npm run test:batch:directory` script and provide the module directory of the tests. This will run each file in the directory provided. Ex: `npm run test:batch:directory -- animation`. This will run the `actions.test.js`, `reducer.test.js` and `util.test.js` test files located in the `modules/animation` directory.

To test against a different time zone, run `npm run test:unit:tz`. _Note:_ This currently doesn't work in Windows.

To view the unit test code coverage, run `npm run test:coverage`.
Use `npm run test:unit:coverage` or `npm run test:unit:tz:coverage` to run coverage tests individually.

## End-To-End Tests

The end-to-end tests are integrated into our CI and are required to pass before a submission is accepted. New features should be accompanied by end-to-end tests to cover any new functionality you add.

Run end-to-end tests using `npm run e2e`

To run the end-to-end tests using Firefox in a docker container, create an image using `npm run docker:image`. Run the tests with `npm run docker:ci`. See the [Docker](docker.md) page for more information.

See the [end-to-end testing](e2e_testing.md) page for more information on how to run the end-to-end tests.

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
