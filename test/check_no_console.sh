#!/bin/bash

BASEDIR=$(dirname "$0")
SRCDIR="$BASEDIR"/../js

find "$SRCDIR" -name "*.js" -exec grep -H console.log {} \; \
    | grep -v "//" \
    | grep -v "Logging.js" \
    | grep -v "js/ext"

