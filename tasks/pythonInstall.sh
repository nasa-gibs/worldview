#!/bin/bash
# Install python dependencies
PYTHON_VERSION="$(python -V 2>&1)"
if [ $1 = "linux" ]; then
  PYPATH=.python/bin:${PATH}
else
  PYPATH=.python/Scripts:${PATH}
fi

if command -v python3 &>/dev/null; then
  echo "Installing virtualenv with python3"
  python3 -m pip install --user virtualenv
  python3 -m virtualenv .python
  PATH=${PYPATH} python3 -m pip install -r requirements.txt
elif [[ $PYTHON_VERSION = *"Python 3"* ]]; then
  echo "Installing virtualenv with python"
  python -m pip install --user virtualenv
  python -m virtualenv .python
  PATH=${PYPATH} python -m pip install -r requirements.txt
else
  echo "Please install or update python v3"
fi



