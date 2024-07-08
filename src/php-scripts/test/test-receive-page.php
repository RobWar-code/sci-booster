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


?>
    </div>
</body>
</html>