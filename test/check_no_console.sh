#!/bin/bash

BASEDIR=$(dirname "$0")
SRCDIR="$BASEDIR"/../src/js

find "$SRCDIR" -name "*.js" -exec grep -n -H console.log {} \; \
    | grep -v "//" \
    | grep -v "Logging.js" \
    | grep -v "js/ext" \
    | grep -v -e " *\/*\*"

