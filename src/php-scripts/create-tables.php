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
?>
    </div>
</body>
</html>