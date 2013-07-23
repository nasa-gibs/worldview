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

endpoint = "https://api.echo.nasa.gov/catalog-rest/echo_catalog/granules/search.json?page_size=300"

class RequestError(Exception):
  pass


class ServiceError(Exception):
  pass


def handle_error(error_code, message, options, info=None):
    print "Content-type: text/html"
    print "Status: %s" % error_code
    print ""
    print "<h2>%s Error</h2>" % error_code
    print message
    if options.error and message:
      print "<br/><br/>"
      print str(info)
    sys.exit(1)

  
def bad_request(options, info=None):
  handle_error(400, "Bad request", options, info)

  
def internal_server_error(options, info=None):
  handle_error(500, "Unexpected error", options, info)


def service_unavailable(options, info=None):
  handle_error(503, "Service Unavailable", options, info)
  
  
def aql_list(fields):
  result = ["<list>"]
  for field in fields:
    result += ["<value>%s</value>" % field]
  result += ["</list>"]
  return result

def aql_date(t):
  return "<Date YYYY='%s' MM='%s' DD='%s' HH='%s' MI='%s' SS='%s'/>" % (
    t.year, t.month, t.day, t.hour, t.minute, t.second
  )
  
  
def create_xml(fields):
  xml = ["<?xml version='1.0' encoding='UTF-8' ?>"]
  xml = ['<!DOCTYPE query PUBLIC "-//ECHO CatalogService (v10)//EN" "http://api.echo.nasa.gov/echo/dtd/IIMSAQLQueryLanguage.dtd">']
  
  xml += ["<query>", "<for value='granules'/>"]
  
  xml += ["<dataCenterId>"] 
  xml += aql_list(fields.getlist("dataCenterId"))
  xml += ["</dataCenterId>"]
  
  xml += ["<where>"]
  
  xml += ["<granuleCondition>", "<collectionShortName>"]
  xml += aql_list(fields.getlist("shortName"))
  xml += ["</collectionShortName>", "</granuleCondition>"]
  
  try:
    day = datetime.strptime(fields["day"].value, "%Y-%m-%d")
  except ValueError:
    raise RequestError("Invalid day: " + fields["day"].value)
    
  start_time = datetime(day.year, day.month, day.day, 0, 0, 0)
  end_time = datetime(day.year, day.month, day.day, 23, 59, 0)
  
  xml += ["<granuleCondition>", "<temporal>"]
  xml += ["<startDate>", aql_date(start_time), "</startDate>"]
  xml += ["<stopDate>", aql_date(end_time), "</stopDate>"]
  xml += ["</temporal>", "</granuleCondition>"]
     
  xml += ["</where>"]
  xml += ["</query>"]
  
  return "\n".join(xml)
  

def query_echo(options, xml):
  url = endpoint
  headers = {
    "Content-type": "application/xml"
  }
  request = Request(url=url, headers=headers, data=xml)
  
  with urlopen(request) as fp:
    print "Content-type: application/json"
    print ""
    shutil.copyfileobj(fp, sys.stdout)

    
def process_request(options):    
  fields = cgi.FieldStorage()
    
  required_fields = ["day", "shortName", "dataCenterId"]
  for required_field in required_fields:
    if required_field not in fields:
      bad_request(options, "Missing parameter: %s" % required_field)
  
  xml = create_xml(fields)
  
  if options.xml:
    print xml
  
  if not options.no_query:
    query_echo(options, xml)

    
def parse_options():  
  parser = OptionParser()
  parser.add_option("-a", "--all", action="store_true", 
    help="Print all debugging information")
  parser.add_option("-e", "--error", action="store_true", 
    help="Print detailed error information")
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
