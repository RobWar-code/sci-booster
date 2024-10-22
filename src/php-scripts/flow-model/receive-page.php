<?php
include_once __DIR__  . "/../db-connect.php";
include_once __DIR__ . "/add-page.php";
include_once __DIR__ . "/update-page.php";
include_once __DIR__ . "/extract-page.php";
include_once __DIR__ . "/search-db.php";
include_once __DIR__ . "/../users/find-user.php";

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
        elseif ($requestType === "get page list") {
            getModelPageList($inputData['flow_model_id']);
        }
        elseif($requestType === "fetch model by title") {
            fetchModelPageByTitle($inputData['title']);
        }
        elseif($requestType === "fetch page by id") {
            fetchModelPageById($inputData['page_id']);
        }
        elseif($requestType === "export page") {
            exportPage($inputData);
        }
        elseif($requestType === "export model") {
            exportModel($inputData);
        }
        elseif($requestType === "delete page by id") {
            deleteModelPage($inputData['page_id']);
            $response = ["result"=>true];
            echo json_encode($response);
        }
        elseif($requestType === "delete node and children") {
            deleteNodeAndChildPages($inputData['node_id'], $inputData['flow_model_id'], $inputData['hierarchical_id']);
        }
        elseif($requestType === "zoom page") {
            fetchModelPageByHierarchicalId($inputData);
        }
        elseif($requestType === "find user") {
            findUserRequest($inputData);
        }
        elseif($requestType === "general search") {
            conductGeneralSearch($inputData);
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
            $flowModelId = addFlowModel(htmlspecialchars($inputData['flow_model_title']));
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

function fetchModelPageById($pageId) {
    $pageRef = findModelPageById($pageId);
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

function deleteModelPage($pageId) {
    if ($pageId != null) {
        $hierarchicalId = "";
        $flowModelId = null;
        deletePage($flowModelId, $hierarchicalId, $pageId);
        $result['result'] = true;
        echo json_encode($result);
    }
    else {
        $result['result'] = false;
        echo json_encode($result);
    }
}

function fetchModelPageByHierarchicalId($inputData) {
    $hierarchicalId = $inputData['hierarchical_id'];
    $flowModelTitle = $inputData['flow_model_title'];
    $flowModelId = $inputData['flow_model_id'];
 
    if ($flowModelId === null && $flowModelTitle === "") {
        $result = ['result'=>false, 'error'=>"Missing at least flow model title"];
        echo json_encode($result);
    }
    else {
        $pageObj = findModelPageByHierarchicalId($hierarchicalId, $flowModelId, $flowModelTitle);
        if ($pageObj['page_id'] === null) {
            $result = json_encode(['result'=>true, 'got_page'=>false]);
            echo $result;
        }
        else {
            $pageId = $pageObj['page_id'];
            $flowModelId = $pageObj['flow_model_id'];
            $result = extractPage($flowModelId, $pageId);
            $result['result'] = true;
            $result['got_page'] = true;
            echo json_encode($result);    
        }
    }
}

function findUserRequest($inputData) {
    $username = $inputData["username"];
    $foundAry = findUser($username);
    $result = [];
    $result['result'] = $foundAry['result'];
    if ($result['result']) {
        $result['id'] = $foundAry['user']['id'];
        $result['username'] = $foundAry['user']['username'];
    }
    echo json_encode($result);
}

function conductGeneralSearch($inputData) {
    $searchText = $inputData['search_item'];
    $result = generalSearch($searchText);
    echo json_encode($result);
}

function getModelPageList($flowModelId) {
    global $dbConn;

    $list = [];
    $sql = "SELECT id, title FROM page WHERE flow_model_id = $flowModelId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("getModelPageList: sql failed fetching list {$dbConn->error}", 0);
        $response = ['result'=>false];
    }
    else {
        while ($row = $result->fetch_assoc()) {
            array_push($list, ['id'=>$row['id'], 'title'=>$row['title']]);
        }
        $response = ['result'=>true, 'list'=>$list];
    }
    echo json_encode($response);
}

function exportPage($inputData) {
    // Check the request details
    if (!array_key_exists('flow_model_id', $inputData)) {
        $response = ['result'=>false, 'status'=>"Missing flow_model_id in export request data"];
        echo json_encode($response);
        exit;
    }
    if (!array_key_exists('hierarchical_id', $inputData)) {
        $response = ['result'=>false, 'status'=>"Missing hierarchical_id in export page request data"];
        echo json_encode($response);
        exit;
    }
    $flowModelId = $inputData['flow_model_id'];
    if (!is_int($flowModelId)) {
        $flowModelId = (int) $flowModelId;
    }
    $hierarchicalId = $inputData['hierarchical_id'];
    $pageIdObj = findModelPageByHierarchicalId($hierarchicalId, $flowModelId, "");
    if ($pageIdObj['page_id'] === null) {
        $response = ['result'=>false, 'status'=>"Could not fetch export page"];
        echo json_encode($response);
        exit;
    }
    $pageId = $pageIdObj['page_id'];
    $exPageData = extractPage($flowModelId, $pageId);
    $pageData = [];
    $pageData['flow_model_id'] = $exPageData['flow_model_id'];
    $pageData['flow_model_title'] = $exPageData['flow_model_title'];
    $pageData['complete'] = false;
    $pageData['page'] = $exPageData['page'];
    $response = ['result'=>true, 'data'=>$pageData];
    echo json_encode($response);
    exit;
}

function exportModel($inputData) {
    // Check Data
    if (!array_key_exists('flow_model_id', $inputData)) {
        $response = ["result"=>false, 'status'=>"Export model flow_model_id missing in request"];
        echo json_encode($response);
        exit;
    }
    if (!array_key_exists('flow_model_title', $inputData)) {
        $response = ["result"=>false, 'status'=>"Export model flow_model_title missing in request"];
        echo json_encode($response);
        exit;
    }

    $flowModelId = $inputData['flow_model_id'];
    if (!is_int($flowModelId)) {
        $flowModelId = (int) $flowModelId;
    }
    $flowModelTitle = $inputData['flow_model_title'];

    // Prepare object to send
    $modelData = ['flow_model_id'=>$flowModelId, 'flow_model_title'=>$flowModelTitle, 'complete'=>true];
    $pages = [];
    $hierarchicalId = '01';
    extractModelPages($hierarchicalId, $flowModelId, $pages);
    $modelData['pages'] = $pages;
    $response = ['result'=>true, 'data'=>$modelData];
    echo json_encode($response);
    exit;
}

function extractModelPages($hierarchicalId, $flowModelId, &$pages) {
    // Get the page id
    $idObj = findModelPageByHierarchicalId($hierarchicalId, $flowModelId, "");
    if ($idObj['page_id'] === null) {
        $response = ['result'=>false, 'status'=>"extractModelPages - could not find page $hierarchicalId for export"];
        echo json_encode($response);
        exit;
    }
    $pageId = $idObj['page_id'];
    $pageData = extractPage($flowModelId, $pageId);
    $page = $pageData['page'];
    array_push($pages, $page);
    foreach ($page['nodes'] as $node) {
        $nodeNum = $node['node_num'];
        if ($node['has_child_page']) {
            $childHierarchicalId = $hierarchicalId . $nodeNum;
            extractModelPages($childHierarchicalId, $flowModelId, $pages);
        }
    }
}