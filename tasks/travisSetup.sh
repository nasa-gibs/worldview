#!/usr/bin/env sh


# Bash commands to run in TRAVIS

if [ $TRAVIS_PULL_REQUEST != "false" ]; then 
  npm start &
  npm run build
else 
  npm run build:tests
fi
