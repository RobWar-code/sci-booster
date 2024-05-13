<?php
    /*
        To service request from client, whether the owner has
        already been set.

        input json: {"request": "ownerSet"}
        output json: {"result": true/false}
    */
    include_once __DIR__ . '/../db-connect.php';

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    if ($inputData['request'] === "ownerSet") {
        if (ownerSet()) {
            $response = ['result' => TRUE];
        }
        else {
            $response = ['result' => FALSE];
        }
        echo json_encode($response);
    }
    else {
        $response = ['result' => FALSE, 'error' => 'owner-set.php unrecognised request'];
        echo json_encode($response);
    }

    function ownerSet() {
        global $dbConn;

        $sql = "SELECT COUNT(*) as count from user WHERE status = 'owner'";
        $result = $dbConn->query($sql);

        // Fetch and display the count
        if ($result && $row = $result->fetch_assoc()) {
            if ($row['count'] > 0) {
                return TRUE;
            }
            else {
                return FALSE;
            }
        } else {
            return FALSE;
        }
    }
