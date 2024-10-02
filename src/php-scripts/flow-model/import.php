<?php
include_once __DIR__ . '/../db-connect.php';
include_once __DIR__ . '/add-page.php';
include_once __DIR__ . '/update-page.php';
include_once __DIR__ . '/delete-page.php';

header('Content-Type: application/json');

$filenameItem = saveImportFile();
// Constants
$STAGEWIDTH = $_POST['stageWidth'];
$STAGEHEIGHT = $_POST['stageHeight'];
$NODEWIDTH = $_POST['nodeWidth'];
$NODEHEIGHT = $_POST['nodeHeight'];
$USERNAME = $_POST['username'];
$USERSTATUS = $_POST['userStatus'];

$newPageArray = arrangePageData($filenameItem);
if (validateImportData($newPageArray, $_POST['username'])) {
    if (!$newPageArray[0]['update']) {
        $flowModelItem = addNewModel($newPageArray[0]['flow_model_title']);
        if ($flowModelItem['found']) {
            $flowModelId = $flowModelItem['id'];
            $newPageArray[0]['flow_model_id'] = $flowModelId;
        }
        else {
            $flowModelId = null;
        }
    }
    $message = validateHierarchicalIds($newPageArray);
    if ($message != "") {
        $response = ["result"=>false, "status"=>$message];
        echo json_encode($response);
        exit;
    }
    if (importPageData($newPageArray)) {
        $response = ["result"=>true, "status"=>"DATA GOOD<br>", "flow_model_title"=>$newPageArray[0]['flow_model_title']];
        echo json_encode($response);
    }
    else {
        $response = ["result"=>false, "status"=>"IMPORT PROBLEM<br>"];
        echo json_encode($response);
    }
}

function saveImportFile() {
    if (!isset($_POST['username'])) {
        error_log("import: missing username", 0);
        $response = ['result'=>false, 'error'=>"Missing username"];
        echo json_encode($response);
        exit;
    }

    if (!isset($_FILES['file'])) {
        error_log("import: file missing", 0);
        $response = ['result'=>false, 'error'=>"Missing file"];
        echo json_encode($response);
        exit;
    }

    $username = $_POST['username'];
    $fileTempPath = $_FILES['file']['tmp_name'];
    $filename = $_FILES['file']['name'];

    $destPath = $_SERVER['DOCUMENT_ROOT'] . "/sci-booster/assets/imports/{$username}";

    // Check whether the destination directory exists
    if (!file_exists($destPath)) {
        if (!mkdir($destPath, 0777, true)) {
            error_log("Could not create directory for {$username}", 0);
            $response = ['result'=>false, 'error'=>"Could not create directory for {$username}"];
            echo json_encode($response);
            exit;
        }
    }

    // Copy the temp file
    if (!move_uploaded_file($fileTempPath, $destPath . "/" . $filename)) {
        $response = ['result'=>false, 'error'=>"Could not copy uploaded file"];
        echo json_encode($response);
        exit;
    }
    else {
        return ['filename'=>$filename, 'username'=>$username];
    }
}

