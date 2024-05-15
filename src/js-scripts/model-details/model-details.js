const modelDetails = {

  newModel: function() {
    console.log("At newModel");
    e = document.getElementById("modelDetails");
    e.style.display = "block";
    document.getElementById("additionalModelDetailsDiv").style.display = "none";
    dfm.currentPageSet = false;
    dfm.topPage = true;
  },

  setModelFormDefaults: function () {
    dfm.modelAuthorsVisible = false;
    dfm.modelReferencesVisible = false;
  },

  dismissModelDetailsForm: function () {
    e = document.getElementById("modelDetails");
    e.style.display = "none";
  },

  submitModelDetails: function (event) {
    event.preventDefault();
    let title = Misc.stripHTML(document.getElementById("modelTitle").value);
    let description = Misc.stripHTML(document.getElementById("modelDescription").value);
    let keywords = Misc.stripHTML(document.getElementById("modelKeywords").value);

    if (!(title === "" && description === "" && keywords === "")) {
      if (!dfm.currentPageSet) {
        dfm.currentPage = new dfm.FlowPageData();
        dfm.currentVisual = new dfm.FlowVisuals();
      }
      dfm.currentPage.page.title = title;
      if (title != "") {
        document.getElementById("modelTitleTick").style.display = "inline";
      }
      else {
        document.getElementById("modelTitleTick").style.display = "none";
      }
      dfm.currentPage.page.description = description;
      if (description != "") {
        document.getElementById("modelDescriptionTick").style.display = "inline";
      }
      else {
        document.getElementById("modelDescriptionTick").style.display = "none";
      }
      dfm.currentPage.page.keywords = keywords;
      if (keywords != "") {
        document.getElementById("modelKeywordsTick").style.display = "inline";
      }
      else {
        document.getElementById("modelKeywordsTick").style.display = "none";
      }
      dfm.currentPageSet = true;
      dfm.modelEditMode = true;
      document.getElementById("additionalModelDetailsDiv").style.display = "block";
      flowModelPage.displayModelEditOptions();
      document.getElementById("modalDismissButton").innerHTML = "Leave";
      // If the top page of the hierarchy
      if (dfm.topPage) {
        document.getElementById("flowModelTitle").innerText = title;
      }
      document.getElementById("pageTitle").innerText = title;
    }
  },

  toggleAuthors: function () {
    e = document.getElementById("authorsDiv");
    if (!dfm.modelAuthorsVisible) {
      e.style.display = "block";
      if (dfm.currentPageSet) {
        this.displayAuthorsList();
      }
      dfm.modelAuthorsVisible = true;
    }
    else {
      e.style.display = "none";
      dfm.modelAuthorsVisible = false;
    }
  },

  submitAuthor: function (event) {
    event.preventDefault();
    console.log("Got to submit author");
    if (dfm.currentPageSet) {
      let author = Misc.stripHTML(document.getElementById("modelAuthor").value);
      if (author != "") {
        dfm.currentPage.page.authors.push(author);
        console.log("Author:", author);
        this.displayAuthorsList();
        document.getElementById("modelAuthor").value="";
        if (author != "") {
          document.getElementById("modelAuthorTick").style.display = "inline";
        }
      }
      else {
          document.getElementById("modelAuthorTick").style.display = "none";
      }
    }
  },

  displayAuthorsList: function () {
    console.log("Got to displayAuthorsList")
    // Remove the old list
    document.getElementById("authorsList").remove();
    // Build the replacement html
    let listDiv = document.getElementById("authorsListDiv");
    let listHtml = "<ul id=\"authorsList\">";
    let count = 0;
    for (author of dfm.currentPage.page.authors) {
      listHtml += `<li data-item="${count}" onclick="modelDetails.deleteAuthor(event)">${author}</li>`;
      ++count;
    }
    listHtml += "</ul>";
    listDiv.innerHTML = listHtml;
    listDiv.style.display = "block";
  },

  deleteAuthor: function (event) {
    console.log("Got to deleteAuthor");
    let listItem = event.target;
    let itemNum = parseInt(listItem.dataset.item);
    console.log("itemNum:", itemNum);
    if (dfm.currentPage.page.authors.length === 1) {
      dfm.currentPage.page.authors = [];
    }
    else {
      dfm.currentPage.page.authors = dfm.currentPage.page.authors.splice(itemNum, 1);
    }
    console.log("list:", dfm.currentPage.page.authors);
    this.displayAuthorsList();
  },

  toggleReferences: function () {
    e = document.getElementById("modelReferencesDiv");
    if (!dfm.modelReferencesVisible) {
      e.style.display = "block";
      if (dfm.currentPageSet) {
        displayReferencesList();
      }
      dfm.modelReferencesVisible = true;
    }
    else {
      e.style.display = "none";
      dfm.modelReferencesVisible = false;
    }
  },

  submitReference: function (event) {
    event.preventDefault();
    console.log("Got to submit references");
    if (dfm.currentPageSet) {
      let refObj = {};
      refObj.source = Misc.stripHTML(document.getElementById("modelReferenceSource").value);
      refObj.author = Misc.stripHTML(document.getElementById("modelReferenceAuthor").value);
      refObj.title = Misc.stripHTML(document.getElementById("modelReferenceTitle").value);
      if (!(refObj.source === "" && refObj.author === "" && refObj.title === "")) {
        document.getElementById("modelReferenceSource").value = "";
        document.getElementById("modelReferenceAuthor").value = "";
        document.getElementById("modelReferenceTitle").value = "";
        dfm.currentPage.page.references.push(refObj);
        this.displayReferencesList();
      }
    }
  },
  
  displayReferencesList: function () {
    console.log("Got to displayReferencesList");
    document.getElementById("modelReferencesList").remove();
    let referencesListElem = document.getElementById("modelReferencesListDiv");
    let listHtml = '<ul class="modalFormList" id="modelReferencesList">';
    let count = 0;
    for (reference of dfm.currentPage.page.references) {
      listHtml += '<li>';
      listHtml += `<div data-item="${count}" onclick="modelDetails.deleteReference(event)">`;
      listHtml += `<p class="modalFormListItem">Source: ${reference.source}</p>`;
      listHtml += `<p class="modalFormListItem">Author: ${reference.author}</p>`;
      listHtml += `<p class="modalFormListItem">Title: ${reference.title}</p>`;
      listHtml += '<hr class="modalListHR" />';
      listHtml += '</div>';
      listHtml += '</li>';
    }
    listHtml += '</ul>';
    referencesListElem.innerHTML = listHtml;
  },

  deleteReference: function (event) {
    let itemNum = parseInt(event.target.dataset.item);
    if (dfm.currentPage.page.references.length === 1) {
      dfm.currentPage.page.references = [];
    }
    else {
      dfm.currentPage.page.references = dfm.currentPage.page.references.splice(itemNum, 1);
    }
    this.displayReferencesList();
  }

}