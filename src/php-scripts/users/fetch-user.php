<?php
    include_once __DIR__ . "/../db-connect.php";

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $response = fetchUser($inputData['username']);

    echo json_encode($response);

    function fetchUser($username) {
        global $dbConn;

        $sql = "SELECT * FROM user WHERE username = '$username'";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("fetchUser: Could not fetch record {$dbConn->error}", 0);
            $response = ['result'=>false, 'status'=>"fetchUser: Could not fetch record {$dbConn->error}"];
            return $response;
        }
        if ($result->num_rows === 0) {
            $response = ['result'=>false, 'status'=>"fetchUser: could not match username"];
            return $response;
        }
        $userDetails = $result->fetch_assoc();
        $response = ['result'=>true, 'data'=>$userDetails];
        return $response;
    }