# Developer Guide

This document is an attempt to normalize the code.

## Writing code

### CSS

We use stylelint to enforce our CSS code standards. You can run `grunt stylelint` to check your CSS code. CSS that does not adhere to this standard will not pass the Travis CI build. Please use a linter while developer to catch any issues as they occur. We provide an additional tool to auto-correct your CSS, `grunt stylefmt`.

#### Main Focus
* CSS should be written in a clean, consistent, cascading manner with equal spaced rules and properties.
* **Class based cascading specificity.** ID and chained type selectors (i.e. span.icon) are highly discouraged and will be forbidden in the future.
* Do no over comment the code; comments are not allowed in rules

#### Syntax
* Always use 2 space indenting
* Always use a newline for multiple selectors
* Always use 1 space before the opening bracket
* Always use a newline after the opening bracket
* Always use a newline after closing bracket
* Never use spaces between function brackets i.e. url('here.gif');
* Never use spaces before semicolons or commas
* Always use 1 space after commas
* Operators must use spaces i.e. (`this + that`)
* Single or double quotations can be used for strings
* Never use a newline between strings

#### At rules
* We only allow the following at rules: "media", "charset", "font-face"
* No import rules. If you want to add a css file, include it via a def link in the html, then add it to the css.json file;
* At media rules ...

#### Selectors
* Selector pseudo classes use a single color, pseudo elements use a double colon

#### Properties
* No duplicate properties (except beside each other for fallbacks)

#### Fonts
* Don't declare duplicate font-family names in properties.

#### Colors
* Colors can only be hexadecimal and if a shorthand is available, this must be used.

#### Units
* Always use `px` units
* Units not allowed: `c`, `ex`, `in`, `mm`, `pc`, `pt`, `rem`, `vh`, `vmin`, `vw`
* Avoid using `em` units as these will be forbidden in the future
* `0px` must be `0`

#### Example
```css

  /* There must always be an empty line before a comment, except on the first line of a file.
   * Multiline comments are ok
   * js style (//) comments are forbidden
   * Comments must include a space at the beginning
   * Comments cannot be inside rules
   * Comments must come directly before a rule with no newlines in between
   */

  /* Rules must be on newlines */
  h1,
  .h1 {
    font-size: 16px; /* Only use px units */
    line-height: 0; /* When a zero unit is present you must use 0, not 0px */
  }

  /* Only one newline between rules; the above would be incorrect */
  .main { /* No empty rules allowed */
  }

  .main .subclass {
    background: #fff; /* shorthand color, hex only no color names */
  }

  .main .subclass::before { /* pseudo elements use 2 colons */
    content: url('smiley.gif'); /* no spacing in url, (either quote type is fine) */
  }

  .main .subclass:hover { /* pseudo classes use 1 colon */
    background: #ccc;
  }

  .main .subclass:hover::before {
    content: '';
  }

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
