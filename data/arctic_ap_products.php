<?php
	$json = array(
		"All"=> array(
			array(
		        "label"=> "Corrected Reflectance (True Color)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_CorrectedReflectance_TrueColor",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Corrected Reflectance (True Color)",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_CorrectedReflectance_TrueColor",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Corrected Reflectance (3-6-7)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_CorrectedReflectance_Bands367",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Day)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Brightness_Temp_Band31_Day",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Night)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Brightness_Temp_Band31_Night", 
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Day)",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Brightness_Temp_Band31_Day",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Night)",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Brightness_Temp_Band31_Night",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Empty",
		        "sublabel"=> "",
		        "value"=> "NON_EXISTENT_LAYER",
		        "type" => "single", "category" => "baselayers"

			),
			array(
		        "label"=> "Sea Ice Extent",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Sea_Ice",
		        "type" => "multi", "category" => "overlays"
			),
			array(
		        "label"=> "Sea Ice Extent",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Sea_Ice",
		        "type" => "multi", "category" => "overlays"
			),
			array(
		        "label"=> "Snow Cover",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Snow_Cover",
		        "type" => "multi", "category" => "overlays"
			),
			array(
		        "label"=> "Snow Cover",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Snow_Cover",
		        "type" => "multi", "category" => "overlays"
			),
	        array(
		        "label"=> "Population Density",
		        "sublabel"=> "SEDAC GRUMP v1 Population Count 2000",
		        "value"=> "grump-v1-population-count_2000",
		        "type" => "multi", "category" => "overlays"
			),
			array(
		        "label"=> "Coastlines",
		        "sublabel"=> "Polarview / Coastlines",
		        "value"=> "polarview:coastArctic10",
		        "type" => "multi", "category" => "overlays"
		        
			),	
			array(
		        "label"=> "Global Labels",
		        "sublabel"=> "SEDAC / Global Labels",
		   		"value"=> "cartographic:00-global-labels",
		        "type" => "multi", "category" => "overlays"
		        
			),
			array(
		        "label"=> "Latitude-Longitude Lines",
		        "sublabel"=> "Polarview / Graticule",
		        "value"=> "polarview:graticuleN",
		        "type" => "multi", "category" => "overlays"
		        
			)
			
		)
	);

	echo json_encode($json);
?>