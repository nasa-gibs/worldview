#!/bin/bash

BASEDIR=$(dirname "$0")/../..

sudo /etc/init.d/httpd stop
mock --init
mock --install yum
mock --copyin $BASEDIR/dist/worldview-*.noarch.rpm /
mock --shell 'yum install *.rpm'
mock --shell '/etc/init.d/httpd start'
