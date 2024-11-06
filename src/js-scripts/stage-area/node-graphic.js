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
        imageElem.onload = () => this.adjustGraphic(imageElem);
        let textElem = document.getElementById("nodeGraphicPara");
        textElem.innerHTML = node.graphic_text;
        if (node.graphic_credits != "") {
            document.getElementById("nodeGraphicCreditsDiv").style.display = "block";
            document.getElementById("nodeGraphicCreditsPara").innerHTML = node.graphic_credits;
        }
        else {
            document.getElementById("nodeGraphicCreditsDiv").style.display = "none";
        }
        let modalBackgroundElem = document.getElementById("nodeGraphicModal");
        modalBackgroundElem.style.height = document.body.scrollHeight;
        modalBackgroundElem.style.display = "block";
        dfm.currentVisual.lastWindowY = window.scrollY;
        window.scrollTo(0, 0);
    },

    adjustGraphic: function (imgElem) {
        let baseWidth = imgElem.naturalWidth;
        let baseHeight = imgElem.naturalHeight;
        let dWidth = document.documentElement.clientWidth * 85/100;
        let dHeight = document.documentElement.clientHeight * 75/100;
        let scale = dWidth/baseWidth;
        if (scale * baseHeight > dHeight) {
            scale = dHeight/baseHeight;
        }
        if (scale * baseWidth > dWidth) {
            scale = dWidth/baseWidth;
        }
        let width = baseWidth * scale;
        let height = baseHeight * scale;
        imgElem.width = width;
        imgElem.height = height;
    },

    dismissGraphic: function () {
        document.getElementById("nodeGraphicModal").style.display = "none";
        window.scrollTo(0, dfm.currentVisual.lastWindowY);
    }
}