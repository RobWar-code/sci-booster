dfm.nodeGraphic = {

    viewNodeGraphic: function (event) {
        let nodeNum = event.target.getAttr("nodeNum");
        let node = dfm.currentPage.getNode(nodeNum);
        let graphicFile = node.graphic_file;
        if (graphicFile === "") return;

        let imageElem = document.getElementById("nodeGraphic");
        imageElem.src = graphicFile;
        let textElem = document.getElementById("nodeGraphicText");
        textElem.innerText = node.graphic_text;
        let modalBackgroundElem = document.getElementById("nodeGraphicModal");
        modalBackgroundElem.style.height = document.body.scrollHeight;
        modalBackgroundElem.style.display = "block";
    },

    dismissGraphic: function () {
        document.getElementById("nodeGraphicModal").style.display = none;
    }
}