<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . "/misc-funcs.php";
    include_once __DIR__ . "/../lib/makeWordArray.php";
    include_once __DIR__ . "/../lib/matchWordLists.php";

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
                return null;
            }
            else {
                if ($result->num_rows === 1) {
                    $row = $result->fetch_assoc();
                    $pageId = $row['id'];
                }
                else {
                    error_log("findModelPageByTitle: duplicate or missing entry - {$flowModelId} - {$result->num_rows}", 0);
                    return null;
                }
            }
        }
        return ['page_id'=>$pageId, 'flow_model_id'=>$flowModelId];
    }

    function findModelPageByHierarchicalId($hierarchicalId, $flowModelId, $flowModelTitle) {
        global $dbConn;

        $pageId = null;
        if ($flowModelId === null) {
            // Search for the title
            $sql = "SELECT id FROM flow_model WHERE title = ?";
            $stmt = $dbConn->prepare($sql);
            if ($stmt === FALSE) {
                error_log("findModelPageByHierarchicalId: problem with sql {$dbConn->error}", 0);
            }
            $stmt->bind_param("s", $flowModelTitle);
            if (!$stmt->execute()) {
                error_log("findModelPageByHierarchicalId: problem with db execution {$dbConn->error}", 0);
            }
            else {
                $stmt->store_result();
                $stmt->bind_result($flowModelId);
                if ($stmt->num_rows != 1) {
                    error_log("findModelPageByHierarchicalId: Problem with matches for $flowModelTitle", 0);
                }
                else {
                    $stmt->fetch();
                }
            }
        }
        if ($flowModelId != null) {
            $sql = "SELECT id FROM page WHERE hierarchical_id = '$hierarchicalId' AND flow_model_id = $flowModelId";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("findModelPageByHierarchicalId: Problem with search for page $hierarchicalId - {$dbConn->error}", 0);
            }
            elseif ($result->num_rows > 1) {
                error_log("findModelPageByHierarchicalId: Problem with number of matches $hierarchicalId - {$result->num_rows}", 0);
            }
            elseif ($result->num_rows === 1) {
                $row = $result->fetch_assoc();
                $pageId = $row['id'];
            }
        }
        return $pageId;
    }

    function generalSearch($searchText) {
        $scoreList = [];
        // Divide the search text into a word array
        $w = makeWordArray($searchText, "\'\-");
        // Set-up the list of places to search
        $fieldList = [
            ["table"=>"page", "field"=>"title", "points"=>5],
            ["table"=>"page", "field"=>"keywords", "points"=>4],
            ["table"=>"node", "field"=>"label", "points"=>3],
            ["table"=>"node", "field"=>"keywords", "points"=>2],
            ["table"=>"flow", "field"=>"label", "points"=>3],
            ["table"=>"flow", "field"=>"keywords", "points"=>2]
        ];
        matchFields($w, $fieldList, $scoreList);
    }

    function matchFields($w, $fieldList, $scorelist) {
        global $dbConn;

        $includeChars="\'\-";
        $maxScore = 0;
        $minScore = 0;
        $maxMatches = 20;
        foreach ($fieldList as $fieldItem) {
            $sql = "SELECT {$fieldItem['field']} FROM {$fieldItem['table']}";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("matchFields: problem with search access - {$dbConn->error}");
            }
            else {
                if ($result->num_rows === 0) {
                    error_log("matchFields: empty table - {$fieldItem['$table']}");
                }
                else {
                    while ($row = $result->fetchAssoc()) {
                        $fw = makeWordArray($row[$fieldItem['field']], $includeChars);
                        $baseScore = $fieldItem['points'];
                        $score = matchWordLists($w, $fw, $baseScore);
                    }
                }
            }

        }
    }
