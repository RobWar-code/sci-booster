<?php

header('Content-Type: application/json');

$filenameItem = saveImportFile();
$newPageArray = arrangePageData($filenameItem);
if (validateImport($newPageArray)) {
    importPageData($newPageArray);
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

    error_log("Got path {$destPath}", 0);

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
    $pageData = json_decode($jsonString);
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
            if (array_key_exists("hierarchical_id", $pageData['pages'][0])) {
                if ($pageData['pages'][0]['hierarchical_id'] === '01') {
                    $flowModelTitle = $pageData['pages'][0]['title'];
                    $newPageItem['flow_model_title'] = $flowModelTitle;
                }
            } 
        }
        if (array_key_exists("flow_model_id", $pageData)) {
            $newPageItem['flow_model_id'] = $pageData['flow_model_id'];
        }
        else {
            if (array_key_exists("flow_model_id", $pageData['pages'][0])) {
                $newPageItem['flow_model_id'] = $pageData['pages'][0]['flow_model_id'];
            }
        }
        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title'];
            echo json_encode($response);
            exit;
        }
        if ($newPageItem['flow_model_id'] === null) {
            $flowModelItem = addNewModel($newPageItem['flow_model_title']);
            if ($flowModelItem === null) {
                $response = ["result"=>false, "error"=>"Problem with model data"];
                echo json_encode($response);
                exit;
            }
            $newPageItem['flow_model_id'] = $flowModelItem['id'];
            $newPageItem['update'] = $flowModelItem['update'];
        }
        else {
            $newPageItem['update'] = true;
        }
        foreach($pageData['pages'] as $page) {
            $pageItem = $newPageItem;
            $pageItem['page'] = $page;
            array_push($newModel, $pageItem);
        }
    }
    else {
        if (array_key_exists("flow_model_id", $pageData[0])){
            $newPageItem['flow_model_id'] = $pageData[0]['flow_model_id'];
        }
        if (array_key_exists("hierarchical_id", $pageData[0])) {
            if ($pageData[0]['hierarchical_id'] === '01') {
                $newPageItem['flow_model_title'] = $pageData[0]['title'];
            }
        }
        if ($newPageItem['flow_model_title'] === "") {
            $response = ['result'=>false, 'error'=>'Could not resolve model title'];
            echo json_encode($response);
            exit;
        }
        if ($newPageItem['flow_model_id'] === null) {
            $flowModelItem = addNewModel($newPageItem['flow_model_title']);
            if ($flowModelItem === null) {
                $response = ["result"=>false, "error"=>"Problem with model data"];
                echo json_encode($response);
                exit;
            }
            $newPageItem['flow_model_id'] = $flowModelItem['id'];
            $newPageItem['update'] = $flowModelItem['update'];
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
    return $newModel();
}

function validateImportData(&$pageData) {
    $message = "";
    $count = 0;
    foreach ($pageData as &$pageItem) {
        $page = $pageItem['page'];
        $message = validatePageDetails($page, $count);
        if ($message != "") break;
        ++$count;
    }
    unset($pageItem);
}

function validatePageDetails(&$page, $count) {
    if (array_key_exists("title", $page)) {
        $title = htmlspecialchars($page['title']);
        if ($title === "") {
            $message = "Missing Title at Page $count<br>";
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
        $matched = preg_match('/^[0-9]+$/');
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
        $page['description'] = $description;
    }
    else {
        $page['description'] = "";
    }
    return "";
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
    $result = $stmt->execute();
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
    $result = $stmt->execute();
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