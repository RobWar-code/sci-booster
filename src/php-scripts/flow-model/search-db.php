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