#!/usr/bin/python

import cgi
import shutil
import sys
from urllib2 import urlopen

root = "http://eonet.sci.gsfc.nasa.gov"
fields = cgi.FieldStorage()
path = fields["path"].value
url = root + path

fp = None
try:
    fp = urlopen(url)
    print "Content-type: application/json"
    print ""
    shutil.copyfileobj(fp, sys.stdout)
    fp.close()
    fp = None
finally:
    if fp:
      fp.close()

