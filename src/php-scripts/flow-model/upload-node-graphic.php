<?php

header('Content-Type: application/json');

if (!isset($_POST['username'])) {
    error_log("upload-node-graphics: missing username", 0);
    $response = ['result'=>false, 'error'=>"Missing username"];
    echo json_encode($response);
    exit;
}

if (!isset($_FILES['file'])) {
    error_log("upload-node-graphics: file missing", 0);
    $response = ['result'=>false, 'error'=>"Missing file"];
    echo json_encode($response);
}

$username = $_POST['username'];
$fileTempPath = $_FILES['file']['tmp_name'];
$filename = $_FILES['file']['name'];

$destPath = $_SERVER['DOCUMENT_ROOT'] . "/sci-booster/assets/images/{$username}";

// Check whether the destination directory exists
if (!file_exists($destPath)) {
    if (!mkdir($destPath, 0777, true)) {
        error_log("Could not create directory for {$username}", 0);
        $response = ['result'=>false, 'error'=>"Could not create directory for {$username}"];
        echo json_encode($response);
        exit;
    }
}

// Copy the temp file
if (!move_uploaded_file($fileTempPath, $destPath . "/" . $filename)) {
    $response = ['result'=>false, 'error'=>"Could not copy uploaded file"];
    echo json_encode($response);
}
else {
    $response = ['result'=>true];
    echo json_encode($response);
}
