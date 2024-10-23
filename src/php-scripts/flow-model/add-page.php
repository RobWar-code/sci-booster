<?php
include_once __DIR__ . '/../db-connect.php';
include_once __DIR__ . '/misc-funcs.php';

function addPage($flowModelId, $pageData) {
    $pageId = addPageDetails($flowModelId, $pageData);

    // If the hierarchical id is greater than 01, flag the parent page
    $hierarchicalId = $pageData['page']['hierarchical_id'];
    if ($hierarchicalId != "01") {
        flagParentPage($flowModelId, $hierarchicalId, true);
    }
    return $pageId;
}

function flagParentPage($flowModelId, $hierarchicalId, $flag) {
    global $dbConn;

    $sl = strlen($hierarchicalId);
    $parentHierarchicalId = substr($hierarchicalId, 0, $sl - 2);
    $nodeNum = substr($hierarchicalId, -2);
    $parentPageId = null;

    // Get the parent page id
    $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '$parentHierarchicalId'";
    $result = $dbConn->query($sql);
    if (!$result) {
        error_log("flagParentPage: Search for parent failed - $hierarchicalId - {$dbConn->error}", 0);
    }
    else {
        if ($result->num_rows === 1) {
            $row = $result->fetch_assoc();
            $parentPageId = $row['id'];
        }
        else {
            error_log("flagParentPage: Multiple ({$result->num_rows}) or no match for parent page from $hierarchicalId");
        }
    }
    if ($parentPageId != null) {
        // Update the node
        $flagVal = $flag ? 1 : 0;
        $sql = "UPDATE node SET has_child_page = $flagVal WHERE page_id = $parentPageId AND node_num = $nodeNum";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("flagParentPage: Could not update parent of $hierarchicalId - {$dbConn->error}");
        }
    }
}

function addPageDetails($flowModelId, $pageData) {
    global $dbConn;

    $pageId = NULL;

    // Check whether the page title already exists
    $title = htmlspecialchars($pageData['page']['title'], ENT_QUOTES, 'UTF-8', false);
    $sql = "SELECT title FROM page WHERE title = '$title'";
    $result = $dbConn->query($sql);
    if ($result && $result->num_rows > 0) {
        error_log("addPageDetails: trying to add a page that already exists - $title", 0);
    }
    else {
        $sql = "INSERT INTO page (flow_model_id, hierarchical_id, title, keywords, description) VALUES (?, ?, ?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageDetails: problem with prepare {$dbConn->error}", 0);
        }
        $hierarchicalId = $pageData['page']['hierarchical_id'];
        $keywords = htmlspecialchars($pageData['page']['keywords'], ENT_QUOTES, 'UTF-8', false);
        $description = htmlspecialchars($pageData['page']['description'], ENT_QUOTES, 'UTF-8', false);
        $stmt->bind_param('issss', $flowModelId, $hierarchicalId, 
            $title, $keywords, $description);
        if($stmt->execute()) {
            // Get the page id
            $sql = "SELECT id FROM page WHERE title = '$title'";
            $result = $dbConn->query($sql);
            if ($result && $row = $result->fetch_assoc()) {
                $pageId = $row['id'];
            }
        }
        
        if ($pageId != NULL) {
            // Add the user authors
            addPageUserAuthors($pageId, $pageData['page']['user_authors']);
            // Add the external authors
            addPageExternalAuthors($pageId, $pageData['page']['external_authors']);
            // Add the references
            addPageReferences($pageId, $pageData['page']['references']);
            // Add the nodes
            addNodes($pageId, $pageData['page']['nodes']);
            // Add the flows
            addFlows($pageId, $pageData['page']['flows']);
        }
        
    }
    return $pageId;
}

function addPageUserAuthors($pageId, $userAuthors) {
    foreach ($userAuthors as $userAuthor) {
        addPageUserAuthor($userAuthor, $pageId);
    }
}

