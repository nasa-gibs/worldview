#!/usr/bin/env python

import os

print """
<!doctype html>
<html>
<head>
<link rel="stylesheet" type="text/css" href="resources/sld.css">
</head>
</body>
<body>
<h1>GIBS Styled Layer Descriptors</h1>
"""
print "<ul>"
for file in os.listdir("."):
    if file.endswith(".xml"):
        base = os.path.splitext(file)[0]
        print "<li><a href='%s.html'>%s</a></li>" % (base, base)
print """
</ul>
</body>
</html>
"""





