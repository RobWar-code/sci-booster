<?php
    include_once __DIR__ . "/../db-connect.php";

    // Collect the JSON data
    header('Content-Type: application/json');

    $inputData = json_decode(file_get_contents('php://input'), true);

    $username = $inputData['username'];
    if ($username === "") {
        echo json_encode(['result'=>false, 'status'=>"forgot password, username is blank"]);
        exit;
    }

    sendLinkEmail($username); 
    
    function sendLinkEmail($username) {
        global $dbConn;

        // Get the email address
        $sql = "SELECT email FROM user WHERE username = '$username'";
        $result = $dbConn->query($sql);
        if (!$result) {
            $response = ['result'=>false, 'status'=>"sendLinkEmail: could not read username from database"];
            echo json_encode($response);
            exit;
        }
        if ($result->num_rows === 0) {
            $response = ['result'=>false, 'status'=>"sendLinkEmail: could not find user"];
            echo json_encode($response);
        }
        $row = $result->fetch_assoc();
        $email = $row['email'];

        // Debug
        error_log("username: $username, email $email", 0);

        // Create a temporary password
        $tempPassword = createTempPassword();
        // Store it in the temp_password table
        $sql = "INSERT INTO temp_password (password) VALUES (?)";
        $stmt = $dbConn->prepare($sql);
        if (!$stmt) {
            $response = ['result'=>false, 'status'=>"sendLinkEmail: problem with sql {$dbConn->error}"];
            echo json_encode($response);
            exit;
        }
        $stmt->bind_param("s", $tempPassword);
        if (!$stmt->execute()) {
            $response = ['result'=>false, 'status'=>"sendLinkEmail: pass update failed {$dbConn->error}"];
            echo json_encode($response);
            exit;
        }

        // Send the email
        // Ensure the $from is a valid email address
        $from = "warnrobin@yahoo.com";
        $subject = "Forgot Sci-Booster Password";
        $textMessage = "Hello $username, You have told us that you forgot your password.";
        $textMessage .= " Click the link below to provide another.";

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= 'From: ' . $from . "\r\n";

        // Prepare the message
        $message = "Hello World";
        /*
        $message = "
        <html>
        <head>
            <title>{$subject}</title>
        </head>
        <body>
            <p>{$textMessage}</p>
            <p><a href='https://narayana-art.co.uk/sci-booster/src/php_scripts/users/redo-password.php?param=$tempPassword";
        $message .= "&username=$username'>";
        $message .= "Click here to create a new password</a></p>
        </body>
        </html>
        ";
        */

        // Send the email
        if(mail($email, $subject, $message, $headers)) {
            $response=['result'=>true, 'status'=>"Email sent successfully to {$email}"];
            echo json_encode($response);
            // Debug 
            error_log("mail sent", 0);
        } else {
            $response=['result'=>false, 'status'=>"Failed to send email."];
            echo json_encode($response);
            // Debug
            error_log("mail not sent", 0);
        }
    }

    function createTempPassword($length = 12) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $password = substr(str_shuffle($characters), 0, $length);
        return $password;
    }
    