function arrangePageData($filedata) {
    $filename = $filedata['filename'];
    $username = $filedata['username'];
    $sourceFile = $_SERVER['DOCUMENT_ROOT'] . '/sci-booster/assets/imports/' . $username . '/' . $filename;
    $jsonString = file_get_contents($sourceFile);
    $pageData = json_decode($jsonString, true);
    if ($pageData === null) {
        $response = ["result"=>false];

        $error = "Decoding JSON has failed: ";
        switch (json_last_error()) {
            case JSON_ERROR_DEPTH:
                $error .= 'Maximum stack depth exceeded';
                break;
            case JSON_ERROR_STATE_MISMATCH:
                $error .= 'Underflow or the modes mismatch';
                break;
            case JSON_ERROR_CTRL_CHAR:
                $error .= 'Unexpected control character found';
                break;
            case JSON_ERROR_SYNTAX:
                $error .= 'Syntax error, malformed JSON';
                break;
            case JSON_ERROR_UTF8:
                $error .= 'Malformed UTF-8 characters, possibly incorrectly encoded';
                break;
            default:
                $error .= 'Unknown error';
                break;

        }
        $response['error'] = $error;
        echo json_encode($response);
        exit;
    }

    /* Distinguish between data supplied as:
    [
        "flow_model_id"=>,
        "flow_model_title"=>,
        "pages"=>[
            'hierarchical_id'=>,
            'title'
        ]
    ]
    
    or 

    [
        [
            'hierarchical_id'=>,
            'title'=>,
            ...
        ]
    ]

    Modify to

    [
        [
            'flow_model_id'=>,
            'flow_model_title'=>,
            page==>[
            ]
        ]
    ]
    */
    $newModel = [];
    $newPageItem = ['flow_model_title'=>"", 'flow_model_id'=>null, 'update'=>false, 'complete'=>true, 'page'=>[]];
    // Check whether json data contains a pages array
    if (array_key_exists("pages", $pageData)) {
        // Check whether the pages array has members
        if (count($pageData['pages']) === 0) {
            $response = ['result'=>false, 'status'=>"model pages array has no members"];
            echo json_encode($response);
            exit;
        }
        // Check whether the "complete" field is present
        if (!array_key_exists("complete", $pageData)) {
            $response = ['result'=>false, 'status'=>"model complete field missing in model data<br>"];
            echo json_encode($response);
            exit;
        }
        else {
            $complete = $pageData['complete'];
            if ($complete != true && $complete != false) {
                $response = ['result'=>false, 'status'=>"model complete field should be true/false<br>"];
                echo json_encode($response);
                exit;    
            }
            $noewPageItem['complete'] = $complete;
        }
        // Check that the model title is present
        if (array_key_exists("flow_model_title", $pageData)) {
            $newPageItem['flow_model_title'] = $pageData['flow_model_title'];
        }
        else {
            $valid = false;
            if (array_key_exists("hierarchical_id", $pageData['pages'][0])) {
                if ($pageData['pages'][0]['hierarchical_id'] === '01') {
                    if (array_key_exists('title', $pageData['pages'][0])) {
                        if ($pageData['pages'][0]['title'] != "") {
                            $flowModelTitle = $pageData['pages'][0]['title'];
                            $newPageItem['flow_model_title'] = $flowModelTitle;
                            $valid = true;
                        }
                    }
                }
            }
            if (!$valid) {
                $response = ["result"=>false, "status"=>"Missing flow_model_title<br>"];
                echo json_encode($response);
                exit;
            }
        }
        if (array_key_exists("flow_model_id", $pageData)) {
            if (!is_int($pageData["flow_model_id"])) {
                if ($pageData["flow_model_id"] != null) {
                    $response = ["result"=>false, "status"=>"Invalid flow_model_id in import file<br>"];
                    echo json_encode($response);
                    exit;
                }
            }
            $newPageItem['flow_model_id'] = $pageData['flow_model_id'];
        }
        else {
            if (array_key_exists("flow_model_id", $pageData['pages'][0])) {
                if (!is_int($pageData['pages'][0]["flow_model_id"])) {
                    if ($pageData['pages'][0]["flow_model_id"] != null) {
                        $response = ["result"=>false, "status"=>"Invalid flow_model_id in import file<br>"];
                        echo json_encode($response);
                        exit;
                    }
                }
                $newPageItem['flow_model_id'] = $pageData['pages'][0]['flow_model_id'];
            }
        }
        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title', 'status'=>'Could not resolve model title<br>'];
            echo json_encode($response);
            exit;
        }
        if ($newPageItem['flow_model_id'] === null) {
            $flowModelId = modelTitleExists($newPageItem['flow_model_title']);
            if ($flowModelId === null) {
                $newPageItem['update'] = false;
            }
            else {
                $newPageItem['update'] = true;
            }
            $newPageItem['flow_model_id'] = $flowModelId;
        }
        else {
            if (modelExists($flowModelId)) {
                $newPageItem['update'] = true;
            }
            else {
                $response = ["result"=>false, "status"=>"Non-existent key from flow_model_id<br>"];
                echo json_encode($response);
                exit;
            }
        }
        foreach($pageData['pages'] as $page) {
            $pageItem = $newPageItem;
            $pageItem['page'] = $page;
            array_push($newModel, $pageItem);
        }
    }
    // Single page
    elseif (array_key_exists('flow_model_title', $pageData)) {
        if ($pageData['flow_model_title'] === "") {
            $response = ["result"=>false, "status"=>"flow_model_title is not set<br>"];
            echo json_encode($response);
            exit;
        }
        if (!array_key_exists('page', $pageData)) {
            $response = ["result"=>false, "status"=>"page field in data not defined<br>"];
            echo json_encode($response);
            exit;
        }
        if (array_key_exists("flow_model_id", $pageData)) {
            $flowModelId = $pageData['flow_model_id'];
            if ($flowModelId != null) {
                if (!is_int($flow_model_id)) {
                    $response = ["result"=>false, "status"=>"flow_model_id has invalid value<br>"];
                    echo json_encode($response);
                    exit;
                }
                if (!modelExists($flowModelId)) {
                    $response = ["result"=>false, "status"=>"flow_model_id key does not exist<br>"];
                    echo json_encode($response);
                    exit;
                }
                $pageData['update'] = true;
                $pageData['complete'] = false;
            }
            else {
                $flowModelTitle = $pageData['flow_model_title'];
                $flowModelId = modelTitleExists($flowModelTitle); 
                if ($flowModelId === null) {
                    if (!array_key_exists("hierarchical_id", $pageData['page'])) {
                        $response = ['result'=>false, 'status'=>"Missing hierarchical_id in page data<br>"];
                        echo json_encode($response);
                        exit;
                    }
                    if ($pageData['page']['hierarchical_id'] != '01') {
                        $response = ['result'=>false, 'status'=>"New model single page does not have hierarchical_id \"01\"<br>"];
                        echo json_encode($response);
                        exit;
                    }
                    $pageData['update'] = false;
                    $pageData['complete'] = true;
                }
                else {
                    $pageData['update'] = true;
                    $pageData['complete'] = false;
                }
                $pageData['flow_model_id'] = $flowModelId;
            }
        }
        else {
            $flowModelTitle = $pageData['flow_model_title'];
            $flowModelId = modelTitleExists($flowModelTitle); 
            if ($flowModelId === null) {
                $pageData['update'] = false;
                $pageData['complete'] = true;
            }
            else {
                $pageData['update'] = true;
                $pageData['complete'] = false;
            }
            $pageData['flow_model_id'] = $flowModelId;
        }
        array_push($newModel, $pageData);
    }
    // Array of pages
    elseif (count($pageData) >= 1) {
        if (!array_key_exists('complete', $pageData[0])) {
            $response = ['result'=>false, 'status'=>'complete field absent from first page of data<br>'];
            echo json_encode($response);
            exit;
        }
        if ($pageData[0]['complete'] != true && $pageData[0]['complete'] != false) {
            $response = ['result'=>false, 'status'=>'complete field must have value true or false<br>'];
            echo json_encode($response);
            exit;
        }
        $newPageItem = [];
        $newPageItem['complete'] = $pageData[0]['complete'];
        if (array_key_exists("flow_model_id", $pageData[0])){
            $flowModelId = $pageData[0]["flow_model_id"];
            if (!is_int($flowModelId)) {
                $response = ['result'=>false, 'status'=>'Invalid flow_model_id value<br>'];
                echo json_encode($response);
                exit;
            }
            if ($flowModelId != null) {
                if (!modelExists($flowModelId)) {
                    $response = ['result'=>false, 'status'=>'Non-existent flow_model_id key<br>'];
                    echo json_encode($response);
                    exit;
                }
                $newPageItem['update'] = true;
            }
            else {
                $newPageItem['update'] = false;
            }
            $newPageItem['flow_model_id'] = $pageData[0]['flow_model_id'];
            $newPageItem['update'] = true;
        }
        else {
            $newPageItem['flow_model_id'] = null;
        }
        if (array_key_exists("hierarchical_id", $pageData[0])) {
            if ($pageData[0]['hierarchical_id'] === '01') {
                if (!array_key_exists('title', $pageData[0])) {
                    $response = ["result"=>false, "status"=>"Missing title in page data<br>"];
                    echo json_encode($response);
                    exit;
                }
                $title = $pageData[0]['title'];
                if ($title === "") {
                    $response = ["result"=>false, "status"=>"Title is empty in page data<br>"];
                    echo json_encode($response);
                    exit;
                }
                $newPageItem['flow_model_title'] = $title;
            }
            else if ($flowModelId === null) {
                $response = ["result"=>false, "status"=>"hierarchical_id of first page not set to 01<br>"];
                echo json_encode($response);
                exit;
            }
        }
        else {
            if ($flowModelId === null) {
                $response = ["result"=>false, "status"=>"hierarchical_id of first page missing<br>"];
                echo json_encode($response);
                exit;
            }
        }

        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title', 'status'=>'Could not resolve model title<br>'];
            echo json_encode($response);
            exit;
        }
        if ($newPageItem['flow_model_id'] === null) {
            $flowModelTitle = $pageData[0]["title"];
            $flowModelId = modelTitleExists($flowModelTitle);
            if ($flowModelId === null) {
                $newPageItem['update'] = false;
            }
            else {
                $newPageItem['update'] = true;
            }
            $newPageItem['flow_model_id'] = $flowModelId;
            $newPageItem['flow_model_title'] = $flowModelTitle;
        }
        else {
            $newPageItem['update'] = true;
        }
        foreach($pageData as $page) {
            $pageItem = $newPageItem;
            $pageItem['page'] = $page;
            array_push($newModel, $pageItem);
        }
    }
    else {
        // Non-acceptable data
        $response = ['result'=>false, 'error'=>'Incorrectly formatted json data', 'status'=>'Incorrectly formatted json data<br>'];
        echo json_encode($response);
        exit;
    }

    // Sort by hierarchical id
    usort($newModel, 'sortByHierarchicalId');
    
    return $newModel;
}

