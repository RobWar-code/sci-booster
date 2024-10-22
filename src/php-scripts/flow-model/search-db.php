<?php
    include_once __DIR__ . '/../db-connect.php';
    include_once __DIR__ . "/misc-funcs.php";
    include_once __DIR__ . "/../lib/makeWordArray.php";
    include_once __DIR__ . "/../lib/matchWordLists.php";

    function findFlowModel($title) {
        global $dbConn;

        $title = htmlspecialchars($title);
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

        $author = htmlspecialchars($author);
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

        $title = htmlspecialchars($title);

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

    function findModelPageById($pageId) {
        global $dbConn;

        $pageRef = null;
        $sql = "SELECT flow_model_id FROM page WHERE id = $pageId";
        $result = $dbConn->query($sql);
        if (!$result) {
            error_log("findModelPageById: Problem searching for page - $pageId - {$dbConn->error}", 0);
        }
        else {
            if ($result->num_rows === 0) {
                error_log("findModelPageById: No match for page - $pageId");
            }
            else {
                $row = $result->fetch_assoc();
                $pageRef = ["page_id"=>$pageId, "flow_model_id"=>$row['flow_model_id']];
            }
        }
        return $pageRef;
    }

    function findModelPageByHierarchicalId($hierarchicalId, $flowModelId, $flowModelTitle) {
        global $dbConn;

        $flowModelTitle = htmlspecialchars($flowModelTitle);
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
        return ['page_id'=>$pageId, 'flow_model_id'=>$flowModelId];
    }

    function generalSearch($searchText) {
        $scoreList = [];
        // Divide the search text into a word array
        $w = makeWordArray(strtolower($searchText), "\\\'\\\-");
        // Set-up the list of places to search
        $fieldList = [
            ["table"=>"page", "pageIdField"=>"id", "field"=>"title", "points"=>5],
            ["table"=>"page", "pageIdField"=>"id", "field"=>"keywords", "points"=>4],
            ["table"=>"node", "pageIdField"=>"page_id", "field"=>"label", "points"=>3],
            ["table"=>"node", "pageIdField"=>"page_id", "field"=>"keywords", "points"=>2],
            ["table"=>"flow", "pageIdField"=>"page_id", "field"=>"label", "points"=>3],
            ["table"=>"flow", "pageIdField"=>"page_id", "field"=>"keywords", "points"=>2]
        ];
        matchFields($w, $fieldList, $scoreList);
        $result = [
            'result'=>true,
            'list'=>$scoreList 
        ];
        return $result;
    }

    function matchFields($w, $fieldList, &$scoreList) {
        global $dbConn;

        $includeChars="\\\'\\\-";
        $maxScore = 0;
        $minScore = 0;
        $maxMatches = 20;
        foreach ($fieldList as $fieldItem) {
            $sql = "SELECT {$fieldItem['pageIdField']}, {$fieldItem['field']} FROM {$fieldItem['table']}";
            $result = $dbConn->query($sql);
            if (!$result) {
                error_log("matchFields: problem with search access - {$dbConn->error}");
            }
            else {
                if ($result->num_rows === 0) {
                    error_log("matchFields: empty table - {$fieldItem['table']}");
                }
                else {
                    while ($row = $result->fetch_assoc()) {
                        $fw = makeWordArray(strtolower($row[$fieldItem['field']]), $includeChars);
                        $baseScore = $fieldItem['points'];
                        $score = matchWordLists(htmlspecialchars($w), $fw, $baseScore);
                        if ($score > 0) {
                            insertMatchScore($score, $fieldItem, $row, $scoreList);
                        }
                    }
                }
            }
        }
    }

    function insertMatchScore($score, $fieldItem, $matchRow, &$scoreList) {
        global $dbConn;
        $maxScores = 20;
        $position = matchScore($score, $scoreList, $maxScores);
        if ($position > -1) {
            // Prepare the entry to be inserted
            // Find the page title if appropriate
            $pageTitle = "";
            if ($fieldItem['table'] === 'page') {
                $pageTitle = $matchRow['title'];
            }
            else {
                $sql = "SELECT title FROM page WHERE id = {$matchRow['page_id']}";
                $result = $dbConn->query($sql);
                if (!$result) {
                    error_log("insertMatchScore: Problem with search for page - {$dbConn->error}");
                }
                elseif ($result->num_rows === 0) {
                    error_log("insertMatchScore: Could not match page {$matchRow['page_id']}");
                }
                else {
                    $row = $result->fetch_assoc();
                    $pageTitle = $row['title'];
                }
            }

            if ($pageTitle != "") {
                $scoreItem = [
                    'page_id'=>$matchRow[$fieldItem['pageIdField']],
                    'page'=>$pageTitle,
                    'field'=>"{$fieldItem['table']} {$fieldItem['field']}",
                    'field_value'=>$matchRow[$fieldItem['field']],
                    'points'=>$score 
                ];

                // Insert the score item into the list
                if ($position >= count($scoreList)) {
                    array_push($scoreList, $scoreItem);
                }
                else {
                    for ($i = $count($scoreList) - 1; $i <= $position; $i--) {
                        if ($i < $maxScores - 1) {
                            if ($i >= $count($scoreList) - 1) {
                                array_push($scoreList, $scoreList[$i]);
                            }
                            else {
                                $scoreList[$i + 1] = $scoreList[$i];
                            }
                        }
                    }
                    $scoreList[$position] = $scoreItem;
                }
            }
        }
    }

    function matchScore($score, $scoreList, $maxScores) {
        $position = -1;
        if (count($scoreList) > 0) {
            if ($score > $scoreList[0]['points']) {
                $position = 0;
            }
            elseif ($score < $scoreList[count($scoreList) - 1]['points']) {
                if (count($scoreList) < $maxScores) {
                    $position = count($scoreList);
                }
            }
            else {
                for ($i = 0; $i < count($scoreList); $i++) {
                    if ($score > $scoreList[$i]['points']) {
                        $position = $i;
                        break;
                    }
                }
                if ($position === -1 && count($scoreList) < $maxScores) {
                    $position = count($scoreList);
                }
            }
        }
        else {
            $position = 0;
        }
        return $position;
    }
