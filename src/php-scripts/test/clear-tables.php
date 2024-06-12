<?php
    include_once __DIR__ . "/../db-connect.php";
    
    function clearTables() {
        global $dbConn;

        $sql = "DELETE FROM conversion_formula";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear conversion_formula table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared conversion_formula<br>";
        }

        $sql = "DELETE FROM flow_point";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear flow_point table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared flow_point<br>";
        }

        $sql = "DELETE FROM flow_arrow_point";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear flow_arrow_point table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared flow_arrow_point<br>";
        }

        $sql = "DELETE FROM flow";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear flow table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared flow<br>";
        }

        $sql = "DELETE FROM node";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear node table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared node<br>";
        }

        $sql = "DELETE FROM external_author_page_link";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear external_author_page_link table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared external_author_page_link<br>";
        }

        $sql = "DELETE FROM reference";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear reference table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared reference<br>";
        }

        $sql = "DELETE FROM external_author";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear external_author table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared external_author<br>";
        }

        $sql = "DELETE FROM page_user_link";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Faile to clear page_user_link table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared page_user_link<br>";
        }

        $sql = "DELETE FROM page";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear page table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared page<br>";
        }

        $sql = "DELETE FROM flow_model";
        $result = $dbConn->query($sql);
        if (!$result) {
            echo "Failed to clear flow_model table<br>" . $dbConn->error . "<br>";
        }
        else {
            echo "Cleared flow_model<br>";
        }
    }