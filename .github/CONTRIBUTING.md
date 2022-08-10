# Contributing

Thanks for considering contributing and making our planet easier to explore!

We'd be quite excited if you'd like to contribute to Worldview! Whether you're
finding bugs, adding new features, fixing anything broken, or improving
documentation, get started by submitting an issue or pull request!

## Submitting an Issue

If you have any questions or ideas, or notice any problems or bugs, first
[search open issues](https://github.com/nasa-gibs/worldview/issues) to see if
the issue has already been submitted. If you think your issue is new,
you're welcome to [create a new issue](https://github.com/nasa-gibs/worldview/issues/new/choose).

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
functionality as well. See [Testing](../doc/testing.md) for more information about
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
an overview of what we're planning.
