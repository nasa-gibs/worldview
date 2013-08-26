#!/usr/bin/python

#
# NASA Worldview
# 
# This code was originally developed at NASA/Goddard Space Flight Center for
# the Earth Science Data and Information System (ESDIS) project. 
#
# Copyright (C) 2013 United States Government as represented by the 
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#
import cgi
from datetime import datetime
import json
from optparse import OptionParser
import os
import shutil
import sys
from urllib2 import Request, urlopen, HTTPError

endpoint = "".join(
  ["https://api.echo.nasa.gov/catalog-rest/echo_catalog/",
   "granules/search.json?client_id=worldview"])

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
  sys.stderr.write("worldview/echo.cgi [%s]: %s" % (error_code, message))
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
  
  
def aql_list(fields):
  """
  Creates an AQL list from a list of CGI fields.
  
  Parameters:
  - fields: List of CGI fields
  
  Returns:
  - List of XML string fragments containing list and value elements.
  """
  result = ["<list>"]
  for field in fields:
    result += ["<value>%s</value>" % field]
  result += ["</list>"]
  return result


def aql_date(t):
  """
  Creates an AQL Date element from a datetime object.
  
  Parameters:
  - t: datetime object to convert
  
  Returns:
  - XML string fragment containing a Date element.
  """
  return "<Date YYYY='%s' MM='%s' DD='%s' HH='%s' MI='%s' SS='%s'/>" % (
    t.year, t.month, t.day, t.hour, t.minute, t.second
  )
  
  
def create_xml(fields):
  """
  Creates an XML document given the provided CGI fields
  
  Parameters:
  - fields: CGI fields to use a parameters for the ECHO query
  
  Returns:
  - AQL XML document for the ECHO query request as a string.
  """
  
  # It isn't necessary to have the official prolog and DOCTYPE
  xml = ["<?xml version='1.0' encoding='UTF-8' ?>"]
  xml = ['<!DOCTYPE query PUBLIC "-//ECHO CatalogService (v10)//EN" '
         '"http://api.echo.nasa.gov/echo/dtd/IIMSAQLQueryLanguage.dtd">']
  
  xml += ["<query>", "<for value='granules'/>"]
  
  xml += ["<dataCenterId>"] 
  if "dataCenterId" in fields:
    xml += aql_list(fields.getlist("dataCenterId"))
  else:
    xml += ["<all/>"]
  xml += ["</dataCenterId>"]
  
  xml += ["<where>"]
  
  xml += ["<granuleCondition>", "<collectionShortName>"]
  xml += aql_list(fields.getlist("shortName"))
  xml += ["</collectionShortName>", "</granuleCondition>"]
  
  try:
    start_time = datetime.strptime(fields["startTime"].value, "%Y%m%d%H%M%S%f")
  except ValueError:
    raise RequestError("Invalid startTime: " + fields["startTime"].value)
  try:
    end_time = datetime.strptime(fields["endTime"].value, "%Y%m%d%H%M%S%f")
  except ValueError:
    raise RequestError("Invalid endTime: " + fields["endTime"].value)
       
  xml += ["<granuleCondition>", "<temporal>"]
  xml += ["<startDate>", aql_date(start_time), "</startDate>"]
  xml += ["<stopDate>", aql_date(end_time), "</stopDate>"]
  xml += ["</temporal>", "</granuleCondition>"]
  
  if "dayNightFlag" in fields:
    xml += ["<granuleCondition>"]
    xml += ["<dayNightFlag value='%s'/>" % fields["dayNightFlag"].value]
    xml += ["</granuleCondition>"]
    
  xml += ["</where>"]
  xml += ["</query>"]
  
  return "\n".join(xml)
  

def query_echo(options, xml):
  """
  Submit an AQL document to ECHO and proxy the results to standard out.
  
  Parameters:
  - options: Execution options. 
  - xml: AQL document to submit to ECHO
  """
  
  url = endpoint + "&page_size=%s" % options.page_size
  
  headers = {
    "Content-type": "application/xml"
  }
  request = Request(url=url, headers=headers, data=xml)
  
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
    
def process_request(options):    
  """
  Handle the request by converting CGI parameters into an AQL document
  and sumbitting to ECHO.
  
  CGI Parameters:
  - day: UTC day to search for in YYYY-DD-MM format
  - shortName: Product short name, may be used multiple times
  - dataCenterId: Data center that provides the data, may be used multiple
      times. Note this field is required to decrease query times due to 
      data center specific ACLs.
  
  Parameters:
  - options: Execution options
  """    
  fields = cgi.FieldStorage()
  
  if len(fields) == 0:
    raise RequestError("No parameters")
    
  required_fields = ["startTime", "endTime", "shortName"]
  for required_field in required_fields:
    if required_field not in fields:
      raise RequestError("Missing parameter: %s" % required_field)
  
  xml = create_xml(fields)
  
  if options.xml:
    print xml
  
  if not options.no_query:
    query_echo(options, xml)

    
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
  parser.add_option("-p", "--page-size", default=300,
    help="Change the maximum number of results")
  parser.add_option("-n", "--no-query", action="store_true", 
    help="Do not execute ECHO query")
  parser.add_option("-x", "--xml", action="store_true", 
    help="Print XML to be sent to ECHO")
  (options, args) = parser.parse_args()
  
  if options.all:
    options.error = True
    options.xml = True
    
  return options
    
    
if __name__ == '__main__':
  """
  Entry point
  """
  options = parse_options()   
  try:  
    process_request(options)
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
