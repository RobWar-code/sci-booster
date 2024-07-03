<?php

function deletePage($flowModelId, $hierarchicalPageId, $pageId) {
    
}

function deleteUserPageLink($pageId, $userId) {
    global $dbConn;

    $sql = "DELETE FROM page_user_link WHERE page_id = ? AND user_id = ?";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("deleteUserPageLink: Problem with sql - " . $dbConn->error, 0);
    }
    else {
        $stmt->bind_param("ii", $pageId, $userId);
        if (!$stmt->execute()) {
            error_log("deleteUserPageLink: problem delete user/page link - " . $dbConn->error, 0);
        }
    }
}

function deleteAuthorPageLink($author, $pageId) {
    global $dbConn;

    // Delete the external_author_page link;
    // Get the first and last names
    $gotAuthorId = false;
    $nameParts = extractFirstAndLastNames($author);
    $firstName = $nameParts['firstName'];
    $lastName = $nameParts['lastName'];
    $sql = "SELECT id FROM external_author WHERE first_name = ? AND last_name = ?";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("deleteAuthorPageLink: sql error select " . $dbConn->error, 0);
    }
    else {
        $stmt->bind_param("ss", $firstName, $lastName);
        if (!$stmt->execute()){
            error_log("deleteAuthorPageLink: select failed - " . $dbConn->error, 0);
        }
        else {
            $stmt->store_result();
            $stmt->bind_result($externalAuthorId);
            if ($stmt->num_rows === 0) {
                error_log("deleteAuthorPageLink: could not find old author " . $author . " " . $dbConn->error, 0);
            }
            else {
                $gotAuthorId = true;
                $stmt->fetch();
            }
        }
    }
    if ($gotAuthorId) {
        $sql = "DELETE FROM external_author_page_link WHERE page_id = ? AND external_author_id = ?";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("deleteAuthorPageLink: delete author page link, sql failed - " . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("ii", $pageId, $externalAuthorId);
            if (!$stmt->execute()) {
                error_log("deleteAuthorPageLink: delete failed - " . $dbConn->error, 0);
            }
        }
    }
}

function deleteReference($referenceId) {
    global $dbConn;
    $sql = "DELETE FROM reference WHERE id = $referenceId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteReference: Could not delete reference - " . $dbConn->error, 0);
    }
}

function deleteNode($nodeId) {
    global $dbConn;

    $sql = "DELETE FROM node WHERE id = $nodeId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log ("deleteNode: failed to delete record - $nodeId - " . $dbConn->error);
    }
}
