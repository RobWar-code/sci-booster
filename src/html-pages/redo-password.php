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
        include_once __DIR__ . "/../php-scripts/db-connect.php";
        include_once __DIR__ . "/../php-scripts/users/check-passkey.php";

        // Debug
        error_log("Got to redo-password", 0);
        echo "Sent Message to error log<br>";

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
        echo "Past checkPasskey<br>";

        $username = $_GET['username'];
        echo "<p>Enter a new password for user: $username</p>";
        
    ?>
    <form onsubmit="sendNewPassword(event)">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <button type="submit">Submit</button>
    </form>
    <p id="warning" style="color: red;"></p>
    <a href="/sci-booster/src/html-pages/flow-diagram.html">Return to Flow Diagram page</a>

<script src="../js-scripts/global-initialise.js"></script>
<script>
    async function sendNewPassword(event) {
        event.preventDefault();
        let password = document.getElementById("password").value;
        if (password === "") {
            document.getElementById("warning").innerText = "No password given";
            return;
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
            let response = await fetch(dfm.phpPath + "users/reset-password.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: messageJSON
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