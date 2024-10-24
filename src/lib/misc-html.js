miscHTML = {
    convertHTMLEntities: function(s) {
        let tempElem = document.createElement("textarea");
        tempElem.innerHTML = s;
        let outString = tempElem.value;
        return outString;
    },

    makeFilename: function(s) {
        let validChars = /[a-zA-Z0-9]/;
        s = this.convertHTMLEntities(s);
        let filename = "";
        lastWasInvalid = false;
        for (let i = 0; i < s.length; i++) {
            let c = s[i];
            if (c.match(validChars) != null) {
                filename += c;
                lastWasInvalid = false;
            }
            else {
                if (!lastWasInvalid) {
                    filename += "-";
                }
                lastWasInvalid = true; 
            }
        }
        if (filename.length === 0) {
            filename = "unknown_filename";
        }
        return filename;
    }
}