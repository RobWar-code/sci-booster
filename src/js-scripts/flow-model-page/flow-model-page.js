const flowModelPage = {

    iAmHere: "hello",

    displayModelEditOptions: function () {
        if (dfm.userStatus === "unregistered") {
            document.getElementById("modelEditOptionsDiv").style.display = "none";
            document.getElementById("modelEditInfo").style.display = "block";
        }
        else if (dfm.userStatus === "user") {
            document.getElementById("modelEditOptionsDiv").style.display = "block";
            document.getElementById("modelEditInfo").style.display = "none";
            // Check whether a model is loaded, and if it is, whether the user is the author
            if (!dfm.currentPageSet) {
                document.getElementById("newModelButton").style.display = "inline";
                document.getElementById("editModelButton").style.display = "none";
                document.getElementById("deleteModelButton").style.display = "none";
                document.getElementById("saveModelButton").style.display = "none";
            }
        }
        else if (dfm.userStatus === "editor" || dfm.userStatus === "owner") {
            document.getElementById("modelEditOptionsDiv").style.display = "block";
            document.getElementById("modelEditInfo").style.display = "none";
            // Check whether a model is loaded
            if (!dfm.currentPageSet) {
                document.getElementById("newModelButton").style.display = "inline";
                document.getElementById("editModelButton").style.display = "none";
                document.getElementById("deleteModelButton").style.display = "none";
                document.getElementById("saveModelButton").style.display = "none";
            }
            else {
                // Display options for current model
            }
        }
        if (dfm.modelEditMode) {
            document.getElementById("cancelModelButton").style.display = "inline";
        }
        else {
            document.getElementById("cancelModelButton").style.display = "none";
        }
    },

    cancelModel: function () {
        dfm.stageApp.destroyChildren();
        dfm.currentVisual = {};
        dfm.currentPage = {};
        dfm.currentPageSet = false;
        dfm.modelEditMode = false;
        document.getElementById("flowModelTitle").innerText = "NONE";
        document.getElementById("pageTitle").innerText = "NONE";
        this.displayModelEditOptions();
    },

    displayFlowModelEditMessage: function () {
        let s = "Click the stage to add flow component nodes.";
        s += " Click the option buttons on a node to choose more actions.";
        s += " Click a flow label to edit the flow";
        document.getElementById("instructionsText").innerText = s;
        document.getElementById("instructionsText").style.display = "block";
    },

    getModelSelectionList: async function () {
        let modelTitles = [];
        modelTitles = await this.fetchModelList();
        console.log("modelTitles", modelTitles);
        if (modelTitles.length > 0) {
            modelTitles.sort();
            let modelSelector = document.getElementById("modelSelector");
            modelSelector.innerHTML = "";
            for (let title of modelTitles) {
                let opt = document.createElement('option');
                opt.value = title;
                opt.text = title;
                modelSelector.appendChild(opt);
            }
        }
    },
    
    fetchModelList: async function() {
        let modelTitles = [];
        let request = {request: "model title list"};
        try {
            response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
    
            let responseData = await response.json();
    
            if (responseData.result) {
                if (responseData.result) {
                    modelTitles = responseData.modelTitles;
                    console.log("Got model titles:", modelTitles);
                }
            }
            return modelTitles;
        }
        catch(error) {
            console.error(`fetchModelList: Could not fetch model titles ${error}`);
            return modelTitles;
        }
    },

    issueNotice: function (message) {
        let noticeDiv = document.getElementById("noticeRow");
        noticeDiv.style.display = "block";
        let noticeElem = document.getElementById("noticeText");
        noticeElem.innerText = message;
        let noticeTimer = setTimeout(() => {
            noticeElem.innerText = "";
            noticeDiv.style.display = "none";
        }, 3000);
    },

    dismissWarning: function() {
        document.getElementById("warningRow").style.display = "none";
    }

    
}