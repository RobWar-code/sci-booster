const flowModelPage = {

    displayModelEditOptions: function () {
        if (dfm.flowDrawMode) {
            document.getElementById("flowDoneButton").style.display = "inline";
            document.getElementById("cancelFlowDrawButton").style.display = "inline";
            document.getElementById("cancelModelButton").style.display = "inline";
            document.getElementById("saveModelButton").style.display = "none";
            document.getElementById("newModelButton").style.display = "none";
            document.getElementById("editModelButton").style.display = "none";
            document.getElementById("deleteModelButton").style.display = "none";
            document.getElementById("importModelButton").style.display = "none";
        }
        else {
            document.getElementById("flowDoneButton").style.display = "none";
            document.getElementById("cancelFlowDrawButton").style.display = "none";
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
                document.getElementById("importModelButton").style.display = "none";
                document.getElementById("exportModelButton").style.display = "none";
            }
            else if (dfm.userStatus === "user") {
                document.getElementById("modelEditOptionsDiv").style.display = "block";
                document.getElementById("modelEditInfo").style.display = "none";
                document.getElementById("importModelButton").style.display = "inline";
                // Check whether a model is loaded, and if it is, whether the user is the author
                if (!dfm.currentPageSet) {
                    document.getElementById("newModelButton").style.display = "inline";
                    document.getElementById("editModelButton").style.display = "none";
                    document.getElementById("deleteModelButton").style.display = "none";
                    document.getElementById("saveModelButton").style.display = "none";
                    document.getElementById("pageDetailsButton").style.display = "none";
                    document.getElementById("exportModelButton").style.display = "none";
                }
                else {
                    // Check whether the user is an author of the current page
                    if (dfm.currentPage.isUserAuthor()) {
                        if (dfm.modelEditMode != "edit") {
                            document.getElementById("editModelButton").style.display = "inline";
                        }
                        else {
                            document.getElementById("editModelButton").style.display = "none";
                        }
                        document.getElementById("deleteModelButton").style.display = "inline";
                        document.getElementById("saveModelButton").style.display = "inline";
                    }
                    else {
                        document.getElementById("editModelButton").style.display = "none";
                        document.getElementById("deleteModelButton").style.display = "none";
                        document.getElementById("saveModelButton").style.display = "none";
                    }
                    document.getElementById("newModelButton").style.display = "inline";
                    document.getElementById("cancelModelButton").style.display = "inline";
                    document.getElementById("exportModelButton").style.display = "inline";
                }
            }
            else if (dfm.userStatus === "editor" || dfm.userStatus === "owner") {
                document.getElementById("modelEditOptionsDiv").style.display = "block";
                document.getElementById("modelEditInfo").style.display = "none";
                document.getElementById("importModelButton").style.display = "inline";
                // Check whether a model is loaded
                if (!dfm.currentPageSet) {
                    document.getElementById("newModelButton").style.display = "inline";
                    document.getElementById("editModelButton").style.display = "none";
                    document.getElementById("deleteModelButton").style.display = "none";
                    document.getElementById("saveModelButton").style.display = "none";
                    document.getElementById("pageDetailsButton").style.display = "none";
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
        }
    },

    cancelModel: function () {
        dfm.stageApp.destroyChildren();
        dfm.currentVisualsSet = false;
        dfm.currentVisual = {};
        dfm.currentPage = {};
        dfm.currentPageSet = false;
        dfm.modelEditMode = "read-only";
        dfm.flowDrawMode = false;
        document.getElementById("pageSelectorRow").style.display = "none";
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
        let modelSelector = document.getElementById("modelSelector");
        modelSelector.innerHTML = "";
        let modelTitles = [];
        modelTitles = await this.fetchModelList();
        if (modelTitles.length > 0) {
            // Convert the html entity symbols
            adjustedTitles = [];
            for (let title of modelTitles) {
                let adjustedTitle = miscHTML.convertHTMLEntities(title);
                adjustedTitles.push(adjustedTitle);
            }
            adjustedTitles.sort();
            // Insert the none selected item at the start of the array
            adjustedTitles.unshift("NONE SELECTED");
            for (let title of adjustedTitles) {
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

    getSearchList: async function (e) {
        e.preventDefault();
        let searchString = document.getElementById("searchInput").value;
        searchString = Misc.stripHTML(searchString);
        if (searchString === null) return;
        let selectionResponse = await this.fetchSearchSelection(searchString);
        if (selectionResponse.result === true) {
            if (selectionResponse.list.length > 0) {
                // Adjust the html entities in the search results
                for (let listItem of selectionResponse.list) {
                    let text = miscHTML.convertHTMLEntities(listItem.page);
                    listItem.page = text;
                }
                document.getElementById("searchSelectorCol").style.display = "block";
                let elem = document.getElementById("searchSelector");
                elem.innerHTML = "";
                // A null item
                let opt = document.createElement('option');
                opt.value = null;
                opt.text = "None Selected";
                elem.appendChild(opt);
                for (let listItem of selectionResponse.list) {
                    let opt = document.createElement('option');
                    let value = listItem.page_id;
                    let text = listItem.page;
                    text += "; Matched Field: " + listItem.field;
                    if (listItem.field != "page title") {
                        text += "; " + listItem.field_value;
                    }
                    opt.value = value;
                    opt.text = text;
                    elem.appendChild(opt);  
                }
            }
        }
    },

    fetchSearchSelection: async function (searchItem) {
        let requestObj = {
            request: "general search",
            search_item: searchItem
        }
        let requestJSONObj = JSON.stringify(requestObj);
        try {
            response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestJSONObj
            });
    
            let responseData = await response.json();

            return responseData;
        }
        catch(error) {
            console.error(`fetchSearchSelection: Could not fetch selection ${error}`);
            return {result: false};
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
            let response = await this.showYesNoModal(miscHTML.convertHTMLEntities(message));
            return response;
        }
        catch(error) {
            console.error("saveModelRequired: could not collect response ", error);
            return "cancel";
        }
    },

    deleteNodeRequired: async function(message) {
        try {
            let response = await this.showYesNoModal(message);
            return response;
        }
        catch(error) {
            console.error("deleteNodeRequired: could not collect response ", error);
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
        if (dfm.modelEditMode === "edit" && dfm.modelChanged) {
            let response = await this.saveModelRequired(`Save Page - ${dfm.currentPage.page.title}`);
            if (response === "yes") {
                let reload = true;
                dfm.currentPage.saveModel(reload);             
            }
            else if (response === "no") {
                return;
            }
            else {
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
        this.doZoomPage("in", response, hierarchicalId, flowModelId, flowModelTitle, nodeLabel);
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
        if (dfm.currentPage.page.hierarchical_id.length === 2) return;

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
        let hierarchicalId = dfm.currentPage.page.hierarchical_id;
        hierarchicalId = hierarchicalId.substring(0, hierarchicalId.length - 2);
        let modelTitle = dfm.currentPage.flow_model_title;
        let modelId = dfm.currentPage.flow_model_id;
        let response = await this.fetchZoomPage(modelId, modelTitle, hierarchicalId);
        this.doZoomPage("back", response, hierarchicalId, modelId, modelTitle, "");
    },

    doZoomPage: function(direction, response, hierarchicalId, flowModelId, flowModelTitle, nodeLabel) {
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
                hierarchicalId = dfm.currentPage.page.hierarchical_id;
                document.getElementById("flowModelTitle").innerText = 
                    miscHTML.convertHTMLEntities(dfm.currentPage.flow_model_title);
                document.getElementById("pageHierarchicalId").innerText = hierarchicalId;
                document.getElementById("pageTitle").innerText = 
                    miscHTML.convertHTMLEntities(dfm.currentPage.page.title);

                if (hierarchicalId.length > 2) {
                    document.getElementById("zoomBackButton").style.display = "inline";
                }
                else {
                    document.getElementById("zoomBackButton").style.display = "none";
                }
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
                    document.getElementById("flowModelTitle").innerText = miscHTML.convertHTMLEntities(flowModelTitle);
                    document.getElementById("pageHierarchicalId").innerText = hierarchicalId;
                    document.getElementById("pageTitle").innerText = "Not Defined";
                    modelDetails.newModel();
                }
            }
            else {
                console.error("doZoomPage: hierarchical owner page not found.");
            }
        }
    },

    gotoPage: function(pageTitle) {
        // Save the current settings in local storage
        let pageSettings = {
            pageSet: dfm.currentPageSet,
            modelChanged: dfm.modelChanged,
            username: dfm.username, 
            userStatus: dfm.userStatus
        }
        if (dfm.currentPageSet) {
            pageJSONObj = dfm.currentPage.prepareJSONObject();
            pageSettings.page = pageJSONObj;
        }
        settingsJSON = JSON.stringify(pageSettings);
        localStorage.setItem("pageSettings", settingsJSON);
        if (pageTitle === "Introduction") {
            window.location = "./intro.html";
        }
        else if (pageTitle === "Import Help") {
            window.location = "./import-help.html";
        }
    },

    restorePage: function() {
        // Collect the page data from local storage
        let pageSettings = JSON.parse(localStorage.getItem("pageSettings"));
        if (pageSettings) {
            dfm.username = pageSettings.username;
            dfm.userStatus = pageSettings.userStatus;
            dfm.currentPageSet = pageSettings.pageSet;
            if (dfm.currentPageSet) {
                dfm.currentPage = new dfm.FlowPageData();
                dfm.currentPage.setPageData(pageSettings.page);
                dfm.currentVisual = new dfm.FlowVisuals();
                dfm.currentVisual.redoPage();
                dfm.modelChanged = pageSettings.modelChanged;
                // Display titles etc.
                document.getElementById("flowModelTitle").innerText = 
                    miscHTML.convertHTMLEntities(dfm.currentPage.flow_model_title);
                document.getElementById("pageTitle").innerText =
                    miscHTML.convertHTMLEntities(dfm.currentPage.page.title);
                document.getElementById("pageHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
                document.getElementById("pageDetailsButton").style.display = "block";
            }
            if (dfm.userStatus != "unregistered") {
                this.displayModelEditOptions();
            }
        }
    }
}