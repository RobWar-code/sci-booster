<?php
    function convertJsonEntities(&$pageData) {
        $pageData['flow_model_title'] = html_entity_decode($pageData['flow_model_title'], ENT_QUOTES);
        $index = 0;
        foreach($pageData["pages"] as $page) {
            decodeRecord($page, ["title", "description", "keywords"]);
            // Decode authors
            $externalAuthors = $page['external_authors'];
            decodeExternalAuthors($externalAuthors);
            $page['external_authors'] = $externalAuthors;

            // Decode references
            $references = $page['references'];
            decodeReferences($references);
            $page['references'] = $references;

            // Decode Nodes
            $nodes = $page['nodes'];
            decodeNodes($nodes);
            $page['nodes'] = $nodes;

            // Decode Flows
            $flows = $page['flows'];
            decodeFlows($flows);
            $page['flows'] = $flows;

            $pageData['pages'][$index] = $page;

            ++$index;

        }
    }

    function decodeFlows(&$flows) {
        $index = 0;
        foreach($flows as $flow) {
            decodeRecord($flow, ["label", "definition", "keywords"]);
            $conversionFormulas = $flow['conversion_formulas'];
            decodeFormulas($conversionFormulas);
            $flow['conversion_formulas'] = $conversionFormulas;
            $flows[$index] = $flow;
            ++$index;
        }
    }

    function decodeFormulas(&$conversionFormulas) {
        $index = 0;
        foreach($conversionFormulas as $item) {
            decodeRecord($item, ["formula", "description"]);
            $conversionFormulas[$index] = $item;       
            ++$index;
        }
    }

    function decodeNodes(&$nodes) {
        $index = 0;
        foreach($nodes as $node) {
            decodeRecord($node, ["label", "graphic_text", "graphic_credits", "definition", "keywords"]);
            $nodes[$index] = $node;
            ++$index;
        }
    }

    function decodeReferences(&$references) {
        $index = 0;
        foreach($references as $item) {
            decodeRecord($item, ["source", "title"]);
            $author = html_entity_decode($item["author"]["author"], ENT_QUOTES);
            $item["author"]["author"] = $author;
            $references[$index] = $item;
            ++$index;
        }
    }

    function decodeExternalAuthors(&$externalAuthors) {
        $index = 0;
        foreach($externalAuthors as $item) {
            $author = html_entity_decode($item['author'], ENT_QUOTES);
            $item['author'] = $author;
            $externalAuthors[$index] = $item;
            ++$index;
        }
    }

    function decodeRecord(&$record, $fields) {
        foreach($fields as $fieldname) {
            $record[$fieldname] = html_entity_decode($record[$fieldname], ENT_QUOTES);
        }
    }