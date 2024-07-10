<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sci-Booster Database Dump</title>
</head>
<body>
    <h1>Sci-Booster Database Dump</h1>
    <div>
    <?php
        include_once __DIR__ . "/dump-tables.php";
        dumpTables();
    ?>
    </div>
</body>
</html>