function addPageUserAuthor($userAuthor, $pageId) {
    global $dbConn;

    // Get the user id
    $username = $userAuthor['username'];
    $sql = "SELECT id FROM user WHERE username = ?";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addPageUserAuthor: selection sql incorrect - {$dbConn->error}", 0);
    }
    else {
        $stmt->bind_param("s", $username);
        if (!$stmt->execute()){
            error_log("addPageUserAuthor: problem searching for $username - {$dbConn->error}", 0);
        }
        else {
            $stmt->store_result();
            $stmt->bind_result($userId);
            if ($stmt->num_rows > 0) {
                $stmt->fetch();
                if ($userId != null) {
                    // Add the user page link
                    $sql = "INSERT INTO page_user_link (user_id, page_id) VALUES (?, ?)";
                    $stmt = $dbConn->prepare($sql);
                    if ($stmt === FALSE) {
                        error_log("addPageUserAuthor: problem with insert sql - {$dbConn->error}", 0);
                    }
                    else {
                        $stmt->bind_param("ii", $userId, $pageId);
                        if (!$stmt->execute()) {
                            error_log("addPageUserAuthor: problem inserting user_page_link - {$dbConn->error}", 0);
                        }
                    }
                }
            }
        }
    }
}

function addPageExternalAuthors($pageId, $externalAuthors) {
    foreach ($externalAuthors as $externalAuthor) {
        addPageExternalAuthor ($externalAuthor, $pageId);
    }
}

function addPageExternalAuthor($externalAuthor, $pageId) {
    global $dbConn;

    $gotAuthor = false;
    $gotUser = false;
    // Extract the first (names) and last name
    $author = htmlspecialchars($externalAuthor['author'], ENT_QUOTES, 'UTF-8', false); 
    $nameParts = extractFirstAndLastNames($author);
    $firstName = $nameParts['firstName'];
    $lastName = $nameParts['lastName'];
    // Search the database for the last name
    $sql = "SELECT * FROM external_author WHERE last_name = '$lastName' AND first_name = '$firstName'";
    $result = $dbConn->query($sql);
    if ($result && $row = $result->fetch_assoc()) {
        $authorId = $row['id'];
        $gotAuthor = true;
    }
    if (!$gotAuthor) {
        // Add the author as an external author
        $insertedAuthor = false;
        $authorId = addExternalAuthor($author);
        if ($authorId != null) {
            $gotAuthor = true;
        }
    }
    if ($gotAuthor) {
        // Update the external_author_page_link table
        $sql = "INSERT INTO external_author_page_link (page_id, external_author_id) VALUES (?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageExternalAuthor: sql to insert author link failed {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("ii", $pageId, $authorId);
            if ($stmt->execute() === FALSE) {
                error_log("addPageExternalAuthor: failed to insert page author link {$dbConn->error}", 0);
            }
        }
    }
}

function addExternalAuthor($author) {
    global $dbConn;

    $authorId = null;
    $insertedAuthor = false;

    $nameParts = extractFirstAndLastNames($author);
    $firstName = $nameParts['firstName'];
    $lastName = $nameParts['lastName'];

    $sql = "INSERT INTO external_author (first_name, last_name) VALUES (?, ?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addExternalAuthor: error attempting to add author (sql) {$dbConn->error}", 0);
    }
    else {
        $stmt->bind_param("ss", $firstName, $lastName);
        if ($stmt->execute()) {
            $insertedAuthor = true;
        }
        else {
            error_log("addExternalAuthor: problem inserting author {$dbConn->error}", 0);
        }
    }
    if ($insertedAuthor) {
        // Get the author id
        $sql = "SELECT * FROM external_author WHERE last_name = '$lastName' AND first_name = '$firstName'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            $authorId = $row['id'];
        }
    }
    return $authorId;
}

function addUserPageLink($pageId, $userId) {
    global $dbConn;

    $sql = "INSERT INTO page_user_link (page_id, user_id) VALUES (?, ?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addUserPageLink: sql to insert user link failed {$dbConn->error}", 0);
    }
    else {
        $stmt->bind_param("ii", $pageId, $userId);
        if ($stmt->execute() === FALSE) {
            error_log("addUserPageLink: failed to insert page user link {$dbConn->error}", 0);
        }
    }
}

function addPageReferences($pageId, $references) {
    foreach($references as $reference) {
        addPageReference($pageId, $reference);
    }
}

