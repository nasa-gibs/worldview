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
		        "label"=> "Coastlines",
		        "sublabel"=> "Polarview / Coastlines",
		        "value"=> "polarview:coastS10",
		        "type" => "multi", "category" => "overlays"
		        
			),	
			array(
		        "label"=> "Latitude-Longitude Lines",
		        "sublabel"=> "Polarview / Graticule",
		        "value"=> "polarview:graticule3031_10x30",
		        "type" => "multi", "category" => "overlays"
		        
			)
			
		)
	);

	echo json_encode($json);
?>