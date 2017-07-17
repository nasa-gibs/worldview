# Developer Guide

This document is an attempt to normalize the code.

## JavaScript

* Functions should be pure when possible; pass paramaters that are used to return a result
```
function getWordArray(str) {
    return str.split(' ');
}
```
* Keep variable declaration at the top of the scope to be a more literal representation of where variables are declared
```
function varDeclare() {
    var all, variables, here;

    // then do something with vars
}
```
* If a variable is a jQuery object use a $ at the start of the variable
` var $element = $('#some_element');`
* Use camelback notation
` var camelBack = 'First world lowercase, following words uppercase';`

## Contributing

* Fork a version of Worldview
* Create a new branch that is in synce with the branch you would like to contribute to.
* It an issue does not already exist, file a new issue on GitHub related to the feature, bug, or improvement that you would like to work on

### Commits

* Make small commits that make your changes
* Commit messages should clearly portray what was worked on while referencing the issue it addresses

Example

```
One line commit header that references an issue #101

The paragraphs following the header are used to better describe what
is being done in the commit.
```

### Pull Request

* Before making a pull request, look through the [current issues](https://github.com/nasa-gibs/worldview/issues) to see if your issue / feature has been reported.
* If your issue / feature has not been reported, create a new issue.
* When you submit a pull request you should make sure that there are no conflicts
* Reference the issue # in the pull request by writing "Connects to #000"
* Upon submission of a pull request, a member or members of the Worldview development team will review the code.
* The request will then either be merged, declined, or an adjustment to the code will be requested.
