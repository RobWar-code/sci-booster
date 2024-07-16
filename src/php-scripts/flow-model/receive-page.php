<?php
include_once __DIR__  . "/../db-connect.php";
include_once __DIR__ . "/add-page.php";
include_once __DIR__ . "/update-page.php";
include_once __DIR__ . "/extract-page.php";
include_once __DIR__ . "/search-db.php";

// Collect the JSON data
header('Content-Type: application/json');

$inputData = json_decode(file_get_contents('php://input'), true);

scanInput($inputData);

function scanInput($inputData) {
    if(array_key_exists("request", $inputData)) {
        $requestType = $inputData['request'];
        if ($requestType === 'model title list') {
            getModelTitlesList();
        }
        elseif($requestType == "fetch model by title") {
            fetchModelPageByTitle($inputData['title']);
        }
    }
    else {
        handlePageData($inputData);
    }
}

function handlePageData($inputData) {
    // Check whether this is a model that does not already exist
    if (!$inputData['update']) {
        // Search for the flow model title
        $flowModelId = findFlowModel($inputData['flow_model_title']);
        if ($flowModelId === null) {
            $flowModelId = addFlowModel($inputData['flow_model_title']);
        }

        if ($flowModelId != NULL) {
            $pageId = addPage($flowModelId, $inputData);
            /*
            $report = [];
            $report['result'] = false;
            $report['page_id'] = $pageId;
            $report['flow_model_id'] = $flowModelId;
            echo json_encode($report);
            exit(0);
            */
        }

        if ($flowModelId != NULL && $pageId != NULL) {
            $pageData = extractPage($flowModelId, $pageId);
            $pageData['result'] = true;
            echo json_encode($pageData);
        }
        else {
            $report = [];
            $report['result'] = false;
            $report['error'] = "Problems saving the page data";
            echo json_encode($report);
        }
    }
    else {
        // Update Modes
        if ($inputData["flow_model_id"] === NULL) {
            $inputData = getSetModelAndPageIds($inputData);
            if ($inputData['result'] === false) {
                $report = [];
                $report['result'] = false;
                $report['error'] = "Could not find page to update";
                echo json_encode($report); 
                exit;   
            }
        }
        $flowModelId = $inputData['flow_model_id'];
        $pageId = $inputData['page']['id'];
        if ($pageId != NULL) {
            updatePage($inputData);
            $pageData = extractPage($flowModelId, $pageId);
            $pageData['result'] = true;
            echo json_encode($pageData);
        }
    }
}

function addFlowModel($title) {
    global $dbConn;

    $flowModelId = NULL;

    $sql="INSERT INTO flow_model (title) VALUES (?)";

    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addFlowModel: problem with $stmt prepare {$dbConn->error}", 0);
        return FALSE;
    }

    $stmt->bind_param('s', $title);
    if (!$stmt->execute()) {
        error_log("addFlowModel: could not add flow model {$dbConn->error}", 0);
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


function getSetModelAndPageIds($inputData) {
    global $dbConn;

    // Get the ids for the model/page
    $flowModel = $inputData['flow_model_title'];
    $sql = "SELECT id FROM flow_model WHERE title = '$flowModel'";
    $result = $dbConn->query($sql);
    if (!$result) {
        $inputData['result'] = false;
        return $inputData;
    } 
    else {
        if ($row = $result->fetch_assoc()) {
            $flowModelId = $row['id'];
            $hierarchicalId = $inputData['page']['hierarchical_id'];
            $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '$hierarchicalId'";
            $result = $dbConn->query($sql);
            if (!$result) {
                $inputData['result'] = false;
                return $inputData;
            } 
            else {
                if ($row = $result->fetch_assoc()) {
                    $pageId = $row['id'];
                    $inputData['flow_model_id'] = $flowModelId;
                    $inputData['page']['id'] = $pageId;
                    $inputData['result'] = true;
                    return $inputData;
                }
            }
        }
    }
    return false;
}

function getModelTitlesList() {
    $modelsList = fetchModelTitlesList();
    $listObj = count($modelsList) > 0 ? $listObj = ["result"=>true, "modelTitles"=>$modelsList] :
        $listObj = ["result"=>false];
    echo json_encode($listObj);
}

function fetchModelPageByTitle($title) {
    $pageRef = findModelPageByTitle($title);
    if ($pageRef === null) {
        $result = ['result'=>false];
        echo json_encode($result);
    }
    else {
        $pageId = $pageRef['page_id'];
        $flowModelId = $pageRef['flow_model_id'];
        $result = extractPage($flowModelId, $pageId);
        $result['result'] = true;
        echo json_encode($result);
    }
}