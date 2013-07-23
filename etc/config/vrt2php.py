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
import sys
import os
import os.path
from xml.dom.minidom import parseString
import xml.parsers.expat

# GLOBALS

# <product name in Worldview>, <VRT filename>, <units>, <min palette value>, <max palette value>, <min valid palette index>, <max valid palette index>
productListGeo = \
    [['AIRS_Precipitation_Day', 'AIRS_Precip_template.vrt', 'mm/day', '7.2', '30', 61, 251], \
     ['AIRS_Precipitation_Night','AIRS_Precip_template.vrt', 'mm/day', '7.2', '30', 61, 251], \
     ['AIRS_CO_Total_Column_Day','AIRS_CO_template.vrt', 'ppb', '98.8', '120', 198, 251], \
     ['AIRS_CO_Total_Column_Night','AIRS_CO_template.vrt', 'ppb', '98.8', '120', 198, 251], \
     ['AIRS_Dust_Score','AIRS_Dust_template.vrt', 'score', '360', '520', 1, 251], \
     ['AIRS_Prata_SO2_Index_Day','AIRS_Prata_SO2_template.vrt', 'DU', '0', '30', 1, 251], \
     ['AIRS_Prata_SO2_Index_Night','AIRS_Prata_SO2_template.vrt', 'DU', '0', '30', 1, 251], \
     ['OMI_SO2_Planetary_Boundary_Layer','OMI_CloudPressure_template.vrt', 'DU', '1.2', '2.0', 139, 217], \
     ['OMI_SO2_Lower_Troposphere','OMI_CloudPressure_template.vrt', 'DU', '0.8', '2.0', 99, 217], \
     ['OMI_SO2_Middle_Troposphere','OMI_CloudPressure_template.vrt', 'DU', '0.4', '2.0', 61, 217], \
     ['OMI_SO2_Upper_Troposphere_and_Stratosphere','OMI_CloudPressure_template.vrt', 'DU', '0.4', '2.0', 61, 217], \
     ['OMI_Aerosol_Index', 'OMI_CloudPressure_template.vrt', '', '1.1', '2.0', 128, 217], \
     ['OMI_Aerosol_Optical_Depth', 'OMI_CloudPressure_template.vrt', '', '1.1','2.0', 128, 217], \
     ['OMI_Absorbing_Aerosol_Optical_Depth', 'OMI_CloudPressure_template.vrt', '', '0.27','0.5', 128, 217], \
     ['OMI_Cloud_Pressure', 'OMI_CloudPressure_template.vrt', 'hPa', '0','1100', 20, 217], \
     ['MODIS_Terra_Aerosol', 'MOR4ODLO_template.vrt', '', '0.27', '0.70', 12, 20], \
     ['MODIS_Aqua_Aerosol', 'MOR4ODLO_template.vrt', '', '0.27', '0.70', 12, 20], \
     ['MODIS_Terra_Brightness_Temp_Band31_Day', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Terra_Brightness_Temp_Band31_Night', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Aqua_Brightness_Temp_Band31_Day', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Aqua_Brightness_Temp_Band31_Night', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Terra_Cloud_Top_Pressure_Day', 'MOR6CTP_template.vrt', 'hPa', '250', '950', 6, 19], \
     ['MODIS_Terra_Cloud_Top_Pressure_Night', 'MOR6CTP_template.vrt', 'hPa', '250', '950', 6, 19], \
     ['MODIS_Aqua_Cloud_Top_Pressure_Day', 'MOR6CTP_template.vrt', 'hPa', '250', '950', 6, 19], \
     ['MODIS_Aqua_Cloud_Top_Pressure_Night', 'MOR6CTP_template.vrt', 'hPa', '250', '950', 6, 19], \
     ['MODIS_Terra_Cloud_Top_Temp_Day', 'MOR6CTT_template.vrt', 'K', '220', '290', 6, 19], \
     ['MODIS_Terra_Cloud_Top_Temp_Night', 'MOR6CTT_template.vrt', 'K', '220', '290', 6, 19], \
     ['MODIS_Aqua_Cloud_Top_Temp_Day', 'MOR6CTT_template.vrt', 'K', '220', '290', 6, 19], \
     ['MODIS_Aqua_Cloud_Top_Temp_Night', 'MOR6CTT_template.vrt', 'K', '220', '290', 6, 19], \
     ['MODIS_Terra_Land_Surface_Temp_Day', 'MOR11LST_colortable.vrt', 'K', '240', '340', 0, 251], \
     ['MODIS_Terra_Land_Surface_Temp_Night', 'MOR11LST_colortable.vrt', 'K', '240', '340', 0, 251], \
     ['MODIS_Aqua_Land_Surface_Temp_Day', 'MOR11LST_colortable.vrt', 'K', '240', '340', 0, 251], \
     ['MODIS_Aqua_Land_Surface_Temp_Night', 'MOR11LST_colortable.vrt', 'K', '240', '340', 0, 251], \
     ['MODIS_Terra_Sea_Ice', 'MOR29SIR_colortable.vrt', '', '0', '1', 200, 200], \
     ['MODIS_Aqua_Sea_Ice', 'MOR29SIR_colortable.vrt', '', '0', '1', 200, 200], \
     ['MODIS_Terra_Snow_Cover', 'MOR10FSC_colortable.vrt', '%', '1', '100', 1, 100], \
     ['MODIS_Aqua_Snow_Cover', 'MOR10FSC_colortable.vrt', '%', '1', '100', 1, 100], \
     ['MODIS_Terra_Water_Vapor_5km_Day', 'MOR5WVIR_template.vrt', 'cm', '0.1', '9.6411', 6, 130], \
     ['MODIS_Terra_Water_Vapor_5km_Night', 'MOR5WVIR_template.vrt', 'cm', '0.1', '9.6411', 6, 130], \
     ['MODIS_Aqua_Water_Vapor_5km_Day', 'MOR5WVIR_template.vrt', 'cm', '0.1', '9.6411', 6, 130], \
     ['MODIS_Aqua_Water_Vapor_5km_Night', 'MOR5WVIR_template.vrt', 'cm', '0.1', '9.6411', 6, 130]]
     
