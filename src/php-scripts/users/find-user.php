<?php
/*
    PHP function to return the associative array for
    the given user
*/
include_once __DIR__ . "/../db-connect.php";

function findUser($username) {
    global $dbConn;

    $sql = "SELECT * FROM user WHERE username = '" . $username . "'";

    $result = $dbConn->query($sql);
    if ($result && $row = $result->fetch_assoc()) {
        return ["result"=>TRUE, "user"=>$row];
    }
    else {
        return ["result"=>FALSE];
    }
}