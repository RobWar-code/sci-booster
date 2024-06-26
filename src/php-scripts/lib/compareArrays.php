<?php
    /**
     * Compare the arrays A and B using the key (unless set to ""). Use similar
     * comparison as same if this parameter is true and the comparison is for strings.
	 * It is an assumption that the members of each array are unique.
     * 
     * Returns - indexes of elements
     * ["same"=> [], // a same as b - lists both the a and b indexes in pairs a, b, a, b etc.
     * "aOnly"=> [],
     * "bOnly"=> []
     * ]
     */
    function compareArrays($arrayA, $arrayB, $key, $useSimilar) {
		if ($key) {
			$a = getKeyList($arrayA, $key);
			$b = getKeyList($arrayB, $key);
		}
		else {
			$a = $arrayA;
			$b = $arrayB;
		}
        $same = [];
        $aOnly = [];
        $bOnly = [];
		$aIndex = 0;
        foreach($a as $aVal) {
        	$bIndex = 0;
            $matched = false;
			$done = false;
			while(!$matched && $bIndex < count($b)) {
				$bVal = $b[$bIndex];
				// Check for same
				if ($useSimilar) {
					if ($bVal[0] === $aVal[0]) {
						$matches = similar_text($aVal, $bVal);
						if (strlen($aVal) >= 7) {
							if ($matches >= strlen($aVal) - 2) {
								$matched = true;
								break;
							}
						}
						elseif (strlen($aVal) >= 5) {
							if ($matches >= strlen($aVal) - 1) {
								$matched = true;
								break;
							}
						}
						elseif ($aVal === $bVal) {
							$matched = true;
							break;
						}
					}
				}
				else {
					if ($aVal === $bVal) {
						$matched = true;
						break;
					}
				}
				if (!$matched) {
					++$bIndex;
				}
			}
			if ($matched) {
				array_push($same, $aIndex);
				array_push($same, $bIndex);
			}
			else {
				array_push($aOnly, $aIndex);
			}
			++$aIndex;
        }
		// Determine b only
		for ($i = 0; $i < count($arrayB); $i++) {
			$matched = false;
			for ($j = 1; $j < count($same); $j += 2) {
				if ($i === $same[$j]) {
					$matched = true;
					break;
				}
			}
			if (!$matched) {
				array_push($bOnly, $i);
			}
		}
		return ['same'=>$same, 'aOnly'=>$aOnly, 'bOnly'=>$bOnly];
    }
	
	function getKeyList($array, $key) {
		$outArray = [];
		foreach($array as $item) {
			array_push($outArray, $item[$key]);
		}
		return $outArray;
	}


