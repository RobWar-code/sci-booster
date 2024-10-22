miscHTML = {
    convertHTMLEntities: function(s) {
        let tempElem = document.createElement("textarea");
        tempElem.innerHTML = s;
        let outString = tempElem.value;
        console.log("s, outString:", s, outString);
        return outString;
    }
}