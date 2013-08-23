#!/usr/bin/python

import feedparser, logging, logging.config
import urllib2, shutil, urlparse, os, zipfile, os.path, re, json
# CentOS uses 2.6, argparse starts with 2.7
from optparse import OptionParser
import sys
from zipfile import ZipFile as zip
from zipfile import BadZipfile
from bs4 import BeautifulSoup
from osgeo import gdal

baseDir = os.path.join(os.path.dirname(__file__), '..')

parser = OptionParser()
parser.add_option("-d", "--development", action="store_true",
                  help="Use the source tree instead of the system directories")
parser.add_option("-f", "--feed", 
                  help="Use file as feed instead of Earth Observatory")
(options, args) = parser.parse_args()
    
feed = None              
if options.feed:
    # Read in the entire feed before changing directories
    with open(options.feed) as fp:
        feed = fp.read()
if options.development:
    print 'Development mode'
    # Log configuration assume working from this directory
    os.chdir(baseDir)
    confDir = 'etc/config'
    libDir = 'src/var'
else:
    confDir = '/etc/worldview'
    libDir = '/var/lib/worldview'

# ===================================================================
# Log Configuration
# ===================================================================
logConfFile = os.path.join(confDir, 'events_log.conf')
if not os.path.exists(logConfFile):
    sys.stderr.write('No such file: %s\n' % logConfFile)
    sys.exit(1)
logging.config.fileConfig(logConfFile)
accessLog = logging.getLogger('eventsAccess')
errorLog = logging.getLogger('eventsErrors')
debugLog = logging.getLogger('eventsDebug')

# ===================================================================
# GeoRSS Processing
# ===================================================================

# Pulls the GeoRSS feed and returns a list of entries.
# @param url - the URL of the GeoRSS feed
# @return - an array of GeoRSS entries
def pullRss(url):
    feed = feedparser.parse(url)
    if feed:
        accessLog.info('Successful pull: %s', url)
        return feed["items"]
    else:
        accessLog.info('Failed pull: %s', url)
        return None

# Find the link to the first tif image (if present).
# @param soup - the content of the entry's story
# @return - the link to the GeoTif image (if present)
def findTiff(soup):
    t = soup.find(href=re.compile("tif"))
    if t:
        return t.get("href")
    else:
        return None

# Find the link to the first kmz image (if present).
# @param soup - the content of the entry's story
# @return - the link to the KMZ image (if present)
def findKmz(soup):
    k = soup.find(href=re.compile("kmz"))
    if k:
        return k.get("href")
    else:
        return None

# Extract the KMZ file with the given file name.
# @param zipname - the name of the zip file
# @return - the relative path to the KML file
def extractKmz(zipname):
    try:
        z = zip(zipname)
        f = z.namelist()[0]
        if f.endswith('/'):
            os.makedirs(f)
        else:
            z.extract(f)
        return f   
    except BadZipfile as e:
        errorLog.error('(extractKmz) Bad Zipfile: %s', zipname)
        return None
    except OSError as e:
        errorLog.error('(extractKmz) %s: %s', e.strerror, e.filename)
        return None
    except IOError as e:
        errorLog.error('(extractKmz) %s: %s', e.strerror, e.filename)
        return None

# Download a file from the given link.
# @param url - the link to the file (KMZ or GeoTiff)
# @param fileName - the filename
# @return - the filename
def download(url, fileName=None):
    def getFileName(url, openUrl):
        if 'Content-Disposition' in openUrl.info():
            # If the response has Content-Disposition, try to get the
            # filename from it
            cd = dict(map(
                lambda x: x.strip().split('=') if '=' in x else (x.strip(),''),
                openUrl.info()['Content-Disposition'].split(';')))
            if 'filename' in cd:
                filename = cd['filename'].strip("\"'")
                if filename: return filename

        # if no filename was found above, parse it out of the final URL
        filename = os.path.basename(urlparse.urlsplit(openUrl.url)[2])
        return filename

    r = urllib2.urlopen(urllib2.Request(url))
    try:
        fileName = fileName or getFileName(url, r)
        with open(fileName, 'wb') as f:
            shutil.copyfileobj(r,f)
    
    finally:
        r.close()


