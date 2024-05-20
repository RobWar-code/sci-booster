flowDetails = {
    flowDetailsSet: false,
    flowFormulasOpen: false,

    addNewFlow: function (event) {
        if (dfm.currentVisual.flowDrawMode) {
            event.cancelBubble = true;
            return;
        }
        this.displayFlowModal("new");
        this.flowDetailsSet = false;
        this.flowFormulasOpen = false;
    },

    displayFlowModal: function(editMode) {
        if (editMode === "new") {
            this.clearValues();
            this.setDisableFlowDetailsEdit(false);
        }
        document.getElementById("flowDetails").style.display = "block";
        document.getElementById("flowDetailsError").style.display = "none";
        document.getElementById("formulaToggleWarning").style.display = "none";
    },

    clearValues: function () {
        let flowNum = dfm.currentPage.getNextFlowNum();
        document.getElementById("flowNum").innerText = flowNum;
        document.getElementById("flowLabel").value = "";
        document.getElementById("flowSourceNodeNum").value = "";
        document.getElementById("flowDestinationNodeNum").value = "";
        document.getElementById("flowKeywords").value = "";
        document.getElementById("flowDefinition").value = "";
        document.getElementById("flowHypertext").value = "";
        document.getElementById("flowFormula").value = "";
        document.getElementById("flowFormulaDescription").value = "";
    },

    setDisableFlowDetailsEdit: function (setting) {
        document.getElementById("flowLabel").disabled = setting;
        document.getElementById("flowSourceNodeNum").disabled = setting;
        document.getElementById("flowDestinationNodeNum").disabled = setting;
        document.getElementById("flowKeywords").disabled = setting;
        document.getElementById("flowDefinition").disabled = setting;
        document.getElementById("flowHypertext").disabled = setting;
        document.getElementById("flowFormula").disabled = setting;
        document.getElementById("flowFormulaDescription").disabled = setting;
        if (setting) {
            document.getElementById("flowDetailsSubmit").style.display = "none";
            document.getElementById("flowFormula").style.display = "none";
            document.getElementById("flowFormulaDescription").style.display = "none";
            document.getElementById("flowFormulaSubmit").style.display = "none";
        }
    },

    submitFlowDetails: function (event) {
        event.preventDefault();
        console.log("Got to submit flow details");
        let errElem = document.getElementById("flowDetailsError");
        errElem.style.display = "none";
        // Check values
        let label = Misc.stripHTML(document.getElementById("flowLabel").value);
        if (label === "") {
            errElem.innerText = "Label not entered";
            errElem.style.display = "block";
            return;
        }
        let flow = new dfm.Flow();
        flow.flow_num = document.getElementById("flowNum").innerText;
        flow.label = label;
        let sourceNodeNum = Misc.stripHTML(document.getElementById("flowSourceNodeNum").value);
        // Check whether the given node num exists
        if (sourceNodeNum != "") {
            if (!dfm.currentPage.nodeExists(nodeNum)) {
                errElem.innerText = "Source Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            flow.source_node_num = sourceNodeNum; 
        }
        let destinationNodeNum = Misc.stripHTML(document.getElementById("flowDestinationNodeNum").value);
        // Check whether the given node num exists
        if (destinationNodeNum != "") {
            if (!dfm.currentPage.nodeExists(nodeNum)) {
                errElem.innerText = "Destination Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            flow.destination_node_num = destinationNodeNum;
        }
        let keywords = Misc.stripHTML(document.getElementById("flowKeywords").value);
        flow.keywords = keywords;
        let definition = Misc.stripHTML(document.getElementById("flowDefinition").value);
        flow.definition = definition;
        let hypertext = Misc.stripHTML(document.getElementById("flowHypertext").value);
        flow.hypertext = hypertext;
        dfm.currentPage.addFlow(flow);
        this.flowDetailsSet = true;       
    },

    toggleConversionFormulas: function () {
        if (this.flowFormulasOpen) {
            document.getElementById("flowFormulasDiv").style.display = "none";
            return;
        }
        if (!this.flowDetailsSet) {
            document.getElementById("formulaToggleWarning").style.display = "block";
            setTimeout(() => {
                document.getElementById("fomulaToggleWarning").style.display = "none";
            }, 4000);
            return;
        }
        this.displayFlowFormulas();
    },

    displayFlowFormulas: function () {
        this.flowFormulasOpen = true;
        let formulasListElem = document.getElementById("flowFormulasListDiv");
        let listHtml = '<ul class="modalFormList" id="flowFormulasList">';
        let count = 0;
        for (flow of dfm.currentPage.page.flows) {
          listHtml += '<li>';
          listHtml += `<div data-item="${count}" onclick="flowDetails.deleteFormula(event)">`;
          listHtml += `<p class="modalFormListItem">Formula: ${flow.formula}</p>`;
          listHtml += `<p class="modalFormListItem">Description: ${flow.description}</p>`;
          listHtml += '<hr class="modalListHR" />';
          listHtml += '</div>';
          listHtml += '</li>';
        }
        listHtml += '</ul>';
        formulasListElem.innerHTML = listHtml;
        formulasListElem.style.display = "block";
    },

    deleteFormula: function(event) {
        let itemNum = parseInt(event.target.dataset.item);
        dfm.currentPage.deleteFlowItem(itemNum);
        this.displayFlowFormulas();
    }
}