function modelExists($flowModelId) {
    global $dbConn;

    $sql = "SELECT id FROM flow_model WHERE id = $flowModelId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("modelExists: problem with sql execution {$dbConn->error}", 0);
        return false;
    }
    if ($result->num_rows > 0) {
        return true;
    }
    return false;
}

function modelTitleExists($flowModelTitle) {
    global $dbConn;

    $flowModelId = null;
    $sql = "SELECT id FROM flow_model WHERE title = ?";
    $stmt = $dbConn->prepare($sql);
    if (!$stmt) {
        error_log("modelTitleExists: problem with sql {$dbConn->error}", 0);
        $response = ["result"=>false, "status"=>"Problem with database sql access on flow_model_title"];
        echo json_encode($response);
        exit;
    }
    $stmt->bind_param("s", $flowModelTitle);
    if ($stmt->execute()) {
        $stmt->store_result();
        $stmt->bind_result($flowModelId);
        if ($stmt->fetch()) {
            return $flowModelId;
        }
        else {
            return null;
        }
    }
    else {
        error_log("modelTitleExists: Problem with database access {$dbConn->error}", 0);
        $response = ["result"=>false, "status"=>"Problem with database access on flow_model_title"];
        echo json_encode($response);
        exit;
    }

}

function sortByHierarchicalId($a, $b) {
    if ($a['page']['hierarchical_id'] === $b['page']['hierarchical_id']) {
        return 0;
    }
    return ($a['page']['hierarchical_id'] < $b['page']['hierarchical_id']) ? -1 : 1;
}

function importPageData($pageData) {
    global $dbConn;

    $flowModelId = $pageData[0]['flow_model_id'];
    if ($pageData[0]['update'] === false) {
        // Add All Pages
        foreach ($pageData as $pageItem) {
            $page = $pageItem['page'];
            addPage($flowModelId, $pageItem);
        }
    }
    else {
        // Do Updates
        if ($pageData[0]['complete']) {
            // Do page deletions from database
            $currentPageList = [];
            $sql = "SELECT id, hierarchical_id FROM page WHERE flow_model_id = $flowModelId";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("importPageData: problem with hierarchical_id fetch from database {$dbConn->error}", 0);
                return false;
            }
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $hierarchicalId = $row['hierarchical_id'];
                    $pageId = $row['id'];
                    // Check against the imported set
                    $found = false;
                    foreach ($pageData as $pageItem) {
                        if ($pageItem['page']['hierarchical_id'] === $hierarchicalId) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        deletePage($flowModelId, $hierarchicalId, $pageId); 
                        // Flag-out the parent node
                        $nodeNum = substr($hierarchicalId, -2);
                        $pageHierarchicalId = substr($hierarchicalId, 0, strlen($hierarchicalId) - 2);
                        // Find the parent page
                        $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '$pageHierarchicalId'";
                        $result2 = $dbConn->query($sql);
                        if (!$result2) {
                            error_log("importPageData: problem with search for parent page after delete {$dbConn->error}", 0);
                            return false;
                        }
                        if ($result2->num_rows > 0) {
                            $row = $result2->fetch_assoc();
                            $parentPageId = $row['id'];
                            // Update the node
                            $sql = "UPDATE node SET has_child_page = 0 WHERE node_num = '$nodeNum' AND page_id = $parentPageId";
                            $result3 = $dbConn->query($sql);
                            if (!$result3) {
                                error_log("importPageData: problem clearing has_child_page flag {$dbConn->error}", 0);
                            }
                        }
                    }
                }
            }
        }
        // Update/add the pages
        foreach ($pageData as $pageItem) {
            $page = $pageItem['page'];
            // Determine whether update or add
            $hierarchicalId = $page['hierarchical_id'];
            $sql = "SELECT id FROM page WHERE hierarchical_id = '$hierarchicalId' AND flow_model_id = $flowModelId";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("importPageData: Problem searching by hierarchical_id and flow_model_id {$dbConn->error}", 0);
                return false;
            }
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $pageId = $row['id'];
                $pageItem['page']['id'] = $pageId;
                updatePage($pageItem);
            }
            else {
                addPage($flowModelId, $pageItem);
            }
        }
    }
    return true;
}

