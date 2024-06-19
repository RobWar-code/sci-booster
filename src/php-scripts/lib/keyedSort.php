<?php
	/** Sort the associative array members of the given array by
		by the given key. Returns a new array
	*/
	function keyedSort($array, $key) {
		// Extract key value with index
		$keyList = [];
		$index = 0;
		foreach($array as $record) {
			$keyList[$record[$key]] = $index;
			++$index;
		}

		// Sort key field by the value
		ksort($keyList, SORT_REGULAR);

		// Sort the main array using the key list
		$newArray = [];
		foreach($keyList as $value => $index) {
			array_push($newArray, $array[$index]);
		}

		return $newArray;
	}

