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
        include_once __DIR__ . "/../php_scripts/db-connect.php";
        include_once __DIR__ . "/../php-scripts/users/check-passkey.php";

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
        
    ?>
    <form onsubmit="sendNewPassword()">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <button type="submit">Submit</button>
    </form>
    <p id="warning" style="color: red;"></p>
    <a href="./flow_diagram.html">Return to Flow Diagram page</a>

<script src="../js-scripts/global-initialise.js"></script>
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
            let response = await fetch(dfm.phpPath + "users/reset_password.php", {
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