# Parse the entry and return a JSON representation
# @param entry - a GeoRSS entry
# @return - a JSON description of the GeoRss entry
def processEntry(entry):

    title = entry["title"]

    # check satellite/instrument - if not MODIS, skip
    if not any("tags" in n for n in entry):
        debugLog.debug('skipping because no tags')
        return None

    tags = entry["tags"]
    if len(tags) < 2:
        debugLog.debug('skipping because too few tags: %s' % title)
        return None

    parts = tags[1].term.split("/")
    sat = parts[0]
    instrument = parts[1]
    if instrument != "MODIS":
        debugLog.debug('skipping because of instrument')
        return None

    # check for KMZ or GeoTiff - if not present, skip
    story = entry["link"]
    page = urllib2.urlopen(story)
    content = BeautifulSoup(page)
    
    # check for KMZ
    kmzLink = findKmz(content)
    kmzSuccess = True
    if kmzLink:
        temp_kmz = "temp_kmz"
        download(kmzLink, temp_kmz)
        kmlFileName = extractKmz(temp_kmz)
        if kmlFileName:
            kmlFile = open(kmlFileName, 'r')
            content = BeautifulSoup(kmlFile)
            box = content.find('latlonbox')
            north = box.find('north').getText()
            south = box.find('south').getText()
            east = box.find('east').getText()
            west = box.find('west').getText()

            # cleanup temp directory
            try:
                kmlDir = kmlFileName.rpartition('/')[0]
                os.remove(kmlFileName)
                os.removedirs(kmlDir)
            except OSError as e:
                errorLog.error('(processEntry) %s: %s', e.strerror, e.filename)
        
        else:
            kmzSuccess = False

        try:
            os.remove(temp_kmz)
        except OSError as e:
            errorLog.error('(processEntry) %s: %s', e.strerror, e.filename)

    else:
        kmzSuccess = False

    # check for GeoTiff
    if kmzSuccess == False:
        tiffLink = findTiff(content)
        if tiffLink:
            temp_tiff = "temp_tiff"
            download(tiffLink, temp_tiff)
            ds = gdal.Open(temp_tiff)
            width = ds.RasterXSize
            height = ds.RasterYSize
            gt = ds.GetGeoTransform()
            west = gt[0]
            south = gt[3] + width*gt[4] + height*gt[5]
            east = gt[0] + width*gt[1] + height*gt[2]
            north = gt[3]

            # cleanup temp file
            try:
                os.remove(temp_tiff)
            except OSError as e:
                errorLog.error('(processEntry) %s: %s', e.strerror, e.filename)

        else:
            debugLog.debug('skipping because lacking image')
            return None
    
    # if the entry is kept, parse the rest of the fields
    date = entry["date"].split("T")[0]
    title = entry["title"]
    description = entry["summary_detail"].value
    thumbnail = entry["media_thumbnail"][0].get("url")
    keyword = ''

    # if the category is a fire or flood, look for keywords
    # about the base layer and overlay
    category = entry["tags"][0].term
    lowerContent = content.getText().lower()
    if category == 'Floods':
        if lowerContent.count('natural-color') > 0:
            keyword = 'natural-color'
        if lowerContent.count('natural color') > 0:
            keyword = 'natural-color'
    if category == 'Fires':
        if lowerContent.count('red outlines') > 0:
            keyword = 'outlines'
    
    retobj = { 
            'title':title, 
            'date':date, 
            'description':description, 
            'category':category, 
            'satellite':sat, 
            'instrument':instrument, 
            'thumbnail':thumbnail, 
            'link':story, 
            'north':north, 
            'south':south, 
            'east':east, 
            'west':west, 
            'keyword':keyword}

    return retobj

# Driver
def main():
    if not feed:
        entries = pullRss("http://www.earthobservatory.nasa.gov/Feeds/rss/nh.rss")
    else:
        entries = pullRss(feed)
    num = 0
    recent_titles = []
    data = []

    outFileName = os.path.join(libDir, 'events_data.json')
    # get existing data to make sure we aren't adding duplicates
    if os.path.exists(outFileName):
    	outfile = open(outFileName, 'r+w')
        try:
            data = json.load(outfile)
            last_len = 0
            if len(data) < len(entries):
                last_len = len(data) * -1
    	    else:
                last_len = len(entries) * -1
    	    recent_entries = data[last_len:]
  
    	    for r in recent_entries:
                recent_titles.append(r["title"])
           
        except ValueError:
            pass

    else:
        outfile = open(outFileName, 'w+');


    for e in entries:
        obj = processEntry(e)
        if obj:
            if not obj["title"] in recent_titles:
                debugLog.debug("selected: %s" % obj["title"])
                data.append(obj)
                num = num + 1
            else:
                debugLog.debug("already seen: %s" % obj["title"])
    
    outfile.seek(0)
    if len(data) < 100:
        json.dump(data, outfile)
    else:
        json.dump(data[-100:], outfile)
    outfile.truncate()
    outfile.close()

main()
