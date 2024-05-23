<?php
include_once __DIR__ . '/../db-connect.php';
function addPage($flowModelId, $pageData) {
    $pageId = addPageDetails($flowModelId, $pageData);
}

function addPageDetails($flowModelId, $pageData) {
    global $dbConn;

    $pageId = NULL;

    // Check whether the page title already exists
    $title = $pageData['page']['title'];
    $sql = "SELECT title FROM page WHERE title = {$title}";
    $result = $dbConn->query($sql);
    if ($result && $result->num_rows > 0) {
        error_log("addPageDetails: trying to add a page that already exists", 0);
    }
    else {
        $sql = "INSERT INTO page (flow_model_id, hierarchical_id, title, keywords) VALUES (?, ?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageDetails: problem with prepare" . $dbConn->error, 0);
        }
        $stmt->bind_param('isss', $flowModelId, $pageData['page']['hierarchical_id'], 
            $title, $pageData['page']['hierarchical_id']);
        if($stmt->execute()) {
            // Get the page id
            $sql = "SELECT id FROM page WHERE title = title";
            $result = $dbConn->query($sql);
            if ($result && $row = $result->fetch_assoc()) {
                $pageId = $row['id'];
            }
        }
    }
    return $pageId;
}