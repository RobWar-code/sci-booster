<?php
include_once __DIR__ . '/../db-connect.php';
include_once __DIR__ . '/add-page.php';
include_once __DIR__ . '/update-page.php';

header('Content-Type: application/json');

$filenameItem = saveImportFile();
// Constants
$STAGEWIDTH = $_POST['stageWidth'];
$STAGEHEIGHT = $_POST['stageHeight'];
$NODEWIDTH = $_POST['nodeWidth'];
$NODEHEIGHT = $_POST['nodeHeight'];

$newPageArray = arrangePageData($filenameItem);
if (validateImportData($newPageArray, $_POST['username'])) {
    if (!$newPageArray[0]['update']) {
        addNewModel($newPageArray[0]['flow_model_title']);
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
    $newPageItem = ['flow_model_title'=>"", 'flow_model_id'=>null, 'update'=>false, 'page'=>[]];
    // Check whether json data contains a pages array
    if (array_key_exists("pages", $pageData)) {
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
                $response = ["result"=>false, "status"=>"Missing flow_model_title"];
                echo json_encode($response);
                exit;
            }
        }
        if (array_key_exists("flow_model_id", $pageData)) {
            if (!is_int($pageData["flow_model_id"])) {
                if ($pageData["flow_model_id"] != null) {
                    $response = ["result"=>false, "status"=>"Invalid flow_model_id in import file"];
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
                        $response = ["result"=>false, "status"=>"Invalid flow_model_id in import file"];
                        echo json_encode($response);
                        exit;
                    }
                }
                $newPageItem['flow_model_id'] = $pageData['pages'][0]['flow_model_id'];
            }
        }
        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title', 'status'=>'Could not resolve model title'];
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
                $response = ["result"=>false, "status"=>"Non-existent key from flow_model_id"];
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
            $response = ["result"=>false, "status"=>"flow_model_title is not set"];
            echo json_encode($response);
            exit;
        }
        if (array_key_exists("flow_model_id", $pageData)) {
            $flowModelId = $pageData['flow_model_id'];
            if ($flowModelId != null) {
                if (!is_int($flow_model_id)) {
                    $response = ["result"=>false, "status"=>"flow_model_id has invalid value"];
                    echo json_encode($response);
                    exit;
                }
                if (!modelExists($flowModelId)) {
                    $response = ["result"=>false, "status"=>"flow_model_id key does not exist"];
                    echo json_encode($response);
                    exit;
                }
                $pageData['update'] = true;
            }
            else {
                $flowModelTitle = $pageData['flow_model_title'];
                $flowModelId = modelTitleExists($flowModelTitle); 
                if ($flowModelId === null) {
                    $pageData['update'] = false;
                }
                else {
                    $pageData['update'] = true;
                }
                $pageData['flow_model_id'] = $flowModelId;
            }
        }
        else {
            $flowModelTitle = $pageData['flow_model_title'];
            $flowModelId = modelTitleExists($flowModelTitle); 
            if ($flowModelId === null) {
                $pageData['update'] = false;
            }
            else {
                $pageData['update'] = true;
            }
            $pageData['flow_model_id'] = $flowModelId;
        }
        array_push($newModel, $pageData);
    }
    // Array of pages
    elseif (count($pageData) >= 1) {
        if (array_key_exists("flow_model_id", $pageData[0])){
            $flowModelId = $pageData[0]["flow_model_id"];
            if (!is_int($flowModelId)) {
                $response = ['result'=>false, 'status'=>'Invalid flow_model_id value'];
                echo json_encode($response);
                exit;
            }
            if ($flowModelId != null) {
                if (!modelExists($flowModelId)) {
                    $response = ['result'=>false, 'status'=>'Non-existent flow_model_id key'];
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
                if (!array_key_exists($pageData[0]['title'])) {
                    $response = ["result"=>false, "status"=>"Missing title in page data"];
                    echo json_encode($response);
                    exit;
                }
                $title = $pageData[0]['title'];
                if ($title === "") {
                    $response = ["result"=>false, "status"=>"Title is empty in page data"];
                    echo json_encode($response);
                    exit;
                }
                $newPageItem['flow_model_title'] = $title;
            }
            else if ($flowModelId === null) {
                $response = ["result"=>false, "status"=>"hierarchical_id of first page not set to 01"];
                echo json_encode($response);
                exit;
            }
        }
        else {
            if ($flowModelId === null) {
                $response = ["result"=>false, "status"=>"hierarchical_id of first page missing"];
                echo json_encode($response);
                exit;
            }
        }

        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title', 'status'=>'Could not resolve model title'];
            echo json_encode($response);
            exit;
        }
        if ($newPageItem['flow_model_id'] === null) {
            $flowModelTitle = $pageData[0]["title"];
            $flowModelId = modelTitleExists($flowModelTitle);
            if ($flowModelItem === null) {
                $newPageItem['update'] = false;
            }
            else {
                $newPageItem['update'] = $flowModelItem['update'];
            }
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

    $count = 0;
    foreach ($pageData as $pageItem) {
        $flowModelId = $pageItem['flow_model_id'];
        $page = $pageItem['page'];
        if ($pageItem['update'] === false) {
            addPage($flowModelId, $pageItem);
        }
        else {
            $doUpdate = false;
            // Check whether we have the page id
            if (array_key_exists('id', $page)) {
                if ($page['id'] != null) {
                    $doUpdate = true;
                }
            }
            // Search for the page
            if (!$doUpdate) {
                $title = $page['title'];
                $sql = "SELECT id FROM page WHERE title = '$title'";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("importPageData: could not search for page title {$dbConn->error}", 0);
                    return false;
                }
                if ($result->num_rows >= 1) {
                    $row = $result->fetch_assoc();
                    $pageItem['page']['id'] = $row['id'];
                    $doUpdate = true;
                }
            }

            if ($doUpdate) {
                updatePage($pageItem);
            }
            else {
                addPage($flowModelId, $pageItem);
            }
        }
        ++$count;
    }
    return true;
}

