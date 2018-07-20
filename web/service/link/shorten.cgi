#!/usr/bin/python

import cgi
import json
from optparse import OptionParser
import os
import shutil
import sys
from urllib2 import Request, urlopen, HTTPError, quote

endpoint = "http://api.bit.ly/v3/shorten"
login = ""
key = ""

class RequestError(Exception):
  """
  Exception raised when a missing or an invalid parameter is provided
  """
  pass


def handle_error(error_code, message, options, info=None):
  """
  Displays an error page to the client and exits the program with a return
  code of one.

  Parameters:
  - error_code: HTTP status code to set in the header
  - message: Message reported to the user
  - options: Execution options
  - info: Additional information to display to the user if options.error
      is True
  """
  print "Content-type: text/html"
  print "Status: %s" % error_code
  print ""
  print "<h2>%s Error</h2>" % error_code
  print message
  if options.error and info:
    print "<br/><br/>"
    print str(info)

  # Print to standard out for the Apache error log
  sys.stderr.write("worldview/shorten.cgi [%s]: %s" % (error_code, message))
  if info:
    sys.stderr.write(": %s" % info)
  sys.stderr.write("\n")

  sys.exit(1)


def bad_request(options, info=None):
  """
  Displays the error page with a 400 error and a Bad Request message. Exits
  the program with a return code of one.

  Parameters:
  - options: Execution options
  - info: Additional information to display to the user if options.error
      is True
  """
  handle_error(400, "Bad request", options, info)


def internal_server_error(options, info=None):
  """
  Displays the error page with a 500 error and a Unexpected Error message.
  Exits the program with a return code of one.

  Parameters:
  - options: Execution options
  - info: Additional information to display to the user if options.error
      is True
  """
  handle_error(500, "Unexpected error", options, info)


def service_unavailable(options, info=None):
  """
  Displays the error page with a 503 error and a Service Unavailable message.
  Exits the program with a return code of one.

  Parameters:
  - options: Execution options
  - info: Additional information to display to the user if options.error
      is True
  """
  handle_error(503, "Service Unavailable", options, info)

def process_request(options):
  fields = cgi.FieldStorage()

  if len(fields) == 0:
    raise RequestError("No parameters")

  required_fields = ["url"]
  for required_field in required_fields:
    if required_field not in fields:
      raise RequestError("Missing parameter: %s" % required_field)


  url = "".join([endpoint,
    "?login=" + login,
    "&apiKey=" + key,
    "&format=json",
    "&longUrl=" + quote(fields["url"].value)])

  if options.url:
    print url

  request = Request(url=url)

  fp = None
  try:
    fp = urlopen(request)
    print "Content-type: application/json"
    print ""
    shutil.copyfileobj(fp, sys.stdout)
    fp.close()
    fp = None
  finally:
    if fp:
      fp.close()

def parse_options():
  """
  Allow command line arguments for easy debugging at the command line.

  Returns:
    Execution options
  """
  parser = OptionParser()
  parser.add_option("-a", "--all", action="store_true",
    help="Print all debugging information")
  parser.add_option("-e", "--error", action="store_true",
    help="Print detailed error information")
  parser.add_option("-u", "--url" ,action="store_true",
    help="Print URL used to access bit.ly")
  (options, args) = parser.parse_args()

  if options.all:
    options.error = True

  return options

if __name__ == '__main__':
  """
  Entry point
  """
  options = parse_options()
  try:
    key_path = os.path.join("..", "..", "..", "bitly.json")
    with open(key_path) as fp:
        config = json.load(fp)
    login = config["login"]
    key = config["key"]
    process_request(options)
  except IOError:
    options.error = True
    service_unavailable(options, "No API key")
  except RequestError as re:
    bad_request(options, re)
  except HTTPError as he:
    if options.error:
      raise
    service_unavailable(options, he)
  except Exception as e:
    if options.error:
      raise
    internal_server_error(options, e)
