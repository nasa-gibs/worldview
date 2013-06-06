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
                "label"=> "Corrected Reflectance (7-2-1)",
                "sublabel"=> "Terra / MODIS",
                "value"=> "MODIS_Terra_CorrectedReflectance_Bands721",
                "type" => "single", "category" => "baselayers"

            ),
            array(
                "label"=> "Corrected Reflectance (7-2-1)",
                "sublabel"=> "Aqua / MODIS",
                "value"=> "MODIS_Aqua_CorrectedReflectance_Bands721",
                "type" => "single", "category" => "baselayers"

            ),
			array(
		        "label"=> "Sea Ice",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Sea_Ice",
		        "type" => "multi", "category" => "overlays"
			),
			array(
		        "label"=> "Sea Ice",
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
		        "label"=> "Brightness Temperature (Band 31-Day)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Brightness_Temp_Band31_Day",
		        "type" => "multi", "category" => "overlays"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Night)",
		        "sublabel"=> "Terra / MODIS",
		        "value"=> "MODIS_Terra_Brightness_Temp_Band31_Night", 
		        "type" => "multi", "category" => "overlays"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Day)",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Brightness_Temp_Band31_Day",
		        "type" => "multi", "category" => "overlays"

			),
			array(
		        "label"=> "Brightness Temperature (Band 31-Night)",
		        "sublabel"=> "Aqua / MODIS",
		        "value"=> "MODIS_Aqua_Brightness_Temp_Band31_Night",
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
                "sublabel"=> "OpenStreetMap / Coastlines",
                "value"=> "arctic_coastlines_3413",
                "type" => "multi", "category" => "overlays"
            ),
            array(
                "label"=> "Coastlines (EPSG:3995)",
                "sublabel"=> "Polarview / Coastlines",
                "value"=> "arctic_coastlines",
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
                "value"=> "arctic_graticule_3413",
                "type" => "multi", "category" => "overlays"
            ),
			array(
		        "label"=> "Latitude-Longitude Lines (EPSG:3995)",
		        "sublabel"=> "Polarview / Graticule",
		        "value"=> "polarview:graticuleN",
		        "type" => "multi", "category" => "overlays"
			)
			
		)
	);

	echo json_encode($json);
?>