<?php
    /*
        Test scripts to interface with html test procedures
        input json: {request: testName, data: {}}
    */

    include_once __DIR__ . "/../users/find-user.php";

    // Collect the json data
    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);
    
    if ($inputData['request'] === "testFindUser") {
        testFindUser($inputData['data']);
    }

    /*
        input is $data = [username=>username]
        output is $result = {result: true/false, user: {result row}}
    */
    function testFindUser($data) {
        $result = findUser($data['username']);
        echo json_encode($result);
    }