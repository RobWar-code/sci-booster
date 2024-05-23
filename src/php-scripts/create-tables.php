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
    /*
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
    */

    // flow_model Table
    $sql = "CREATE TABLE flow_model (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(126) NOT NULL UNIQUE
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow_model table";
    }
    else {
        echo "Problem adding flow_model table: " . $dbConn->error;
    }

    // page Table
    $sql = "CREATE TABLE page (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_model_id INT,
        hierarchical_id VARCHAR(64),
        title VARCHAR(128) UNIQUE NOT NULL,
        description VARCHAR(4096),
        keywords VARCHAR(255),
        FOREIGN KEY (flow_model_id) REFERENCES flow_model(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added page table";
    }
    else {
        echo "Problem adding page table: " . $dbConn->error;
    }

    // node Table
    $sql = "CREATE TABLE node (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        node_num CHAR(2) NOT NULL,
        label VARCHAR(64) NOT NULL,
        x_coord SMALLINT NOT NULL,
        y_coord SMALLINT NOT NULL,
        type VARCHAR(16) NOT NULL,
        definition VARCHAR(4096),
        keywords VARCHAR(255),
        hyperlink VARCHAR(255),
        has_child_page TINYINT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES page(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added node table";
    }
    else {
        echo "Problem adding node table: " . $dbConn->error;
    }

    // flow Table
    $sql = "CREATE TABLE flow (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        flow_num CHAR(2) NOT NULL,
        label VARCHAR(64) NOT NULL,
        label_x SMALLINT NOT NULL,
        label_y SMALLINT NOT NULL,
        keywords VARCHAR(255),
        definition VARCHAR(4096),
        hyperlink VARCHAR(255),
        source_void TINYINT NOT NULL,
        source_node_id INT,
        destination_void TINYINT NOT NULL,
        destination_node_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (source_node_id) REFERENCES node(id)
        FOREIGN KEY (destination_node_id) REFERENCES node(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added flow table";
    }
    else {
        echo "Problem adding flow table: " . $dbConn->error;
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
        echo "Added references table";
    }
    else {
        echo "Problem adding references table: " . $dbConn->error;
    }
    
    // external_author Table
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
    $sql = "CREATE TABLE reference (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        source VARCHAR(255),
        title VARCHAR(128),
        external_author_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (external_author_id REFERENCES external_author(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added reference table";
    }
    else {
        echo "Problem adding reference table: " . $dbConn->error;
    }

    // external_authors_page_link Table
    // references Table
    $sql = "CREATE TABLE external_author_page_link (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        external_author_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (external_author_id REFERENCES external_author(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added external_author_page_link table";
    }
    else {
        echo "Problem adding external_author_page_link table: " . $dbConn->error;
    }

    // page_user_link Table
    $sql = "CREATE TABLE page_user_link (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT,
        user_id INT,
        FOREIGN KEY (page_id) REFERENCES page(id),
        FOREIGN KEY (user_id REFERENCES user(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added page_user_link table";
    }
    else {
        echo "Problem adding page_user_link table: " . $dbConn->error;
    }
    
    // conversion_formula Table
    $sql = "CREATE TABLE conversion_formula (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_id INT,
        formula VARCHAR(1024),
        description VARCHAR(4096)
        FOREIGN KEY (flow_id) REFERENCES flow(id)
    )";

    if ($dbConn->query($sql) === TRUE) {
        echo "Added conversion_formula table";
    }
    else {
        echo "Problem adding conversion_formula table: " . $dbConn->error;
    }
    
?>
    </div>
</body>
</html>