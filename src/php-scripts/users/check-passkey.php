<?php
    function checkPasskey($passkey) {
        global $dbConn;

        $sql = "SELECT id FROM temp_password WHERE password = ?";
        if(!$stmt = $dbConn->prepare($sql)) {
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
            if ($stmt->num_rows === 0) {
                return false;
            }
            else {
                return true;
            }
        }
    }
