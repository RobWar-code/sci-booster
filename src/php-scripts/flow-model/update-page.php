<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . '/add-page.php';
    include_once __DIR__ . '/extract-page.php';
    include_once __DIR__ . '/delete-page.php';
    include_once __DIR__ . '/search-db.php';
    include_once __DIR__ . '/../lib/compareArrays.php';
    include_once __DIR__ . '/../lib/findKeyedValue.php';
    include_once __DIR__ . '/misc-funcs.php';

    function updatePage($flowModelData) {
        $flowModelId = $flowModelData['flow_model_id'];
        $pageId = $flowModelData['page']['id'];
        $oldFlowModelData = extractPage($flowModelId, $pageId);
        $oldPageData = $oldFlowModelData['page'];
        $pageData = $flowModelData['page'];

        updatePageDetails($pageData, $oldPageData);
        updatePageUserAuthors($pageData, $oldPageData);
        updatePageExternalAuthors($pageId, $pageData, $oldPageData);
        updatePageReferences($pageData, $oldPageData);
        updateNodes($pageData, $oldPageData);
        updateFlows($pageData, $oldPageData);
    }

    function updatePageDetails(&$pageData, $oldPageData) {
        $table = "page";
        $id = $pageData['id'];
        $fieldsRef = $pageData;
        $oldFieldsRef = $oldPageData;
        adjustFieldHtml($pageData, ["title", "keywords", "description"]);
        $fieldNames = ["hierarchical_id", "title", "keywords", "description"];
        $destFieldNames = [];
        $types = "ssss";
        updateFields($table, $id, $fieldsRef, $oldFieldsRef, $fieldNames, $destFieldNames, $types);
    }

    function updatePageUserAuthors($pageData, $oldPageData) {

        $pageId = $pageData['id'];

        // Separate the usernames from the external authors
        $authorList = $pageData['user_authors'];
        $oldAuthorList = $oldPageData['user_authors'];
        updateUserAuthors($pageId, $authorList, $oldAuthorList);
    }

    function updatePageExternalAuthors($pageId, $pageData, $oldPageData) {
        global $dbConn;

        $authors = $pageData['external_authors'];
        $oldAuthors = $oldPageData['external_authors'];

        $key = "author";
        $useSimilar = false;
        $arrayDiffs = compareArrays($authors, $oldAuthors, $key, $useSimilar);
        $aOnly = $arrayDiffs['aOnly'];
        $bOnly = $arrayDiffs['bOnly'];
        if (count($aOnly) > 0) {
            // Do inserts
            foreach($aOnly as $index) {
                $author = htmlspecialchars($authors[$index]['author'], ENT_QUOTES, 'UTF-8', false);
                // Check whether the id is present
                if (isset($authors[$index]['id'])) {
                    $authorId = $authors[$index]['id'];
                    // Check for the same id in the oldAuthors list
                    $oldIndex = findKeyedValue($oldAuthors, "id", $authorId);
                    if ($oldIndex === -1) {
                        error_log("updatePageExternalAuthors: id not found in old data $authorId", 0);
                    }
                    else {
                        // Remove the entry from the old authors only list (bOnly)
                        $bOnly = deleteKeyedRefValue($bOnly, $oldAuthors, "id", $authorId);
                        $author = htmlspecialchars($authors[$index]['author'], ENT_QUOTES, 'UTF-8', false);
                        $oldAuthor = $oldAuthors[$oldIndex]['author'];
                        updateExternalAuthor($author, $oldAuthor, $authorId);
                    }
                }
                else {
                    $author = htmlspecialchars($authors[$index]['author'], ENT_QUOTES, 'UTF-8', false);
                    addPageExternalAuthor($author, $pageId);
                }
            }
        }
        if (count($bOnly) > 0) {
            // Delete the page author links
            foreach($bOnly as $index) {
                $author = htmlspecialchars($oldAuthors[$index]['author'], ENT_QUOTES, 'UTF-8', false);
                deleteAuthorPageLink($author, $pageId);
            }
        }
    }

    function deleteKeyedRefValue($refArray, $array, $key, $value) {
        $newArray = [];
        foreach($refArray as $index) {
            $record = $array[$index];
            if (!array_key_exists($key, $record)) {
                array_push($newArray, $record);
            }
            else {
                if ($record[$key] != $value) {
                    array_push($newArray, $record);
                }
            }
        }
        return $newArray;
    }

    function updateUserAuthors($pageId, $authorList, $oldAuthorList) {
        global $dbConn;

        // Compare the two lists
        $key = "username";
        $useSimilar = false;
        $arrayDiffs = compareArrays($authorList, $oldAuthorList, $key, $useSimilar);
        $newNamesOnly = $arrayDiffs['aOnly'];
        $oldNamesOnly = $arrayDiffs['bOnly'];
        if (count($newNamesOnly) > 0) {
            // Add the user page links
            foreach ($newNamesOnly as $index) {
                $username = $authorList[$index]['username'];
                // Get the user id
                $sql = "SELECT id FROM user WHERE username = '$username'";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("updateUserAuthors: could not get id for user - $username - {$dbConn->error}", 0);
                }
                else {
                    $row = $result->fetch_assoc();
                    $userId = $row['id'];
                    addUserPageLink($pageId, $userId);
                }
            }
        }
        if (count($oldNamesOnly) > 0) {
            // Delete the old users only items
            foreach ($oldNamesOnly as $index) {
                $username = $oldAuthorList[$index]['id'];
                // Get the user id
                $sql = "SELECT id FROM user WHERE username = '$username'";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("updateUserAuthors: could not get id for old user - $username - {$dbConn->error}", 0);
                }
                else {
                    $row = $result->fetch_assoc();
                    $userId = $row['id'];
                    deleteUserPageLink($pageId, $userId);
                }
            }

        }
    }

    function updateExternalAuthor($author, $oldAuthor, $authorId) {
        global $dbConn;

        if ($author === "") return;

        if ($authorId === NULL) {
            // The author given is not a user, so update the author name
            $result = findExternalAuthor($oldAuthor, $authorId);
            if ($result === FALSE) {
                error_log("updateAuthors: Problem doing external author search - $oldAuthor", 0);
            }
            elseif ($result->num_rows > 1) {
                error_log("updateAuthors: Duplicate matches for name - $oldAuthor", 0);
            }
            elseif ($row = $result->fetch_assoc()) {
                $authorId = $row['id'];
            }
        }
        if ($authorId != NULL) {
            $nameParts = extractFirstAndLastNames($author);
            $firstName = $nameParts['firstName'];
            $lastName = $nameParts['lastName'];
            $sql = "UPDATE external_author SET first_name = ?, last_name = ? WHERE id = ?";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("updateExternalAuthor: could not update author preparing sql - {$dbConn->error}", 0);
            }
            else {
                $stmt->bind_param("ssi", $firstName, $lastName, $authorId);
                if (!$stmt->execute()) {
                    error_log("updateExternalAuthor: could not update external author record - $lastName - {$dbConn->error}", 
                        0);
                }
            }
        }
    }

    function updatePageReferences($pageData, $oldPageData) {
        global $dbConn;

        // Look for differences between the two lists
        $pageId = $pageData["id"];
        $references = $pageData['references'];
        // Adjust the html in the references
        $newReferences = [];
        foreach ($references as $refItem) {
            adjustFieldHtml($refItem, ["source", "title"]);
            $author = htmlspecialchars($refItem['author']['author'], ENT_QUOTES, 'UTF-8', false);
            $refItem['author']['author'] = $author;
            array_push($newReferences, $refItem);
        }
        $oldReferences = $oldPageData['references'];
        $key = 'title';
        $useSimilar = true;
        $arrayDiffs = compareArrays($newReferences, $oldReferences, $key, $useSimilar);
        $same = $arrayDiffs['same'];
        if (count($same) > 0) {
            for($i = 0; $i < count($same); $i += 2) {
                $index = $same[$i];
                $oldIndex = $same[$i + 1];
                $reference = $newReferences[$index];
                $oldReference = $oldReferences[$oldIndex];
                $oldReferenceId = $oldReferences[$oldIndex]['id'];
                $externalAuthorId = checkAndUpdateReferenceAuthor($reference, $oldReferences);
                if ($reference['author']['author'] === "") {
                    $reference['author'] = null;
                }
                else {
                    $reference['author'] = $externalAuthorId;
                }
                // Check the other fields
                $table = 'reference';
                $fieldNames = ['source', 'title', 'author'];
                $destFieldNames = ['source', 'title', 'external_author_id'];
                $types = "ssi";
                updateFields($table, $oldReferenceId, $reference, $oldReference, $fieldNames, $destFieldNames, $types);
            }
        }
        $aOnly = $arrayDiffs['aOnly'];
        $bOnly = $arrayDiffs['bOnly'];
        if (count($aOnly) > 0) {
            // Do reference additions
            foreach ($aOnly as $index) {
                $reference = $newReferences[$index];
                if (isset($reference['id'])) {
                    // Remove the corresponding item from $bOnly
                    deleteKeyedRefValue($bOnly, $oldReferences, "id", $reference['id']);
                    // Update the reference, including the title
                    // Check and update the author
                    checkAndUpdateReferenceAuthor($reference, $oldReferences);
                }
                addPageReference($pageId, $reference);
            }
        }
        if (count($bOnly) > 0) {
            // Do reference deletions
            foreach ($bOnly as $index) {
                $referenceId = $oldReferences[$index]['id'];
                deleteReference($referenceId);
            }
        }
    }

    /**
     * Assuming that the id for the reference author is present,
     * but the old author name may be different, update the
     * author name accordingly.
     */
    function checkAndUpdateReferenceAuthor($reference, $oldReferences){
        global $dbConn;

        $author = $reference['author']['author'];
        if ($author === "") return null;

        $externalAuthorId = isset($reference['author']['id']) ? $reference['author']['id'] : null;
        // Find the old author
        $found = false;
        if ($externalAuthorId != null) {
            $index = 0;
            foreach($oldReferences as $oldReference) {
                if ($oldReference['author']['id'] === $externalAuthorId) {
                    $found = true;
                    break;
                }
                ++$index;
            }
        }
        if ($found) {
            $oldAuthor = $oldReference['author']['author'];
            if ($author != $oldAuthor) {
                // Modify the author spelling
                // Update the author spelling
                updateExternalAuthor($author, $oldAuthor, $externalAuthorId);
            }            
        }
        else {
            $result = findExternalAuthor($author, $externalAuthorId);
            if ($result && $result->num_rows == 1) {
                $row = $result->fetch_assoc();
                $externalAuthorId = $row['id'];
            }
            else if ($result) {
                $externalAuthorId = addExternalAuthor($author);
            }
        }
        return $externalAuthorId;
    }

    function updateNodes($pageData, $oldPageData) {
        // compare the old and new node lists by label
        $pageId = $oldPageData['id'];
        $flowModelId = $oldPageData['flow_model_id'];
        $pageHierarchicalId = $oldPageData['hierarchical_id'];
        $nodes = $pageData['nodes'];
        $oldNodes = $oldPageData['nodes'];


        // Loop through the nodes
        // Set-up the deletions list flags
        $oldMatches = [];
        for ($i = 0; $i < count($oldNodes); $i++) {
            array_push($oldMatches, false);
        }

        foreach($nodes as $node) {
            // Adjust html for each applicable field
            adjustFieldHtml($node, ["label", "graphic_text", "graphic_credits", "definition", "keywords"]);
            // Debug
            error_log("updateNodes: node label - {$node['label']}", 0);
            $nodeId = null;
            if (isset($node['id'])) {
                $nodeId = $node['id'];
            }
            if ($nodeId != null) {
                // Check for the corresponding old node is
                $oldIndex = searchNodeListById($oldNodes, $nodeId);
                if ($oldIndex === -1) {
                    error_log("updateNodes: Unmatched nodeId - $nodeId", 0);
                }
                else {
                    updateNode($flowModelId, $pageHierarchicalId, $node, $oldNodes[$oldIndex], $nodeId);
                    $oldMatches[$oldIndex] = true;
                }
            }
            else {
                // Search for matching node_num and title
                $label = $node['label'];
                $nodeNum = $node['node_num'];
                $oldIndex = searchNodeListByNumAndLabel($oldNodes, $nodeNum, $label);
                if ($oldIndex === -1) {
                    addNode($node, $pageId);
                }
                else {
                    $oldNodeId = $oldNodes[$oldIndex]['id'];
                    updateNode($flowModelId, $pageHierarchicalId, $node, $oldNodes[$oldIndex], $oldNodeId);
                    $oldMatches[$oldIndex] = true;
                }
            }
        }

        // Delete unmatched old nodes
        for ($index = 0; $index < count($oldMatches); $index++) {
            if (!$oldMatches[$index]) {
                $oldNode = $oldNodes[$index];
                $oldNodeId = $oldNode['id'];
                $flowModelId = $oldPageData['flow_model_id'];
                deleteNodeAndChildPages($oldNodeId, $flowModelId, $pageHierarchicalId);
            }
        }
    }

    function searchNodeListById($nodes, $id) {
        $index = -1;
        $count = 0;
        foreach($nodes as $node) {
            if ($node['id'] === $id) {
                $index = $count;
                break;
            }
            ++$count;
        }
        return $index;
    } 

    function searchNodeListByNumAndLabel($nodes, $nodeNum, $label) {
        $index = -1;
        $count = 0;
        foreach($nodes as $node) {
            if (htmlspecialchars($node['label'], ENT_QUOTE, "UTF-8", false) === $label && $node['node_num'] === $nodeNum) {
                $index = $count;
                break;
            }
            ++$count;
        }
        return $index;
    }

    function updateNode($flowModelId, $pageHierarchicalId, $node, $oldNode, $nodeId) {
        if (!$node['has_child_page'] && $oldNode['has_child_page']) {
            // If the new page is not marked for a child page, but the old one was
            // then delete the child pages
            $deletionHierarchicalId = $pageHierarchicalId . $oldNode['node_num'];
            deletePage($flowModelId, $deletionHierarchicalId, $oldNode['page_id']);
        }
        // Check whether the node id is present in the node data
        if (isset($nodeId)) {
            // Identify the fields that are different and update
            $table = "node";
            $fieldNames = ['node_num', 'x', 'y', 'label', 'graphic_file', 'graphic_text', 'graphic_credits', 
                'type', 'definition', 'keywords', 'hyperlink', 'has_child_page'];
            $destFieldNames = ['node_num', 'x_coord', 'y_coord', 'label', 'graphic_file', 'graphic_text', 
                'graphic_credits', 'type', 'definition', 'keywords', 'hyperlink', 'has_child_page'];
            $fieldValues = $node;
            $oldFieldValues = $oldNode;
            $types = "siissssssssi";
            updateFields($table, $nodeId, $fieldValues, $oldFieldValues, $fieldNames, $destFieldNames, $types);
        }
    }


    function updateFlows($pageData, $oldPageData) {

        $pageId = $oldPageData['id'];
        $flows = $pageData['flows'];
        $oldFlows = $oldPageData['flows'];

        // Set-up a check list for old flows matched (to use for deletions)
        $oldMatch = [];
        for ($i = 0; $i < count($oldFlows); $i++) {
            array_push($oldMatch, false);
        }

        foreach($flows as $flow) {
            // Adjust html of the flow
            adjustFieldHtml($flow, ["label", "keywords", "definition", "hyperlink"]);
            // Debug
            error_log("updateFlows: flow label: {$flow['label']}", 0);
            // Search for a corresponding entry in old flows
            $flowId = null;
            $flowNum = $flow['flow_num'];
            $label = $flow['label'];
            if (isset($flow['id'])) {
                $flowId = $flow['id'];
            }
            $oldFlowData = findOldFlowMatch($oldFlows, $flowNum, $label, $flowId);
            if ($oldFlowData != null) {
                // Match found so do update
                // Check for void source/destination
                $oldFlow = $oldFlowData['oldFlow'];
                $flow['source_void'] = $flow['source_node_num'] === "" ? 1 : 0;
                $flow['destination_void'] = $flow['destination_node_num'] === "" ? 1 : 0;
                $oldFlow['source_void'] = $oldFlow['source_node_num'] === "" ? 1 : 0;
                $oldFlow['destination_void'] = $oldFlow['destination_node_num'] === "" ? 1 : 0;

                $oldMatch[$oldFlowData['index']] = true;
                $table = "flow";
                $id = $oldFlow['id'];
                $fieldNames = ['flow_num', 'label', 'drawing_group_x', 'drawing_group_y', 
                    'label_x', 'label_y', 'label_width', 'definition', 'keywords', 
                    'hyperlink', 'source_node_num', 'source_void', 
                    'destination_node_num', 'destination_void'];
                $destFieldNames = [];
                $types = "ssiiiiissssisi";
                updateFields($table, $id, $flow, $oldFlow, $fieldNames, $destFieldNames, $types);
                // Replace the arrow points and line points coordinates
                replaceFlowArrowPoints($id, $flow['arrow_points']);
                replaceFlowPoints($id, $flow['points']);
                // Update the conversion formulas
                updateConversionFormulas($id, $flow['conversion_formulas'], $oldFlow['conversion_formulas']);
            }
            else {
                // Add the flow
                // Debug 
                error_log("Adding flow: {$flow['flow_num']}", 0);
                addFlow($flow, $pageId);
            }
        }
        // Delete unmatched old flows
        for ($i = 0; $i < count($oldMatch); $i++) {
            if (!$oldMatch[$i]) {
                $oldFlowId = $oldFlows[$i]['id'];
                // Debug
                error_log("Deleting Flow: {$flow['flow_num']}", 0);
                deleteFlow($oldFlowId);
            }
        }
    }

    function updateConversionFormulas($flowId, $formulas, $oldFormulas) {
        global $dbConn;

        // Set-up the update checklist for the old formulas
        $oldMatches = [];
        for ($i = 0; $i < count($oldFormulas); $i++) {
            array_push($oldMatches, false);
        }

        for ($i = 0; $i < count($formulas); $i++) {
            $conversionFormula = $formulas[$i];
            // Adjust the html for the formula record
            adjustFieldHtml($conversionFormula, ['formula', 'description']);
            $formulaId = null;
            if (isset($conversionFormula['id'])) {
                $formulaId = $conversionFormula['id'];
            }
            if ($formulaId != null) {
                $oldIndex = findFormulaIdInSet($formulaId, $oldFormulas);
                if ($oldIndex === -1) {
                    error_log("updateConversionFormulas: Orphan formula id in data", 0);
                }
                else {
                    updateConversionFormula($formulaId, $conversionFormula);
                    $oldMatches[$oldIndex] = true;
                }
            }
            else {
                // Check old flows by flow_num
                $formula = $conversionFormula['formula'];
                $oldIndex = findFormulaInSet($formula, $oldFormulas);
                if ($oldIndex === -1) {
                    addConversionFormula($flowId, $conversionFormula);
                }
                else {
                    $formulaId = $oldFormulas[$oldIndex]['id'];
                    updateConversionFormula($formulaId, $conversionFormula);
                    $oldMatches[$oldIndex] = true;
                }
            }
        }

        if (count($oldMatches) > 0) {
            for ($i = 0; $i < count($oldMatches); $i++) {
                if (!$oldMatches[$i]) {
                    deleteConversionFormula($oldFormulas[$i]['id']);
                }
            }
        }

    }

    function findFormulaIdInSet($formulaId, $formulas) {
        $index = 0;
        $found = false;
        foreach($formulas as $formula) {
            if ($formula['id'] === $formulaId) {
                $found = true;
                break;
            }
            ++$index;
        }
        if (!$found) {
            return -1;
        }
        else {
            return $index;
        }
    }

    function findFormulaInSet($formula, $formulas) {
        $index = 0;
        $found = false;
        foreach($formulas as $oldFormula) {
            if ($oldFormula['id'] === $formula) {
                $found = true;
                break;
            }
            ++$index;
        }
        if (!$found) {
            return -1;
        }
        else {
            return $index;
        }
    }

    function updateConversionFormula($formulaId, $conversionFormula) {
        global $dbConn;

        $sql = "SELECT * FROM conversion_formula WHERE id = $formulaId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("updateConversionFormula: select failed - " . $dbConn->error, 0);
        }
        else {
            if ($result->num_rows != 1) {
                error_log("updateConversionFormula: missing record or extra records id - $formulaId - {$dbConn->error}", 0);
            }
            else {
                $row = $result->fetch_assoc();
                $oldConversionFormula = [];
                $oldConversionFormula['formula'] = $row['formula'];
                $oldConversionFormula['description'] = $row['description'];
                $table = "conversion_formula";
                $fieldNames = ["formula", "description"];
                $destFieldNames = [];
                $types = "ss";
                updateFields($table, $formulaId, $conversionFormula, $oldConversionFormula, $fieldNames, $destFieldNames, $types);
            }
        }
    }

    function replaceFlowArrowPoints($flowId, $flowArrowPoints) {
        global $dbConn;
        $sql = "DELETE FROM flow_arrow_point WHERE flow_id = $flowId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("replaceFlowArrowPoints: delete query failed - {$dbConn->error}", 0);
        }
        else {
            // Add the new points
            addArrowPoints($flowId, $flowArrowPoints);
        }
    }

    function replaceFlowPoints($flowId, $flowPoints) {
        global $dbConn;
        $sql = "DELETE FROM flow_point WHERE flow_id = $flowId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("replaceFlowPoints: delete query failed - {$dbConn->error}", 0);
        }
        else {
            // Add the new points
            addFlowPoints($flowId, $flowPoints);
        }
    }

    /**
    * The labels of flows may be repeated several times (ie: not unique)
    * So if the id of the flow is absent, we can only identify a label
    * as unique from the flow_num and the label taken together,
    * Otherwise we use the id to ensure that we have a match.
    * return ['oldFlow'=>$oldFlow, 'index'=>$index] or null.
    */
    function findOldFlowMatch($oldFlows, $flowNum, $label, $id) {
        $found = false;
        $index = 0;
        foreach($oldFlows as $oldFlow) {
            if ($id != null) {
                if ($id === $oldFlow['id']) {
                    $found = true;
                    break;
                }
            }
            else {
                if ($oldFlow['flow_num'] === $flowNum && $oldFlow['label'] === $label) {
                    $found = true;
                    break;
                }
            }
            ++$index;
        }
        if (!$found) {
            return null;
        }
        return ['oldFlow'=>$oldFlow, 'index'=>$index];
    }

    function adjustFieldHtml(&$record, $fieldNames) {
        foreach ($fieldNames as $field) {
            $record[$field] = htmlspecialchars($record[$field], ENT_QUOTES, 'UTF-8', false);
        }
    }

    /**
     * Update the given table, coomparing and using the fieldNames attached to
     * the given fieldRefs of the types given in $types.
     */
    function updateFields($table, $id, $fieldsRef, $oldFieldsRef, $fieldNames, $destFieldNames, $types) {
        global $dbConn;
        $changeFields = "";
        $bindParam = "";
        $fieldValues = [];
        $count = 0;
        foreach ($fieldNames as $fieldName) {
            if ($fieldsRef[$fieldName] != $oldFieldsRef[$fieldName]) {
                if ($count > 0) {
                    if ($changeFields != "") $changeFields .= ", ";
                }
                if (count($destFieldNames) != 0) {
                    $changeFields .= $destFieldNames[$count] . " = ?";
                }
                else {
                    $changeFields .= $fieldName . " = ?";
                }
                $bindParam .= $types[$count];
                array_push($fieldValues, $fieldsRef[$fieldName]);
            }
            ++$count;
        }
        if ($changeFields != "") {
            $sql = "UPDATE $table SET " . $changeFields . " WHERE id = $id";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("updateFields: table - $table - could not prepare: {$dbConn->error}", 0);
            }
            else {
                $stmt->bind_param($bindParam, ...$fieldValues);
                if (!$stmt->execute()) {
                    error_log("updateFields: could not update record: {$dbConn->error}", 0);
                }
            }
        }
    }
