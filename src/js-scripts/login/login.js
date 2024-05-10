async function loadLoginModal() {
    document.getElementById("loginDetails").display.status = "block";
    if (dfm.userStatus === "unregistered") {
        document.getElementById("loginOpt").display.status = "block";
        document.getElementById("logoutOpt").display.status = "none";
        document.getElementById("signupOpt").display.status = "block";
        document.getElementById("editorSignupOpt").display.status = "block";
        // Check whether the owner has been set already
        let ownerSet = false;
        try {
            ownerSet = await isOwnerSet();
        }
        catch (e) {
            console.log("Problem with ownerSet call", e.message);
            return;
        }
        if (!ownerSet) {
            document.getElementById("ownerSignupOpt").display.status = "block";
        }
        else {
            document.getElementById("ownerSignupOpt").display.status = "none";
        }
    }
    else if (dfm.userStatus === "user") {
        document.getElementById("loginOpt").display.status = "none";
        document.getElementById("logoutOpt").display.status = "block";
        document.getElementById("signupOpt").display.status = "none";
        document.getElementById("editorSignupOpt").display.status = "block";
        document.getElementById("ownerSignupOpt").display.status = "none";
    }
    else {
        document.getElementById("loginOpt").display.status = "none";
        document.getElementById("logoutOpt").display.status = "block";
        document.getElementById("signupOpt").display.status = "none";
        document.getElementById("editorSignupOpt").display.status = "none";
        document.getElementById("ownerSignupOpt").display.status = "none";
    }
}

async function isOwnerSet() {
    let requestObj = {request: "ownerSet"};
    fetch('../../php-scripts/users/owner-set.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestObj)
    })
    .then(response => response.json()) // Parse the JSON response
    .then(responseData => {
        return true;
    })
    .catch((error) => {
        console.error('Error:', error);
        return false;
    });

}