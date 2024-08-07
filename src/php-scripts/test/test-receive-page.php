<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flow Model Test</title>
</head>
<body>
    <h1>Test Model Load/Update</h1>
    <div>
<?php
    include_once __DIR__ . '/../flow-model/receive-page.php';
    include_once __DIR__ . '/dump-tables.php';
    include_once __DIR__ . "/../test/clear-tables.php";
    
    // Debug Script
    $inputData = json_decode(file_get_contents(__DIR__ . '/../test/test-model1.json'), true);
    clearTables();

    handlePageData($inputData);

    // Add child record to check-out child page deletion
    $inputData = json_decode(file_get_contents(__DIR__ . "/../test/test-model3.json"), true);
    echo "<br>";
    echo "Child record: " . $inputData['flow_model_title'] . "<br>";
    if ($inputData) {
        handlePageData($inputData);
    }

    // Debug Script
    // Update Record
    $inputData = json_decode(file_get_contents(__DIR__ . "/../test/test-model2.json"), true);
    echo "<br>";
    echo "Update record: " . $inputData['flow_model_title'] . "<br>";
    if ($inputData) {
        handlePageData($inputData);
    }

    // Check that the child record has been deleted
    echo "<br>";
    $hierarchicalId = "0102";
    $sql = "SELECT * FROM page WHERE hierarchical_id = $hierarchicalId";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem executing request for page <br>";
    }
    else {
        if ($result->num_rows === 0) {
            echo "Page 0102 deleted successfully<br>";
        }
        else {
            echo "Page 0102 NOT deleted<br>";
        }
    }

    echo "<br>Dump Of Tables<br>";
    dumpTables();

?>
    </div>
</body>
</html>