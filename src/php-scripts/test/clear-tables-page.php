<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clear Tables</title>
</head>
<body>
    <h1>Clear Sci-Booster Tables</h1>
    <form onsubmit="doClear(event)">
        <label for="passKey">Key</label>
        <input type="text" id="passKey" name="passKey">
        <button type="submit">Submit</button> 
    </form>
    <p id="report"></p>
<script>
    async function doClear(event) {
        event.preventDefault();
        let passKey = document.getElementById("passKey").value;
        let obj = {pass_key: passKey};
        let jsonMessage = JSON.stringify(obj);
        try {
            response = await fetch("./clear-tables.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonMessage
            });
            let responseData = await response.json();
            console.log("responseData:", responseData);
            if (responseData.result === false) {
                document.getElementById("report").innerText = "Clear Tables Failed: " + responseData.status;
            }
            else {
                document.getElementById("report").innerText = "Clear Tables Succeeded";
            }
        }
        catch {(error) => {
            document.getElementById("report").innerText = "Problem loading script";
        }};
    }
</script>
</body>
</html>