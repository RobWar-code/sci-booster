<?php

    /**
     * Returns -1 if not found otherwise index in array.
     */
    function findKeyedValue($array, $key, $value) {
        $index = -1;
        for ($i = 0; $i < count($array); $i++) {
            if ($array[$key] === $value) {
                $index = $i;
                break;
            }
        }
        return $index;
    }