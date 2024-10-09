<?php
/**
 * Divide the given author name into two parts, firstName and lastName.
 * Return both in the associative array <div firstName=">," lastName=" 
 * The firstName is "" if no firstName is given and the lastName has the name.
 */
function extractFirstAndLastNames($author) {
    // Remove .'s from name
    $cleanAuthorItem = stripDotsAndSpareSpace($author);
    $cleanAuthor = $cleanAuthorItem['newString'];
    $lastSpace = $cleanAuthorItem['lastSpace'];
    if ($lastSpace === -1) {
        $lastName = $cleanAuthor;
        $firstName = "";
    }
    else {
        $lastName = substr($cleanAuthor, $lastSpace + 1);
        $firstName = substr($cleanAuthor, 0, $lastSpace);
    }
    $nameParts = ['firstName' => $firstName, 'lastName' => $lastName];
    return $nameParts;
}

function stripDotsAndSpareSpace($s) {
    $s1 = trim($s);
    $n = strlen($s1);
    $s2 = "";
    $lastSpace = -1;
    $lastWasSpace = false;
    for ($i = 0; $i < $n; $i++) {
        $c = $s1[$i];
        if ($c === ".") {
            $addChar = " ";
        }
        elseif($c === " " || $c === "\t") {
            if ($lastWasSpace) {
                $addChar = "";
            }
            else {
                $addChar = " ";
            }
        }
        else {
            $addChar = $c;
        }
        $s2 .= $addChar;
        if ($addChar === " ") {
            $lastSpace = strlen($s2) - 1;
        }
    }
    return ['newString'=>$s2, 'lastSpace'=>$lastSpace];
}
