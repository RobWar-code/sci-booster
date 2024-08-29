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
			height: 30,
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
			fontSize: 12,
			fill: 'black'
		});

		dfm.hoverGroup.add(dfm.hoverBox);
		dfm.hoverGroup.add(dfm.hoverTextItem);
		dfm.hoverTextItem.setZIndex(1);
		dfm.hoverLayer.add(dfm.hoverGroup);
	},

	displayHoverText: function(message, x, y) {
		dfm.hoverGroup.position({x, y});
		dfm.hoverTextItem.setAttr('text', message);
		this.activateHover();
		setTimeout(() => {
			if (dfm.stageApp && dfm.hoverLayer) {
				dfm.hoverLayer.remove();
				dfm.stageApp.draw();
			}
			else {
				console.log("hover variables missing");
			}
		}, 3000);
	},

	activateHover: function () {
		dfm.stageApp.add(dfm.hoverLayer);
		dfm.hoverLayer.setZIndex(1);
		dfm.hoverLayer.draw();
	}
}