#!/usr/bin/python

import cgi

fields = cgi.FieldStorage()

size = int(fields["TILEMATRIXSET"].value)
z = fields["TILEMATRIX"].value
x = fields["TILEROW"].value
y = fields["TILECOL"].value

print "Content-type: image/svg+xml"
print """
<svg version="1.1"
     baseProfile="full"
     width="%d" height="%d"
     xmlns="http://www.w3.org/2000/svg">

  <line x1="0" y1="0" x2="%d" y2="0"   stroke="rgb(255, 0, 0)" stroke-width="5"/>
  <line x1="0" y1="0" x2="0"  y2="%d" stroke="rgb(255, 0, 0)" stroke-width="5"/>
  
  <rect width="128" height="30" fill="rgb(255, 0, 0)" />

  <text x="10" y="21" font-size="18" text-anchor="start" fill="white">%s / %s / %s</text>

</svg>
""" % (size, size, size, size, z, x, y)
