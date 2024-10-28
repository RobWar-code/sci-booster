<?php
    function checkPasskey($passkey) {
        global $dbConn;

        $sql = "SELECT id FROM temp_password WHERE password = ?";
        if(!$stmt->prepare($sql)) {
            echo "checkPasskey: invalid sql<br>";
            exit;
        }
        $stmt->bind_param("s", $passkey);
        $result = $stmt->execute();
        if (!$result) {
            error_log("checkPasskey: database access failed", 0);
            return false;
        }
        else {
            $stmt->store_result();
            $stmt->bind_result($passId);
            if (!$stmt->fetch()) {
                return false;
            }
            else {
                return true;
            }
        }
    }