productListPolar = \
    [['MODIS_Terra_Brightness_Temp_Band31_Day', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Terra_Brightness_Temp_Band31_Night', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Aqua_Brightness_Temp_Band31_Day', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Aqua_Brightness_Temp_Band31_Night', 'MOR2B31_colortable.vrt', 'K', '190', '340', 0, 255], \
     ['MODIS_Terra_Sea_Ice', 'MOR29SIR_colortable.vrt', '', '0', '1', 200, 200], \
     ['MODIS_Aqua_Sea_Ice', 'MOR29SIR_colortable.vrt', '', '0', '1', 200, 200], \
     ['MODIS_Terra_Snow_Cover', 'MOR10FSC_colortable.vrt', '%', '1', '100', 1, 100], \
     ['MODIS_Aqua_Snow_Cover', 'MOR10FSC_colortable.vrt', '%', '1', '100', 1, 100]]


def printUsage(errMsg):
    print
    print "Error parsing input arguments:  "+errMsg
    print
    print "Usage:"
    print "   python scriptName.py <input_vrt_directory> <output_php_filename> [-polar]"
    print
    print "   Note that the \"-polar\" flag must be the last parameter"
    print
    
#end printUsage


def readColorTableValuesFromVrt(vrtFilename):

    # Open file
    print "Reading VRT: "+vrtFilename
    vrtFile = open(vrtFilename, 'r')
    vrtData = vrtFile.read()
    vrtFile.close()

    # Carefully try to load XML into a DOM
    try:
        dom = parseString(vrtData)
    except xml.parsers.expat.ExpatError:
        # This is a hack to catch cases where (MODIS) VRTs aren't properly-structured XML
        vrtData = "<ColorTable>\n" + vrtData + "\n</ColorTable>"
        dom = parseString(vrtData)



    ctEntries = dom.getElementsByTagName('Entry')
    if len(ctEntries) != 256:
        print "ERROR: " + vrtFilename + \
            " does not contain 256 palette entries; skipping. " +\
            "(It contains " + len(ctEntries) + " entries)"
        return []


    # Initialize palette array to [256, 4];   (R, G, B, A)
    paletteEntries = [[0 for col in range(4)] for row in range(256)]

    # Read each entry into a [256, 4] array
    for i in range(0, 256):

        # Get/check idx value
        idx = int(ctEntries[i].attributes["idx"].value)
        if (idx < 0) or (idx > 255):
            print "ERROR: index is out of range ("+idx+")"
            return []

        # Save palette entries
        redVal = int(ctEntries[i].attributes["c1"].value)
        greenVal = int(ctEntries[i].attributes["c2"].value)
        blueVal = int(ctEntries[i].attributes["c3"].value)
        alphaVal = int(ctEntries[i].attributes["c4"].value)
        paletteEntries[idx][0] = redVal
        paletteEntries[idx][1] = greenVal
        paletteEntries[idx][2] = blueVal
        paletteEntries[idx][3] = alphaVal
        
        #print paletteEntries[idx]

    #end for all palette entries

    return paletteEntries

#end readColorTableValuesFromVrt



# Main routine
def main(argv):

    # Read/validate command line args:  input_vrt_directory output_php_file
    if ((len(argv) < 2) or (len(argv) > 3)):
        printUsage("number of arguments must be 2 or 3")
        exit()


    # Parse input args
    inputPath = argv[0];
    outputFilePath = argv[1];
    productList = []
    if ((len(argv) == 3) and (argv[2] == "-polar")):
    	productList = productListPolar
    	print "\"-polar\" flag found;  outputting polar palettes"
    else:
        productList = productListGeo

    if inputPath[len(inputPath)-1] != "/":
        inputPath = inputPath + "/"
    if not os.path.exists(inputPath):
        printUsage("Input directory ("+inputPath+") does not exist")
        exit()

    print
    print "Input directory set to "+inputPath
    print "Output file will be "+outputFilePath
    print

    if os.path.isfile(outputFilePath):
        print "Removing existing output file"
        os.remove(outputFilePath)

    # Open new php file for writing and write header
    outputFile = open(outputFilePath, 'w')
    outputFile.write("<?php\n")
    outputFile.write("\t$json = array(\n")



    # Loop through all products
    for i in range(0, len(productList)):

        # Retrieve product info for current iteration
        productName = productList[i][0];
        productVrt = productList[i][1];

        # Construct full path to VRT and verify that it exists
        fullVrtPath = inputPath + productVrt;
        if not os.path.isfile(fullVrtPath):                                                                      
            print "WARNING: "+fullVrtPath+" does not exist;  skipping."                                          
            continue 

        # Read color table values
        colorTableVals = readColorTableValuesFromVrt(fullVrtPath)

        if (len(colorTableVals) < 1):
            print "ERROR: no color table found for "+fullVrtPath+"; skipping"
            continue

        # Write to php file
        outputFile.write("\t\"" + productName + "\" => array(\n")
        outputFile.write("\t\t\"units\" => \"" + productList[i][2] + "\",\n")
        outputFile.write("\t\t\"min\" => \"" + productList[i][3] + "\",\n")
        outputFile.write("\t\t\"max\" => \"" + productList[i][4] + "\",\n")
        outputFile.write("\t\t\"minValidPaletteIdx\" => \"" + str(productList[i][5]) + "\",\n")
        outputFile.write("\t\t\"maxValidPaletteIdx\" => \"" + str(productList[i][6]) + "\",\n")
        outputFile.write("\t\t\"palette\" => array(\n")
        
        # Only output "valid" range of palette indices
        for j in range(productList[i][5],productList[i][6]+1):
            outputFile.write("\t\t\t\"")
            outputFile.write(str(colorTableVals[j][0]) + ",")
            outputFile.write(str(colorTableVals[j][1]) + ",")
            outputFile.write(str(colorTableVals[j][2]) + ",")
            outputFile.write(str(colorTableVals[j][3]) + "\"")

            #outputFile.write("\t\t\tarray(\n")
            #outputFile.write("\t\t\t\t\"r\" => " + str(colorTableVals[j][0]) + ",\n")
            #outputFile.write("\t\t\t\t\"g\" => " + str(colorTableVals[j][1]) + ",\n")            
            #outputFile.write("\t\t\t\t\"b\" => " + str(colorTableVals[j][2]) + ",\n")
            #outputFile.write("\t\t\t\t\"a\" => " + str(colorTableVals[j][3])+ "\n")

            if (j < productList[i][6]):
                outputFile.write(",\n")
            else:
                outputFile.write("\n")

            #if (j < productList[i][6]):
            #    outputFile.write("\t\t\t),\n")
            #else:
            #    outputFile.write("\t\t\t)\n")

        
        outputFile.write("\t\t)\n")


        # Special case to skip adding comma if last file in list
        if (i < len(productList) - 1):
            outputFile.write("\t),\n")
        else:
            outputFile.write("\t)\n")

    #end for loop through all products


    # Add closing text and close php file 
    outputFile.write("\t);\n\n");
    outputFile.write("\techo json_encode($json);\n")
    outputFile.write("?>")
    outputFile.close()



#end main



if __name__ == "__main__":
    # Chop off first argv since it's just the script name
    main(sys.argv[1:])
