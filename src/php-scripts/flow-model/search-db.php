<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . "/misc-funcs.php";

    function findExternalAuthor($author, $authorId) {
        global $dbConn;

        if ($authorId != NULL) {
            // Search by authorId
            $sql = "SELECT * FROM external_author WHERE id = $authorId";
        }
        elseif($author != NULL) {
            // Split the name into first and last parts
            $nameParts = extractFirstAndLastNames($author);
            $firstName = $nameParts['firstName'];
            $lastName = $nameParts['lastName'];
            $sql = "SELECT * FROM external_author WHERE first_name = '$firstName' AND last_name = '$lastName'";
        }
        $result = $dbConn->query($sql);
        return $result;
    }