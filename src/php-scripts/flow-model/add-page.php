<?php
include_once __DIR__ . '/../db-connect.php';
function addPage($flowModelId, $pageData) {
    $pageId = addPageDetails($flowModelId, $pageData);
    return $pageId;
}

function addPageDetails($flowModelId, $pageData) {
    global $dbConn;

    $pageId = NULL;

    // Check whether the page title already exists
    $title = $pageData['page']['title'];
    $sql = "SELECT title FROM page WHERE title = '$title'";
    $result = $dbConn->query($sql);
    if ($result && $result->num_rows > 0) {
        error_log("addPageDetails: trying to add a page that already exists", 0);
    }
    else {
        $sql = "INSERT INTO page (flow_model_id, hierarchical_id, title, keywords, description) VALUES (?, ?, ?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addPageDetails: problem with prepare" . $dbConn->error, 0);
        }
        $stmt->bind_param('issss', $flowModelId, $pageData['page']['hierarchical_id'], 
            $title, $pageData['page']['keywords'], $pageData['page']['description']);
        if($stmt->execute()) {
            // Get the page id
            $sql = "SELECT id FROM page WHERE title = '$title'";
            $result = $dbConn->query($sql);
            if ($result && $row = $result->fetch_assoc()) {
                $pageId = $row['id'];
            }
        }
        
        if ($pageId != NULL) {
            // Add the authors
            addPageAuthors($pageId, $pageData['page']['authors']);
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

function addPageAuthors($pageId, $authors) {
    global $dbConn;

    foreach ($authors as $author) {
        $gotAuthor = false;
        $gotUser = false;
        // Extract the first (names) and last name 
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
        else {
            $gotAuthor = false;
        }
        if (!$gotAuthor && $firstName === "") {
            // Check the user table
            $sql = "SELECT * FROM user WHERE username = '$lastName'";
            $result = $dbConn->query($sql);
            if ($result && $row = $result->fetch_assoc()) {
                $userId = $row['id'];
                $gotUser = true;
            }
            else {
                $gotUser = false;
            }
        }
        if (!$gotUser && !$gotAuthor) {
            // Add the author as an external author
            $insertedAuthor = false;
            $sql = "INSERT INTO external_author (first_name, last_name) VALUES (?, ?)";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("addPageAuthor: error attempting to add author" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("ss", $firstName, $lastName);
                if ($stmt->execute()) {
                    $insertedAuthor = true;
                }
                else {
                    error_log("addPageAuthor: problem inserting author" . $dbConn->error, 0);
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
                else {
                    $gotAuthor = false;
                }        
            }
        }
        if ($gotAuthor) {
            // Update the external_author_page_link table
            $sql = "INSERT INTO external_author_page_link (page_id, external_author_id) VALUES (?, ?)";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("addPageAuthors: sql to insert author link failed" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("ii", $pageId, $authorId);
                if ($stmt->execute() === FALSE) {
                    error_log("addPageAuthors: failed to insert page author link" . $dbConn->error, 0);
                }
            }
        }
        elseif ($gotUser) {
            // Insert the user_page_link
            $sql = "INSERT INTO page_user_link (page_id, user_id) VALUES (?, ?)";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("addPageAuthors: sql to insert user link failed" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("ii", $pageId, $userId);
                if ($stmt->execute() === FALSE) {
                    error_log("addPageAuthors: failed to insert page user link" . $dbConn->error, 0);
                }
            }
        }
    }
}

function extractFirstAndLastNames($author) {
    // Check for last "." in the name
    $author = trim($author);
    $strEnd = strlen($author) - 1;
    $found = false;
    $i = $strEnd;
    do {
        $c = $author[$i];
        if ($c === "." || $c === " ") {
            $found = true;
        }
        else {
            --$i;
        }
    } while ($i >= 0 && !$found);
    if (!$found) {
        $firstName = "";
        $lastName = trim($author);
    }
    else {
        $lastName = substr($author, $i + 1, strlen($author) - ($i + 1));
        if ($c === " ") {
            // Find the nearest alpha
            --$i;
            $found = false;
            do {
                $c = $author[$i];
                if (($c >= "A" && $c <= "Z") || ($c >= "a" && $c <= "z")) {
                    $found = true;
                }
                else {
                    --$i;
                }
            }  while ($i >= 0 && !$found);
            if ($found) {
                $firstName = substr($author, 0, $i + 1);
            }
            else {
                $firstName = "";
            }
        }
        else {
            $firstName = trim(substr($author, 0, $i - 1));
        }
    }

    $nameParts = ['firstName' => $firstName, 'lastName' => $lastName];
    return $nameParts;
}

function addPageReferences($pageId, $references) {
    global $dbConn;

    foreach($references as $reference) {
        $source = $reference["source"];
        $title = $reference["title"];
        $author = $reference["author"];
        $gotAuthor = false;

        // Process the author name
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
            // Add the author to the external authors table
            $insertedAuthor = false;
            $sql = "INSERT INTO external_author (first_name, last_name) VALUES (?, ?)";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("addPageReferences: error attempting to add author" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("ss", $firstName, $lastName);
                if ($stmt->execute()) {
                    $insertedAuthor = true;
                }
                else {
                    error_log("addPageReferences: problem inserting author" . $dbConn->error, 0);
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
                error_log("addPageReferences: insert, sql failed to prepare" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("issi", $pageId, $source, $title, $authorId);
                if (!$stmt->execute()) {
                    error_log("addPageReferences: insert reference failed" . $dbConn->error, 0);
                }
            }
        }
    }
}

function addNodes($pageId, $nodes) {
    global $dbConn;
    foreach($nodes as $node) {
        $insertedNode = false;
        $gotNodeId = false;
        if ($node['has_child_page']) {
            $hasChildPage = 1;
        }
        else {
            $hasChildPage = 0;
        }
        $sql = "INSERT INTO node (page_id, node_num, label, x_coord, y_coord, 
            type, definition, keywords, hyperlink, has_child_page) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addNodes: problem with sql:" . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("issiissssi", $pageId, $node['node_num'], $node['label'], $node['x'],
                $node['y'], $node['type'], $node['definition'], $node['keywords'],
                $node['hyperlink'], $hasChildPage);
            if (!$stmt->execute()) {
                error_log("addNodes: failed to save node:" . $node['node_num'] . " " . $dbConn->error);
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
                error_log("addNodes: could not find inserted node: $nodeNum" . $dbConn->error);
            }
        }
    }
}