function validateImportData(&$pageData, $username) {
    $message = "";
    $count = 0;
    $modelDetails = [];
    $modelDetails['flow_model_id'] = $pageData[0]['flow_model_id'];
    $modelDetails['flow_model_title'] = $pageData[0]['flow_model_title'];
    $modelDetails['update'] = $pageData[0]['update'];
    foreach ($pageData as &$pageItem) {
        $page = $pageItem['page'];
        $message = validatePageDetails($page, $count);
        if ($message != "") break;
        $message = validateUserAuthors($page, $modelDetails, $username, $count);
        if ($message != "") break;
        $message = validateExternalAuthors($page, $count);
        if ($message != "") break;
        $message = validateReferences($page, $count);
        if ($message != "") break;
        $message = validateNodes($page, $count);
        if ($message != "") break;
        $message = validateFlows($page, $count);
        if ($message != "") break;
        $pageItem['page'] = $page;
        ++$count;
    }
    unset($pageItem);
    if ($message != "") {
        $response = ["result"=>false, "error"=>$message, "status"=>$message];
        echo json_encode($response);
        exit;
    }
    return true;
}

function validateHierarchicalIds($pageData) {
    global $dbConn;

    $message = "";
    $flowModelId = $pageData[0]['flow_model_id'];
    $update = $pageData[0]['update'];
    $complete = $pageData[0]['complete'];
    foreach($pageData as $pageItem) {
        $hierarchicalId = $pageItem['page']['hierarchical_id'];
        $nodeNum = substr($hierarchicalId, -2);
        $parent = substr($hierarchicalId, 0, strlen($hierarchicalId) - 2);
        $found = false;
        if ($hierarchicalId === '01') {
            $found = true;
        }
        else {
            // If update, search the existing model
            if ($update && !$complete) {
                $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '$parent'";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("validateHierarchicalId: Problem checking page in database {$dbConn->error}", 0);
                    $message = "validateHierarchicalId: Problem checking page in database<br>";
                    return $message;
                }
                if ($result->num_rows > 0) {
                    // Check the node number
                    $row = $result->fetch_assoc();
                    $pageId = $row['id'];
                    $sql = "SELECT id FROM node WHERE page_id = $pageId AND node_num = '$nodeNum'";
                    $result = $dbConn->query($sql);
                    if (!$result) {
                        error_log("validateHierarchicalId: Problem checking node num in database {$dbConn->error}", 0);
                        $message = "validateHierarchicalId: Problem checking node num in database<br>";
                        return $message;
                    }
                    if ($result->num_rows > 0) {
                        $found = true;
                    }
                }
            }
            if (!$found) {
                // Search the import data
                foreach($pageData as $testPage) {
                    $testHierarchicalId = $testPage['page']['hierarchical_id'];
                    if ($testHierarchicalId === $parent) {
                        // Check the node number
                        foreach ($testPage['page']['nodes'] as $node) {
                            if ($node['node_num'] === $nodeNum) {
                                $found = true;
                                break;
                            }
                        }
                    }
                    if ($found) {
                        break;
                    }
                }
            }
        }
        if (!$found) {
            $message = "Unmatched hierarchical_id in import data $hierarchicalId";
            return $message;
        }
    }
    return $message;
}

function validatePageDetails(&$page, $count) {
    if (array_key_exists("title", $page)) {
        $title = htmlspecialchars($page['title']);
        if (!is_string($title)) {
            $message = "Page title is not a string at Page $count<br>";
            return $message;
        }
        if ($title === "") {
            $message = "Missing Title at Page $count<br>";
            return $message;
        }
        if (strlen($title) > 64) {
            $message = "Title too long (>64 chars) at Page $count<br>";
            return $message;
        }
    }
    else {
        $message = "Title omitted from page $count<br>";
        return $message;
    }
    $page['title'] = $title;
    
    if (array_key_exists("hierarchical_id", $page)) {
        $hierarchicalId = $page['hierarchical_id'];
        if (!is_string($hierarchicalId)) {
            $message = "validatePageDetails: hierarchical_id is not of type string at page $count<br>";
        }
        $matched = preg_match('/^[0-9]+$/', $hierarchicalId);
        if (!$matched) {
            $message = "validatePageDetails: Faulty hierarchical_id at page $count, $title<br>";
            return $message;
        }
        if (strlen($hierarchicalId) % 2 != 0) {
            $message = "validatePageDetails: Uneven number of characters in hierarchical_id at page $count, $title<br>";
            return $message;
        }
    }
    else {
        $message = "validatePageDetails: Missing file hierarchical_id at page $count, $title<br>";
        return $message;
    }

    if (array_key_exists("description", $page)) {
        $description = $page['description'];
        if (!is_string($description)) {
            $message = "Page description is not a string at page $count<br>";
            return $message;
        }
        $description = htmlspecialchars($page['description']);
        if (strlen($description) > 4096) {
            $message = "validatePageDetails: Description too long (>4096 chars) at page $count, $title<br>";
            return $message;
        }
        $page['description'] = $description;
    }
    else {
        $page['description'] = "";
    }

    if (array_key_exists("keywords", $page)) {
        $keywords = $page['keywords'];
        if (!is_string($keywords)) {
            $message = "Page keywords not a string at page $count<br>";
            return $message;
        }
        $keywords = htmlspecialchars($keywords);
        if (strlen($keywords) > 256) {
            $message = "validatePageDetails: Keywords too long (>256 chars) at Page $count, $title<br>";
            return $message;
        }
        $page['keywords'] = $keywords;
    }
    else {
        $page['keywords'] = "";
    }


    return "";
}

