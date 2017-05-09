# Style Guide

This document is an attempt to normalize the code.

## General

* Indent 4 spaces



## JavaScript
* Keep variable declaration at the top of the block
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
