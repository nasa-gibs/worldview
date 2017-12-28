#!/bin/bash

echo "installing npm dependencies"
if ! npm install ; then
  echo "ERROR: \"npm install\" failed" &>2
  exit 1
fi
echo "Cleaning build"
if ! grunt clean:build ; then
  echo "ERROR: \"grunt clean:build\" failed" &>2
  exit 1
fi
echo "Cleaning dist"
if ! grunt clean:dist ; then
  echo "ERROR: \"grunt clean:dist\" failed" &>2
  exit 1
fi
echo "Fetching GetCapabilities"
if ! npm run getcapabilities ; then
  echo "ERROR: \"npm run getcapabilities\" failed" &>2
  exit 1
fi
echo "Fetching GetCapabilities"
if ! npm run build:config ; then
  echo "ERROR: \"npm run build:config\" failed" &>2
  exit 1
fi
echo "Generating Configuration"
if ! grunt config ; then
  echo "ERROR: \"grunt config\" failed" &>2
  exit 1
fi
