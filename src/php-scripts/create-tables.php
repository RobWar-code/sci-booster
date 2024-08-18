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
        password VARCHAR(256) NOT NULL,
        status VARCHAR(16) NOT NULL
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added user table<br>";
    }
    else {
        echo "Problem adding user table: " . $dbConn->error . "<br>";
    }
    
    $sql = "DROP TABLE IF EXISTS editor_key";

    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped editor_key table<br>";
    }
    else {
        echo "Problem deleting editor_key table: " . $dbConn->error . "<br>";
        exit();
    }

    $sql = "CREATE TABLE editor_key (
        editor_key VARCHAR(256) NOT NULL
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
    */

    // node Table
    $sql = "DROP TABLE IF EXISTS node";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping node table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE node (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        node_num CHAR(2) NOT NULL,
        label VARCHAR(64) NOT NULL,
        graphic_file VARCHAR(256),
        graphic_text VARCHAR(256),
        x_coord SMALLINT NOT NULL,
        y_coord SMALLINT NOT NULL,
        type VARCHAR(16) NOT NULL,
        definition VARCHAR(4096),
        keywords VARCHAR(256),
        hyperlink VARCHAR(256),
        has_child_page TINYINT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES page(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added node table<br>";
    }
    else {
        echo "Problem adding node table: " . $dbConn->error . "<br>";
    }

    $sql = "DROP TABLE IF EXISTS flow_point";
    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped flow_point table successfully<br>";
    }
    else {
        echo "Drop flow_point table failed<br>" . $dbConn->error . "<br>";
    }

    $sql = "DROP TABLE IF EXISTS flow_arrow_point";
    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped flow_arrow_point table successfully<br>";
    }
    else {
        echo "Drop flow_arrow_point table failed<br>" . $dbConn->error . "<br>";
    }

    $sql = "DROP TABLE IF EXISTS conversion_formula";
    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped conversion_formula table successfully<br>";
    }
    else {
        echo "Drop conversion_formula table failed <br>" . $dbConn->error . "<br>";
    }

    $sql = "DROP TABLE IF EXISTS flow";
    if ($dbConn->query($sql) === TRUE) {
        echo "Dropped flow table successfully <br>";
    }
    else {
        echo "Drop flow table failed<br>" . $dbConn->error . "<br>";
    }

    // flow Table
    $sql = "CREATE TABLE flow (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        flow_num CHAR(2) NOT NULL,
        label VARCHAR(64) NOT NULL,
        drawing_group_x SMALLINT NOT NULL,
        drawing_group_y SMALLINT NOT NULL,
        label_x SMALLINT NOT NULL,
        label_y SMALLINT NOT NULL,
        label_width SMALLINT NOT NULL,
        keywords VARCHAR(256),
        definition VARCHAR(4096),
        hyperlink VARCHAR(256),
        source_void TINYINT NOT NULL,
        source_node_num CHAR(2),
        destination_void TINYINT NOT NULL,
        destination_node_num CHAR(2),
        FOREIGN KEY (page_id) REFERENCES page(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow table<br>";
    }
    else {
        echo "Problem adding flow table: " . $dbConn->error . "<br>";
        exit;
    }

    // flow_point Table
    $sql = "CREATE TABLE flow_point (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_id INT,
        x SMALLINT,
        y SMALLINT,
        FOREIGN KEY (flow_id) REFERENCES flow(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow_point table<br>";
    }
    else {
        echo "Problem adding flow_point table: " . $dbConn->error . "<br>";
    }

    // flow_arrow_point Table
    $sql = "CREATE TABLE flow_arrow_point (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_id INT,
        x SMALLINT,
        y SMALLINT,
        FOREIGN KEY (flow_id) REFERENCES flow(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow_arrow_point table<br>";
    }
    else {
        echo "Problem adding flow_arrow_point table: " . $dbConn->error . "<br>";
    }
    
    // external_author Table
    $sql = "DROP TABLE IF EXISTS external_author";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping external_author table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE external_author (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(64),
        last_name VARCHAR(64)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added external_author table";
    }
    else {
        echo "Problem adding external_author table: " . $dbConn->error;
    }
  
    // references Table
    $sql = "DROP TABLE IF EXISTS reference";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping reference table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE reference (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        source VARCHAR(256),
        title VARCHAR(128),
        external_author_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (external_author_id) REFERENCES external_author(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added reference table<br>";
    }
    else {
        echo "Problem adding reference table: " . $dbConn->error . "<br>";
    }

    // external_author_page_link Table
    // references Table
    $sql = "DROP TABLE IF EXISTS external_author_page_link";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping external_author_page_link table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE external_author_page_link (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        external_author_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (external_author_id) REFERENCES external_author(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added external_author_page_link table<br>";
    }
    else {
        echo "Problem adding external_author_page_link table: " . $dbConn->error . "<br>";
    }

    // page_user_link Table
    $sql = "DROP TABLE IF EXISTS page_user_link";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping page_user_link table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE page_user_link (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        user_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (user_id) REFERENCES user(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added page_user_link table<br>";
    }
    else {
        echo "Problem adding page_user_link table: " . $dbConn->error . "<br>";
    }
    
    // conversion_formula Table
    $sql = "DROP TABLE IF EXISTS conversion_formula";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping conversion_formula table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE conversion_formula (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_id INT,
        formula VARCHAR(1024),
        description VARCHAR(4096),
        FOREIGN KEY (flow_id) REFERENCES flow(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added conversion_formula table<br>";
    }
    else {
        echo "Problem adding conversion_formula table: " . $dbConn->error . "<br>";
    }
    
    // page Table
    $sql = "DROP TABLE IF EXISTS page";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping page table - {$dbConn->error}<br>";
    }

    $dbConn->query($sql);
    $sql = "CREATE TABLE page (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_model_id INT,
        hierarchical_id VARCHAR(64),
        title VARCHAR(128) UNIQUE NOT NULL,
        description VARCHAR(4096),
        keywords VARCHAR(256),
        FOREIGN KEY (flow_model_id) REFERENCES flow_model(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added page table<br>";
    }
    else {
        echo "Problem adding page table: " . $dbConn->error ."<br>";
    }
    
    // flow_model Table
    $sql = "DROP TABLE IF EXISTS flow_model";
    $result = $dbConn->query($sql);
    if (!$result) {
        echo "Problem dropping flow_model table - {$dbConn->error}<br>";
    }

    $sql = "CREATE TABLE flow_model (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(128) NOT NULL UNIQUE
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow_model table<br>";
    }
    else {
        echo "Problem adding flow_model table: " . $dbConn->error . "<br>";
    }
    
    
?>
    </div>
</body>
</html>