<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . '/add-page.php';
    include_once __DIR__ . '/extract-page.php';
    include_once __DIR__ . '/search-db.php';
    include_once __DIR__ . '/../lib/compareArrays.php';
    include_once __DIR__ . '/misc-funcs.php';

    function updatePage($flowModelData) {
        $flowModelId = $flowModelData['flow_model_id'];
        $pageId = $flowModelData['page']['id'];
        $oldFlowModelData = extractPage($flowModelId, $pageId);
        $oldPageData = $oldFlowModelData['page'];
        $pageData = $flowModelData['page'];

        updatePageDetails($pageData, $oldPageData);
        updatePageAuthors($pageData, $oldPageData);
        updatePageReferences($pageData, $oldPageData);
        updateNodes($pageData, $oldPageData);
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

    function updatePageAuthors($pageData, $oldPageData) {

        $pageId = $pageData['id'];

        // Separate the usernames from the external authors
        $authorList = $pageData['authors'];
        $oldAuthorList = $oldPageData['authors'];
        $lists1 = separateUsers($authorList);
        $usernames = $lists1['users'];
        $externalAuthors = $lists1['externalAuthors'];
        $lists2 = separateUsers($oldAuthorList);
        $oldUsernames = $lists2['users'];
        $oldExternalAuthors = $lists2['externalAuthors'];

        // Process the usernames
        if (count($usernames) > 0 || count($oldUsernames) > 0) {
            updateUserAuthors($pageId, $usernames, $oldUsernames);
        }

        if (count($externalAuthors) > 0 || count($oldUsernames) > 0) {
            updateExternalAuthors($pageId, $externalAuthors, $oldExternalAuthors);
        }        
    }

    function updateExternalAuthors($pageId, $authors, $oldAuthors) {
        global $dbConn;

        $key = "";
        $useSimilar = true;
        $arrayDiffs = compareArrays($authors, $oldAuthors, $key, $useSimilar);

        // Check for updates (ie: minor spelling corrections)
        $same = $arrayDiffs['same'];
        if (count($same) > 0) {
            for ($i = 0; $i < count($same); $i += 2) {
                $index = $same[$i];
                $oldIndex = $same[$i + 1];
                if ($authors[$index] != $oldAuthors[$oldIndex]) {
                    $author = $authors[$index];
                    $oldName = $oldAuthors[$oldIndex];
                    $authorId = NULL;
                    updateExternalAuthor($author, $oldName, $authorId);
                }
            }
        }
        $aOnly = $arrayDiffs['aOnly'];
        if (count($aOnly) > 0) {
            // Do inserts
            foreach($aOnly as $index) {
                $author = $authors[$index];
                addPageAuthor($author, $pageId);
            }
        }
        $bOnly = $arrayDiffs['bOnly'];
        if (count($bOnly) > 0) {
            // Delete the page author links
            foreach($bOnly as $index) {
                $author = $oldAuthors[$index];
                deleteAuthorPageLink($author, $pageId);
            }
        }
    }

    function updateUserAuthors($pageId, $usernames, $oldUsernames) {
        global $dbConn;

        // Compare the two lists
        $key = "";
        $useSimilar = false;
        $arrayDiffs = compareArrays($usernames, $oldUsernames, $key, $useSimilar);
        $newNamesOnly = $arrayDiffs['aOnly'];
        $oldNamesOnly = $arrayDiffs['bOnly'];
        if (count($newNamesOnly) > 0) {
            // Add the user page links
            foreach ($newNamesOnly as $index) {
                $username = $usernames[$index];
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
                $username = $oldUsernames[$index];
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

    function separateUsers($authorList) {
        global $dbConn;

        $users = [];
        $externalAuthors = [];
        foreach ($authorList as $item) {
            $sql = "SELECT * FROM user WHERE username = '$item'";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("separateUsers: select user failed - " . $dbConn->error, 0);
            }
            elseif ($result->num_rows === 1) {
                array_push($users, $item);
            }
            elseif ($result->num_rows === 0) {
                array_push($externalAuthors, $item);
            }
        }
        return ['users'=>$users, 'externalAuthors'=>$externalAuthors];
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

    function updateExternalAuthor($author, $oldAuthor, $authorId) {
        global $dbConn;

        if ($authorId === NULL) {
            // The author given is not a user, so update the author name
            $externalAuthorId = NULL;
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
                $reference = $references[$index];
                $oldIndex = $same[$i + 1];
                $oldReference = $oldReferences[$oldIndex];
                if ($reference['author'] != $oldReference['author']) {
                    // Modify the author spelling
                    // Get the Author id from the reference
                    $referenceId = $oldReference['id'];
                    $sql = "SELECT external_author_id FROM reference WHERE id = $referenceId";
                    $result = $dbConn->query($sql);
                    if (!$result) {
                        echo "updatePageReferences: could not obtain author id - " . $dbConn->error, 0;
                    }
                    else {
                        $row = $result->fetch_assoc();
                        $authorId = $row['external_author_id'];
                        // Update the author spelling
                        $author = $reference['author'];
                        $oldAuthor = $oldReference['author'];
                        updateExternalAuthor($author, $oldAuthor, $authorId);
                    }
                }
                // Check the other fields
                $table = 'reference';
                $id = $oldReference['id'];
                $fieldNames = ['source', 'title'];
                $destFieldNames = [];
                $types = "ss";
                updateFields($table, $id, $reference, $oldReference, $fieldNames, $destFieldNames, $types);
            }
        }
        $aOnly = $arrayDiffs['aOnly'];
        if (count($aOnly) > 0) {
            // Do reference additions
            foreach ($aOnly as $index) {
                $reference = $references[$index];
                addPageReference($pageId, $reference);
            }
        }
        $bOnly = $arrayDiffs['bOnly'];
        if (count($bOnly) > 0) {
            // Do reference deletions
            foreach ($bOnly as $index) {
                $referenceId = $oldReferences[$index]['id'];
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

    function updateNodes($pageData, $oldPageData) {

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
                error_log("updateFields: could not prepare: " . $dbConn->error, 0);
            }
            else {
                $stmt->bind_param($bindParam, ...$fieldValues);
                if (!$stmt->execute()) {
                    error_log("updateFields: could not update record: " . $dbConn->error, 0);
                }
            }
        }

    }

