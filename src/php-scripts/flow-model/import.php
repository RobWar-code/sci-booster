<?php
include_once __DIR__ . '/../db-connect.php';

header('Content-Type: application/json');

$filenameItem = saveImportFile();
$newPageArray = arrangePageData($filenameItem);
if (validateImportData($newPageArray, $_POST['username'])) {
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

        ++$count;
    }
    unset($pageItem);
    if ($message != "") {
        $response = ["result"=>false, "error"=>$message];
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
    foreach ($page['user_authors'] as $user) {
        $sql = "SELECT id FROM user WHERE username = ?";
        $stmt = $dbConn->prepare($sql);
        if (!$stmt) {
            error_log("validateUserAuthors: problem with sql - {$dbConn->error}", 0);
            $message = "Database error<br>";
            return $message;
        }
        $stmt->bind_param("s", $user);
        $result->execute();
        if (!$result) {
            error_log("validateUserAuthors: could not execute sql - {$dbConn->error}", 0);
            $message = "Database error<br>";
            return $message;
        }
        if ($result->num_rows === 0) {
            $message = "Unidentified user in user authors of Page $count<br>";
            return $message;
        }
        if ($user === $username) {
            $gotUser = true;
        }
    }
    if (!$gotUser) {
        array_push($page['user_authors'], $username);
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
    foreach($page['external_authors'] as $author) {
        $author = htmlspecialchars($author);
        if (strlen($author) > 128) {
            $message = "Author name length too long > 128 characters at page $count<br>";
            return $message;
        }
        $page['external_authors'][$index] = $author;
        ++$index;
    }
    return $message;
}

function validateReferences(&$page, $count) {
    $message = "";
    if (!array_key_exists($page, 'references')) {
        $page['references'] = [];
        return $message;
    }
    $index = 0;
    foreach($page['references'] as $reference) {
        if (!array_key_exists($reference, 'source')) {
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

        if (!array_key_exists($reference, $title)) {
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

        if (!array_key_exists($reference, 'author')) {
            $reference['author'] = "";
        }
        else {
            $author = htmlspecialchars($reference['author']);
            if (strlen($author) > 128) {
                $message = "Reference author > 128 characters at page $count<br>";
                return $message;
            }
            $reference['author'] = $author;
        }

        $page['references'][$index] = $reference;
        ++$index;
    }

    return $message;

}

function validateNodes(&$page, $count) {
    $message = "";
    if (!array_key_exists($page, 'nodes')) {
        $page['nodes'] = [];
        return;
    }
    foreach($page['nodes'] as &$node) {
        if (!array_key_exists($node, "node_num")) {
            $message = "ValidateNodes: Missing node_num at page $count<br>";
            return $message;
        }
        $nodeNum = $node['node_num'];
        if (!preg_match('/^[0][0-9]$/', $nodeNum)){
            $message = "ValidateNodes: Badly formed node_num at page $count<br>";
            return $message;
        }
        
        if (!array_key_exists($node, "x")) {
            $message = "ValidateNodes: x coordinate missing at page $count<br>";
            return $message;
        }
        $x = $node['x'];
        if ($x < 0 || 390 < $x) {
            $message = "ValidateNodes: x coordinate out of range at page $count<br>";
            return $message;
        }
        if (!array_key_exists($node, "y")) {
            $message = "ValidateNodes: y coordinate missing at page $count<br>";
            return $message;
        }
        $y = $node['y'];
        if ($y < 0 || 580 < $y) {
            $message = "ValidateNodes: y coordinate out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists($node, 'label')) {
            $message = "ValidateNodes: label missing at page $count<br>";
            return $message;
        }
        $label = htmlspecialchars($node['label']);
        if (strlen($label) > 64) {
            $message = "ValidateNodes: label too long (>64) at page $count<br>";
            return $message;
        }
        $node['label'] = $label;

        if (!array_key_exists($node, 'graphic_file')) {
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
        
        if (!array_key_exists($node, 'graphic_text')) {
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

        if (!array_key_exists($node, 'type')) {
            $node['type'] = "mechanism";
        }
        else {
            if ($node['type'] != "effect" && $node['type'] != "mechanism") {
                $message = "ValidateNodes: node type must be either \"effect\" or \"mechanism\" at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists($node, "definition")) {
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

        if (!array_key_exists($node, "keywords")) {
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

        if (!array_key_exists($node, "hyperlink")) {
            $node['hyperlink'] = "";
        }
        else {
            $hyperlink = htmlspecialchars($node['hyperlink']);
            if (strlen($hyperlink) > 256) {
                $message = "ValidateNodes: hyperlink greater than 256 chars at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists($node, "has_child_page")) {
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
}

function validateFlows(&$page, $count) {
    if (!array_key_exists($page, "flows")) {
        $page['flows'] = [];
        return;
    }
    foreach($page['flows'] as &$flow) {
        if (!array_key_exists($flow, 'flow_num')) {
            $message = "validateFlows: flow_num value and field missing at page $count<br>";
            return $message;
        }
        $flowNum = $flow['flow_num'];
        if (!preg_match("/^[0-9][0-9]$/", $flowNum)) {
            $message = "validateFlows: badly formed flow_num at page $count<br>";
            return $message;
        }

        if (!array_key_exists($flow, 'source_node_num')) {
            $message = "validateFlows: source_node_num field missing at page $count<br>";
            return $message;
        }
        if (!array_key_exists($flow, 'destination_node_num')) {
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

        if (!array_key_exists($flow, 'label')) {
            $message = "validateFlows: missing flow label field at page $count<br>";
            return $message;
        }
        $label = htmlspecialchars($flow['label']);
        if (strlen($label) > 64) {
            $message = "validateFlows: flow label is too long (>64 chars) at page $count<br>";
            return $message;
        }
        $flow['label'] = $label;

        if (!array_key_exists($flow, 'label_x')) {
            $message = "validateFlows: flow label_x field is missing at page $count<br>";
            return $message;
        }
        $labelX = $flow['label_x'];
        if ($labelX < -390 || 390 < $labelX) {
            $message = "validateFlows: flow label_x is out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists($flow, 'label_y')) {
            $message = "validateFlows: flow label_y is missing at page $count<br>";
            return $message;
        }
        $labelY = $flow['label_y'];
        if ($labelY < -580 || 580 < $labelY) {
            $message = "validateFlows: flow label_y is out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists($flow, 'label_width')) {
            $message = "validateFlows: flow label_width is missing at page $count<br>";
            return $message;
        }
        $labelWidth = $flow['label_width'];
        if ($labelWidth < 50 || 140 < $labelWidth) {
            $message = "validateFlows: flow label_width is out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists($flow, 'drawing_group_x')) {
            $message = "validateFlows: flow drawing_group_x field is missing at page $count<br>";
            return $message;
        }
        $drawingGroupX = $flow['drawing_group_x'];
        if ($drawingGroupX < 0 || 390 < $drawingGroupX) {
            $message = "validateFlows: flow drawing_group_x value is out of range at page $count<br>";
            return $message;
        }
        if (!array_key_exists($flow, 'drawing_group_y')) {
            $message = "validateFlows: flow drawing_group_y field omitted at page $count<br>";
            return $message;
        }
        $drawingGroupY = $flow['drawing_group_y'];
        if ($drawingGroupY < 0 || 580 < $drawingGroupY) {
            $message = "validateFlows: flow drawing_group_y value is out of range at page $count<br>";
            return $message;
        }

        if (!array_key_exists($flow, "flow_arrow_points")) {
            $message = "validateFlows: flow_arrow_points field missing at page $count<br>";
            return $message;
        }
        $flowArrowPoints = $flow['flow_arrow_points'];
        if (count($flowArrowPoints) != 4) {
            $message = "validateFlows: flow_arrow_points data incorrect at page $count<br>";
            return $message;
        }
        for ($i = 0; $i < count($flowArrowPoints); $i++) {
            $point = $flowArrowPoints[$i];
            if (!array_key_exists($point, 'x')) {
                $message = "validateFlows: - flow_arrow_point missing x coordinate at page $count<br>";
                return $message;
            }
            $x = $point['x'];
            if ($x < -300 || 300 < $x) {
                $message = "validateFlows: - flow_arrow_point x value out of range at page $count<br>";
                return $message;
            }
            if (!array_key_exists($point, 'y')) {
                $message = "validateFlows: - flow_arrow_point missing y coordinate at page $count<br>";
                return $message;
            }
            $y = $point['y'];
            if ($y < -500 || 500 < $y) {
                $message = "validateFlows: - flow_arrow_point y value out of range at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists($flow, "points")) {
            $message = "validateFlows: - flow line points omitted at page $count<br>";
            return $message;
        }
        if (count($flow['points']) < 2) {
            $message = "validateFlows: - flow line points missing at page $count<br>";
            return $message;
        }
        foreach($flow['points'] as $point) {
            if (!array_key_exists($point, 'x')){
                $message = "validateFlows: - flow line point has missing x coordinate at page $count<br>";
                return $message;
            }
            $x = $point['x'];
            if ($x < -300 || 300 < $x) {
                $message = "validateFlows: - flow line coordinate x out of range at page $count<br>";
                return $message;
            }
            if (!array_key_exists($point, 'y')) {
                $message = "validateFlows: - flow line coordinate y is missing at page $count<br>";
                return $message;
            }
            $y = $point['y'];
            if ($y < -500 || 500 < $y) {
                $message = "validateFlows: - flow line coordinate y is out of range at page $count<br>";
                return $message;
            }
        }

        if (!array_key_exists($flow, 'definition')) {
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

        if (!array_key_exists($flow, 'keywords')) {
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

        if (!array_key_exists($flow, 'hyperlink')) {
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

        if (!array_key_exists($flow, 'conversion_formulas')) {
            $flow['conversion_formulas'] = [];
        }
        else {
            foreach($flow['conversion_formulas'] as &$formulaItem) {
                if (!array_key_exists($formulaItem, 'formula')) {
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

                if (!array_key_exists($formulaItem, 'description')) {
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