<?php
    include_once __DIR__ . "/../db-connect.php";

    // Collect the JSON data
    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $passKey = $inputData['pass_key'];

    $result = clearTables($passKey);

    echo json_encode($result);

    function clearTables($passKey) {
        global $dbConn;

        if ($passKey != "warnerxwy") {
            $response = ['result'=>false, 'status'=>'bad pass key'];
            return $response;
        }

        $sql = "DELETE FROM conversion_formula";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear conversion_formula table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM flow_point";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=> false, 'status'=>"Failed to clear flow_point table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM flow_arrow_point";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear flow_arrow_point table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM flow";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear flow table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM node";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear node table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM external_author_page_link";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear external_author_page_link table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM reference";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear reference table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM external_author";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ["result"=>false, 'status'=>"Failed to clear external_author table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM page_user_link";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear page_user_link table: " . $dbConn->error];
        }
/*
        $sql = "DELETE FROM user";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear user table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared user<br>";
        }
*/        
        $sql = "DELETE FROM page";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear page table: " . $dbConn->error];
            return $response;
        }

        $sql = "DELETE FROM flow_model";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"Failed to clear flow_model table: " . $dbConn->error];
            return $response;
        }

        return ['result'=>true, 'status'=>"Data Cleared"];
    }