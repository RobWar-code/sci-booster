flowDetails = {
    flowDetailsSet: false,
    flowFormulasOpen: false,
    editMode: "",
    currentFlow: null,

    addNewFlow: function (event) {
        if (dfm.currentVisual.flowDrawMode) {
            event.cancelBubble = true;
            return;
        }
        this.displayFlowModal("new");
        this.flowDetailsSet = false;
        this.flowFormulasOpen = false;
        this.editMode = "new";
        this.currentFlow = new dfm.Flow();
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
        let errElem = document.getElementById("flowDetailsError");
        errElem.style.display = "none";
        // Check values
        let label = Misc.stripHTML(document.getElementById("flowLabel").value);
        if (label === "") {
            errElem.innerText = "Label not entered";
            errElem.style.display = "block";
            return;
        }
        this.currentFlow.flow_num = document.getElementById("flowNum").innerText;
        this.currentFlow.label = label;
        let sourceNodeNum = Misc.stripHTML(document.getElementById("flowSourceNodeNum").value);
        // Check whether the given node num exists
        if (sourceNodeNum != "") {
            if (!dfm.currentPage.nodeExists(sourceNodeNum)) {
                errElem.innerText = "Source Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            this.currentFlow.source_node_num = sourceNodeNum; 
        }
        let destinationNodeNum = Misc.stripHTML(document.getElementById("flowDestinationNodeNum").value);
        // Check whether the given node num exists
        if (destinationNodeNum != "") {
            if (!dfm.currentPage.nodeExists(destinationNodeNum)) {
                errElem.innerText = "Destination Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            this.currentFlow.destination_node_num = destinationNodeNum;
        }
        let keywords = Misc.stripHTML(document.getElementById("flowKeywords").value);
        this.currentFlow.keywords = keywords;
        let definition = Misc.stripHTML(document.getElementById("flowDefinition").value);
        this.currentFlow.definition = definition;
        let hypertext = Misc.stripHTML(document.getElementById("flowHypertext").value);
        this.currentFlow.hypertext = hypertext;
        if (this.editMode === "new") {
            dfm.currentPage.addFlow(this.currentFlow);
            this.editMode = "edit";
        }
        else {
            dfm.currentPage.updateFlow(this.currentFlow);
        }
        this.flowDetailsSet = true;       
    },

    toggleFormulas: function () {
        if (this.flowFormulasOpen) {
            document.getElementById("flowFormulasDiv").style.display = "none";
            return;
        }
        if (!this.flowDetailsSet) {
            document.getElementById("formulaToggleWarning").style.display = "block";
            setTimeout(() => {
                document.getElementById("formulaToggleWarning").style.display = "none";
            }, 4000);
            return;
        }
        document.getElementById("flowFormulasDiv").style.display = "block";
        this.displayFlowFormulas();
        console.log("Got to toggleFormulas");
        if (this.editMode) {
            document.getElementById("flowFormulasInputForm").style.display = "block";
        }
        else {
            document.getElementById("flowFormulasInputForm").style.display = "none";
        }
    },

    displayFlowFormulas: function () {
        this.flowFormulasOpen = true;
        let formulasListElem = document.getElementById("flowFormulasListDiv");
        let listHtml = '<ul class="modalFormList" id="flowFormulasList">';
        let count = 0;
        for (let formula of this.currentFlow.conversion_formulas) {
          listHtml += '<li>';
          listHtml += `<div data-item="${count}" onclick="flowDetails.deleteFormula(event)">`;
          listHtml += `<p class="modalFormListItem">Formula: ${formula.formula}</p>`;
          listHtml += `<p class="modalFormListItem">Description: ${formula.description}</p>`;
          listHtml += '<hr class="modalListHR" />';
          listHtml += '</div>';
          listHtml += '</li>';
          ++count;
        }
        listHtml += '</ul>';
        formulasListElem.innerHTML = listHtml;
        formulasListElem.style.display = "block";
    },

    deleteFormula: function(event) {
        let itemNum = parseInt(event.target.dataset.item);
        this.currentFlow.conversion_formulas.splice(itemNum, 1);
        dfm.currentPage.updateFlow(this.currentFlow);
        this.displayFlowFormulas();
    },

    submitFormula: function(event) {
        event.preventDefault();
        let formula = Misc.stripHTML(document.getElementById("flowFormula").value);
        let description = Misc.stripHTML(document.getElementById("flowFormulaDescription").value);
        if (formula != "") {
            let conversion_formula = {formula: formula, description: description};
            this.currentFlow.conversion_formulas.push(conversion_formula);
            dfm.currentPage.updateFlow(this.currentFlow);
            this.displayFlowFormulas();
        }
    }
}