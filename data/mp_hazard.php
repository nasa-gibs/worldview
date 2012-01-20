<?php
	$items = array(
		"items" => array(
			array(
				"label" => "Wildfires",
				"value" => "Wildfires",
				"disabled" => false
			),
			array(
				"label" => "Drought",
				"value" => "Drought",
				"disabled" => false
			),
			/*array(
				"label" => "Severe Storms",
				"value" => "ss",
				"disabled" => true
			),*/
			array(
				"label" => "Smoke Plumes",
				"value" => "SmokePlumes",
				"disabled" => false
			),
			array(
				"label" => "Vegetation",
				"value" => "Vegetation",
				"disabled" => false
			),
			array(
				"label" => "Shipping",
				"value" => "Shipping",
				"disabled" => false
			),
			array(
				"label" => "Dust Storms",
				"value" => "DustStorms",
				"disabled" => false
			)
		),
		//"selected" => "DustStorms"
	);

	#if ($_GET['time'] == "today")
		#$items["items"][2]["disabled"] = false;

	echo json_encode($items);
?>