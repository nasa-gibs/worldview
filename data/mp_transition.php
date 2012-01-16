<?php
	$items = array(
		"items" => array(
			array(
				"label" => "Standard",
				"value" => "sta"
			),
			array(
				"label" => "Crossfader",
				"value" => "cro",
				"disabled" => true
			),
			array(
				"label" => "Vertical Slider Bar",
				"value" => "vsb",
				"disabled" => true
			),
			array(
				"label" => "Data Probe",
				"value" => "dp",
				"disabled" => true
			),
			array(
				"label" => "Download",
				"value" => "dow",
				"disabled" => true
			)
		),
		"selected" => "sta"
	);

	echo json_encode($items);
?>