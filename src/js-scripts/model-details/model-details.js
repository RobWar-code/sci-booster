const modelDetails = {
  editMode: "new",

  newModel: function() {
    e = document.getElementById("modelDetails");
    e.style.display = "block";
    document.getElementById("additionalModelDetailsDiv").style.display = "none";
    document.getElementById("modelEditOption").style.display = "none";
    this.clearSubmissionTicks();

    dfm.currentPageSet = false;
    dfm.topPage = true;
    flowModelPage.showSaveOnPageEdit(true);
    this.editMode = "new";
  },

  /**
   * Load the relevant page data from the database when a title selection is made
   * @param {*} event 
   */
  selectPage: async function(event) {
    if (dfm.currentPageSet && dfm.modelChanged) {
      // Present the option to save the existing model
      let doSave = await flowModelPage.saveModelRequired(`Save the current model - ${dfm.currentPage.page.title}?`);
      if (doSave === "cancel") return;
      if (doSave === "yes") {
        let reload = false;
        dfm.currentPage.saveModel(reload);
      }
    }
    if (dfm.currentVisualsSet) {
      dfm.currentVisual.destroyCurrentPage();
    }
    dfm.currentPage = new dfm.FlowPageData();
    dfm.currentVisual = new dfm.FlowVisuals();
    await dfm.currentPage.selectModel(event);
    dfm.currentPageSet = true;
    flowModelPage.showSaveOnPageEdit(true);
    this.loadModelDetails();
  },

  loadModelDetails: function() {
    e = document.getElementById("modelDetails");
    e.style.display = "block";
    this.editMode = "read-only";
    this.loadDisplayValues();
    this.setReadOnlyDisplay();
    this.clearSubmissionTicks();
  },

  loadDisplayValues: function() {
    console.log(dfm.currentPage.page.user_authors);
    document.getElementById("modelTitle").value = dfm.currentPage.page.title;
    document.getElementById("modelDescription").value = dfm.currentPage.page.description;
    document.getElementById("modelKeywords").value = dfm.currentPage.page.keywords;
    this.displayAuthorsList();
    this.displayExtAuthorsList();
    this.displayReferencesList();
  },

  setReadOnlyDisplay: function () {
    document.getElementById("modelTitle").disabled = true;
    document.getElementById("modelDescription").disabled = true;
    document.getElementById("modelKeywords").disabled = true;
    document.getElementById("additionalModelDetailsDiv").style.display = "block";
    document.getElementById("modelDetailsSubmit").style.display = "none";
    document.getElementById("authorSubmit").style.display = "none";
    document.getElementById("authorInputForm").style.display = "none";
    document.getElementById("extAuthorSubmit").style.display = "none";
    document.getElementById("extAuthorInputForm").style.display = "none";
    document.getElementById("referenceSubmit").style.display = "none";
    document.getElementById("referenceInputForm").style.display = "none";
    if (dfm.currentPage.isUserAuthor() || dfm.userStatus === "owner" || dfm.userStatus === "editor") {
      document.getElementById("modelEditOption").style.display = "inline";
    }
    else {
      document.getElementById("modelEditOption").style.display = "none";
    }
  },

  setModelEditMode: function() {
    this.editMode = true;
    document.getElementById("modelEditOption").style.display = "none";

    document.getElementById("modelTitle").disabled = false;
    document.getElementById("modelDescription").disabled = false;
    document.getElementById("modelKeywords").disabled = false;

    document.getElementById("modelDetailsSubmit").style.display = "inline";
    document.getElementById("authorSubmit").style.display = "inline";
    document.getElementById("authorInputForm").style.display = "block";
    document.getElementById("extAuthorSubmit").style.display = "inline";
    document.getElementById("extAuthorInputForm").style.display = "block";
    document.getElementById("referenceSubmit").style.display = "inline";
    document.getElementById("referenceInputForm").style.display = "block";
  },

  clearSubmissionTicks() {
    document.getElementById("modelTitleTick").style.display = "none";
    document.getElementById("modelDescriptionTick").style.display = "none";
    document.getElementById("modelKeywordsTick").style.display = "none";
    document.getElementById("modelAuthorTick").style.display = "none";
    document.getElementById("modelExtAuthorTick").style.display = "none";
    document.getElementById("modelReferenceTick").style.display = "none";
  },

  setModelFormDefaults: function () {
    dfm.modelAuthorsVisible = false;
    dfm.modelReferencesVisible = false;
  },

  dismissModelDetailsForm: function () {
    let e = document.getElementById("modelDetails");
    e.style.display = "none";
    flowModelPage.displayFlowModelEditMessage();
  },

  submitModelDetails: function (event) {
    event.preventDefault();
    let title = Misc.stripHTML(document.getElementById("modelTitle").value).trim();
    let description = Misc.stripHTML(document.getElementById("modelDescription").value).trim();
    let keywords = Misc.stripHTML(document.getElementById("modelKeywords").value).trim();

    if (title != "") {
      if (!dfm.currentPageSet) {
        dfm.currentPage = new dfm.FlowPageData();
        dfm.currentVisual = new dfm.FlowVisuals();
      }
      dfm.currentPage.page.hierarchical_id = "01";
      document.getElementById("pageHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
      if (title != "") {
        document.getElementById("modelTitleTick").style.display = "inline";
      }
      else {
        document.getElementById("modelTitleTick").style.display = "none";
      }
      if (dfm.currentPage.page.hierarchical_id === "01") {
        dfm.currentPage.flow_model_title = title;
      }
      if (description != "") {
        document.getElementById("modelDescriptionTick").style.display = "inline";
      }
      else {
        document.getElementById("modelDescriptionTick").style.display = "none";
      }
      if (keywords != "") {
        document.getElementById("modelKeywordsTick").style.display = "inline";
      }
      else {
        document.getElementById("modelKeywordsTick").style.display = "none";
      }
      let change = dfm.currentPage.setModelDetails(title, description, keywords);
      if (change) {
        let start = false;
        flowModelPage.showSaveOnPageEdit(start);
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
    if (dfm.currentPageSet) {
      let author = Misc.stripHTML(document.getElementById("modelAuthor").value).trim();
      if (author != "") {
        dfm.currentPage.page.user_authors.push({id: null, username: author});
        let start = false;
        flowModelPage.showSaveOnPageEdit(start);
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
    // Remove the old list
    document.getElementById("authorsList").remove();
    // Build the replacement html
    let listDiv = document.getElementById("authorsListDiv");
    let listHtml = "<ul id=\"authorsList\">";
    let count = 0;
    for (authorItem of dfm.currentPage.page.user_authors) {
      listHtml += `<li data-item="${count}" onclick="modelDetails.deleteAuthor(event)">${authorItem.username}</li>`;
      ++count;
    }
    listHtml += "</ul>";
    listDiv.innerHTML = listHtml;
    listDiv.style.display = "block";
  },

  deleteAuthor: function (event) {
    if (this.editMode === "read-only") return;
    let listItem = event.target;
    let itemNum = parseInt(listItem.dataset.item);
    if (dfm.currentPage.page.user_authors.length === 1) {
      dfm.currentPage.page.user_authors = [];
    }
    else {
      dfm.currentPage.page.user_authors = dfm.currentPage.page.user_authors.splice(itemNum, 1);
    }
    this.displayAuthorsList();
  },

  toggleExtAuthors: function () {
    e = document.getElementById("extAuthorsDiv");
    if (!dfm.modelExtAuthorsVisible) {
      e.style.display = "block";
      if (dfm.currentPageSet) {
        this.displayExtAuthorsList();
      }
      dfm.modelExtAuthorsVisible = true;
    }
    else {
      e.style.display = "none";
      dfm.modelExtAuthorsVisible = false;
    }
  },

  submitExtAuthor: function (event) {
    event.preventDefault();
    if (dfm.currentPageSet) {
      let author = Misc.stripHTML(document.getElementById("modelExtAuthor").value).trim();
      author = Misc.stripRedundantNameChars(author);
      if (author != "") {
        dfm.currentPage.page.external_authors.push({id: null, author: author});
        let start = false;
        flowModelPage.showSaveOnPageEdit(start);
        this.displayExtAuthorsList();
        document.getElementById("modelExtAuthor").value = "";
        if (author != "") {
          document.getElementById("modelExtAuthorTick").style.display = "inline";
        }
      }
      else {
          document.getElementById("modelExtAuthorTick").style.display = "none";
      }
    }
  },

  displayExtAuthorsList: function () {
    // Remove the old list
    document.getElementById("extAuthorsList").remove();
    // Build the replacement html
    let listDiv = document.getElementById("extAuthorsListDiv");
    let listHtml = "<ul id=\"extAuthorsList\">";
    let count = 0;
    for (authorItem of dfm.currentPage.page.external_authors) {
      listHtml += `<li data-item="${count}" onclick="modelDetails.deleteExtAuthor(event)">${authorItem.author}</li>`;
      ++count;
    }
    listHtml += "</ul>";
    listDiv.innerHTML = listHtml;
    listDiv.style.display = "block";
  },

  deleteExtAuthor: function (event) {
    if (this.editMode === "read-only") return;
    let listItem = event.target;
    let itemNum = parseInt(listItem.dataset.item);
    if (dfm.currentPage.page.external_authors.length === 1) {
      dfm.currentPage.page.external_authors = [];
    }
    else {
      dfm.currentPage.page.external_authors = dfm.currentPage.page.external_authors.splice(itemNum, 1);
    }
    this.displayAuthorsList();
  },

  toggleReferences: function () {
    e = document.getElementById("modelReferencesDiv");
    if (!dfm.modelReferencesVisible) {
      e.style.display = "block";
      if (dfm.currentPageSet) {
        this.displayReferencesList();
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
      refObj.id = null;
      refObj.source = Misc.stripHTML(document.getElementById("modelReferenceSource").value).trim();
      refObj.author = {id: null, author: Misc.stripHTML(document.getElementById("modelReferenceAuthor").value).trim()};
      refObj.title = Misc.stripHTML(document.getElementById("modelReferenceTitle").value).trim();
      if (!(refObj.source === "" && refObj.author.author === "" && refObj.title === "")) {
        document.getElementById("modelReferenceSource").value = "";
        document.getElementById("modelReferenceAuthor").value = "";
        document.getElementById("modelReferenceTitle").value = "";
        dfm.currentPage.page.references.push(refObj);
        let start = false;
        flowModelPage.showSaveOnPageEdit(start);
        this.displayReferencesList();
      }
    }
  },
  
  displayReferencesList: function () {
    document.getElementById("modelReferencesList").remove();
    let referencesListElem = document.getElementById("modelReferencesListDiv");
    let listHtml = '<ul class="modalFormList" id="modelReferencesList">';
    let count = 0;
    for (reference of dfm.currentPage.page.references) {
      listHtml += '<li>';
      listHtml += `<div data-item="${count}" onclick="modelDetails.deleteReference(event)">`;
      listHtml += `<p class="modalFormListItem">Source: ${reference.source}</p>`;
      listHtml += `<p class="modalFormListItem">Author: ${reference.author.author}</p>`;
      listHtml += `<p class="modalFormListItem">Title: ${reference.title}</p>`;
      listHtml += '<hr class="modalListHR" />';
      listHtml += '</div>';
      listHtml += '</li>';
    }
    listHtml += '</ul>';
    referencesListElem.innerHTML = listHtml;
  },

  deleteReference: function (event) {
    if (this.editMode === "read-only") return;
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