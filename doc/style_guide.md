# Developer Guide

This document is an attempt to normalize the code.

## Writing code

### CSS

We use stylelint to enforce our CSS code standards. You can run `grunt stylelint` to check your CSS code. CSS that does not adhere to our standards will not pass the Travis CI build. Please use a linter while developing to catch any issues as they occur. We provide a style format development tool via `grunt stylefmt` to auto-correct CSS issues. All css lint rules are located in a [.stylelintrc](https://github.com/nasa-gibs/worldview/blob/development/.stylelintrc) file in the project root.

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
* Never use spaces between function brackets (i.e. url('here.gif');)
* Never use spaces before semicolons or commas
* Always use 1 space after commas
* Operators must use spaces (i.e. `this + that`)
* Single or double quotations can be used for strings
* Never use a newline between strings
* Always use lowercase
* Never leave end of line whitespace
* Always include an end of file newline

#### Rules
* Rules must be followed by a newline
* Only 1 newline between rules
* No empty rules allowed

#### At rules
* Only the following at-rules are allowed: "media", "charset", "font-face"
* **No import rules.** If you want to add a css file, include it via a def link in the [index.html](https://github.com/nasa-gibs/worldview/blob/development/web/index.html), then add it to the [wv.css.json](https://github.com/nasa-gibs/worldview/blob/master/deploy/wv.css.json) file.
* At media rules should always be on a single line and should not contain spaces between parentheses

#### Selectors
* Use class selectors. ID and type chained selectors will be forbidden in the future. (i.e. `#foo, div.bar`)
* Selectors can be 5 levels deep max: (i.e. `div .bar[data-val] > a.baz + .boom > #lorem {}`)
  Universal selectors should be avoided. Only 1 universal selector is allowed per rule.
* No duplicate selectors allowed. i.e (`.foo {} .bar {} .foo {}`)
* Selector pseudo classes use a single colon (i.e. `.foo:focus`), pseudo elements use a double colon (i.e. `.foo::before`)
* A maximum of 2 selectors can be used (i.e. [type="text"][disabled])

#### Properties
* Only use [known properties](https://github.com/betit/known-css-properties#source)
* No duplicate properties (except beside each other for fallbacks)
* No redundant values when using shorthand properties (i.e. `margin: 1px 1px 1px 1px;` should be `margin: 1px;`)
* If a combination of properties have a shorthand, the shorthand version must be used (i.e. `.foo { padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px; }` should be `.foo { padding: 1px 2px 3px 4px; }`)
* Always use shorthand properties first. (i.e. `background: #000; background-repeat: repeat;` _the reverse would be incorrect_)

#### Fonts
* Only use font-families defined in `fonts.css`. Currently this includes `"Open Sans"` and `"Roboto Mono"`
* Use proper font fallbacks (i.e. a sans-serif font like `"Open Sans"` would fall back to `sans-serif`)
* Don't declare duplicate font-family names in properties.
* Always use quotes around fonts unless it is a keyword font (i.e. font-family: "Times New Roman", "Times", serif;). Single or double quotes can be used.
* Font weights must always be specified in numeric format. (i.e. `font-weight: 700;` instead of `font-weight: bold;` / `font-weight: 400;` instead of `font-weight: normal;`)

#### Colors
* Never use named colors. Use only valid hexadecimal or rgb / rgba colors instead.
* A shorthand hexadecimal value must be used if applicable (i.e. #000000 should be #000).

#### Units
* Always use `px` units
* Units not allowed: `c`, `ex`, `in`, `mm`, `pc`, `pt`, `rem`, `vh`, `vmin`, `vw`
* Avoid using `em` units as these will be forbidden in the future.
* `0px` zero units must be `0`
* `%` units can have a max precision of 6 (i.e. 0.666667%); all other units, must be a precision of 1. (i.e. 9.5px)
* Always include leading zeros. (i.e. `.5%` should be `0.5%`)
* Never include trailing zeros (i.e. `1.0px` should be `1px`)

#### Comments
* An empty line must always come before a comment, except on the first line of a file.
* Multiline comments are acceptable
* js style (//) comments are forbidden
* Comments must include a space at the beginning
* Comments cannot be inside rules
* Comments must come directly before a rule with no newlines in between

#### Example
```css
/* There must always be an empty line before a comment, except on the first line of a file. */

/* Rules must be followed by a newline */
h1,
.h1 {
  font-size: 16px; /* Only use px units */
  line-height: 0; /* When a zero unit is present you must use 0, not 0px */
}


/* Only 1 newline after rules; the above would be incorrect */
.main { /* No empty rules allowed */
}

.main .subclass {
  background: #fff; /* shorthand color, hex only no color names */
}

.main .subclass::before { /* pseudo elements use 2 colons */
  content: url('smiley.gif'); /* no spacing in url (either quote type is fine) */
}

.main .subclass:hover { /* pseudo classes use 1 colon */
  background: #ccc;
}

.main .subclass:hover::before {
  content: '';
}

.main .subclass .title {
  font-family: "Open Sans", sans-serif;
  font-weight: 400;
}

@media only screen and (min-width: 740px) {
  .main .subclass {
    display: none;
  }
}

```

### JavaScript

* Functions should be pure when possible; pass parameters that are used to return a result

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
