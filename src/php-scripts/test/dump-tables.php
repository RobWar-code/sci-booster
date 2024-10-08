<?php
    include_once __DIR__ . '/../db-connect.php';

    function dumpTables() {
        echo "<br>";
        dumpFlowModel();
        dumpPage();
        dumpExternalAuthor();
        dumpExternalAuthorPageLink();
        dumpPageUserLink();
        dumpReference();
        dumpNode();
        dumpFlow();
        dumpFlowArrowPoint();
        dumpFlowPoint();
        dumpConversionFormula();
    }

    function dumpFlowModel() {
        global $dbConn;

        $sql = "SELECT * FROM flow_model";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($flow_model_id, $flow_model_title);
        if ($result) {
            echo "Flow Model Table, number of rows:" . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $flow_model_id . "<br>";
                echo "title: " . $flow_model_title . "<br>";
            }
        }
    }

    function dumpPage() {
        global $dbConn;

        $sql = "SELECT * FROM page";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($pageId, $flowModelId, $hierarchicalId, $title, $description, $keywords);
        if ($result) {
            echo "<br>";
            echo "Page Table, number of rows:" . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $pageId . "<br>";
                echo "flow_model_id: " . $flowModelId . "<br>";
                echo "hierarchical_id: " . $hierarchicalId . "<br>";
                echo "title: " . $title . "<br>";
                echo "description: " . $description . "<br>";
                echo "keywords: " . $keywords . "<br>";
            }
        }
    }

    function dumpExternalAuthor() {
        global $dbConn;

        $sql = "SELECT * FROM external_author";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($externalAuthorId, $firstName, $lastName);
        if ($result) {
            echo "<br>";
            echo "External Author table, number of rows: " . $stmt->num_rows . "<br>";
            while ($stmt->fetch()) {
                echo "id: " . $externalAuthorId . "<br>";
                echo "first_name: " . $firstName . "<br>";
                echo "last_name: " . $lastName . "<br>";
            }
        }
    }

    function dumpExternalAuthorPageLink() {
        global $dbConn;

        $sql = "SELECT * FROM external_author_page_link";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $pageId, $externalAuthorId);
        if ($result) {
            echo "<br>";
            echo "External Author Page Link Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "external_author_id: " . $externalAuthorId . "<br>";
            }
        }
    }

    function dumpPageUserLink() {
        global $dbConn;
        
        $sql = "SELECT * FROM page_user_link";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $pageId, $userId);
        if ($result) {
            echo "<br>";
            echo "Page User Link table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "user_id: " . $userId . "<br>";
            }
        }

    }

    function dumpReference() {
        global $dbConn;

        $sql = "SELECT * FROM reference";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $pageId, $source, $title, $externalAuthorId);
        if ($result) {
            echo "<br>";
            echo "Reference Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "source: " . $source . "<br>";
                echo "title: " . $title . "<br>";
                echo "external_author_id: " . $externalAuthorId . "<br>";
            }
        }
    }

    function dumpNode() {
        global $dbConn;

        $sql = "SELECT * FROM node";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $pageId, $nodeNum, $label, $graphicFile, $graphicText,
            $graphicCredits, $xCoord, $yCoord, $type, $definition, $keywords, $hyperlink, $hasChildPage);
        if ($result) {
            echo "<br>";
            echo "Node Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "node_num: " . $nodeNum . "<br>";
                echo "label: " . $label . "<br>";
                echo "graphic_file: " . $graphicFile . "<br>";
                echo "graphic_text: " . $graphicText . "<br>";
                echo "graphic_credits: " . $graphicCredits . "<br>";
                echo "x_coord: " . $xCoord . "<br>";
                echo "y_coord: " . $yCoord . "<br>";
                echo "type: " . $type . "<br>";
                echo "definition: " . $definition . "<br>";
                echo "keywords: " . $keywords . "<br>";
                echo "hyperlink: " . $hyperlink . "<br>";
                echo "has_child_page: " . $hasChildPage . "<br>";
            }
        }
    }

    function dumpFlow() {
        global $dbConn;

        $sql = "SELECT * FROM flow";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $pageId, $flowNum, $label, $drawingGroupX, $drawingGroupY,
            $labelX, $labelY, $labelWidth, $keywords, $definition, $hyperlink,
            $sourceVoid, $sourceNodeNum, $destinationVoid, $destinationNodeNum
        );
        if ($result) {
            echo "<br>";
            echo "Flow Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "page_id: " . $pageId . "<br>";
                echo "flow_num: " . $flowNum . "<br>";
                echo "label: " . $label . "<br>";
                echo "drawing_group_x: " . $drawingGroupX . "<br>";
                echo "drawing_group_y: " . $drawingGroupY . "<br>";
                echo "label_x: " . $labelX . "<br>";
                echo "label_y: " . $labelY . "<br>";
                echo "label_width: " . $labelWidth . "<br>";
                echo "keywords: " . $keywords . "<br>";
                echo "definition: " . $definition . "<br>";
                echo "hyperlink: " . $hyperlink . "<br>";
                echo "source_void: " . $sourceVoid . "<br>";
                echo "source_node_num: " . $sourceNodeNum . "<br>";
                echo "destination_void: " . $destinationVoid . "<br>";
                echo "destination_node_num: " . $destinationNodeNum . "<br>";
            }
        }

    }

    function dumpFlowArrowPoint() {
        global $dbConn;

        $sql = "SELECT * FROM flow_arrow_point ORDER BY flow_id, id";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $flowId, $x, $y);
        if ($result) {
            echo "<br>";
            echo "Flow Arrow Point Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "flow_id: " . $flowId . "<br>";
                echo "x: " . $x . "<br>";
                echo "y: " . $y . "<br>";
            }
        }
    }

    function dumpFlowPoint() {
        global $dbConn;

        $sql = "SELECT * FROM flow_point ORDER BY flow_id, id";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $flowId, $x, $y);
        if ($result) {
            echo "<br>";
            echo "Flow Point Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()) {
                echo "id: " . $id . "<br>";
                echo "flow_id: " . $flowId . "<br>";
                echo "x: " . $x . "<br>";
                echo "y: " . $y . "<br>";
            }
        }
    }

    function dumpConversionFormula() {
        global $dbConn;

        $sql = "SELECT * FROM conversion_formula ORDER BY flow_id";
        $stmt = $dbConn->prepare($sql);
        $result = $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $flowId, $formula, $description);
        if ($result) {
            echo "<br>";
            echo "Conversion Formula Table: " . $stmt->num_rows . "<br>";
            while($stmt->fetch()){
                echo "id: " . $id . "<br>";
                echo "flow_id: " . $flowId . "<br>";
                echo "formula: " . $formula . "<br>";
                echo "description: " . $description . "<br>"; 
            }
        }
    }