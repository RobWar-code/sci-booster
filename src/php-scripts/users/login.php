<?php
    /*
        Test whether the given login details match an entry in the user table 
        send back the user record as json if matched.

        input : {request: login, username:, password: }
        return : {result: true/false, user: user record}
        error return : {result: false, error : }
    */
    include_once __DIR__ . "/find-user.php";

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    // Check the input data
    if ($inputData['username'] === "") {
        $responseObj = ['result'=>FALSE, 'error'=>"login.php: bad username"];
        echo json_encode($responseObj);
        exit();
    }
    if ($inputData['password'] === "") {
        $responseObj = ['result'=>FALSE, 'error'=>"login.php: bad password"];
        echo json_encode($responseObj);
        exit();
    }

    $userObj = findUser($inputData['username']);

    if ($userObj['result'] === TRUE) {
        // Check the password
        $recordPwd = $userObj['user']['password'];
        if (password_verify($inputData['password'], $recordPwd)) {
            // Report OK and send back data
            $responseObj = ['result'=>TRUE, 'user'=>$userObj['user']];
            echo json_encode($responseObj);
            exit();
        }
        else {
            $responseObj = ['result'=>FALSE, 'error'=> "login.php: bad password"];
            echo json_encode($responseObj);
            exit();
        }
    }
    else {
        $responseObj = ['result'=>FALSE, 'error'=>"login.php: username not matched"];
        echo json_encode($responseObj);
        exit();
    }