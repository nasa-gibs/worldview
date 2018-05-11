#!/bin/bash

# Bash commands to run in TRAVIS
if [ $TRAVIS_PULL_REQUEST != "false" ]; then 
  npm run browserstack
fi
npm run test
