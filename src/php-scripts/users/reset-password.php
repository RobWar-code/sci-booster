<?php
    include_once __DIR__ . "/../db-connect.php";
    include_once __DIR__ . "/check-passkey.php";

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $response = resetPassword($inputData);

    echo json_encode($response);

    function resetPassword($inputData) {
        global $dbConn;

        if (!isset($inputData['username'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: Missing username from data"];
            return $response;
        }
        $username = $inputData['username'];
        if (!isset($inputData['password'])) {
            $reponse = ['result'=>false, 'status'=>"resetPassword: Missing password from data"];
            return $response;
        }
        $password = $inputData['password'];
        if (!isset($inputData['passkey'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: Missing passkey from data"];
        }
        // Check that the passkey is valid
        if (!checkPasskey($inputData['passkey'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: invalid pass key"];
            return $response;
        }
        $passkey = $inputData['passkey'];

        // Update the password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $sql = "UPDATE user SET password = '$hashedPassword' WHERE username = '$username'";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"resetPassword: database update failed {$dbConn->error}"];
            return $response;
        }

        // Clear the passkey token
        $sql = "DELETE FROM temp_password WHERE password = '$passkey'";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"resetPassword: remove passkey failed {$dbConn->error}"];
            return $response;
        }

        $response = ['result'=>true, 'status'=>"resetPassword: Password Accepted"];
        return $response;

    }

