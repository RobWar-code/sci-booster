<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Create the Sci-Booster Tables</h1>
    <div>
<?php
    // Create the sci-booster tables
    include_once './db-connect.php';

    /*
    $sql = "CREATE TABLE user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(16) NOT NULL
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added user table";
    }
    else {
        echo "Problem adding user table: " . $dbConn->error;
    }
    */

    $sql = "DROP TABLE IF EXISTS editor_key";

    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped editor_key table<br>";
    }
    else {
        echo "Problem deleting editor_key table: " . $dbConn->error . "<br>";
        exit();
    }

    $sql = "CREATE TABLE editor_key (
        editor_key VARCHAR(255) NOT NULL
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added editor_key table<br>";
    }
    else {
        echo "Problem adding editor_key table: " . $dbConn->error . "<br>";
        exit();
    }

    // Insert the key
    $key = "PurplePants";
    $keyHash = password_hash($key, PASSWORD_BCRYPT, ['cost' => 10]);
    $sql = "INSERT INTO editor_key (editor_key) VALUES (?)";
    $stmt = $dbConn->prepare($sql);
    if ($stmt === FALSE) {
        echo "create-tables.php: problem with $stmt prepare" . $dbConn->error;
    }
    $stmt->bind_param('s', $keyHash);
    if ($stmt->execute()) {
        echo "editor_key set successfully<br>";
    }
    else {
        echo "problem setting editor key<br>";
    }

?>
    </div>
</body>
</html>