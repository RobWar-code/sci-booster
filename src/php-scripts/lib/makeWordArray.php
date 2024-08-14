<?php
    /**
     * Create an array from the alphanumeric tokens in $text.
     * Apart from the characters [a-z][A-Z][0-9], include the
     * include characters.
     */
    function makeWordArray($text, $includeChars) {
        $regExp = "/[a-zA-Z0-9{$includeChars}]/";
        $a = [];
        $p = 0;
        $w = "";
        while ($p < strlen($text)) {
            $c = $text[$p];
            $match = preg_match($regExp, $c);
            if (!$match) {
                if (strlen($w) > 0) {
                    array_push($a, $w);
                    $w = "";
                }
            }
            else {
                $w .= $c;
            }
            ++$p;
        }
        if ($w != "") {
            array_push($a, $w);
        }
        return $a;
    }