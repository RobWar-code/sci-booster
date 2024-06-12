<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test for Extract Page</title>
</head>
<body>
    <h1>Test Extract Page</h1>
    <div>
        <?php
            include_once __DIR__ . '/../flow-model/extract-page.php';
            
            $sql = "SELECT id, flow_model_id FROM page";
            $stmt = $dbConn->prepare($sql);
            if ($stmt->execute()) {
                $stmt->store_result();
                $stmt->bind_result($pageId, $flowModelId);
                $stmt->fetch();
                echo "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "flow_model_id: " . $flowModelId . "<br>";
                $pageData = extractPage($flowModelId, $pageId);
            }
        ?>
    </div>
    
</body>
</html>