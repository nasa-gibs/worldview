# Contributing

Thanks for considering contributing and making our planet easier to explore!

We'd be quite excited if you'd like to contribute to Worldview! Whether you're finding bugs, adding new features, fixing anything broken, or improving documentation, get started by submitting an issue or pull request!

## Submitting an Issue

If you have any questions or ideas, or notice any problems or bugs, first [search open issues](https://github.com/nasa-gibs/worldview/issues) to see if the issue has already been submitted. We may already be [working on the issue](#what-were-working-on). If you think your issue is new, you're welcome to [create a new issue](https://github.com/nasa-gibs/worldview/issues/new).

## Pull Requests

If you want to submit your own contributions, follow these steps;

* Fork the Worldview repo
* Create a new branch off of the branch you'd like to contribute to
* ** Note: ** If there is not a feature branch already created for you to branch off of, you will want to branch off of `development` to create your own feature branch. We only branch directly off of `master` to resolve urgent bugs.
* If an issue does't already exist, submit one (see above)
* [Create a pull request](https://help.github.com/articles/creating-a-pull-request/) from your fork into the target branch of the nasa-gibs/worldview repo
* Be sure to [mention the corresponding issue number](https://help.github.com/articles/closing-issues-using-keywords/) in the PR description, i.e. "Fixes [#480](https://github.com/nasa-gibs/worldview/issues/480)"
* Upon submission of a pull request, the Worldview development team will review the code
* The request will then either be merged, declined, or an adjustment to the code will be requested

## Guidelines

We ask that you follow these guidelines with your contributions;

### Style Guidelines

Please lint your code with `npm run lint`. Our style rules are defined in `.stylelintrc` and `.eslintrc`. We follow a modified version of [Standard JS Rules](https://github.com/standard/standard#the-rules), with semi-colons. You can install linting plugins in your editor to check against our style guides automatically:

#### Atom

* [AtomLinter](https://atomlinter.github.io/)
* [`linter-eslint`](https://atom.io/packages/linter-eslint)
* [`linter-stylelint`](https://atom.io/packages/linter-stylelint)

#### Sublime

* [SublimeLinter](http://www.sublimelinter.com/en/latest/)
* [`SublimeLinter-eslint`](https://github.com/roadhump/SublimeLinter-eslint)
* [`SublimeLinter-contrib-stylelint`](https://github.com/kungfusheep/SublimeLinter-contrib-stylelint)

### Unit Tests

All of the unit tests for this project need to pass before your submission will be accepted. You can run `npm build && npm test` in the command line after making changes to verify that the tests pass. If you add new functionality, please consider adding tests for that functionality as well.

Note for Windows users: `npm test` may fail unless you [install PhantomJS manually](http://phantomjs.org/download.html).

### End-to-end Tests

You can run the included end-to-end tests to test the app in Chrome and Firefox. The tests run the Cucumber features in the `./e2e/features` using Nightwatch and Selenium.

To run tests in Chrome;

1) Run `npm run e2e:chrome`

To run tests in Firefox;

1) [Create a new Firefox profile](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles) called 'nightwatch'
2) Run `npm run e2e:firefox`

You can run tests for both browsers in sequence by running `npm run e2e`,

To run tests in Browserstack;

1) Log into your [Browserstack automation](https://www.browserstack.com/automate) and get your username and access key from the upper left
2) Set these environmental variables in your shell;
 - `export BROWSERSTACK_ACCESS_KEY=yourkeyhere`
 - `export BROWSERSTACK_USER=yourusernamehere`
3) Configure `./e2e/environments.json` with the browsers you want to test.
4) Run `npm run browserstack`

#### End-to-end Test Reports

After running end-to-end tests, reports are generated and saved in `./e2e/reports`. You can convert these to HTML by running `npm run report <environment>` where `<environment>` is either the lowercase name of the browser for local tests (`chrome` or `firefox`) or the name of the Browserstack environment, such as `Chrome_61-0_OS_X_El_Capitan-1` (you can get this name from the JSON files in `./e2e/reports`).

The end-to-end tests are a little bit flaky, so they aren't required to pass before a submission will be accepted, but you should run them and read through the results to make sure that you haven't broken any functionality. Please also consider adding end-to-end tests to cover any functionality you add.

### Commits

* Make small commits that show the individual changes you are making
* Write descriptive commit messages that explain your changes

Example of a good commit message;

```
Improve contributing guidelines. Fixes #480

Improve contributing docs and consolidate them in the standard location https://help.github.com/articles/setting-guidelines-for-repository-contributors/
```

## What We're Working On

Please see our [Roadmap](https://github.com/nasa-gibs/worldview/projects/7) for an overview of what we're planning.

We use GitHub labels to organize issues we're working on. Here are the labels we use, along with descriptions of what they mean. Click on the headings or badges below to see the GitHub issues tagged with each label.

### [`bug` ![Issues tagged with 'bug'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/bug.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Abug)

Things that appear to be broken or are not working as intended.

### [`enhancement` ![Issues tagged with 'enhancement' ](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/enhancement.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)

An enhancement to an existing feature.

### [`external dependency` ![Issues tagged with 'external dependency'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/%22external%20dependency%22.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen%20is%3Aissue%20label%3A%22external%20dependency%22)

Issues that are waiting on something out of our control.

### [`help wanted` ![Issues tagged with 'help wanted'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/%22help%20wanted%22.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22help%20wanted%22)

These issues might be a good place to start if you want to contribute.

### [`idea` ![Issues tagged with 'idea'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/idea.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aidea)

These are ideas, user stories, or feature requests that don't yet qualify as a new feature, probably because the specifics haven't been worked out yet.

### [`new feature` ![Issues tagged with 'new feature'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/%22new%20feature%22.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22new%20feature%22)

These are new features to be developed at some point in the future.

### [`ready for development` ![Issues tagged with 'ready for development'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/%22ready%20for%20development%22.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22ready%20for%20development%22)

These are issues that are "on deck" for development. We're planning to work on these next.

### [`testing` ![Issues tagged with 'testing'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/testing.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Atesting)

These are issues that have a PR ready to resolve them, and are just waiting to be fully tested.

### [`technical` ![Issues tagged with 'technical'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/technical.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Atechnical)

These issues are related to our technical implementation (refactoring, dependency changes, etc), they're developer focused, and don't directly add new features for end users.

### [`under development` ![Issues tagged with 'under development'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/%22under%20development%22.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22under%20development%22)

These are ideas, user stories, or feature requests that don't yet qualify as a new feature, probably because the specifics haven't been worked out yet.

### [`wontfix` ![Issues tagged with 'wontfix'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/wontfix.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Awontfix)

These are issues that we don't plan to fix.
