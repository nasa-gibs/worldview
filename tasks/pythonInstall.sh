#!/bin/bash
# Install python dependencies
PYTHON_VERSION="$(python -V 2>&1)"

if command -v python3 &>/dev/null; then
  echo "Installing pipenv and dependencies with python3"
  python3 -m pip install pipenv
  python3 -m pipenv install
elif [[ $PYTHON_VERSION = *"Python 3"* ]]; then
  echo "Installing pipenv and dependencies  with python"
  pip install pipenv
  pipenv install
else
  echo "Please install or update python v3"
fi