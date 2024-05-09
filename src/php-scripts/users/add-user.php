<?php
    /*
        Add the user transmitted to the user table

        input json: {username, password, status}
        output json: {result: true/false, error: message}
    */
    include_once __DIR__ . '/../db-connect.php';

    // Collect the json data
    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    // Validate the raw input data
    $username = htmlspecialchars($inputData['username']);
    if ($username === "") {
        $responseObj = ['result' => FALSE, 'error' => "add-user.php username is null"];
        echo json_encode($responseObj);
        exit();
    }

    if ($inputData['password'] === "") {
        $responseObj = ['result' => FALSE, 'error' => "add-user.php password is null"];
        echo json_encode($responseObj);
        exit();
    }

    if ($inputData['status'] === "") {
        $responseObj = ['result' => FALSE, 'error' => "add-user.php status is null"];
        echo json_encode($responseObj);
        exit();
    }

    $result = addUser($inputData);
    if ($result) {
        $response = ['result'=>TRUE];
    }
    else {
        $response = ['result'=>FALSE, 'error'=>"add-user.php - Problem inserting entry"];
    }

    echo json_encode($response);

    function addUser($inputData) {
        global $dbConn;

        // Convert the password
        $hashedPassword = password_hash($inputData['password'], PASSWORD_BCRYPT, ['cost' => 10]);

        $sql = "INSERT INTO user (username, password, status) VALUES (?,?,?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("add-user.php: problem with $stmt prepare" . $dbConn->error, 0);
            return FALSE;
        }
        $stmt->bind_param('sss', $inputData['username'], $hashedPassword, $inputData['status']);
        if ($stmt->execute()) {
            return TRUE;
        }
        else {
            return FALSE;
        }
    }