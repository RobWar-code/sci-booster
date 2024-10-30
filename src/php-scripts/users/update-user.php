<?php
    include_once __DIR__ . "/../db-connect.php";

    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $response = updateUser($inputData);

    echo json_encode($response);

    function updateUser($userData) {
        global $dbConn;

        if (!isset($userData['old_username'])) {
            $response = ['result'=>false, 'status'=>"updateUser: old username not set"];
            return $response;
        }
        $oldUsername = $userData['old_username'];
        if (!isset($userData['username'])) {
            $response = ['result'=>false, 'status'=>"updateUser: username not set"];
            return $response;
        }
        $username = $userData['username'];
        if (!isset($userData['email'])) {
            $response = ['result'=>false, 'status'=>"updateUser: email not set"];
            return $response;
        }
        $email = $userData['email'];
        if ($userData['password_entered']) {
            if (!isset($userData['password'])) {
                $response = ['result'=>false, 'status'=>"updateUser: password not set"];
                return $response;
            }
            $password = $userData['password'];
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            $sql = "UPDATE user SET username = '$username', email = '$email', password = ? ";
            $sql .= "WHERE username = '$oldUsername'";
            $stmt = $dbConn->prepare($sql);
            if (!$stmt) {
                $response = ['result'=>false, 'status'=>"updateUser: problem with update sql {$dbConn->error}"];
                return $response;
            }
            $stmt->bind_param("s", $hashedPassword);
            if (!$stmt->execute()) {
                $response = ['result'=>false, 'status'=>"updateUser: problem updating profile {$dbConn->error}"];
                return $response;
            }
            $response = ['result'=>true, 'status'=>"updateUser: update performed OK"];
            return $response;
        }
        else {
            $sql = "UPDATE user SET username = '$username', email = '$email' WHERE username = '$oldUsername'";
            $result = $dbConn->query($sql);
            if (!$result) {
                $response = ['result'=>false, 'status'=>"updateUser: problem with normal update {$dbConn->error}"];
                return $response;
            }
            $response = ['result'=>true, 'status'=>"updateUser: update performed OK"];
            return $response;
        }

    }

