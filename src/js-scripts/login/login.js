const login = {
    loadLoginModal: async function () {
        // Check whether edit mode
        if (dfm.modelEditMode === "edit" && dfm.modelChanged && !dfm.flowDrawMode) {
            message = "Edit mode active - save current page?";
            let response = await flowModelPage.saveModelRequired(message);
            if (response === "yes") {
                let reload = true;
                await dfm.currentPage.saveModel(reload);
            }
            else if (response === "cancel") return;
        }
        else if (dfm.flowDrawMode) {
            if (!dfm.currentVisual.checkFlowDrawing()) {
                document.getElementById("warningRow").style.display = "block";
                document.getElementById("warningText").innerText = "Please complete the flow (done) before changing login";
                let timerItem = setTimeout(() => {
                    document.getElementById("warningRow").style.display = "none";
                }, 4000);
                return;
            }
            else {
                message = "Set flow to done and save page?";
                let response = await flowModelPage.saveModelRequired(message);
                if (response === "yes") {
                    dfm.currentVisual.flowDone();
                    let reload = true;
                    await dfm.currentPage.saveModel(reload);
                }
                else if (response === "no") {
                    dfm.currentVisual.flowDone();
                }
                else if (response === "cancel") return;
            }
        }
        dfm.modelEditMode = "read-only";
        dfm.modelChanged = false;
    
        window.scrollTo(0, 0);
        document.getElementById("loginDetails").style.display = "block";
        document.getElementById("loginOptionsDiv").style.display = "block";
        
        if (dfm.userStatus === "unregistered") {
            document.getElementById("loginOpt").style.display = "block";
            document.getElementById("logoutOpt").style.display = "none";
            document.getElementById("signupOpt").style.display = "block";
            document.getElementById("editorSignupOpt").style.display = "block";
            document.getElementById("profileOpt").style.display = "none";
            // Check whether the owner has been set already
            let ownerSet = false;
            try {
                ownerSet = await this.isOwnerSet();
            }
            catch (e) {
                console.error("Problem with ownerSet call", e);
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
            document.getElementById("profileOpt").style.display = "block";
        }
        else {
            document.getElementById("loginOpt").style.display = "none";
            document.getElementById("logoutOpt").style.display = "block";
            document.getElementById("signupOpt").style.display = "none";
            document.getElementById("editorSignupOpt").style.display = "none";
            document.getElementById("ownerSignupOpt").style.display = "none";
            document.getElementById("profileOpt").style.display = "block";
        }

        // Hide the login options
        document.getElementById("signupDiv").style.display = "none";
    },

    doLoginOpt: async function (loginOpt) {
        // Clear the signup options display
        document.getElementById("loginOptionsDiv").style.display = "none";

        // Logout Selected
        if (loginOpt === "logout") {
            document.getElementById("loginDetails").style.display = "none";
            dfm.username = "";
            dfm.userStatus = "unregistered";
            if (dfm.modelEditMode === "edit") dfm.modelEditMode = "read-only";
            dfm.loginOption = "";
            flowModelPage.displayModelEditOptions();
            return;
        }

        // Display the signup/login form
        document.getElementById("signupDiv").style.display = "block";
        if (loginOpt === "login") {
            document.getElementById("forgotPasswordButton").style.display = "block";
            document.getElementById("emailDiv").style.display = "none";
        }
        else if (loginOpt === "profile") {
            document.getElementById("emailDiv").style.display = "block";
        }
        else {
            document.getElementById("forgotPasswordButton").style.display = "none";
            document.getElementById("emailDiv").style.display = "block";
        }
        document.getElementById("loginErrorsPara").style.display = "none";
        document.getElementById("loginDonePara").style.display = "none";

        let userDetails = null;
        if (loginOpt === "profile") {
            // Fetch the user details from the user table
            userDetails = await this.fetchUserDetails(dfm.username);
            if (userDetails != null) {
                document.getElementById("username").value = dfm.username;
                document.getElementById("email").value = userDetails.email;
                document.getElementById("password").value = "XXXABCDE";
                document.getElementById("currentPasswordDiv").style.display = "block";
            } 
        }
        else {
            document.getElementById("currentPasswordDiv").style.display = "none";
            // Clear any residual text
            document.getElementById("username").value = "";
            document.getElementById("username").disabled = false;
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
            document.getElementById("editorKey").value = "";
        }

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
        let usernamePattern = /^[a-zA-Z0-9]+$/
        if (!usernamePattern.test(username)) {
            errElem.innerText = "Empty or invalid username";
            errElem.style.display = "block";
            return;
        }
        let email = "";
        if (dfm.loginOption != "login") {
            email = document.getElementById("email").value;
            if (!miscHTML.validateEmail(email)){
                errElem.innerText = "Invalid Email Address";
                errElem.style.display = "block";
            }
        }

        let password = document.getElementById("password").value;
        let passwordChanged = false;
        password = Misc.stripHTML(password);
        if (password === "") {
            errElem.innerText = "Empty or invalid password";
            errElem.style.display = "block";
            return;
        }
        if (password != "XXXABCDE") {
            passwordChanged = true;
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

            let userAdded = false;
            let userUpdated = false;
            if (dfm.loginOption != "profile") {
                let signupObj = {
                    request: "addUser",
                    username: username,
                    email: email,
                    password: password,
                    status: dfm.loginOption,
                    editor_key: editorKey
                }

                let responseObj = await this.addUser(signupObj);   
                if ("error" in responseObj) {
                    errElem.innerText = "addUser Problem: " + responseObj.error;
                    errElem.style.display = "block";
                    return;
                }
                else {
                    userAdded = true;
                }
            }
            else {
                // Profile Resubmission
                // Check the current password
                let oldPassword = document.getElementById("currentPassword").value;
                if (oldPassword === "") {
                    errElem.innerText = "Missing current(old) password";
                    return;
                }
                let loginObj = {
                    request: "login",
                    username: dfm.username,
                    password: oldPassword
                }
                let resultObj = await this.doLoginRequest(loginObj);
                if (!resultObj.result) {
                    errElem.innerText = resultObj.error;
                    errElem.style.display = "block";
                    return;
                }
    
                let signupObj = {
                    request: "update user",
                    old_username: dfm.username,
                    username: username,
                    email: email,
                    password: password,
                    password_entered: passwordChanged
                }

                let responseObj = await this.updateUser(signupObj);   
                if (!responseObj.result) {
                    errElem.innerText = "updateUser Problem: " + responseObj.status;
                    errElem.style.display = "block";
                    return;
                }
                else {
                    dfm.username = username;
                    userUpdated = true;
                }
            }
            if (userAdded || userUpdated) {
                let messageElem = document.getElementById("loginDonePara");
                messageElem.innerText = "User Added/Updated";
                messageElem.style.display = "block";
                setTimeout(() => {
                    messageElem.style.display = "none";
                    document.getElementById("loginDetails").style.display = "none";
                }, 3000);
                if (dfm.loginOption != "profile") dfm.userStatus = dfm.loginOption;
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
                messageElem.innerText = "LOGIN DONE";
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
    },

    forgotPassword: async function () {
        // Check whether a user name has been entered
        let username = document.getElementById("username").value;
        if (username === "") {
            document.getElementById("loginErrorsPara").innerText = "Username not submitted";
            document.getElementById("loginErrorsPara").style.display = "block";
            return;
        }
        // Send email link to user
        let messageObj = {username: username};
        let messageJson = JSON.stringify(messageObj);
        try {
            let response = await fetch(dfm.phpPath + "users/forgot-password.php", {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: messageJson
            });

            let responseData = await response.json();
            if (!responseData.result) {
                document.getElementById("loginErrorsPara").innerText = responseData.status;
                document.getElementById("loginErrorsPara").style.display = "block";
            }
            else {
                document.getElementById("loginErrorsPara").style.display = "none";
                document.getElementById("loginDonePara").innerText = "Email with link for new password, sent to your address";
                document.getElementById("loginDonePara").style.display = "block";
            }
        }
        catch { (error) => {
            console.log("Problem with password server call: " + error);
            return;
        }}
    },

    fetchUserDetails: async function(username) {
        let userDetails = null;
        let requestObj = {
            request: 'fetch user',
            username: username
        };
        let requestJSON = JSON.stringify(requestObj);
        try {
            let response = await fetch(dfm.phpPath + "users/fetch-user.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestJSON
            });

            let responseData = await response.json();

            if (!responseData.result) {
                document.getElementById("loginErrorsPara").innerText = "fetchUserDetails: Problem encountered" + responseData.status;
            }
            else {
                userDetails = responseData.data;
            }
        }
        catch { (error) => {
            document.getElementById("loginErrorsPara").innerText = "fetchUserDetails: Error encountered - " + error;
        }}

        return userDetails;
    },

    updateUser: async function (userDetails) {
        let userDetailsJSON = JSON.stringify(userDetails);
        try {
            let response = await fetch(dfm.phpPath + "users/update-user.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: userDetailsJSON
            });

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("got to update problem");
            let response = {result: false, status: "updateUser: Problem with update - " + error};
            return response;
        }}
    }
}