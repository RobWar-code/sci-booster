dfm.nodeGraphic = {

    viewNodeGraphic: function (event) {
        event.cancelBubble = true;
        let nodeNum = event.target.getAttr("nodeNum");
        let node = dfm.currentPage.getNode(nodeNum);
        let graphicFile = node.graphic_file;
        if (graphicFile === "") return;

        if (graphicFile.substring(0, 6) != "https:") {
            graphicFile = "/sci-booster/assets/images/" + graphicFile;
            console.log("Graphic File", graphicFile);
        }
        let imageElem = document.getElementById("nodeGraphic");
        imageElem.src = graphicFile;
        let textElem = document.getElementById("nodeGraphicPara");
        textElem.innerText = node.graphic_text;
        let modalBackgroundElem = document.getElementById("nodeGraphicModal");
        modalBackgroundElem.style.height = document.body.scrollHeight;
        modalBackgroundElem.style.display = "block";
    },

    dismissGraphic: function () {
        document.getElementById("nodeGraphicModal").style.display = "none";
    }
}