function addFlows($pageId, $flows) {
    global $dbConn;

    foreach($flows as $flow) {
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
            error_log("addFlows: Failed to prepare flow sql:" . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("issiiiiisssssii",
                $pageId,
                $flow['flow_num'],
                $flow['label'],
                $flow['drawing_group_x'],
                $flow['drawing_group_y'],
                $flow['label_x'],
                $flow['label_y'],
                $flow['label_width'],
                $flow['keywords'],
                $flow['definition'],
                $flow['hyperlink'],
                $flow['source_node_num'],
                $flow['destination_node_num'],
                $sourceVoid,
                $destinationVoid
            );
            if (!$stmt->execute()) {
                error_log("addFlows: flow not inserted" . $dbConn->error, 0);
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
                error_log("addFlows: could not get flow id " . $dbConn->error, 0);
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

}

function addArrowPoints($flowId, $arrowPoints) {
    global $dbConn;

    foreach($arrowPoints as $point){
        $sql = "INSERT INTO flow_arrow_point (flow_id, x, y) VALUES (?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addArrowPoints: Problem preparing sql" . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("iii", $flowId, $point['x'], $point['y']);
            if (!$stmt->execute()) {
                error_log("addArrowPoints: Problem inserting coords " . $dbConn->error, 0);
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
            error_log("addFlowPoints: Problem preparing sql" . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("iii", $flowId, $point['x'], $point['y']);
            if (!$stmt->execute()) {
                error_log("addFlowPoints: Problem inserting coords " . $dbConn->error, 0);
            }
        }
    }
}

function addConversionFormulas($flowId, $conversionFormulas) {
    global $dbConn;

    foreach($conversionFormulas as $conversionFormula) {
        $sql = "INSERT INTO conversion_formula (flow_id, formula, description) VALUES (?, ?, ?)";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("addConversionFormulas: problem with sql:" . $dbConn->error, 0);
        }
        else {
            $stmt->bind_param("iss", $flowId, $conversionFormula['formula'], $conversionFormula['description']);
            if (!$stmt->execute()) {
                error_log("addConversionFormulas: problem insert formula:" . $dbConn->error, 0);
            }
        }
    }
}