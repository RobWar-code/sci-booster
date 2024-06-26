<?php
/**
 * Divide the given author name into two parts, firstName and lastName.
 * Return both in the associative array <div firstName=">," lastName=" 
 * The firstName is "" if no firstName is given and the lastName has the name.
 */
function extractFirstAndLastNames($author) {
    // Check for last "." in the name
    $author = trim($author);
    $strEnd = strlen($author) - 1;
    $found = false;
    $i = $strEnd;
    do {
        $c = $author[$i];
        if ($c === "." || $c === " ") {
            $found = true;
        }
        else {
            --$i;
        }
    } while ($i >= 0 && !$found);
    if (!$found) {
        $firstName = "";
        $lastName = trim($author);
    }
    else {
        $lastName = substr($author, $i + 1, strlen($author) - ($i + 1));
        if ($c === " ") {
            // Find the nearest alpha
            --$i;
            $found = false;
            do {
                $c = $author[$i];
                if (($c >= "A" && $c <= "Z") || ($c >= "a" && $c <= "z")) {
                    $found = true;
                }
                else {
                    --$i;
                }
            }  while ($i >= 0 && !$found);
            if ($found) {
                $firstName = substr($author, 0, $i + 1);
            }
            else {
                $firstName = "";
            }
        }
        else {
            $firstName = trim(substr($author, 0, $i - 1));
        }
    }

    $nameParts = ['firstName' => $firstName, 'lastName' => $lastName];
    return $nameParts;
}
