flowDetails = {

    addNewFlow: function (event) {
        if (dfm.currentVisual.flowDrawMode) {
            event.cancelBubble = true;
            return;
        }
        this.displayFlowModal("new");
    },

    displayFlowModal: function(editMode) {
        if (editMode === "new") {
            this.clearValues();
            this.setDisableFlowDetailsEdit(false);
        }
        document.getElementById("flowDetails").style.display = "block";
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
            document.getElementById("flowFormula").style.display = "none";
            document.getElementById("flowFormulaDescription").style.display = "none";
            document.getElementById("flowFormulaSubmit").style.display = "none";
        }
    }
}