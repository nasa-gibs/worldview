#!/bin/bash
# Install python dependencies
PYTHON_VERSION="$(python -V 2>&1)"
if [ $1 = "linux" ]; then
  if command -v python3 &>/dev/null; then
    echo "Installing virtualenv with python3"
    python3 -m pip install --user virtualenv
    python3 -m virtualenv .python
    PATH=.python/bin:${PATH} python3 -m pip install -r requirements.txt
  elif [[ $PYTHON_VERSION = *"Python 3"* ]]; then
    echo "Installing virtualenv with python3"
    python -m pip install --user virtualenv
    python -m virtualenv .python
    PATH=.python/bin:${PATH} python -m pip install -r requirements.txt
  else
    echo "Please install or update python v3"
  fi
else
  # If is a window machine use virtualenv
    if command -v python3 &>/dev/null; then
      virtualenv .python
      PATH=.python/Scripts:${PATH} python3 -m pip install --user -r requirements.txt
    elif [[ $PYTHON_VERSION = *"Python 3"* ]]; then
      virtualenv .python
      PATH=.python/Scripts:${PATH} python -m pip install --user -r requirements.txt
    else
      echo "Please install or update python v3"
    fi
fi



