<?php
    /*
        Add the user transmitted to the user table

        input json: {request: addUser, username, password, status, editor_key}
        output json: {result: true/false, error: message}
    */
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . '/find-user.php';

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

    if ($inputData['status'] != "user" && $inputData['status'] != "editor" && $inputData['status'] != "owner") {
        $responseObj = ['result' => FALSE, 'error' => "add-user.php status is an invalid value"];
        echo json_encode($responseObj);
        exit();
    }

    // Check whether the username already exists in the table
    $response = findUser($inputData['username']);
    if ($response['result'] === TRUE) {
        $responseObj = ['result' => FALSE, 'error' => "add-user.php username already exists"];
        echo json_encode($responseObj);
        exit();
    }
    
    // Check whether the user is an editor
    if ($inputData['status'] === "editor") {
        // Check the editor key
        if ($inputData['editor_key'] != NULL) {
            $sql = "SELECT * FROM editor_key LIMIT 1";
            $result = $dbConn->query($sql);
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $editorHash = $row['editor_key'];
                if (!password_verify($inputData['editor_key'], $editorHash)) {
                    $response = ['result'=>FALSE, 'error'=>'add-user.php: editor key not matched'];
                    echo json_encode($response);
                    exit();
                }
            }
        }
        else {
            error_log("add-user.php: editor_key missing from details", 0);
            $response = ['result'=>FALSE, 'error'=>"add-user.php - missing editor key"];
            echo json_encode($response);
            exit();
        }

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
            error_log("add-user.php: problem with $stmt execute" . $stmt->error, 0);
            return FALSE;
        }
    }