function addPageReference($pageId, $reference) {
    global $dbConn;

    $source = htmlspecialchars($reference["source"], ENT_QUOTES, 'UTF-8', false);
    $title = htmlspecialchars($reference["title"], ENT_QUOTES, 'UTF-8', false);
    $author = htmlspecialchars($reference["author"]["author"], ENT_QUOTES, 'UTF-8', false);
    $gotAuthor = false;

    // Process the author name
    if ($author === "") {
        $authorId = null;
        $gotAuthor = true;
    }
    else {
        $nameParts = extractFirstAndLastNames($author);
        $firstName = $nameParts['firstName'];
        $lastName = $nameParts['lastName'];
        // Search the database for the last name
        $sql = "SELECT * FROM external_author WHERE last_name = '$lastName' AND first_name = '$firstName'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            $authorId = $row['id'];
            $gotAuthor = true;
        }
    }
    if (!$gotAuthor) {
        // Add the author to the external authors table
        $insertedAuthor = false;
        $sql = "INSERT INTO external_author (first_name, last_name) VALUES (?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageReferences: error attempting to add author {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("ss", $firstName, $lastName);
            if ($stmt->execute()) {
                $insertedAuthor = true;
            }
            else {
                error_log("addPageReferences: problem inserting author {$dbConn->error}", 0);
            }
        }
        if ($insertedAuthor) {
            // Get the author id
            $sql = "SELECT * FROM external_author WHERE last_name = '$lastName' AND first_name = '$firstName'";
            $result = $dbConn->query($sql);
            if ($result && $row = $result->fetch_assoc()) {
                $authorId = $row['id'];
                $gotAuthor = true;
            }
        }

    }
    if ($gotAuthor) {
        // Insert the reference details into the reference table
        $sql = "INSERT INTO reference (page_id, source, title, external_author_id) VALUES (?, ?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageReferences: insert, sql failed to prepare {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("issi", $pageId, $source, $title, $authorId);
            if (!$stmt->execute()) {
                error_log("addPageReferences: insert reference failed {$dbConn->error}", 0);
            }
        }
    }
}

function addNodes($pageId, $nodes) {
    global $dbConn;
    foreach($nodes as $node) {
        addNode($node, $pageId);
    }
}

function addNode($node, $pageId) {
    global $dbConn;

    $insertedNode = false;
    $hasChildPage = $node['has_child_page'] ? 1 : 0;
    $sql = "INSERT INTO node (page_id, node_num, label, graphic_file, graphic_text, graphic_credits, x_coord, y_coord, 
        type, definition, keywords, hyperlink, has_child_page) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addNodes: problem with sql: {$dbConn->error}", 0);
    }
    else {
        $label = htmlspecialchars($node['label'], ENT_QUOTES, 'UTF-8', false);
        $graphicText = htmlspecialchars($node['graphic_text'], ENT_QUOTES, 'UTF-8', false);
        $graphicCredits = htmlspecialchars($node['graphic_credits'], ENT_QUOTES, 'UTF-8', false);
        $definition = htmlspecialchars($node['definition'], ENT_QUOTES, 'UTF-8', false);
        $keywords = htmlspecialchars($node['keywords'], ENT_QUOTES, 'UTF-8', false);
        $stmt->bind_param("isssssiissssi", $pageId, $node['node_num'], $label, 
            $node['graphic_file'], $graphicText, $graphicCredits, $node['x'],
            $node['y'], $node['type'], $definition, $keywords,
            $node['hyperlink'], $hasChildPage);
        if (!$stmt->execute()) {
            error_log("addNodes: failed to save node: {$node['node_num']} {$dbConn->error}", 0);
        }
        else {
            $insertedNode = true;
        }
    }
    if ($insertedNode) {
        // Get the node id
        $nodeNum = $node['node_num'];
        $sql = "SELECT id FROM node WHERE page_id = '$pageId' AND node_num = '$nodeNum'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            $nodeId = $row['id'];
            $gotNodeId = true;
        }
        else {
            error_log("addNodes: could not find inserted node: $nodeNum {$dbConn->error}", 0);
        }
    }
}

function addFlows($pageId, $flows) {

    foreach($flows as $flow) {
        addFlow($flow, $pageId);
    }
}

