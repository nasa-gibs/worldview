#!/bin/bash
  echo "installing npm dependencies"
  if ! npm install ; then
    echo "ERROR: \"npm install\" failed" &>2
    exit 1
  fi
  echo "Cleaning dist"
  if ! grunt distclean ; then
    echo "ERROR: \"grunt distclean\" failed" &>2
    exit 1
  fi
  echo "Generating build"
  if ! grunt build ; then
    echo "ERROR: \"grunt build\" failed" &>2
    exit 1
  fi
