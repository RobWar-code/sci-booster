<?php
include_once __DIR__  . "/../db-connect.php";
include_once __DIR__ . "/add-page.php";
include_once __DIR__ . "/extract-page.php";

// Collect the JSON data
header('Content-Type: application/json');

$inputData = json_decode(file_get_contents('php://input'), true);

// Test Script
// $inputData = json_decode(file_get_contents(__DIR__ . '/../test/test-model.json'), true);

// Check whether this is a model that does not already exist
if ($inputData['flow_model_id'] === NULL) {
    $flowModelId = addFlowModel($inputData['page']['title']);
    if ($flowModelId != NULL) {
        $pageId = addPage($flowModelId, $inputData);
    }
    if ($flowModelId != NULL && $pageId != NULL) {
        $pageData = extractPage($flowModelId, $pageId);
        $pageData['result'] = true;
        echo json_encode($pageData);
    }
}
// Else - Check whether page already exists

function addFlowModel($title) {
    global $dbConn;

    $flowModelId = NULL;

    $sql="INSERT INTO flow_model (title) VALUES (?)";

    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addFlowModel: problem with $stmt prepare" . $dbConn->error, 0);
        return FALSE;
    }

    $stmt->bind_param('s', $title);
    if (!$stmt->execute()) {
        error_log("addFlowModel: could not add flow model" . $dbConn->error, 0);
    }
    else {
        // Get the id
        $sql = "SELECT * FROM flow_model WHERE title = '$title'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            $flowModelId = $row['id'];
        }
    }

    return $flowModelId;
}