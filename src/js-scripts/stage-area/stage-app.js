const stageApp = {
    /***
     * Adjust the stage following a resize event
     */
    adjustStage: function () {
        console.log("Resizing");
        this.getStageScaling();
        this.redoStage();
    },

    getStageScaling: function () {
        dfm.scaleX = window.innerWidth / GLOBALS.minAssumedDisplayWidth;
        if (dfm.scaleX < 1) {
            dfm.scaleX = 1;
        }
        else if (dfm.scaleX > 2) {
            dfm.scaleX = 2;
        }

        dfm.stageWidth = dfm.scaleX * GLOBALS.minStageWidth;
    },

    startStageApp: function () {
        let containerElem = document.getElementById("flowModelStageDiv");
        this.getStageScaling();
        containerElem.style.width = (dfm.stageWidth + 4) + "px";

        // First, create a stage
        dfm.stageApp = new Konva.Stage({
            container: 'flowModelStageDiv',   // id of container <div>
            width: dfm.stageWidth,
            height: dfm.stageHeight
        });
        
        dfm.stageApp.scale({x: dfm.scaleX, y: 1});

        dfm.stageApp.on('click', (e) => {
            if (!dfm.flowDrawMode) {
                nodeDetails.doNodeDetails(e);
            }
            else {
                dfm.currentVisual.drawFlowClick(e);
            }
        });

        // Set-up the hover text
        setupHoverText();
    },

    redoStage: function () {
        e = document.getElementById("flowModelStageDiv");
        e.style.width = dfm.stageWidth + "px";
        dfm.stageApp.width(dfm.stageWidth);
        dfm.stageApp.scale({x: dfm.scaleX, y: 1});
        dfm.stageApp.batchDraw();
    }

}