function validateUserAuthors(&$page, $modelDetails, $username, $count) {
    global $dbConn;
    global $USERSTATUS;

    $message = "";
    $gotUser = false;
    if (!array_key_exists("user_authors", $page)) {
        $page['user_authors'] = ['username'=>$username];
        return $message;
    }
    foreach ($page['user_authors'] as $userItem) {
        $sql = "SELECT id FROM user WHERE username = ?";
        $stmt = $dbConn->prepare($sql);
        if (!$stmt) {
            error_log("validateUserAuthors: problem with sql - {$dbConn->error}", 0);
            $message = "Database error<br>";
            return $message;
        }
        $stmt->bind_param("s", $userItem['username']);
        $stmt->execute();
        $result = $stmt->get_result();
        if (!$result) {
            error_log("validateUserAuthors: could not execute sql - {$dbConn->error}", 0);
            $message = "Database error<br>";
            return $message;
        }
        if ($result->num_rows === 0) {
            $message = "Unidentified user in user authors of Page $count<br>";
            return $message;
        }
        if ($userItem['username'] === $username) {
            $gotUser = true;
        }
    }
    // Check whether the user has permissions for this update
    if ($count === 0 && $modelDetails['update'] === true && $USERSTATUS != "owner" && $USERSTATUS != "editor") {
        // Get the pageId of the first model page
        $flowModelId = $modelDetails['flow_model_id'];
        $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '01'";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("validateUserAuthors: Problem searching database for first model page {$dbConn->error}", 0);
            $message = "validateUserAuthors: Problem searching database for first model page";
            return $message;
        }
        if ($result->num_rows === 0) {
            $message = "validateUserAuthors: Database problem update model has no first page {$modelDatails['flow_model_title']}";
            return $message;
        }
        $row = $result->fetch_assoc();
        $pageId = $row['id'];

        // Get the id of the current user
        $sql = "SELECT id FROM user WHERE username = '$username'";
        $result = $dbConn->query($sql);
        if (!$result) {
            $message = "validateUserAuthors: Problem with accessing username";
            error_log("$message {$dbConn->error}", 0);
            return $message;
        }
        if ($result->num_rows === 0) {
            $message = "validateUserAuthors: Invalid user sent from client";
            return $message;
        }
        $row = $result->fetch_assoc();
        $userId = $row['id'];

        // Check whether the current user id is present for the first page
        $sql = "SELECT id FROM page_user_link WHERE page_id = $pageId AND user_id = $userId";
        $result = $dbConn->query($sql);
        if (!$result) {
            $message = "validateUserAuthors: Problem accessing page_user_link";
            error_log("$message {$dbConn->error}", 0);
            return $message;
        }
        if ($result->num_rows === 0) {
            $message = "validateUserAuthors: User does not have permissions to perform this update";
            return $message;
        }

    }
    if (!$gotUser) {
        $auth = $page['user_authors'];
        array_push($auth, ['username'=>$username]);
        $page['user_authors'] = $auth;
    }
    return $message;
}

function validateExternalAuthors(&$page, $count) {
    $message = "";
    if (!array_key_exists("external_authors", $page)) {
        $page['external_authors'] = [];
        return $message;
    }
    $index = 0;
    foreach($page['external_authors'] as $authorItem) {
        $author = $authorItem['author'];
        if (!is_string($author)) {
            $message = "External Author not a string at page $count<br>";
            return $message;
        }
        $author = htmlspecialchars($authorItem['author']);
        if (strlen($author) > 128) {
            $message = "Author name length too long > 128 characters at page $count<br>";
            return $message;
        }
        $page['external_authors'][$index]["author"] = $author;
        ++$index;
    }
    return $message;
}

function validateReferences(&$page, $count) {
    $message = "";
    if (!array_key_exists('references', $page)) {
        $page['references'] = [];
        return $message;
    }
    $index = 0;
    foreach($page['references'] as $reference) {
        if (!array_key_exists('source', $reference)) {
            $reference['source'] = "";
        }
        else {
            $source = $reference['source'];
            if (!is_string($source)) {
                $message = "Reference Source is not a string at page $count<br>";
                return;
            }
            $source = htmlspecialchars($source);
            if (strlen($source) > 256) {
                $message = "reference source > 256 chars long at page $count<br>";
                return $message;
            }
            $reference['source'] = $source;
        }

        if (!array_key_exists('title', $reference)) {
            $message = "Reference missing title at page $count<br>";
            return $message;
        }
        $title = $reference['title'];
        if (!is_string($title)) {
            $message = "Reference title is not a string at page $count<br>";
            return $message;
        }
        $title = htmlspecialchars($title);
        if ($title === "") {
            $message = "Reference title is empty at page $count<br>";
            return $message;
        }
        if (strlen($title) > 128) {
            $message = "Reference title length > 128 at page $count<br>";
            return $message;
        }
        $reference['title'] = $title;

        if (!array_key_exists('author', $reference)) {
            $reference['author'] = "";
        }
        else {
            $author = $reference['author']['author'];
            if (!is_string($author)) {
                $message = "Reference author is not a string at page $count<br>";
                return;
            }
            $author = htmlspecialchars($author);
            if (strlen($author) > 128) {
                $message = "Reference author > 128 characters at page $count<br>";
                return $message;
            }
            $reference['author']['author'] = $author;
        }

        $page['references'][$index] = $reference;
        ++$index;
    }

    return $message;

}

