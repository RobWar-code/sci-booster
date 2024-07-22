const login = {
    loadLoginModal: async function () {
        document.getElementById("loginDetails").style.display = "block";
        document.getElementById("loginOptionsDiv").style.display = "block";
        
        if (dfm.userStatus === "unregistered") {
            document.getElementById("loginOpt").style.display = "block";
            document.getElementById("logoutOpt").style.display = "none";
            document.getElementById("signupOpt").style.display = "block";
            document.getElementById("editorSignupOpt").style.display = "block";
            // Check whether the owner has been set already
            let ownerSet = false;
            try {
                ownerSet = await this.isOwnerSet();
            }
            catch (e) {
                console.log("Problem with ownerSet call", e);
                return;
            }
            if (!ownerSet) {
                document.getElementById("ownerSignupOpt").style.display = "block";
            }
            else {
                document.getElementById("ownerSignupOpt").style.display = "none";
            }
        }
        else if (dfm.userStatus === "user") {
            document.getElementById("loginOpt").style.display = "none";
            document.getElementById("logoutOpt").style.display = "block";
            document.getElementById("signupOpt").style.display = "none";
            document.getElementById("editorSignupOpt").style.display = "block";
            document.getElementById("ownerSignupOpt").style.display = "none";
        }
        else {
            console.log("Got Here");
            document.getElementById("loginOpt").style.display = "none";
            document.getElementById("logoutOpt").style.display = "block";
            document.getElementById("signupOpt").style.display = "none";
            document.getElementById("editorSignupOpt").style.display = "none";
            document.getElementById("ownerSignupOpt").style.display = "none";
        }

        // Hide the login options
        document.getElementById("signupDiv").style.display = "none";
    },

    doLoginOpt: function (loginOpt) {
        // Clear the signup options display
        document.getElementById("loginOptionsDiv").style.display = "none";

        // Logout Selected
        if (loginOpt === "logout") {
            document.getElementById("loginDetails").style.display = "none";
            dfm.username = "";
            dfm.userStatus = "unregistered";
            if (dfm.modelEditMode = "edit") dfm.modelEditMode = "read-only";
            dfm.loginOption = "";
            flowModelPage.displayModelEditOptions();
            return;
        }

        // Display the signup/login form
        document.getElementById("signupDiv").style.display = "block";
        document.getElementById("loginErrorsPara").style.display = "none";
        document.getElementById("loginDonePara").style.display = "none";

        // Clear any residual text
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("editorKey").value = "";

        if (loginOpt === "editor") {
            document.getElementById("editorKeyDiv").style.display = "block";
        }
        else {
            document.getElementById("editorKeyDiv").style.display = "none";
        }
        dfm.loginOption = loginOpt;
    },

    submitSignup: async function (event) {
        event.preventDefault();

        if (dfm.loginOption === "") {
            console.error("No login option set");
            return;
        }

        // Validate the username and password
        let errElem = document.getElementById("loginErrorsPara");
        let username = document.getElementById("username").value;
        username = Misc.stripHTML(username);
        if (username === "") {
            errElem.innerText = "Empty or invalid username";
            errElem.style.display = "block";
            return;
        }
        let password = document.getElementById("password").value;
        password = Misc.stripHTML(password);
        if (password === "") {
            errElem.innerText = "Empty or invalid password";
            errElem.style.display = "block";
            return;
        }

        if (dfm.loginOption != "login") {
            let editorKey = "";
            if (dfm.loginOption === "editor") {
                editorKey = document.getElementById("editorKey").value;
                editorKey = Misc.stripHTML(editorKey);
                if (editorKey === "") {
                    errElem.innerText = "Empty or invalid editor key";
                    errElem.style.display = "block";
                    return;        
                }
            }

            let signupObj = {
                request: "addUser",
                username: username,
                password: password,
                status: dfm.loginOption,
                editor_key: editorKey
            }

            let userAdded = false;
            try {
                let responseObj = await addUser(signupObj);
                if ("error" in responseObj) {
                    errElem.innerText = "addUser Problem: " + responseObj.error;
                    errElem.style.display = "block";
                }
                else {
                    userAdded = true;
                }
            }
            catch { (error) => {
                console.error("submitSignup() error with addUser(): ", error);
            }}

            if (userAdded) {
                let messageElem = document.getElementById("loginDonePara");
                messageElem.style.display = "block";
                setTimeout(() => {
                    messageElem.style.display = "none";
                    document.getElementById("loginDetails").style.display = "none";
                }, 3000);
                dfm.userStatus = dfm.loginOption;
                dfm.username = username;
                dfm.loginOption = "";
                flowModelPage.displayModelEditOptions();            
            }
        }
        else {
            // Login Request
            let loginObj = {
                request: "login",
                username: username,
                password: password
            }
            resultObj = await this.doLoginRequest(loginObj);
            if (!resultObj.result) {
                errElem.innerText = resultObj.error;
                errElem.style.display = "block";
            }
            else {
                let messageElem = document.getElementById("loginDonePara");
                messageElem.style.display = "block";
                setTimeout(() => {
                    messageElem.style.display = "none";
                    document.getElementById("loginDetails").style.display = "none";
                }, 3000);
                dfm.userStatus = resultObj.user.status;
                dfm.username = username;
                dfm.loginOption = "";
                flowModelPage.displayModelEditOptions();            
            }
        }
    },

    dismissLoginDetails: function () {
        document.getElementById("loginDetails").style.display = "none";
    },

    // PHP Interfaces
    addUser: async function(signupObj) {
        try {
            let response = await fetch(dfm.phpPath + 'users/add-user.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupObj)
            })

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("Problem with addUser script call", error);
            return {result: false, error: "addUser Systems Error"};
        }};

    },

    isOwnerSet: async function () {
        let requestObj = {request: "ownerSet"};
        try {
            let response = await fetch(dfm.phpPath + 'users/owner-set.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestObj)
            })

            let responseData = await response.json();

            console.log("responseData:", responseData);
            if (!responseData.result) {
                if (error in responseData) {
                    console.error("isOwnerSet error: ", responseData.error);
                }
                return false;
            }
            else {
                return true;
            }
        }
        catch {(error) => {
            console.error("Problem with isOwnerSet script call", error);
            return false;
        }};

    },

    doLoginRequest: async function (loginObj) {
        try {
            let response = await fetch(dfm.phpPath + 'users/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginObj)
            })

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("Problem with login script call", error);
            return {result: false, error: "login Systems Error"};
        }};
    }
}