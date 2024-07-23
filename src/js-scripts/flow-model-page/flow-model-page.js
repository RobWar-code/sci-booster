const flowModelPage = {

    displayModelEditOptions: function () {
        if (dfm.userStatus === "unregistered") {
            if (dfm.currentPageSet) {
                document.getElementById("cancelModelButton").style.display = "inline";
                this.clearFlowModelEditMessage();
            }
            else {
                document.getElementById("cancelModelButton").style.display = "none";
            }
            document.getElementById("modelEditInfo").style.display = "block";
            document.getElementById("newModelButton").style.display = "none";
            document.getElementById("editModelButton").style.display = "none";
            document.getElementById("deleteModelButton").style.display = "none";
            document.getElementById("saveModelButton").style.display = "none";
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
                document.getElementById("cancelModelButton").style.display = "inline";
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
                document.getElementById("newModelButton").style.display = "inline";
                document.getElementById("editModelButton").style.display = "inline";
                document.getElementById("deleteModelButton").style.display = "none";
                document.getElementById("saveModelButton").style.display = "none";
                document.getElementById("cancelModelButton").style.display = "inline";
            }
        }
        if (dfm.currentPageSet) {
            document.getElementById("cancelModelButton").style.display = "inline";
        }
        else {
            document.getElementById("cancelModelButton").style.display = "none";
        }
    },

    cancelModel: function () {
        dfm.stageApp.destroyChildren();
        dfm.currentVisualsSet = false;
        dfm.currentVisual = {};
        dfm.currentPage = {};
        dfm.currentPageSet = false;
        dfm.modelEditMode = "read-only";
        document.getElementById("flowModelTitle").innerText = "NONE";
        document.getElementById("pageTitle").innerText = "NONE";
        this.clearFlowModelEditMessage();
        this.displayModelEditOptions();
    },

    displayFlowModelEditMessage: function () {
        let s = "Click the stage to add flow component nodes.";
        s += " Click the option buttons on a node to choose more actions.";
        s += " Double click a flow label to edit the flow";
        document.getElementById("instructionsText").innerText = s;
        document.getElementById("instructionsText").style.display = "block";
    },

    clearFlowModelEditMessage: function () {
        document.getElementById("instructionsText").innerText = "";
        document.getElementById("instructionsText").style.display = "none";
    },

    getModelSelectionList: async function () {
        let modelTitles = [];
        modelTitles = await this.fetchModelList();
        if (modelTitles.length > 0) {
            modelTitles.sort();
            // Insert the none selected item at the start of the array
            modelTitles.unshift("NONE SELECTED");
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
    },

    /**
     * Set the model changed flag and display save button as required.
     * If the start parameter is true, the save button is hidden and the
     * model changed flag set to false.
     * @param {*} start 
     */
    showSaveOnPageEdit: function(start) {
        if (start) {
            dfm.modelChanged = false;
            document.getElementById("saveModelButton").style.display = "none";
        }
        else {
            if (!dfm.modelChanged) {
                dfm.modelChanged = true;
                document.getElementById("saveModelButton").style.display = "inline";
            }
        }
    },

    showYesNoModal: function(message) {
        return new Promise((resolve, reject) => {
            document.getElementById("yesNoModal").style.display = "block";
            document.getElementById("yesNoText").innerText = message;
            
            // Set-up event listeners for buttons
            document.getElementById("modalYes").addEventListener('click', () => {
                resolve('yes');
                document.getElementById("yesNoModal").style.display = "none";
            });

            document.getElementById("modalNo").addEventListener('click', () => {
                resolve('no');
                document.getElementById("yesNoModal").style.display = "none";
            });

            document.getElementById("modalCancel").addEventListener('click', () => {
                resolve('cancel');
                document.getElementById("yesNoModal").style.display = "none";
            });
        });
    },

    saveModelRequired: async function(message) {
        try {
            let response = await this.showYesNoModal(message);
            return response;
        }
        catch(error) {
            console.error("saveModelRequired: could not collect response ", error);
            return "cancel";
        }
    },

    deletePageRequired: async function(message) {
        try {
            let response = await this.showYesNoModal(message);
            return response;
        }
        catch(error) {
            console.error("deletePageRequired: could not collect response ", error);
            return "cancel";
        }
    }


}