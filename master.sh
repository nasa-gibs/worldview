#!/bin/bash  
  echo "installing npm dependencies"
  npm install
  echo "setting up Python environment"
  ./wv-python
  echo "Cleaning dist"
  grunt distclean
  echo "Generating build"
  grunt build
  echo "starting lint report.  Results in lint-results.xml"
  grunt jshint:report | ./bin/filter-test-report > lint-results.xml
  grunt lint
  echo "executing unit tests.  Results in test-results.xml"
  grunt buster:report | ./bin/filter-test-report > test-results.xml