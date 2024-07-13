<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . "/misc-funcs.php";

    function findFlowModel($title) {
        global $dbConn;

        $flowModelId = null;
        $sql = "SELECT id FROM flow_model WHERE title = ?";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("findFlowModel: Problem with sql {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("s", $title);
            if (!$stmt->execute()) {
                error_log("findFlowModel: Search failed to execute {$dbConn->error}", 0);
            }
            else {
                $stmt->store_result();
                $stmt->bind_result($flowModelId);
                $stmt->fetch();
            }
        }
        return $flowModelId;
    }

    function findExternalAuthor($author, $authorId) {
        global $dbConn;

        if ($authorId != NULL) {
            // Search by authorId
            $sql = "SELECT * FROM external_author WHERE id = $authorId";
        }
        elseif($author != NULL) {
            // Split the name into first and last parts
            $nameParts = extractFirstAndLastNames($author);
            $firstName = $nameParts['firstName'];
            $lastName = $nameParts['lastName'];
            $sql = "SELECT * FROM external_author WHERE first_name = '$firstName' AND last_name = '$lastName'";
        }
        $result = $dbConn->query($sql);
        return $result;
    }

    function fetchModelTitlesList() {
        global $dbConn;

        $modelTitles = [];
        $sql = "SELECT title FROM flow_model";
        $result = $dbConn->query($sql);
        if ($result === FALSE) {
            error_log("fetchModelTitlesList: could not fetch list {$dbConn->error}", 0);
        }
        else {
            while ($row = $result->fetch_assoc()) {
                array_push($modelTitles, $row['title']);
            }
        }
        return $modelTitles;
    }

    function findModelPageByTitle($title) {
        global $dbConn;

        // Get the flow model id
        $pageId = null;
        $flowModelId = null;
        $sql = "SELECT id FROM flow_model WHERE title = ?";
        $stmt = $dbConn->prepare($sql);
        if ($stmt === FALSE) {
            error_log("findModelPageByTitle: Could not prepare flow_model search {$dbConn->error}", 0);
        }
        else {
            $stmt->bind_param("s", $title);
            if (!$stmt->execute()) {
                error_log("findModelPageByTitle: Could not execute flow_model search {$dbConn->error}", 0);
            }
            else {
                $stmt->store_result();
                $stmt->bind_result($flowModelId);
                $stmt->fetch();
            }
        }
        if ($flowModelId != null) {
            // Search for pageId
            $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '01'";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("findModelPageByTitle: Could not execute page search {$dbConn->error}", 0);
            }
            else {
                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $pageId = $row['id'];
                }
            }
        }
        return ['page_id'=>$pageId, 'flow_model_id'=>$flowModelId];
    }