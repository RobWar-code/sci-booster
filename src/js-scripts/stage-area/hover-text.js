dfm.hoverText = {
	setupHoverText: function () {
			// Hover Set-up
		dfm.hoverLayer = new Konva.Layer();

		dfm.hoverGroup = new Konva.Group({
			x: 0,
			y: 0
		});

		dfm.hoverBox = new Konva.Rect({
			x: 0,
			y: 0,
			width: 100,
			height: dfm.hoverFontSize + 6,
			fill: 'rgba(200, 200, 100, 0.5)',
			stroke: 'black'
		});

		// Setup the hover text
		dfm.hoverTextItem = new Konva.Text({
			x: 2,
			y: 2,
			text: "Some Hover Text",
			fontFamily: 'Calibri',
			style: 'italic',
			fontSize: dfm.hoverFontSize,
			fill: 'black'
		});

		dfm.hoverGroup.add(dfm.hoverBox);
		dfm.hoverGroup.add(dfm.hoverTextItem);
		dfm.stageApp.add(dfm.hoverLayer);
	},

	displayHoverText: function(message, x, y) {
		let nx = x;
		let ny = y;
		// Check for overlap of stage edge
		let fontSize = dfm.hoverFontSize;
        let fontFamily = dfm.nodeTemplate.fontFamily; 
        let textWidth = dfm.currentVisual.calculateTextWidth(message, fontSize, fontFamily);
		let boxWidth = textWidth + 6;
		if (x < 0) {
			nx = 0;
		}
		else if (x + boxWidth >= GLOBALS.minStageWidth) {
			nx = GLOBALS.minStageWidth - boxWidth;
		}
		dfm.hoverGroup.position({x: nx, y: ny});
		dfm.hoverBox.setAttr('width', boxWidth);
		dfm.hoverTextItem.setAttr('text', message);
		dfm.hoverLayer.add(dfm.hoverGroup);
		dfm.stageApp.draw();
		this.activateHover();
		setTimeout(() => {
			if (dfm.stageApp && dfm.hoverLayer) {
				dfm.hoverGroup.remove();
				dfm.stageApp.draw();
			}
			else {
				console.log("hover variables missing");
			}
		}, 3000);
	},

	activateHover: function () {
		dfm.hoverLayer.draw();
	}
}