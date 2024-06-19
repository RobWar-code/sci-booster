<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . '/extract-page.php';
    include_once __DIR__ . '/../lib/keyedSort.php';

    function updatePage($flowModelData) {
        $flowModelId = $flowModelData['flow_model_id'];
        $pageId = $flowModelData['page']['id'];
        $oldFlowModelData = extractPage($flowModelId, $pageId);
        $oldPageData = $oldFlowModelData['page'];
        $pageData = $flowModelData['page'];

        updatePageDetails($pageData, $oldPageData);
        updateAuthors($pageData, $oldPageData);

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

    function updateAuthors($pageData, $oldPageData) {
        global $dbConn;

        $pageId = $pageData['id'];
        $key = "";
        $useSimilar = true;
        $arrayDiffs = compareArrays($pageData, $oldPageData, $key, $useSimilar);
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
                    $changeFields += ", ";
                }
                if (count($destFieldNames) != 0) {
                    $changeFields += $destFieldNames[$count] . " = ?";
                }
                else {
                    $changeFields += $fieldName . " = ?";
                }
                $bindParam += $types[$count];
                array_push($fieldValues, $fieldName);
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