function validateNodes(&$page, $count) {
    global $STAGEWIDTH;
    global $STAGEHEIGHT;
    global $NODEWIDTH;
    global $NODEHEIGHT;

    $message = "";
    if (!array_key_exists('nodes', $page)) {
        $page['nodes'] = [];
        return;
    }
    $count = 0;
    foreach($page['nodes'] as &$node) {
        if (!array_key_exists("node_num", $node)) {
            $message = "ValidateNodes: Missing node_num at page $count<br>";
            return $message;
        }
        $nodeNum = $node['node_num'];
        if (!is_string($nodeNum)) {
            $message = "validateNodes: node_num is not of type string at page $count<br>";
            return message;
        }
        if (!preg_match('/^[0][0-9]$/', $nodeNum)){
            $message = "ValidateNodes: Badly formed node_num at page $count<br>";
            return $message;
        }
        
        if (!array_key_exists("x", $node)) {
            $message = "ValidateNodes: x coordinate missing at page $count<br>";
            return $message;
        }
        if (!is_int($node['x'])) {
            $message = "ValidateNodes: x has invalid value at page $count<br>";
            return $message;
        }
        $x = $node['x'];
        if ($x < 0 || $STAGEWIDTH < $x) {
            $message = "ValidateNodes: x coordinate out of range at page $count<br>";
            return $message;
        }
        if (!array_key_exists("y", $node)) {
            $message = "ValidateNodes: y coordinate missing at page $count<br>";
            return $message;
        }
        if (!is_int($node['y'])) {
            $message = "ValidateNodes: invalid y value for node at page $count<br>";
        }
        $y = $node['y'];
        if ($y < 0 || $STAGEHEIGHT < $y) {
            $message = "ValidateNodes: y coordinate out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists("label", $node)) {
            $message = "ValidateNodes: label missing at page $count<br>";
            return $message;
        }
        $label = $node['label'];
        if (!is_string($label)) {
            $message = "Node label is not a string at page $count<br>";
            return $message;
        }
        $label = htmlspecialchars($node['label']);
        if ($label === "") {
            $message = "ValidateNodes: label set to no value at page $count<br>";
            return $message;
        }
        if (strlen($label) > 64) {
            $message = "ValidateNodes: label too long (>64) at page $count<br>";
            return $message;
        }
        $node['label'] = $label;

        if (!array_key_exists('graphic_file', $node)) {
            $node['graphic_file'] = "";
        }
        else {
            $graphicFile = $node['graphic_file'];
            if (!is_string($graphicFile)) {
                $message = "Node graphic_file is not a string at page $count<br>";
                return $message;
            }
            $graphicFile = htmlspecialchars($graphicFile);
            if (strlen($graphicFile) > 256) {
                $message = "ValidateNodes: graphic_file too long (>256 chars) at page $count<br>";
                return $message;
            }
            $node['graphic_file'] = $graphicFile;
        }
        
        if (!array_key_exists('graphic_text', $node)) {
            $node['graphic_text'] = "";
        }
        else {
            $graphicText = $node['graphic_text'];
            if (!is_string($graphicText)) {
                $message = "Node graphic_text is not a string at page $count<br>";
                return $message;
            }
            $graphicText = htmlspecialchars($graphicText);
            if (strlen($graphicText) > 256) {
                $message = "ValidateNodes: graphic_text too long (>256 chars) at page $count<br>";
                return $message;
            }
            $node['graphic_text'] = $graphicText;
        }

        if (!array_key_exists('type', $node)) {
            $node['type'] = "mechanism";
        }
        else {
            $type = $node['type'];
            if (!is_string($type)) {
                $message = "Node type is not a string at page $count<br>";
                return $message;
            }
            if ($type != "effect" && $type != "mechanism") {
                $message = "ValidateNodes: node type must be either \"effect\" or \"mechanism\" at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists("definition", $node)) {
            $node['definition'] = "";
        }
        else {
            $definition = $node['definition'];
            if (!is_string($definition)) {
                $message = "Node definition is not a string at page $count<br>";
                return $message;
            }
            $definition = htmlspecialchars($definition);
            if (strlen($definition) > 4096) {
                $message = "ValidateNodes: definition too long (>4096 chars) at page $count<br>";
                return $message;
            }
            $node['definition'] = $definition;
        }

        if (!array_key_exists("keywords", $node)) {
            $node['keywords'] = "";
        }
        else {
            $keywords = $node['keywords'];
            if (!is_string($keywords)) {
                $message = "Node keywords is not a string at page $count<br>";
                return $message;
            }
            $keywords = htmlspecialchars($keywords);
            if (strlen($keywords) > 256) {
                $message = "ValidateNodes: keywords too long (>256 chars) at page $count<br>";
                return $message;
            }
            $node['keywords'] = $keywords;
        }

        if (!array_key_exists("hyperlink", $node)) {
            $node['hyperlink'] = "";
        }
        else {
            $hyperlink = $node['hyperlink'];
            if (!is_string($hyperlink)) {
                $message = "Node hyperlink is not a string at page $count<br>";
                return $message;
            }
            $hyperlink = htmlspecialchars($hyperlink);
            if (strlen($hyperlink) > 256) {
                $message = "ValidateNodes: hyperlink greater than 256 chars at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists("has_child_page", $node)) {
            $node['has_child_page'] = false;
        }
        else {
            $hasChildPage = $node['has_child_page'];
            if ($hasChildPage != true && $hasChildPage != false) {
                $message = "ValidateNodes: has_child_page must be true or false at page $count<br>";
                return $message;
            }
        }
        $page['nodes'][$count] = $node;
        ++$count;
    }
    return $message;
}

function validateFlows(&$page, $count) {
    global $STAGEWIDTH;
    global $STAGEHEIGHT;
    global $NODEWIDTH;
    global $NODEHEIGHT;

    $message = "";
    if (!array_key_exists("flows", $page)) {
        $page['flows'] = [];
        return $message;
    }
    foreach($page['flows'] as &$flow) {
        if (!array_key_exists('flow_num', $flow)) {
            $message = "validateFlows: flow_num value and field missing at page $count<br>";
            return $message;
        }
        $flowNum = $flow['flow_num'];
        if (!is_string($flowNum)) {
            $message = "validateFlows: flow_num is not given as a string at page $count<br>";
            return $message;
        }
        if (!preg_match("/^[0-9][0-9]$/", $flowNum)) {
            $message = "validateFlows: badly formed flow_num at page $count<br>";
            return $message;
        }

        if (!array_key_exists('source_node_num', $flow)) {
            $message = "validateFlows: source_node_num field missing at page $count<br>";
            return $message;
        }
        $sourceNodeNum = $flow['source_node_num'];
        if (!is_string($sourceNodeNum)) {
            $message = "validateFlows: source_node_num is not given as a string at page $count<br>";
            return $message;
        }
        if (!array_key_exists('destination_node_num', $flow)) {
            $message = "validateFlows: destination_node_num field missing at page $count<br>";
            return $message;
        }
        $destNodeNum = $flow['destination_node_num'];
        if (!is_string($destNodeNum)) {
            $message = "validateFlows: destination_node_num is not given as a string at page $count<br>";
            return $message;
        }
        if ($sourceNodeNum != "") {
            if (!preg_match('/^[0-9][0-9]$/', $sourceNodeNum)) {
                $message = "validateFlows: source_node_num badly formed at page $count<br>";
                return $message;
            }
        }
        if ($destNodeNum != "") {
            if (!preg_match('/^[0-9][0-9]$/', $destNodeNum)) {
                $message = "validateFlows: destination_node_num badly formed at page $count<br>";
                return $message;
            }
        }
        if ($sourceNodeNum === "" && $destNodeNum === "") {
            $message = "validateFlows: either the destination or the source node num or both must be set at page $count<br>";
            return $message;
        }

        if (!array_key_exists('label', $flow)) {
            $message = "validateFlows: missing flow label field at page $count<br>";
            return $message;
        }
        $label = $flow['label'];
        if (!is_string($label)) {
            $message = "validateFlows: label is not a string at page $count<br>";
            return $message;
        }
        $label = htmlspecialchars($label);
        if ($label === "") {
            $message = "validateFlows: label set to empty at page $count<br>";
            return $message;
        }
        if (strlen($label) > 64) {
            $message = "validateFlows: flow label is too long (>64 chars) at page $count<br>";
            return $message;
        }
        $flow['label'] = $label;

        if (!array_key_exists('label_x', $flow)) {
            $message = "validateFlows: flow label_x field is missing at page $count<br>";
            return $message;
        }
        $labelX = $flow['label_x'];
        if (!is_int($labelX)) {
            $message = "validateFlows: flow label_x is not integer at page $count<br>";
            return $message;
        }
        if ($labelX < -$STAGEWIDTH || $STAGEWIDTH < $labelX) {
            $message = "validateFlows: flow label_x is out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists('label_y', $flow)) {
            $message = "validateFlows: flow label_y is missing at page $count<br>";
            return $message;
        }
        $labelY = $flow['label_y'];
        if (!is_int($labelY)) {
            $message = "validateFlows: flow label_y is not an integer at page $count<br>";
            return $message;
        }
        if ($labelY < -$STAGEHEIGHT || $STAGEHEIGHT < $labelY) {
            $message = "validateFlows: flow label_y is out of range at page $count<br>";
            return $message;
        }

        // Label Width is optional
        if (array_key_exists('label_width', $flow)) {
            $labelWidth = $flow['label_width'];
            if (!is_int($labelWidth)) {
                $message = "validateFlows: flow label_width is not an integer at page $count<br>";
                return $message;
            }
            if ($labelWidth < 50 || 140 < $labelWidth) {
                $message = "validateFlows: flow label_width is out of range at page $count<br>";
                return $message;
            }
        }
        else {
            $flow['label_width'] = 0;
        }

        if (!array_key_exists('drawing_group_x', $flow)) {
            $message = "validateFlows: flow drawing_group_x field is missing at page $count<br>";
            return $message;
        }
        $drawingGroupX = $flow['drawing_group_x'];
        if (!is_int($drawingGroupX)) {
            $message = "validateFlows: flow drawing_group_x is not an integer at page $count<br>";
        }
        if ($drawingGroupX < 0 || $STAGEWIDTH < $drawingGroupX) {
            $message = "validateFlows: flow drawing_group_x value is out of range at page $count<br>";
            return $message;
        }
        if (!array_key_exists('drawing_group_y', $flow)) {
            $message = "validateFlows: flow drawing_group_y field omitted at page $count<br>";
            return $message;
        }
        $drawingGroupY = $flow['drawing_group_y'];
        if (!is_int($drawingGroupY)) {
            $message = "validateFlows: flow drawing_group_y is not an integer at page $count<br>";
            return $message;
        }
        if ($drawingGroupY < 0 || $STAGEHEIGHT < $drawingGroupY) {
            $message = "validateFlows: flow drawing_group_y value is out of range at page $count<br>";
            return $message;
        }

        // Arrow points are optional, and will be set to absent if not present
        if (array_key_exists("arrow_points", $flow)) {
            $arrowPoints = $flow['arrow_points'];
            if (count($arrowPoints) != 4) {
                $message = "validateFlows: arrow_points data incorrect at page $count<br>";
                return $message;
            }
            for ($i = 0; $i < count($arrowPoints); $i++) {
                $point = $arrowPoints[$i];
                if (!array_key_exists('x', $point)) {
                    $message = "validateFlows: - arrow_points missing x coordinate at page $count<br>";
                    return $message;
                }
                $x = $point['x'];
                if (!is_int($x)) {
                    $message = "validateFlows: - arrow_points x coordinate is not an integer at page $count<br>";
                    return $message;
                }
                if ($x < -($STAGEWIDTH - 40) || $STAGEWIDTH - 40 < $x) {
                    $message = "validateFlows: - arrow_points x value out of range at page $count<br>";
                    return $message;
                }
                if (!array_key_exists('y', $point)) {
                    $message = "validateFlows: - arrow_points missing y coordinate at page $count<br>";
                    return $message;
                }
                $y = $point['y'];
                if (!is_int($y)) {
                    $message = "validateFlows: - arrow_points y coordinate is not an integer at page $count<br>";
                    return $message;
                }
                if ($y < -($STAGEHEIGHT - 40) || $STAGEHEIGHT - 40 < $y) {
                    $message = "validateFlows: - arrow_points y value out of range at page $count<br>";
                    return $message;
                }
            }
        }
        else {
            $flow['arrow_points'] = [];
        }

        if (!array_key_exists("points", $flow)) {
            $message = "validateFlows: - flow line points omitted at page $count<br>";
            return $message;
        }
        if (count($flow['points']) < 2) {
            $message = "validateFlows: - flow line points missing at page $count<br>";
            return $message;
        }
        foreach($flow['points'] as $point) {
            if (!array_key_exists('x', $point)){
                $message = "validateFlows: - flow line point has missing x coordinate at page $count<br>";
                return $message;
            }
            $x = $point['x'];
            if (!is_int($x)) {
                $message = "validateFlows: - flow line point coordinate x is not an integer at page $count<br>";
                return $message;
            }
            if ($x < -($STAGEWIDTH - 40) || $STAGEWIDTH - 40 < $x) {
                $message = "validateFlows: - flow line coordinate x out of range at page $count<br>";
                return $message;
            }
            if (!array_key_exists('y', $point)) {
                $message = "validateFlows: - flow line coordinate y is missing at page $count<br>";
                return $message;
            }
            $y = $point['y'];
            if (!is_int($y)) {
                $message = "validateFlows: - flow line point coordinate y is not an integer at page $count<br>";
                return $message;
            }
            if ($y < -($STAGEHEIGHT - 40) || $STAGEHEIGHT - 40 < $y) {
                $message = "validateFlows: - flow line coordinate y is out of range at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists('definition', $flow)) {
            $flow['definition'] = "";
        }
        else {
            $definition = $flow['definition'];
            if (!is_string($definition)) {
                $message = "validateFlows: flow definition is not a string at page $count<br>";
                return $message;
            }
            $definition = htmlspecialchars($definition);
            if (strlen($definition) > 4096) {
                $message = "validateFlows: flow definition longer than 4096 chars at page $count<br>";
                return $message;
            }
            $flow['definition'] = $definition;
        }

        if (!array_key_exists('keywords', $flow)) {
            $flow['keywords'] = "";
        }
        else {
            $keywords = $flow['keywords'];
            if (!is_string($keywords)) {
                $message = "validateFlows: flow keywords is not a string at page $count<br>";
                return $message;
            }
            $keywords = htmlspecialchars($keywords);
            if (strlen($keywords) > 256) {
                $message = "validateFlows: flow keywords longer than 256 chars at page $count<br>";
                return $message;
            }
            $flow['keywords'] = $keywords;
        }

        if (!array_key_exists('hyperlink', $flow)) {
            $flow['hyperlink'] = "";
        }
        else {
            $hyperlink = $flow['hyperlink'];
            if (!is_string($hyperlink)) {
                $message = "validateFlows: flow hyperlink is not a string at page $count<br>";
                return $message;
            }
            $hyperlink = htmlspecialchars($hyperlink);
            if (strlen($hyperlink) > 256) {
                $message = "validateFlows: flow hyperlink longer than 256 characters at page $count<br>";
                return $message;
            }
            $flow['hyperlink'] = $hyperlink;
        }

        if (!array_key_exists('conversion_formulas', $flow)) {
            $flow['conversion_formulas'] = [];
        }
        else {
            foreach($flow['conversion_formulas'] as &$formulaItem) {
                if (!array_key_exists('formula', $formulaItem)) {
                    $message = "validateFlows: conversion formula missing formula field at page $count<br>";
                    return $message;
                }
                $formula = $formulaItem['formula'];
                if (!is_string($formula)) {
                    $message = "validateFlows: conversion formula, formula is not a string at page $count<br>";
                    return $message;
                }
                $formula = htmlspecialchars($formula);
                if ($formula === "") {
                    $message = "validateFlows: conversion formula missing formula at page $count<br>";
                    return $message;
                }
                if (strlen($formula) > 1024) {
                    $message = "validateFlows: conversion formula, formula longer than 256 chars at page $count<br>";
                    return $message;
                }
                $formulaItem['formula'] = $formula;

                if (!array_key_exists('description', $formulaItem)) {
                    $formulaItem['description'] = "";
                }
                else {
                    $description = $formulaItem['description'];
                    if (!is_string($description)) {
                        $message = "validateFlows: Conversion formula description is not a string at page $count<br>";
                        return;
                    }
                    $description = htmlspecialchars($description);
                    if (strlen($description) > 4096) {
                        $message = "validateFlows: conversion formula, description longer than 4096 chars at page $count<br";
                        return $message;
                    }
                    $formulaItem['description'] = $description;
                }
            }
        }
    }
    return $message;
}
    
function addNewModel($modelTitle) {
    global $dbConn;

    $sqlA = "SELECT id FROM flow_model WHERE title = ?";
    $stmt = $dbConn->prepare($sqlA);
    if (!$stmt) {
        error_log("addNewModel - problem with sql: {$dbConn->error}", 0);
        return null;
    }
    $stmt->bind_param("s", $modelTitle);
    $stmt->execute();
    $result = $stmt->get_result();
    if (!$result) {
        error_log("addNewModel - could not perform search: {$dbConn->error}", 0);
        return null;
    }
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return ['found'=>true, 'id'=>$row['id'], 'update'=>true];
    }

    $sqlB = "INSERT INTO flow_model(title) VALUES (?)";
    $stmt = $dbConn->prepare($sqlB);
    if (!$stmt) {
        error_log("addNewModel - insert sql failed: {$dbConn->error}", 0);
        return null;
    }
    $stmt->bind_param('s', $modelTitle);
    if (!$stmt->execute()) {
        error_log("addNewModel - insert model failed: {$dbConn->error}", 0);
        return null;
    }

    // Get Id of new record
    $stmt = $dbConn->prepare($sqlA);
    if (!$stmt) {
        error_log("addNewModel - problem with sql: {$dbConn->error}", 0);
        return null;
    }
    $stmt->bind_param("s", $modelTitle);
    $stmt->execute();
    $result = $stmt->get_result();
    if (!$result) {
        error_log("addNewModel - could not perform search: {$dbConn->error}", 0);
        return null;
    }
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return ['found'=>true, 'id'=>$row['id'], 'update'=>false];
    }
    else {
        error_log("addNewModel - inserted model not found", 0);
        return ['found'=>false];
    }

}