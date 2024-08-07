const flowModelPage = {

    displayModelEditOptions: function () {
        if (dfm.flowDrawMode) {
            document.getElementById("flowDoneButton").style.display = "inline";
            document.getElementById("cancelFlowDrawButton").style.display = "inline";
            document.getElementById("saveModelButton").style.display = "none";
            document.getElementById("newModelButton").style.display = "none";
            document.getElementById("editModelButton").style.display = "none";
            document.getElementById("deleteModelButton").style.display = "none";
        }
        else if (dfm.userStatus === "unregistered") {
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
                if (dfm.modelEditMode === "edit") {
                    document.getElementById("editModelButton").style.display = "none";
                }
                else {
                    document.getElementById("editModelButton").style.display = "inline";
                }
                if (dfm.currentPage.page.id === null) {
                    document.getElementById("deleteModelButton").style.display = "none";
                }
                else {
                    document.getElementById("deleteModelButton").style.display = "inline";
                }
                document.getElementById("saveModelButton").style.display = "inline";
            }
        }
        if (dfm.currentPageSet) {
            if (dfm.currentPage.page.hierarchical_id.length > 2) {
                document.getElementById("zoomBackButton").style.display = "inline";
            }
            else {
                document.getElementById("zoomBackButton").style.display = "none";
            }
            document.getElementById("cancelModelButton").style.display = "inline";
        }
        else {
            document.getElementById("zoomBackButton").style.display = "none";
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
            window.scrollTo(0, 0);
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
    },

    zoomPage: async function(event) {
        event.cancelBubble = true;
        // Check whether the current page should be saved
        if (dfm.modelEditMode && dfm.modelChanged) {
            let response = await this.saveModelRequired(`Save Page - ${dfm.currentPage.page.title}`);
            if (response === "yes") {
                let reload = true;
                dfm.currentPage.saveModel(reload);             
            }
            else if (response != "no") {
                return;
            }
        }

        // Get the hierarchical id, flow model id and flow model title
        // To construct the search
        let nodeNum = event.target.getAttr("nodeNum");
        let hierarchicalId = dfm.currentPage.page.hierarchical_id + nodeNum;
        let flowModelId = dfm.currentPage.flow_model_id;
        let flowModelTitle = dfm.currentPage.flow_model_title;
        let node = dfm.currentPage.getNode(nodeNum);
        let nodeLabel = node.label;
        let response = await this.fetchZoomPage(flowModelId, flowModelTitle, hierarchicalId);
        this.doZoomPage("in", response);
    },

    fetchZoomPage: async function(flowModelId, flowModelTitle, hierarchicalId) {
        let requestObj = {
            request: "zoom page",
            flow_model_id: flowModelId,
            flow_model_title: flowModelTitle,
            hierarchical_id: hierarchicalId
        };
        let requestJSON = JSON.stringify(requestObj);
        try {
            let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestJSON
            })

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("Problem with receive-page script call", error);
            return {result: false, error: "Zoom Page - server error"};
        }};
    },

    zoomBack: async function() {
        // Check whether the current page is deeper than level 1
        if (!dfm.currentPageSet) return;
        if (dfm.currentPage.page.hierarchicalId.length === 2) return;

        // Check whether the current page should be saved
        if (dfm.modelEditMode && dfm.modelChanged) {
            let response = await this.saveModelRequired(`Save Page - ${dfm.currentPage.page.title}`);
            if (response === "yes") {
                let reload = true;
                dfm.currentPage.saveModel(reload);             
            }
            else if (response != "no") {
                return;
            }
        }

        // Get the hierarchical id for the parent page
        let hierarchicalId = dfm.currentPage.page.hierarchicalId;
        hierarchicalId = hierarchicalId.substring(0, hierarchicalId.length - 2);
        let modelTitle = dfm.currentPage.flow_model_title;
        let modelId = dfm.currentPage.flow_model_id;
        let response = await this.fetchZoomPage(modelId, modelTitle, hierarchicalId);
        doZoomPage("back", response);
    },

    doZoomPage: function(direction, response) {
        if (!("error" in response)) {
            if (response.got_page) {
                dfm.currentVisual.destroyCurrentPage();
                dfm.currentPage = new dfm.FlowPageData();
                dfm.currentVisual = new dfm.FlowVisuals();
                dfm.currentPage.setPageData(response);
                dfm.currentPage.update = true;
                dfm.currentVisual.redoPage();
                dfm.currentPageSet = true;
                dfm.modelChanged = false;
                dfm.modelEditMode = "read-only";
                // Set main page details
                document.getElementById("flowModelTitle").innerText = dfm.currentPage.flow_model_title;
                document.getElementById("pageHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
                document.getElementById("pageTitle").innerText = dfm.currentPage.page.title;

                document.getElementById("modelDetails").style.display = "block";
                document.getElementById("pageDetailsButton").style.display = "inline";
                if (dfm.userStatus === "editor" || dfm.userStatus === "owner" || dfm.currentPage.isUserAuthor()) {
                  document.getElementById("editModelButton").style.display = "inline";
                }
                document.getElementById("cancelModelButton").style.display = "inline";
                flowModelPage.showSaveOnPageEdit(true);
                modelDetails.setReadOnlyDisplay();
                modelDetails.loadModelDetails();
            }
            else if (direction === "in") {
                // Check whether the use has edit permissions
                if (dfm.modelEditMode === "edit") {
                    // New page to start
                    dfm.currentVisual.destroyCurrentPage();
                    dfm.currentPageSet = false;
                    dfm.modelChanged = false;
                    dfm.currentPage = new dfm.FlowPageData();
                    dfm.currentPage.flow_model_title = flowModelTitle;
                    dfm.currentPage.flow_model_id = flowModelId;
                    dfm.currentPage.page.title = nodeLabel;
                    dfm.currentPage.page.hierarchical_id = hierarchicalId;
                    dfm.currentVisual = new dfm.FlowVisuals();
                    // Set main page details
                    document.getElementById("flowModelTitle").innerText = flowModelTitle;
                    document.getElementById("pageHierarchicalId").innerText = hierarchicalId;
                    document.getElementById("pageTitle").innerText = "Not Defined";
                    modelDetails.newModel();
                }
            }
            else {
                console.error("doZoomPage: hierarchical owner page not found.");
            }
        }
    }
}