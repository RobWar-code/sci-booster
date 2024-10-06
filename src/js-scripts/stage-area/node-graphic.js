dfm.nodeGraphic = {

    viewNodeGraphic: function (event) {
        event.cancelBubble = true;
        let nodeNum = event.target.getAttr("nodeNum");
        let node = dfm.currentPage.getNode(nodeNum);
        let graphicFile = node.graphic_file;
        if (graphicFile === "") return;

        if (graphicFile.substring(0, 6) != "https:") {
            graphicFile = "/sci-booster/assets/images/" + graphicFile;
        }
        let imageElem = document.getElementById("nodeGraphic");
        imageElem.src = graphicFile;
        let textElem = document.getElementById("nodeGraphicPara");
        textElem.innerText = node.graphic_text;
        if (node.graphic_credits != "") {
            document.getElementById("nodeGraphicCreditsDiv").style.display = "block";
            document.getElementById("nodeGraphicCreditsPara").innerText = node.graphic_credits;
        }
        else {
            document.getElementById("nodeGraphicCreditsDiv").style.display = "none";
        }
        let modalBackgroundElem = document.getElementById("nodeGraphicModal");
        modalBackgroundElem.style.height = document.body.scrollHeight;
        modalBackgroundElem.style.display = "block";
    },

    dismissGraphic: function () {
        document.getElementById("nodeGraphicModal").style.display = "none";
    }
}