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
echo "Generating build"
if ! npm run build ; then
  echo "ERROR: \"npm run build\" failed" &>2
  exit 1
fi
echo "Generating build"
if ! grunt build ; then
  echo "ERROR: \"grunt build\" failed" &>2
  exit 1
fi
