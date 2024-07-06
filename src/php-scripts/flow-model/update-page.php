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

    function updatePageDetails($pageData, $oldPageData) {
        $table = "page";
        $id = $pageData['id'];
        $fieldsRef = $pageData;
        $oldFieldsRef = $oldPageData;
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
                // Debug 
                $author = $authors[$index]['author'];
                echo "<br>updatePageExternalAuthors - $author<br>";
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
                        $author = $authors[$index]['author'];
                        $oldAuthor = $oldAuthors[$oldIndex]['author'];
                        updateExternalAuthor($author, $oldAuthor, $authorId);
                    }
                }
                else {
                    $author = $authors[$index];
                    addPageExternalAuthor($author, $pageId);
                }
            }
        }
        if (count($bOnly) > 0) {
            // Delete the page author links
            foreach($bOnly as $index) {
                $author = $oldAuthors[$index]['author'];
                deleteAuthorPageLink($author, $pageId);
            }
        }
    }

    function deleteKeyedRefValue($refArray, $array, $key, $value) {
        $newArray = [];
        foreach($refArray as $index) {
            $record = $array[$index];
            if (!array_key_exists($record, $key)) {
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
        // Debug
        echo "<br>updateUserAuthors: " . count($arrayDiffs['aOnly']) . " " . count($arrayDiffs['bOnly']) . "<br>";
        $oldNamesOnly = $arrayDiffs['bOnly'];
        if (count($newNamesOnly) > 0) {
            // Add the user page links
            foreach ($newNamesOnly as $index) {
                $username = $authorList[$index]['username'];
                // Debug
                echo "<br>updateUserAuthors: $username<br>";
                // Get the user id
                $sql = "SELECT id FROM user WHERE username = '$username'";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("updateUserAuthors: could not get id for user - " . $username . " " . $dbConn->error, 0);
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
                    error_log("updateUserAuthors: could not get id for old user - " . $username . " " . $dbConn->error, 0);
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

        if ($authorId === NULL) {
            // The author given is not a user, so update the author name
            $result = findExternalAuthor($oldAuthor, $authorId);
            if ($result === FALSE) {
                error_log("updateAuthors: Problem doing external author search - " . $oldAuthor, 0);
            }
            elseif ($result->num_rows > 1) {
                error_log("updateAuthors: Duplicate matches for name - " . $oldAuthor, 0);
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
                error_log("updateExternalAuthor: could not update author preparing sql" . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param("ssi", $firstName, $lastName, $authorId);
                if (!$stmt->execute()) {
                    error_log("updateExternalAuthor: could not update external author record - " . 
                        $lastName . " " . $dbConn->error, 0);
                }
            }
        }
    }

    function updatePageReferences($pageData, $oldPageData) {
        global $dbConn;

        // Look for differences between the two lists
        $pageId = $pageData["id"];
        $references = $pageData['references'];
        $oldReferences = $oldPageData['references'];
        $key = 'title';
        $useSimilar = true;
        $arrayDiffs = compareArrays($references, $oldReferences, $key, $useSimilar);
        $same = $arrayDiffs['same'];
        if (count($same) > 0) {
            for($i = 0; $i < count($same); $i += 2) {
                $index = $same[$i];
                $oldIndex = $same[$i + 1];
                $reference = $references[$index];
                $oldReference = $oldReferences[$oldIndex];
                $oldReferenceId = $oldReferences[$oldIndex]['id'];
                $externalAuthorId = checkAndUpdateReferenceAuthor($reference, $oldReferences);
                // Check the other fields
                $table = 'reference';
                $reference['author'] = $externalAuthorId;
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
                $reference = $references[$index];
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
        $author = $reference['author']['author'];
        $externalAuthorId = $reference['author']['id'];
        // Find the old author
        $found = false;
        $index = 0;
        foreach($oldReferences as $oldReference) {
            if ($oldReference['author']['id'] === $externalAuthorId) {
                $found = true;
                break;
            }
            ++$index;
        }
        if ($found) {
            $oldAuthor = $oldReference['author']['author'];
            if ($author != $oldAuthor) {
                // Modify the author spelling
                // Update the author spelling
                updateExternalAuthor($author, $oldAuthor, $externalAuthorId);
            }            
        }
        return $externalAuthorId;
    }

    function updateNodes($pageData, $oldPageData) {
        // compare the old and new node lists by label
        $pageId = $oldPageData['id'];
        $nodes = $pageData['nodes'];
        $oldNodes = $oldPageData['nodes'];
        $useSimilar = false;
        $arrayDiffs = compareArrays($nodes, $oldNodes, 'label', $useSimilar);
        $same = $arrayDiffs['same'];
        $aOnly = $arrayDiffs['aOnly'];
        $bOnly = $arrayDiffs['bOnly'];
        if (count($same) > 0) {
            for ($i = 0; $i < count($same); $i += 2) {
                $index = $same[$i];
                $oldIndex = $same[$i + 1];
                $node = $nodes[$index];
                $oldNode = $oldNodes[$oldIndex];
                if (isset($node['id'])) {
                    $nodeId = $node['id'];
                    $oldNodeId = $oldNode['id'];
                    if ($nodeId != $oldNodeId) {
                        $label = $node['label'];
                        error_log("UpdateNodes: mismatched id with title the same $label", 0);
                        $invalid = true;
                    }
                    else {
                        updateNode($node, $oldNode, $nodeId);
                    }
                }
                else {
                    $nodeId = $oldNode['id'];
                    updateNode($node, $oldNode, $nodeId);
                }
            }
        }
        if (count($aOnly) > 0) {
            foreach ($aOnly as $index) {
                $node = $nodes[$index];
                // Check whether a matched id exists
                if (isset($node['id'])) {
                    // Search for corresponding
                    $nodeId = $node['id'];
                    $found = false;
                    foreach ($oldNodes as $oldNode) {
                        if ($oldNode['id'] === $nodeId) {
                            $found = true;
                            break;
                        }
                    }
                    if ($found) {
                        updateNode($node, $oldNode, $nodeId);
                    }
                    else {
                        // The labels are not matched and neither are the id's
                        $label = $node['label'];
                        error_log("updateNodes: - potential new entry already has id - $label");
                        $invalid = true;
                    }
                }
                else {
                    // Assume New Node
                    addNode($node, $pageId);
                }
            }
        }
        if (count($bOnly) > 0) {
            foreach ($bOnly as $index) {
                $oldNode = $oldNodes[$index];
                $oldNodeId = $oldNode['id'];
                $flowModelId = $oldPageData['flow_model_id'];
                $pageHierarchicalId = $oldPageData['hierarchical_id'];
                deleteNodeAndChildPages($oldNodeId, $flowModelId, $pageHierarchicalId);
            }
        }
    }

    function updateNode($node, $oldNode, $nodeId) {
        // Check whether the node id is present in the node data
        if (isset($nodeId)) {
            // Identify the fields that are different and update
            $table = "node";
            $fieldNames = ['node_num', 'x', 'y', 'label', 'type', 'definition', 
                'keywords', 'hyperlink', 'has_child_page'];
            $destFieldNames = ['node_num', 'coord_x', 'coord_y', 'label', 
                'type', 'definition', 'keywords', 'hyperlink', 'has_child_page'];
            $fieldValues = $node;
            $oldFieldValues = $oldNode;
            $types = "siisssssi";
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
            // Search for a corresponding entry in old flows
            $flowId = null;
            $flowNum = $flow['flow_num'];
            $label = $flow['label'];
            if (isset($flow['$id'])) {
                $flowId = $flow['id'];
            }
            $oldFlowData = findOldFlowMatch($oldFlows, $flowNum, $label, $flowId);
            if ($oldFlowData != null) {
                // Match found so do update
                // Check for void source/destination
                if ($flow['source_node_num'] === "") {
                    $flow['source_void'] = 1;
                }
                else {
                    $flow['source_void'] = 0;
                }
                if ($flow['destination_node_num'] === "") {
                    $flow['destination_void'] = 1;
                }
                else {
                    $flow['destination_void'] = 0;
                }

                $oldFlow = $oldFlowData['oldFlow'];
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
        }
    }

    function updateConversionFormulas($flowId, $formulas, $oldFormulas) {
        global $dbConn;

        $key = "formula";
        $useSimilar = false;
        $arrayDiffs = compareArrays($formulas, $oldFormulas, $key, $useSimilar);
        $same = $arrayDiffs['same'];
        $aOnly = $arrayDiffs['aOnly'];
        $bOnly = $arrayDiffs['bOnly'];
        if (count($same) > 0) {
            for ($i = 0; $i < count($same); $i += 2) {
                $conversionFormula = $formulas[$same[$i]];
                $oldConversionFormula = $oldFormulas[$same[$i + 1]];
                $idSet = false;
                $formulaId = null;
                if (isset($conversionFormula['id'])) {
                    $idSet = true;
                    $formulaId = $conversionFormula['id'];
                }
                // new id not set - update
                // id set - matches old - update
                // id set - does not match old - data error
            }
        }
    }

    function replaceFlowArrowPoints($flowId, $flowArrowPoints) {
        global $dbConn;
        $sql = "DELETE FROM flow_arrow_point WHERE flow_id = $flowId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("replaceFlowArrowPoints: delete query failed - " . $dbConn->error, 0);
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
            error_log('replaceFlowPoints: delete query failed - ' . $dbConn->error, 0);
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
                error_log("updateFields: table - $table - could not prepare: " . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param($bindParam, ...$fieldValues);
                if (!$stmt->execute()) {
                    error_log("updateFields: could not update record: " . $dbConn->error, 0);
                }
            }
        }
    }
