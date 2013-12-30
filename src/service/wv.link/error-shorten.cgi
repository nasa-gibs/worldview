#!/usr/bin/python

#
# NASA Worldview
#
# This code was originally developed at NASA/Goddard Space Flight Center for
# the Earth Science Data and Information System (ESDIS) project.
#
# Copyright (C) 2013 - 2014 United States Government as represented by the
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#

import json

result = {
  "status_code": 500,
  "status_txt": "Limit exceeded"
}

print "Content-type: application/json"
print ""
print json.dumps(result)


