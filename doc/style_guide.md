# Developer Guide

This document is an attempt to normalize the code.

## Writing code

### CSS

We use stylelint to enforce our CSS code standards. You can run `grunt stylelint` to check your CSS code. CSS that does not adhere to this standard will not pass the Travis CI build. Please use a linter while developer to catch any issues as they occur. We provide an additional tool to auto-correct your CSS, `grunt stylefmt`.

#### Main Focus
* CSS should be written in a clean, consistent manner with equal spaced rules and properties.
* **Class based cascading specificity.** ID and chained type (i.e. span.icon) selectors are highly discouraged and will be forbidden in the future.

#### Selectors
* Selector pseudo classes
* Declaration

#### At rules
* No import rules. If you want to add a css file, include it via a def link in the html, then add it to the css.json file;
* We are only allowing these at rules:
* At media rules ...

#### Units / Fonts / Colors
* Units not allowed: c, ex, in, mm, pc, pt, rem, vh, vmin, vw
* Colors can only be hexadecimal and if a shorthand is available, this must be used.
* `0px` must be `0`

Examples
```css

```

### JavaScript

* Functions should be pure when possible; pass paramaters that are used to return a result
```js
function getWordArray(str) {
    return str.split(' ');
}
```
* Keep variable declaration at the top of the scope to be a more literal representation of where variables are declared
```js
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
