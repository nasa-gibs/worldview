# Contributing

Thanks for considering contributing and making our planet easier to explore!

We'd be quite excited if you'd like to contribute to Worldview! Whether you're
finding bugs, adding new features, fixing anything broken, or improving
documentation, get started by submitting an issue or pull request!

## Submitting an Issue

If you have any questions or ideas, or notice any problems or bugs, first
[search open issues](https://github.com/nasa-gibs/worldview/issues) to see if
the issue has already been submitted. We may already be
[working on the issue](#what-were-working-on). If you think your issue is new,
you're welcome to [create a new issue](https://github.com/nasa-gibs/worldview/issues/new).

## Pull Requests

If you want to submit your own contributions, follow these steps:

* Fork the Worldview repo.
* Create a new branch from the branch you'd like to contribute to.
* *Note:* If you're not branching from an existing feature branch, create your branch from `develop` for the majority of contributions. Branching from `main` is reserved for urgent patches.
* If an issue doesn't already exist, [submit one](#submitting-an-issue).
* [Create a pull request](https://help.github.com/articles/creating-a-pull-request/) from your fork into the target branch of the `nasa-gibs/worldview` repo.
* Be sure to [mention the issue number](https://help.github.com/articles/closing-issues-using-keywords/) in the PR description, i.e. "Fixes [#480](https://github.com/nasa-gibs/worldview/issues/480)".
* Make sure to set the base branch to `develop`.
* Upon submission of a pull request, the Worldview development team will review the code.
* The request will then either be merged, declined, or an adjustment to the code will be requested.

## Guidelines

We ask that you follow these guidelines with your contributions:

### Style Guidelines

Please lint your code with `npm run lint`. Our style rules are defined in
`.stylelintrc` and `.eslintrc`. We follow a modified version of
[Standard JS Rules](https://github.com/standard/standard#the-rules), with
semi-colons. You can install linting plugins in your editor to check against
our style guides automatically:

#### VS Code

* [Vscode](https://code.visualstudio.com/)
* [`vscode-eslint`](https://github.com/microsoft/vscode-eslint)
* [`vscode-stylelint`](https://github.com/stylelint/vscode-stylelint)

#### Atom

* [AtomLinter](https://atomlinter.github.io/)
* [`linter-eslint`](https://atom.io/packages/linter-eslint)
* [`linter-stylelint`](https://atom.io/packages/linter-stylelint)

#### Sublime

* [SublimeLinter](http://www.sublimelinter.com/en/latest/)
* [`SublimeLinter-eslint`](https://github.com/roadhump/SublimeLinter-eslint)
* [`SublimeLinter-contrib-stylelint`](https://github.com/kungfusheep/SublimeLinter-contrib-stylelint)

### Tests

All of the unit tests for this project need to pass before your submission will
be accepted. If you add new functionality, please consider adding tests for that
functionality as well. See [Testing](doc/testing.md) for more information about
testing.

### Commits

* Make small commits that show the individual changes you are making.
* Write descriptive commit messages that explain your changes.

Example of a good commit message:

```
Improve contributing guidelines. Fixes #480

Improve contributing docs and consolidate them in the standard location https://help.github.com/articles/setting-guidelines-for-repository-contributors/
```

## What We're Working On

Please see our [Roadmap](https://github.com/nasa-gibs/worldview/projects/7) for
an overview of what we're planning. We also track the progress of [Worldview](https://github.com/nasa-gibs/worldview)
using the public [ZenHub Projects Board](https://app.zenhub.com/workspaces/worldview-591b38dffb1c761edb0bc54a/board).

We use GitHub labels to organize issues we're working on. Here are the labels
we use, along with descriptions of what they mean. Click on the headings or badges below to see the GitHub issues tagged with each label.

### [`bug` ![Issues tagged with 'bug'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/bug.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Abug)

Things that appear to be broken or are not working as intended.

### [`documentation` ![Issues tagged with 'documentation' ](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/documentation.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Adocumentation)

An issue that requires an update to our documentation.

### [`enhancement` ![Issues tagged with 'enhancement' ](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/enhancement.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)

An enhancement to an existing feature.

### [`Epic` ![Issues tagged with 'Epic' ](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/Epic.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3AEpic)

A large objective consisting of multiple issues.

### [`external dependency` ![Issues tagged with 'external dependency'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/external%20dependency.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen%20is%3Aissue%20label%3A%22external%20dependency%22)

Issues that are waiting on something out of our control.

### [`good first issue` ![Issues tagged with 'good first issue'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/good%20first%20issue.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22good%20first%20issue%22)

These issues might be a good place to start if you want to contribute for the first time.

### [`help wanted` ![Issues tagged with 'help wanted'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/help%20wanted.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22help%20wanted%22)

These issues might be a good place to start if you want to contribute.

### [`idea` ![Issues tagged with 'idea'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/idea.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aidea)

These are ideas, user stories, or feature requests that don't yet qualify as a new feature, probably because the specifics haven't been worked out yet.

### [`invalid` ![Issues tagged with 'invalid'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/invalid.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Ainvalid)

These are issues that are no longer relevant or are not considered valid issues.

### [`investigate` ![Issues tagged with 'investigate'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/investigate.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Ainvestigate)

These are issues that require further investigation to be considered as valid issues.

### [`new feature` ![Issues tagged with 'new feature'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/new%20feature.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22new%20feature%22)

These are new features to be developed at some point in the future.

### [`project management` ![Issues tagged with 'project management'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/project%20management.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3A%22project%20management%22)

These are issues that require changes outside of the code repository.

### [`question` ![Issues tagged with 'question'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/question.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aquestion)

These are questions related to a problem and/or issues that require further investigation.

### [`quickfix` ![Issues tagged with 'quickfix'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/quickfix.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Aquickfix)

These are issues which require minimal effort to address.

### [`security` ![Issues tagged with 'security'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/security.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Asecurity)

These are issues which address a known vulnerability.

### [`SIT` ![Issues tagged with 'SIT'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/SIT.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3ASIT)

These are issues which were found during systems integration testing (SIT).

### [`technical` ![Issues tagged with 'technical'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/technical.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Atechnical)

These issues are related to our technical implementation (refactoring, dependency changes, etc.), they're developer focused, and don't directly add new features for end users.

### [`UAT` ![Issues tagged with 'UAT'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/UAT.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3AUAT)

These are issues which were found during user acceptance testing (UAT).

### [`wontfix` ![Issues tagged with 'wontfix'](https://img.shields.io/github/issues-raw/nasa-gibs/worldview/wontfix.svg)](https://github.com/nasa-gibs/worldview/issues?q=is%3Aopen+is%3Aissue+label%3Awontfix)

These are issues that we don't plan to fix.
