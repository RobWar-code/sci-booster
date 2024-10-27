<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h2>Reset your Sci-Booster Password</h2>
    <?php
        if (!isset($_GET['param'])) {
            echo "No temporary pass key<br>";
            exit;
        }
        if (!isset($_GET['username'])) {
            echo "Missing username for password reset<br>";
            exit;
        }
        
        if(!checkPasskey($_GET['param'])) {
            echo "Invalid pass key for password reset<br>";
            exit;
        }

        echo "<p>Enter a new password for user: $username</p>";

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
                echo "checkPasskey: database access failed<br>";
                exit;
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
        
    ?>
    <form onsubmit="sendNewPassword()">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <button type="submit">Submit</button>
    </form>
    <p id="warning" style="color: red;"></p>
    <a href="./flow_diagram.html">Return to Flow Diagram page</a>

<script>
    async function sendNewPassword() {
        let password = document.getElementById("password").value;
        if (password === "") {
            document.getElementById("warning").innerText = "No password given";
        }
        <?php
            echo "let username = '" . $_GET['username'] . "';";
            echo "let passkey = '" . $_GET['param'] . "';";
        ?>
        let messageObj = {
            passkey: passkey,
            username: username,
            password: password
        }
        let messageJSON = JSON.stringify(messageObj);
        try {
            let response = await fetch("/sci-booster/src/php-scripts/user/reset_password.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: $messageJSON
            });

            let responseData = await response.json();

            document.getElementById("warning").innerText = responseData.status;
        }
        catch {(error) => {
            document.getElementById("warning").innerText = `Problem sending new password ${error}`;
        }}
    }
</script>    
</body>
</html>