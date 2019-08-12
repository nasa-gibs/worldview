#!/bin/bash
# Install python dependencies
PYTHON_VERSION="$(python -V 2>&1)"
if [ $1 = "linux" ]; then
  if [command -v python3 &>/dev/null] || [[ $PYTHON_VERSION = *"Python 3"* ]]; then
    echo "Installing virtualenv with python3"
    python3 -m pip install --user virtualenv
    python3 -m virtualenv .python
    PATH=.python/bin:${PATH} pip install -r requirements.txt
    # If is a linux machine try to run python2
  elif command -v python2 &>/dev/null; then
    echo "Installing virtualenv with python2"
    python2 -m pip install --user virtualenv
    python2 -m virtualenv .python
    PATH=.python/bin:${PATH} pip install -r requirements-2.7.txt
  else
    echo "Installing virtualenv with python"
    python -m pip install --user virtualenv
    python -m virtualenv .python
    PATH=.python/bin:${PATH} pip install -r requirements-2.7.txt
  fi
else
  # If is a window machine use virtualenv
    if [command -v python3 &>/dev/null] || [[ $PYTHON_VERSION = *"Python 3"* ]]; then
      virtualenv .python
      PATH=.python/Scripts:${PATH} pip install -r requirements.txt
    else
      virtualenv .python
      PATH=.python/Scripts:${PATH} pip install -r requirements-2.7.txt
    fi
fi



