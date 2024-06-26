<?php
include_once __DIR__  . "/../db-connect.php";
include_once __DIR__ . "/add-page.php";
include_once __DIR__ . "/update-page.php";
include_once __DIR__ . "/extract-page.php";
// Debug Script
include_once __DIR__ . "/../test/clear-tables.php";

// Collect the JSON data
// header('Content-Type: application/json');

// $inputData = json_decode(file_get_contents('php://input'), true);

// Debug Script
$inputData = json_decode(file_get_contents(__DIR__ . '/../test/test-model1.json'), true);
clearTables();

handlePageData($inputData);

// Debug Script
$inputData = json_decode(file_get_contents(__DIR__ . "/../test/test-model2.json"), true);
echo "<br>";
echo "Update record: " . $inputData['flow_model_title'] . "<br>";
if ($inputData) {
    $inputData = testSetIds($inputData);
    exit();
    if ($inputData) {
        handlePageData($inputData);
    }
}

function handlePageData($inputData) {
// Check whether this is a model that does not already exist
    if ($inputData['flow_model_id'] === NULL) {
        $flowModelId = addFlowModel($inputData['page']['title']);

        if ($flowModelId != NULL) {
            $pageId = addPage($flowModelId, $inputData);
            /*
            $report = [];
            $report['result'] = false;
            $report['page_id'] = $pageId;
            $report['flow_model_id'] = $flowModelId;
            echo json_encode($report);
            exit(0);
            */
        }

        if ($flowModelId != NULL && $pageId != NULL) {
            $pageData = extractPage($flowModelId, $pageId);
            $pageData['result'] = true;
            echo json_encode($pageData);
        }
        else {
            $report = [];
            $report['result'] = false;
            $report['error'] = "Problems saving the page data";
            echo json_encode($report);
        }
    }
    else {
        $flowModelId = $inputData['flow_model_id'];
        $pageId = $inputData['page']['id'];
        if ($pageId != NULL) {
            updatePage($inputData);
            $pageData = extractPage($flowModelId, $pageId);
            $pageData['result'] = true;
            echo json_encode($pageData);
        }
    }
}

function addFlowModel($title) {
    global $dbConn;

    $flowModelId = NULL;

    $sql="INSERT INTO flow_model (title) VALUES (?)";

    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        error_log("addFlowModel: problem with $stmt prepare" . $dbConn->error, 0);
        return FALSE;
    }

    $stmt->bind_param('s', $title);
    if (!$stmt->execute()) {
        error_log("addFlowModel: could not add flow model" . $dbConn->error, 0);
    }
    else {
        // Get the id
        $sql = "SELECT * FROM flow_model WHERE title = '$title'";
        $result = $dbConn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            $flowModelId = $row['id'];
        }
    }

    return $flowModelId;
}

function testSetIds($inputData) {
    $flowModelId = NULL;
    $pageId = NULL;

    $inputData = testGetSetModelAndPageIds($inputData);
    $pageData = testGetSetUserAuthorIds($inputData['page']);
    $pageData = testGetSetExternalAuthorIds($pageData);

    $inputData['page'] = $pageData;
    return $inputData;
}

function testGetSetModelAndPageIds($inputData) {
    global $dbConn;

    // Get the ids for the model/page
    $flowModel = $inputData['flow_model_title'];
    $sql = "SELECT id FROM flow_model WHERE title = '$flowModel'";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "testSetIds: could not find model - " . $flowModel . " " . $dbConn->error;
    }
    else {
        if ($row = $result->fetch_assoc()) {
            $flowModelId = $row['id'];
            $hierarchicalId = $inputData['page']['hierarchical_id'];
            $sql = "SELECT id FROM page WHERE flow_model_id = $flowModelId AND hierarchical_id = '$hierarchicalId'";
            $result = $dbConn->query($sql);
            if (!$result) {
                echo "testSetIds: Could not find page - " . $flowModelId . " " . $hierarchicalId . " " . $dbConn->error;
            } 
            else {
                if ($row = $result->fetch_assoc()) {
                    $pageId = $row['id'];
                    $inputData['flow_model_id'] = $flowModelId;
                    $inputData['page']['id'] = $pageId;
                    return $inputData;
                }
            }
        }
    }
    return false;
}

function testGetSetUserAuthorIds($pageData) {
    global $dbConn;

    $pageId = $pageData['id'];
    $authors = $pageData['user_authors'];
    $count = 0;
    foreach($authors as $userAuthor) {
        $userAuthorLinkId = $userAuthor['id'];
        if ($userAuthorLinkId === null) {
            $username = $userAuthor['username'];
            $sql = "SELECT * FROM user WHERE username = '$username'";
            $result = $dbConn->query($sql);
            if (!$result) {
                echo "Problem searching for user: $username - " . $dbConn->error;
            }
            elseif ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $userId = $row['id'];
                // Search for the user_page link
                $sql = "SELECT * FROM user_page_link WHERE user_id = $userId AND page_id = $pageId";
                $result = $dbConn->query($sql);
                if (!$result) {
                    echo "Problem searching for user_page_link - " . $dbConn->error;
                }
                elseif ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $linkId = $row['id'];
                    $pageData['user_authors'][$count]['id'] = $linkId;
                }
            }
        }
        ++$count;
    }
    return $pageData;
}

function testGetSetExternalAuthorIds($pageData) {
    global $dbConn;

    $pageId = $pageData['id'];
    $authors = $pageData['external_authors'];
    $count = 0;
    foreach($authors as $externalAuthor) {
        $externalAuthorLinkId = $externalAuthor['id'];
        if ($externalAuthorLinkId === null) {
            $author = $externalAuthor['author'];
            $nameParts = extractFirstAndLastNames($author);
            $firstName = $nameParts['firstName'];
            $lastName = $nameParts['lastName'];
            $sql = "SELECT * FROM external_author WHERE first_name = '$firstName' AND last_name = '$lastName'";
            $result = $dbConn->query($sql);
            if (!$result) {
                echo "Problem searching for user: $author - " . $dbConn->error;
            }
            elseif ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $externalAuthorId = $row['id'];
                // Search for the user_page link
                $sql = "SELECT * FROM user_page_link WHERE user_id = $externalAuthorId AND page_id = $pageId";
                $result = $dbConn->query($sql);
                if (!$result) {
                    echo "Problem searching for user_page_link - " . $dbConn->error;
                }
                elseif ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $linkId = $row['id'];
                    $pageData['external_authors'][$count]['id'] = $linkId;
                }
            }
        }
        ++$count;
    }
    return $pageData;
}