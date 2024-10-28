<?php
    include_once __DIR__ . "../db-connect.php";

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $response = resetPassword($inputData);

    echo json_encode($response);

    function resetPassword($inputData) {
        if (!isset($inputData['username'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: Missing username from data"];
            return $response;
        }
        if (!isset($inputData['password'])) {
            $reponse = ['result'=>false, 'status'=>"resetPassword: Missing password from data"];
            return $response;
        }
        if (!isset($inputData['passkey'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: Missing passkey from data"];
        }
        // Check that the passkey is valid
        if (!checkPasskey($inputData['passkey'])) {
            $response = ['result'=>false, 'status'=>"resetPassword: invalid pass key"];
            return $response;
        }
    }