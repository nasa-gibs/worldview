#!/bin/bash
  echo "installing npm dependencies"
  if ! npm install ; then
    echo "ERROR: \"npm install\" failed" &>2
    exit 1
  fi
  echo "setting up Python environment"
  if ! ./wv-python ; then
    echo "ERROR: \"./wv-python\" failed" &>2
    exit 1
  fi
  echo "Cleaning dist"
  if ! grunt distclean ; then
    echo "ERROR: \"grunt distclean\" failed" &>2
    exit 1
  fi
  echo "relocation node_module dependencies"
  if ! grunt update ; then
    echo "ERROR: \"grunt update\" failed" &>2
    exit 1
  fi
  echo "Generating build"
  if ! grunt build ; then
    echo "ERROR: \"grunt build\" failed" &>2
    exit 1
  fi
  echo "starting lint report.  Results in lint-results.xml"
  grunt jshint:report | ./bin/filter-test-report > lint-results.xml
  if ! grunt lint ; then
    echo "ERROR: \"grunt test\" failed" &>2
    exit 1
  fi
  echo "executing unit tests.  Results in test-results.xml"
  grunt buster:report | ./bin/filter-test-report > test-results.xml
  if ! grunt test ; then
    echo "ERROR: \"grunt test\" failed" &>2
    exit 1
  fi
