<?php
/**
 * Delete the given page and all child pages recursively
 * $pageId - if this is null, derives the other arguments and vv. 
 */
function deletePage($flowModelId, $hierarchicalPageId, $pageId) {
    global $dbConn;

    // Get PageId etc. as necessary
    $gotPage = false;
    if ($pageId = null) {
        $sql = "SELECT id FROM page WHERE flow_model_id = ? AND hierarchical_id = ?";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("deletePage: problem with sql " . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("is", $flowModelId, $hierarchicalPageId);
            if (!$stmt->execute()) {
                error_log("deletePage: failed to select page by flowModelId, hierarchicalId: " . $dbConn->error, 0);
            }
            else {
                $stmt->store_result();
                $stmt->bind_result($pageId);
                if ($stmt->num_rows != 1) {
                    error_log("deletePage: failed to find page by flowModelId, hierarchicalId", 0);
                }
                else {
                    $gotPage = true;
                    $stmt->fetch();
                }
            }
        }
    }
    else {
        $sql = "SELECT flow_model_id, hierarchical_id FROM page WHERE page_id = $pageId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("deletePage: Could not read database page" . $dbConn->error, 0);
        }
        else {
            if ($result->num_rows != 1) {
                error_log("deletePage: No matching page record found or more than one", 0);
            }
            else {
                $row = $result->fetch_assoc();
                $gotPage = true;
                $flowModelId = $row['flow_model_id'];
                $hierarchicalPageId = $row['hierarchical_id'];
            }
        }
    }
    if ($gotPage) {
        // Delete nodes and child pages
        deletePageNodes($pageId, $flowModelId, $hierarchicalPageId);
        deleteUserAuthorPageLinks($pageId);
        deleteExternalAuthorPageLinks($pageId);
        deletePageReferences($pageId);
    } 
}

function deleteUserAuthorPageLinks($pageId) {
    global $dbConn;

    $sql = "DELETE FROM page_user_link WHERE pageId = $pageId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteUserAuthorLink: failed to delete user authors for page $pageId - " . $dbConn->error, 0);
    }
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

function deleteExternalAuthorPageLinks($pageId) {
    global $dbConn;

    $sql = "DELETE FROM external_author_page_link WHERE page_id = $pageId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteExternalAuthorPageLinks: deletion failed for page $pageId - " . $dbConn->error, 0);
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

function deletePageReferences($pageId) {
    global $dbConn;

    $sql = "SELECT id FROM reference WHERE page_id = $pageId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deletePageReferences: Unable to perform deletions" . $dbConn->error, 0); 
    }
    else {
        while ($row = $result->fetch_assoc()) {
            $referenceId = $row['id'];
            deleteReference($referenceId);
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

function deletePageNodes($pageId, $flowModelId, $hierarchicalId) {
    global $dbConn;

    $gotNodes = false;
    $sql = "SELECT id, node_num, has_child_page FROM node WHERE page_id = $pageId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteNodes: unable to fetch from node table" . $dbConn->error);
    }
    else {
        if ($result->num_rows === 0) {
            error_log("deleteNodes: page of $pageId has no nodes");
        }
        else {
            $gotNodes = true;
        }
    }
    if ($gotNodes) {
        while ($row = $result->fetch_assoc()) {
            $nodeId = $row['id'];
            $nodeNum = $row['node_num'];
            $hasChildPage = $row['has_child_page'];
            if ($hasChildPage === 1) {
                $deletionHierarchicalId = $hierarchicalId . $nodeNum;
                deletePage($flowModelId, $deletionHierarchicalId, null);
            }
            deleteNode($nodeId);
        }
    }
}

function deleteNodeAndChildPages($nodeId, $flowModelId, $pageHierarchicalId) {
    global $dbConn;

    $foundNode = false;
    $hasChildPage = 0;
    $node_num = "";
    $sql = "SELECT has_child_page, node_num FROM node WHERE id = $nodeId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteNodeAndChildPages: Unable to select node $nodeId - " . $dbConn->error, 0);
    }
    else {
        if ($result->num_rows != 1) {
            error_log("deleteNodeAndChildPages: Single item not found for node Id $nodeId - ", 0);
        }
        else {
            $row = $result->fetch_assoc();
            $hasChildPage = $row['has_child_page'];
            $nodeNum = $row['node_num'];
            $foundNode = true;
        }
    }
    if ($foundNode) {
        if ($hasChildPage === 1) {
            $pageId = null;
            $deletionPageHierarchicalId = $pageHierarchicalId . $nodeNum;
            deletePage($flowModelId, $deletionPageHierarchicalId, $pageId);
        }
        deleteNode($nodeId);
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

function deletePageFlows($pageId) {
    global $dbConn;

    $sql = "SELECT id FROM flow WHERE page_id = $pageId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deletePageFlows: Could not perform select" . $dbConn->error, 0);
    }
    else {
        while ($row = $result->fetch_assoc()) {
            $flowId = $row['id'];
            deleteConversionFormulas($flowId);
            deleteFlow($flowId);
        }
    }

}

function deleteFlow($flowId) {
    global $dbConn;
    $sql = "DELETE FROM flow WHERE id = $flowId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteFlow: Could not delete flow - $flowId - " . $dbConn->error, 0);
    }
}

function deleteConversionFormulas($flowId) {
    global $dbConn;

    $sql = "DELETE FROM conversion_formula WHERE flow_id = $flowId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteConversionFormulas: problem with deletion" . $dbConn->error, 0);
    }
}

function deleteConversionFormula($formulaId) {
    global $dbConn;

    $sql = "DELETE FROM conversion_formula WHERE id = $formulaId";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("deleteConversionFormula: problem with deletion: " . $dbConn->error, 0);
    }
}