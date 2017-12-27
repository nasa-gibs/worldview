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
  echo "Fetching GetCapabilities"
  if ! npm run getcapabilities ; then
    echo "ERROR: \"GetCapabilities\" failed" &>2
    exit 1
  fi
  echo "Generating Configuration"
  if ! grunt config ; then
    echo "ERROR: \"grunt config\" failed" &>2
    exit 1
  fi
