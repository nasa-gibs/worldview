#!/bin/bash
# Install python dependencies
if [ $1 = "linux" ]; then
  # If is a linux machine try to run python2
  if command -v python2 &>/dev/null; then
    echo "Installing virtualenv with python2"
    python2 -m pip install virtualenv
    python2 -m virtualenv .python
  else
    echo "Installing virtualenv with python"
    python -m pip install virtualenv
    python -m virtualenv .python
  fi
  PATH=.python/bin:${PATH} pip install -r requirements.txt
else
  # If is a window machine use virtualenv
  virtualenv .python
  PATH=.python/Scripts:${PATH} pip install -r requirements.txt
fi



