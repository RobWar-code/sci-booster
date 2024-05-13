function displayModelEditOptions() {
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
}