function addFlow($flow, $pageId) {
    global $dbConn;

    $flowInserted = false;
    $gotFlowId = false;

    $sourceVoid = 0;
    if ($flow['source_node_num'] === "") {
        $sourceVoid = 1;
    }
    $destinationVoid = 0;
    if ($flow['destination_node_num'] === "") {
        $destinationVoid = 1;
    }
    // Save the individual details
    $sql = "INSERT INTO flow (page_id, flow_num, label, drawing_group_x, drawing_group_y, 
        label_x, label_y, label_width, keywords, definition, hyperlink, 
        source_node_num, destination_node_num, source_void, destination_void)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addFlows: Failed to prepare flow sql: {$dbConn->error}", 0);
    }
    else {
        $stmt->bind_param("issiiiiisssssii",
            $pageId,
            $flow['flow_num'],
            htmlspecialchars($flow['label'], ENT_QUOTES, 'UTF-8', false),
            $flow['drawing_group_x'],
            $flow['drawing_group_y'],
            $flow['label_x'],
            $flow['label_y'],
            $flow['label_width'],
            htmlspecialchars($flow['keywords'], ENT_QUOTES, 'UTF-8', false),
            htmlspecialchars($flow['definition'], ENT_QUOTES, 'UTF-8', false),
            $flow['hyperlink'],
            $flow['source_node_num'],
            $flow['destination_node_num'],
            $sourceVoid,
            $destinationVoid
        );
        if (!$stmt->execute()) {
            error_log("addFlows: flow not inserted {$dbConn->error}", 0);
        }
        else {
            $flowInserted = true;
        }
    }
    if ($flowInserted) {
        // Get the flow_id
        $flowNum = $flow['flow_num'];
        $sql = "SELECT id FROM flow WHERE page_id = '$pageId' AND flow_num = '$flowNum'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()){
            $flowId = $row['id'];
            $gotFlowId = true;
        }
        else {
            error_log("addFlows: could not get flow id {$dbConn->error}", 0);
        }
    }
    if ($gotFlowId) {
        // Do Arrow Points
        addArrowPoints($flowId, $flow['arrow_points']);
        // Do flow points
        addFlowPoints($flowId, $flow['points']);
        // Do conversion formulas
        addConversionFormulas($flowId, $flow['conversion_formulas']);
    }

}

function addArrowPoints($flowId, $arrowPoints) {
    global $dbConn;

    foreach($arrowPoints as $point){
        $sql = "INSERT INTO flow_arrow_point (flow_id, x, y) VALUES (?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addArrowPoints: Problem preparing sql {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("iii", $flowId, $point['x'], $point['y']);
            if (!$stmt->execute()) {
                error_log("addArrowPoints: Problem inserting coords {$dbConn->error}", 0);
            }
        }
    }
}

function addFlowPoints($flowId, $flowPoints){
    global $dbConn;

    foreach($flowPoints as $point){
        $sql = "INSERT INTO flow_point (flow_id, x, y) VALUES (?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addFlowPoints: Problem preparing sql {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("iii", $flowId, $point['x'], $point['y']);
            if (!$stmt->execute()) {
                error_log("addFlowPoints: Problem inserting coords {$dbConn->error}", 0);
            }
        }
    }
}

function addConversionFormulas($flowId, $conversionFormulas) {

    foreach($conversionFormulas as $conversionFormula) {
        addConversionFormula($flowId, $conversionFormula);
    }
}

function addConversionFormula($flowId, $conversionFormula) {
    global $dbConn;

    $sql = "INSERT INTO conversion_formula (flow_id, formula, description) VALUES (?, ?, ?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addConversionFormula: problem with sql: {$dbConn->error}", 0);
    }
    else {
        $stmt->bind_param("iss", $flowId, htmlspecialchars($conversionFormula['formula'], ENT_QUOTES, 'UTF-8', false), 
        htmlspecialchars($conversionFormula['description'], ENT_QUOTES, 'UTF-8', false));
        if (!$stmt->execute()) {
            error_log("addConversionFormula: problem insert formula: {$dbConn->error}", 0);
        }
    }

}