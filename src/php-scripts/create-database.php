<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Sci-Booster Database Creation</h1>
    <div>
<?php
    include_once './host-connect.php';

    $newDBName = "sci_booster";
    $sql = "CREATE DATABASE " . $newDBName;
    if ($hostConn->query($sql) === TRUE) {
        echo "Database '$newDBName' created successfully\n";
    }
    else {
        echo "Problem creating the database '$newDBName': " . $hostConn->error;
    }
?>   
    </div>
</body>
</html>
