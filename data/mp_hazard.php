<?php
	$items = array(
		"items" => array(
			array(
				"label" => "Wildfires",
				"value" => "wf",
				"disabled" => true
			),
			array(
				"label" => "Air Quality",
				"value" => "aq",
				"disabled" => true
			),
			array(
				"label" => "Agriculture",
				"value" => "ag",
				"disabled" => true
			),
			/*array(
				"label" => "Severe Storms",
				"value" => "ss",
				"disabled" => true
			),*/
			array(
				"label" => "Smoke Plumes",
				"value" => "sp",
				"disabled" => true
			),
			array(
				"label" => "Vegetation",
				"value" => "veg",
				"disabled" => true
			),
			array(
				"label" => "Dust Storms",
				"value" => "DustStorms"
			)
		),
		//"selected" => "DustStorms"
	);

	#if ($_GET['time'] == "today")
		#$items["items"][2]["disabled"] = false;

	echo json_encode($items);
?>