function validateImportData(&$pageData, $username) {
    $message = "";
    $count = 0;
    foreach ($pageData as &$pageItem) {
        $page = $pageItem['page'];
        $message = validatePageDetails($page, $count);
        if ($message != "") break;
        $message = validateUserAuthors($page, $username, $count);
        if ($message != "") break;
        $message = validateExternalAuthors($page, $count);
        if ($message != "") break;
        $message = validateReferences($page, $count);
        if ($message != "") break;
        $message = validateNodes($page, $count);
        if ($message != "") break;
        $message = validateFlows($page, $count);
        if ($message != "") break;

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

function validatePageDetails(&$page, $count) {
    if (array_key_exists("title", $page)) {
        $title = htmlspecialchars($page['title']);
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
        $matched = preg_match('/^[0-9]+$/', $hierarchicalId);
        if (!$matched) {
            $message = "Faulty hierarchical_id at page $count, $title<br>";
            return $message;
        }
        if (strlen($hierarchicalId) % 2 != 0) {
            $message = "Uneven number of characters in hierarchical_id at page $count, $title<br>";
            return $message;
        }
    }
    else {
        $message = "Missing file hierarchical_id at page $count, $title<br>";
        return $message;
    }

    if (array_key_exists("description", $page)) {
        $description = htmlspecialchars($page['description']);
        if (strlen($description) > 4096) {
            $message = "Description too long (>4096 chars) at page $count, $title<br>";
            return $message;
        }
        $page['description'] = $description;
    }
    else {
        $page['description'] = "";
    }

    if (array_key_exists("keywords", $page)) {
        $keywords = htmlspecialchars($page['keywords']);
        if (strlen($keywords) > 256) {
            $message = "Keywords too long (>256 chars) at Page $count, $title<br>";
            return $message;
        }
        $page['keywords'] = $keywords;
    }
    else {
        $page['keywords'] = "";
    }


    return "";
}

function validateUserAuthors(&$page, $username, $count) {
    global $dbConn;

    $message = "";
    $gotUser = false;
    if (!array_key_exists("user_authors", $page)) {
        $page['user_authors'] = [$username];
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
    if (!$gotUser) {
        array_push($page['user_authors'], ['username'=>$username]);
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
            $source = htmlspecialchars($reference['source']);
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
        $title = htmlspecialchars($reference['title']);
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
            $author = htmlspecialchars($reference['author']['author']);
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
    foreach($page['nodes'] as &$node) {
        if (!array_key_exists("node_num", $node)) {
            $message = "ValidateNodes: Missing node_num at page $count<br>";
            return $message;
        }
        $nodeNum = $node['node_num'];
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
        if ($node['label'] === "") {
            $message = "ValidateNodes: label set to no value at page $count<br>";
            return $message;
        }
        $label = htmlspecialchars($node['label']);
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
            $graphicText = htmlspecialchars($node['graphic_text']);
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
            if ($node['type'] != "effect" && $node['type'] != "mechanism") {
                $message = "ValidateNodes: node type must be either \"effect\" or \"mechanism\" at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists("definition", $node)) {
            $node['definition'] = "";
        }
        else {
            $definition = htmlspecialchars($node['definition']);
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
            $keywords = htmlspecialchars($node['keywords']);
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
            $hyperlink = htmlspecialchars($node['hyperlink']);
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
        if (!preg_match("/^[0-9][0-9]$/", $flowNum)) {
            $message = "validateFlows: badly formed flow_num at page $count<br>";
            return $message;
        }

        if (!array_key_exists('source_node_num', $flow)) {
            $message = "validateFlows: source_node_num field missing at page $count<br>";
            return $message;
        }
        if (!array_key_exists('destination_node_num', $flow)) {
            $message = "validateFlows: destination_node_num field missing at page $count<br>";
            return $message;
        }
        $sourceNodeNum = $flow['source_node_num'];
        $destNodeNum = $flow['destination_node_num'];
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
        $label = htmlspecialchars($flow['label']);
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

        if (!array_key_exists('label_width', $flow)) {
            $message = "validateFlows: flow label_width is missing at page $count<br>";
            return $message;
        }
        $labelWidth = $flow['label_width'];
        if (!is_int($labelWidth)) {
            $message = "validateFlows: flow label_width is not an integer at page $count<br>";
            return $message;
        }
        if ($labelWidth < 50 || 140 < $labelWidth) {
            $message = "validateFlows: flow label_width is out of range at page $count<br>";
            return $message;
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

        if (!array_key_exists("arrow_points", $flow)) {
            $message = "validateFlows: arrow_points field missing at page $count<br>";
            return $message;
        }
        $arrowPoints = $flow['arrow_points'];
        if (count($arrowPoints) != 4) {
            $message = "validateFlows: arrow_points data incorrect at page $count<br>";
            return $message;
        }
        for ($i = 0; $i < count($arrowPoints); $i++) {
            $point = $arrowPoints[$i];
            if (!array_key_exists('x', $point)) {
                $message = "validateFlows: - arrow_point missing x coordinate at page $count<br>";
                return $message;
            }
            $x = $point['x'];
            if (!is_int($x)) {
                $message = "validateFlows: - x coordinate is not an integer at page $count<br>";
                return $message;
            }
            if ($x < -($STAGEWIDTH - 40) || $STAGEWIDTH - 40 < $x) {
                $message = "validateFlows: - arrow_point x value out of range at page $count<br>";
                return $message;
            }
            if (!array_key_exists('y', $point)) {
                $message = "validateFlows: - arrow_point missing y coordinate at page $count<br>";
                return $message;
            }
            $y = $point['y'];
            if (!is_int($y)) {
                $message = "validateFlows: - arrow point y coordinate is not an integer at page $count<br>";
                return $message;
            }
            if ($y < -($STAGEHEIGHT - 40) || $STAGEHEIGHT - 40 < $y) {
                $message = "validateFlows: - arrow_point y value out of range at page $count<br>";
                return $message;
            }
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
            $definition = htmlspecialchars($flow['definition']);
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
            $keywords = htmlspecialchars($flow['keywords']);
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
            $hyperlink = htmlspecialchars($flow['hyperlink']);
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
                $formula = htmlspecialchars($formulaItem['formula']);
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
                    $description = htmlspecialchars($formulaItem['description']);
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
        return ['found'=>false, 'id'=>$row['id'], 'update'=>false];
    }
    else {
        error_log("addNewModel - inserted model not found", 0);
        return null;
    }

}