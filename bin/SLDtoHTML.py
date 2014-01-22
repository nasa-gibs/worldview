#!/usr/bin/env python

'''
Created on Nov 15, 2013

@author: mcechini
'''

import colorsys
from xml.dom import minidom
from xml.dom import Node
import sys, getopt

class ColorMapEntry():
    quantity  = None
    label     = ""
    opacity   = None
    color     = ""
    
    def __hash__(self):
        return hash(self.quantity)
        
    def __cmp__(self, other):
        return self.quantity.cmp(other.quantity)

    def __eq__(self, other):
        return self.quantity.eq(other.quantity)


class NamedLayer():
    name    = ""
    entries = []
    
    def __hash__(self):
        return hash(self.name)
        
    def __cmp__(self, other):
        return self.name.cmp(other.name)

    def __eq__(self, other):
        return self.name.eq(other.name)
    
## Global Variables ##
layerList = []

## Functions ##
def getText(nodelist):
    rc = []
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc.append(node.data)
    return ''.join(rc)


## START Parse SLD ##
def parseSLD(sourceXml) :
    
    xmldoc     = minidom.parse(sourceXml)
    opacity    = None

    #for childNode in xmldoc.documentElement.childNodes :
    for nlNode in xmldoc.documentElement.getElementsByTagName("NamedLayer") :
        
        namedLayer = NamedLayer()
        namedLayer.entries = []
        
        for nlChildNode in nlNode.childNodes :
            if nlChildNode.nodeType == Node.ELEMENT_NODE :
                if nlChildNode.nodeName == "Name" or nlChildNode.nodeName == "se:Name" :
                    namedLayer.name = getText(nlChildNode.childNodes)
                if nlChildNode.nodeName == "UserStyle" :
                    opacity = None
                    rasterSyms = nlChildNode.getElementsByTagName("RasterSymbolizer")
                    if not rasterSyms:
                        rasterSyms = nlChildNode.getElementsByTagName("se:RasterSymbolizer")
                    for rasterSym in rasterSyms :
                        for rsymChildNode in rasterSym.childNodes :
                            if rsymChildNode.nodeType == Node.ELEMENT_NODE :
                                if rsymChildNode.nodeName == "Opacity" :
                                    opacity = float(getText(rsymChildNode.childNodes))
                                if rsymChildNode.nodeName == "ColorMap" or rsymChildNode.nodeName == "se:ColorMap":
                                    for entryNode in rsymChildNode.getElementsByTagName("ColorMapEntry") :
                                        attrDict = dict(entryNode.attributes.items())
    
                                        cmEntry = ColorMapEntry()
                                        
                                        if 'opacity' in attrDict :
                                            cmEntry.opacity = float(attrDict['opacity'])
                                        elif opacity != None :
                                            cmEntry.opacity = opacity
                                            
                                        if 'quantity' in attrDict :
                                            cmEntry.quantity = float(attrDict['quantity'])
                                            
                                        cmEntry.label = attrDict.get('label', '')
                                        cmEntry.color = attrDict['color']

                                    
                                        namedLayer.entries.append(cmEntry)
                                
        layerList.append(namedLayer)


## END Parse SLD ##

def is_bright(color):
    """
    http://24ways.org/2010/calculating-color-contrast
    """
    r = int(color[1:3], 16)
    g = int(color[3:5], 16)
    b = int(color[5:7], 16)
    yiq = ((r * 299) + (g * 587) + (b * 144)) / 1000
    return yiq > 128

## START Generate HTML ##
def generateHTML(sldFile) :
    
    for layer in layerList :
        print("<!doctype html>")
        print("<html>")
        print("<head>")
        print('<link rel="stylesheet" type="text/css" href="resources/sld.css">')
        print("</head>")
        print("<body>")

        print("<h1>" + layer.name + "</h1>")

        print("<p>Download SLD file <a href=\"" + sldFile + "\">here</a><br><br>")

        print("<table>")
        
        print("  <tr>")
        print("    <th>Color</th>")
        print("    <th class='opacity'>Opacity</th>")
        print("    <th class='data-value'>Label</th>")
        print("    <th class='data-value'>Quantity</th>")
        print("  </tr>")
        
        for entry in layer.entries :
            print("  <tr>")
            print("    <td class='color' bgcolor=" + entry.color + ">" + 
                  "<font color=\"" + ("black" if is_bright(entry.color) else "white") + "\">" +
                  entry.color + "</font></td>")
            print("    <td class='opacity'>" + (str(entry.opacity) if entry.opacity != None else "") + "</td>")
            print("    <td class='data-value'>" + entry.label.encode('ascii', 'xmlcharrefreplace') + "</td>")
            print("    <td class='data-value'>" + (str(entry.quantity) if entry.quantity != None else "") + "</td>")
            print("  </tr>")
        
        print("</table>")
        print("</body>")
        print("</html>")

def main(argv):

    sldFile = ""

    try:
        opts, args = getopt.getopt(argv,"hi:s:",["sld="])
    except getopt.GetoptError:
        print ("MercatorDriver.py -s <sld>")
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print ("MercatorDriver.py -s <sld>")
            sys.exit()
        elif opt in ("-s", "--sld"):
            sldFile = arg

    parseSLD(sldFile)
    generateHTML(sldFile)

if __name__ == "__main__":
   main(sys.argv[1:])

