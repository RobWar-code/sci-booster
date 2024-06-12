<?php
    include_once __DIR__ . '/../db-connect.php';

    function extractPage($flowModelId, $pageId) {
        global $dbConn;

        $pageData['flow_model_id'] = $flowModelId;

        $page = fetchPage($pageId);
        $authors = fetchAuthors($pageId);
        $page['authors'] = $authors;
        $references = fetchReferences($pageId);
        $page['references'] = $references;
        $nodes = fetchNodes($pageId);
        $page['nodes'] = $nodes;
        $flows = fetchFlows($pageId);
        $page['flows'] = $flows;

        if (sizeof($page) > 0) {
            $pageData['page'] = $page;
        }
        $pageJSON = json_encode($pageData);
        echo $pageJSON . "<br>"; 

        return $pageData;
    }

    function fetchPage($pageId) {
        global $dbConn;

        $page = [];
        $sql = "SELECT * FROM page WHERE id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($pageId, $flowModelId, $hierarchicalId, $title, $description, $keywords);
            $stmt->fetch();
            $page['id'] = $pageId;
            $page['flow_model_id'] = $flowModelId;
            $page['hierarchical_id'] = $hierarchicalId;
            $page['title'] = $title;
            $page['description'] = $description;
            $page['keywords'] = $keywords;
        }

        return $page;
    }

    function fetchAuthors($pageId) {
        global $dbConn;

        $authors = [];
        // Collect the user authors
        $sql = "SELECT * FROM page_user_link WHERE page_id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $pageId, $userId);
            if ($stmt->num_rows > 0) {
                while($stmt->fetch()) {
                    // Get the user name
                    $sql = "SELECT username FROM user WHERE id = $userId";
                    $stmt2 = $dbConn->prepare($sql);
                    if ($result = $stmt2->execute()) {
                        $stmt2->store_result();
                        $stmt2->bind_result($username);
                        $stmt2->fetch();
                        array_push($authors, $username);
                    }
                }
            }
        }

        // Collect the external authors
        $sql = "SELECT * FROM external_author_page_link WHERE page_id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $pageId, $externalAuthorId);
            while($stmt->fetch()){
                $authorName = getAuthorName($externalAuthorId);
                array_push($authors, $authorName);
            }
        }
        return $authors;
    }

    function fetchReferences($pageId) {
        global $dbConn;

        $references = [];
        $sql = "SELECT * FROM reference WHERE page_id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($referenceId, $pageId, $source, $title, $externalAuthorId);
            while($stmt->fetch()) {
                $refItem = [];
                $refItem['id'] = $referenceId;
                $refItem['source'] = $source;
                $refItem['title'] = $title;
                $authorName = getAuthorName($externalAuthorId);
                $refItem['author'] = $authorName;
                array_push($references, $refItem);
            }
        }
        return $references;
    }

    function getAuthorName($externalAuthorId) {
        global $dbConn;

        $authorName = "";
        $sql = "SELECT * FROM external_author WHERE id = $externalAuthorId";
        $stmt2 = $dbConn->prepare($sql);
        if ($result = $stmt2->execute()) {
            $stmt2->store_result();
            $stmt2->bind_result($authorId, $firstName, $lastName);
            $stmt2->fetch();
            $authorName = $firstName . " " . $lastName;
        }
        return $authorName;
    }

    function fetchNodes($pageId) {
        global $dbConn;

        $nodes = [];
        $sql = "SELECT * FROM node WHERE page_id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $pageId, $nodeNum, $label, 
                $x, $y, $type, $definition, $keywords, $hyperlink, $hasChildPage);
            while ($stmt->fetch()) {
                $node = [];
                $node['id'] = $id;
                $node['page_id'] = $pageId;
                $node['node_num'] = $nodeNum;
                $node['label'] = $label;
                $node['x'] = $x;
                $node['y'] = $y;
                $node['type'] = $type;
                $node['definition'] = $definition;
                $node['keywords'] = $keywords;
                $node['hyperlink'] = $hyperlink;
                if ($hasChildPage === 1) {
                    $node['has_child_page'] = true;
                }
                else {
                    $node['has_child_page'] = false;
                }
                array_push($nodes, $node);
            }
        }

        return $nodes;
    }

    function fetchFlows($pageId) {
        global $dbConn;

        $flows = [];
        $sql = "SELECT * FROM flow WHERE page_id = $pageId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()){
            $stmt->store_result();
            $stmt->bind_result($flowId, $pageId, $flowNum, $label, $drawingGroupX, $drawingGroupY,
                $labelX, $labelY, $labelWidth, $keywords, $definition, $hyperlink,
                $sourceVoid, $sourceNodeNum, $destinationVoid, $destinationNodeNum);
            while($stmt->fetch()) {
                $flow = [];
                $flow['id'] = $flowId;
                $flow['page_id'] = $pageId;
                $flow['flow_num'] = $flowNum;
                $flow['label'] = $label;
                $flow['drawing_group_x'] = $drawingGroupX;
                $flow['drawing_group_y'] = $drawingGroupY;
                $flow['label_x'] = $labelX;
                $flow['label_y'] = $labelY;
                $flow['label_width'] = $labelWidth;
                $flow['keywords'] = $keywords;
                $flow['definition'] = $definition;
                $flow['hyperlink'] = $hyperlink;
                $flow['source_node_num'] = $sourceNodeNum;
                $flow['destination_node_num'] = $destinationNodeNum;
                $arrowPoints = fetchArrowPoints($flowId);
                $flow['arrow_points'] = $arrowPoints;
                $flowPoints = fetchFlowPoints($flowId);
                $flow['points'] = $flowPoints;
                $formulas = fetchConversionFormulas($flowId);
                $flow['conversion_formulas'] = $formulas;
                array_push($flows, $flow);
            }
        }
        return $flows;
    }

    function fetchArrowPoints($flowId) {
        global $dbConn;

        $arrowPoints = [];
        $sql = "SELECT * FROM flow_arrow_point WHERE flow_id = $flowId ORDER BY id";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $flowId, $x, $y);
            while($stmt->fetch()){
                $arrowPoint = [];
                $arrowPoint['id'] = $id;
                $arrowPoint['flow_id'] = $flowId;
                $arrowPoint['x'] = $x;
                $arrowPoint['y'] = $y;
                array_push($arrowPoints, $arrowPoint);
            }
        }

        return $arrowPoints;
    }

    function fetchFlowPoints($flowId) {
        global $dbConn;

        $points = [];
        $sql = "SELECT * FROM flow_point WHERE flow_id = $flowId ORDER BY id";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $flowId, $x, $y);
            while($stmt->fetch()){
                $point = [];
                $point['id'] = $id;
                $point['flow_id'] = $flowId;
                $point['x'] = $x;
                $point['y'] = $y;
                array_push($points, $point);
            }
        }

        return $points;
    }

    function fetchConversionFormulas($flowId){
        global $dbConn;

        $formulas = [];
        $sql = "SELECT * FROM conversion_formula WHERE flow_id = $flowId";
        $stmt = $dbConn->prepare($sql);
        if ($result = $stmt->execute()) {
            $stmt->store_result();
            $stmt->bind_result($id, $flowId, $formula, $description);
            while ($stmt->fetch()) {
                $formulation = [];
                $formulation['id'] = $id;
                $formulation['flow_id'] = $flowId;
                $formulation['formula'] = $formula;
                $formulation['description'] = $description;
                array_push($formulas, $formulation);
            }
        }

        return $formulas;
    }