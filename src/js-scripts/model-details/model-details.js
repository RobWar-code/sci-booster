const modelDetails = {

  newModel: async function() {
    // Check whether an existing model is present
    if (dfm.currentPageSet && dfm.modelEditMode === "edit" && dfm.modelChanged) {
      // Present the option to save the existing model
      let doSave = await flowModelPage.saveModelRequired(`Save the current model - ${dfm.currentPage.page.title}?`);
      if (doSave === "cancel") return;
      if (doSave === "yes") {
        let reload = false;
        dfm.currentPage.saveModel(reload);
      }
    }
    if (dfm.currentPageSet) {
      if (dfm.currentVisualsSet) {
        dfm.currentVisual.destroyCurrentPage();
      }
      dfm.currentPage = new dfm.FlowPageData();
      dfm.currentVisual = new dfm.FlowVisuals();
    }
    this.clearDisplayData();
    if ("page" in dfm.currentPage) {
      if (dfm.currentPage.page.title != "") {
        document.getElementById("modelTitle").value = dfm.currentPage.page.title;
        document.getElementById("modelHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
      }
    }
    else {
      document.getElementById("modelHierarchicalId").innerText = '01';
    }
    this.setModelEditDisplay();
    this.displayModelDetails();
    dfm.currentPageSet = false;
    dfm.topPage = true;
    this.cancelModelEditMode();
    dfm.modelEditMode = "new";
  },

  editModel: function(message) {
    this.setModelEditMode();
    window.scrollTo(0,0);
    document.getElementById("modelDetails").style.display = "block";
    if (message != "") {
      document.getElementById("modelDetailsError").style.display = "block";
      document.getElementById("modelDetailsError").innerText = message;
    }
    document.getElementById("deleteModelButton").style.display = "inline";
    this.loadDisplayValues();
    this.setModelEditDisplay();
  },

  setModelEditMode: function () {
    dfm.modelEditMode = "edit";
    document.getElementById("modelEditOption").style.display = "none";
    document.getElementById("editModelButton").style.display = "none";
    document.getElementById("deleteModelButton").style.display = "inline";
    flowModelPage.displayFlowModelEditMessage();
  },

  cancelModelEditMode: function() {
    dfm.modelEditMode = "read-only";
    flowModelPage.clearFlowModelEditMessage();
  },

  clearDisplayData: function () {
    document.getElementById("modelTitle").value = "";
    document.getElementById("modelDescription").value = "";
    document.getElementById("modelKeywords").value = "";
    // Remove the old lists
    if (document.getElementById("authorsList")) {
      document.getElementById("authorsList").remove();
    }
    if (document.getElementById("extAuthorsList")) {
      document.getElementById("extAuthorsList").remove();
    }
    if (document.getElementById("modelReferencesList")) {
      document.getElementById("modelReferencesList").remove();
    }
  },

  displayModelDetails: function() {
    window.scrollTo(0, 0);
    e = document.getElementById("modelDetails");
    e.style.display = "block";
    if ("page" in dfm.currentPage) {
      document.getElementById("modelHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
    }
    document.getElementById("additionalModelDetailsDiv").style.display = "none";
    document.getElementById("modelEditOption").style.display = "none";
    this.clearSubmissionTicks();
    flowModelPage.showSaveOnPageEdit(true);
  },

  /**
   * Load the relevant page data from the database when a title selection is made
   * @param {*} event 
   */
  selectPage: async function(event, byId) {
    if (event.target.value === "NONE SELECTED" || event.target.value === null) return;
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
    if (byId) {
      await dfm.currentPage.selectPageById(event);
    }
    else {
      await dfm.currentPage.selectModel(event.target.value);
    }
    this.displaySelectedModel();
  },

  displaySelectedModel: function () {
    dfm.currentPageSet = true;
    dfm.modelChanged = false;

    // Set main page details
    document.getElementById("flowModelTitle").innerText = dfm.currentPage.flow_model_title;
    document.getElementById("pageHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
    document.getElementById("pageTitle").innerText = dfm.currentPage.page.title;

    document.getElementById("pageDetailsButton").style.display = "inline";
    if (dfm.userStatus === "editor" || dfm.userStatus === "owner" || dfm.currentPage.isUserAuthor()) {
      document.getElementById("editModelButton").style.display = "inline";
    }
    if (dfm.userStatus != "unregistered") {
      document.getElementById("exportModelButton").style.display = "inline";
    }
    document.getElementById("cancelModelButton").style.display = "inline";
    flowModelPage.showSaveOnPageEdit(true);
    this.setReadOnlyDisplay();
    this.loadModelDetails();
  },

  pageDetailsAction: function () {
    this.loadDisplayValues();
    this.clearSubmissionTicks();
    window.scrollTo(0, 0);
    document.getElementById("modelDetails").style.display = "block";
    document.getElementById("additionalModelDetailsDiv").style.display = "block";
    if (dfm.modelEditMode === "read-only") {
      this.setReadOnlyDisplay();
    }
    else {
      document.getElementById("modelEditOption").style.display = "none";
    }
  },

  loadModelDetails: function() {
    window.scrollTo(0, 0);
    e = document.getElementById("modelDetails");
    e.style.display = "block";
    this.cancelModelEditMode();
    this.loadDisplayValues();
    this.clearSubmissionTicks();
    // Check whether this page is part of a multi-page model
    if (dfm.currentPage.isMultiPage()) {
      document.getElementById("pageSelectorRow").style.display = "block";
      this.listPages();
    }
    else {
      document.getElementById("pageSelectorRow").style.display = "none";
    }
  },

  listPages: async function () {
    elem = document.getElementById("pageSelector");
    elem.innerHTML = "";
    let list = await dfm.currentPage.getModelPageList();
    if (list.length > 1) {
      list.sort((a, b)=>{return a.title >= b.title ? 1 : -1});
      let opt = document.createElement("option");
      opt.value = null;
      opt.text = "None Selected";
      elem.appendChild(opt);
      for(item of list) {
        let opt = document.createElement("option");
        opt.value = item.id;
        opt.text = item.title;
        elem.appendChild(opt);
      }
    }
  },

  loadDisplayValues: function() {
    document.getElementById("modelHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
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

  setEditModel() {
    document.getElementById("editModelButton").style.display = "none";
    this.setModelEditMode();
    this.setModelEditDisplay();
  },

  setModelEditDisplay: function() {
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
    if (dfm.modelEditMode === "new") {
      dfm.modelEditMode = "read-only";
      document.getElementById("zoomBackButton").style.display = "none";
      flowModelPage.cancelModel();
    }
    // If no model title set, alter the page display
    if (!dfm.currentPageSet) {
      document.getElementById("flowModelTitle").innerText = "Not Set";
      document.getElementById("pageHierarchicalId").innerText = "";
      document.getElementById("pageTitle").innerText = "Not Set";
    }
  },

  submitModelDetails: function (event) {
    event.preventDefault();
    document.getElementById("modelDetailsError").style.display = "none";

    let title = Misc.stripHTML(document.getElementById("modelTitle").value).trim();
    let description = Misc.stripHTML(document.getElementById("modelDescription").value).trim();
    let keywords = Misc.stripHTML(document.getElementById("modelKeywords").value).trim();

    if (title != "" && title.length <= dfm.maxPageTitleLength) {
      if (!("page" in dfm.currentPage)) {
        dfm.currentPage = new dfm.FlowPageData();
        dfm.currentVisual = new dfm.FlowVisuals();
        dfm.currentPage.page.hierarchical_id = "01";
      }
      else if (dfm.currentPage.page.hierarchical_id === "") {
        dfm.currentPage.page.hierarchical_id = "01";
      }
      document.getElementById("pageHierarchicalId").innerText = dfm.currentPage.page.hierarchical_id;
      document.getElementById("modelTitleTick").style.display = "inline";
      if (dfm.currentPage.page.hierarchical_id === "01") {
        dfm.currentPage.flow_model_title = title;
        document.getElementById("flowModelTitle").innerText = title;
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
        dfm.modelChanged = true;
      }
      // If this is a new model, automatically add the user author
      if (dfm.modelEditMode === "new") {
        dfm.currentPage.page.user_authors.push({id: null, username: dfm.username});
      }      

      dfm.currentPageSet = true;
      dfm.modelEditMode = "edit";
      document.getElementById("pageDetailsButton").style.display = "block";
      // Display the Author and reference inputs
      document.getElementById("additionalModelDetailsDiv").style.display = "block";
      
      flowModelPage.displayModelEditOptions();
      flowModelPage.displayFlowModelEditMessage();
      document.getElementById("modelDetailsError").style.display = "none";
      document.getElementById("modalDismissButton").innerHTML = "Leave";
      document.getElementById("pageTitle").innerText = title;
    }
    else if (title.length > dfm.maxPageTitleLength) {
      elem = document.getElementById("modelDetailsError");
      elem.innerText = `Title longer than ${dfm.maxPageTitleLength}`;
      elem.style.display = "block";
    }
    else {
      document.getElementById("modelTitleTick").style.display = "none";
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

  submitAuthor: async function (event) {
    event.preventDefault();
    if (dfm.currentPageSet) {
      let author = Misc.stripHTML(document.getElementById("modelAuthor").value).trim();
      if (author != "") {
        // Check Whether user-author exists
        let elem = document.getElementById("modelDetailsError");
        if (!(await dfm.currentPage.userExists(author))) {
          elem.style.display = "block";
          elem.innerText = "Author Username Not Found";
        }
        else {
          elem.style.display = "none";
          dfm.currentPage.page.user_authors.push({id: null, username: author});
          dfm.modelChanged = true;
          let start = false;
          flowModelPage.showSaveOnPageEdit(start);
          this.displayAuthorsList();
          document.getElementById("modelAuthor").value="";
          if (author != "") {
            document.getElementById("modelAuthorTick").style.display = "inline";
          }
        }
      }
      else {
          document.getElementById("modelAuthorTick").style.display = "none";
      }
    }
  },

  displayAuthorsList: function () {
    // Remove the old list
    if (document.getElementById("authorsList")) {
      document.getElementById("authorsList").remove();
    }
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
    // Check whether the user is the current user
    if (dfm.currentPage.page.user_authors[itemNum].username === dfm.username) {
      return;
    }
    if (dfm.currentPage.page.user_authors.length === 1) {
      dfm.currentPage.page.user_authors = [];
    }
    else {
      dfm.currentPage.page.user_authors.splice(itemNum, 1);
    }
    dfm.modelChanged = true;
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
        dfm.modelChanged = true;
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
    if (document.getElementById("extAuthorsList")) {
      document.getElementById("extAuthorsList").remove();
    }
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
    if (dfm.modelEditMode === "read-only") return;
    let listItem = event.target;
    let itemNum = parseInt(listItem.dataset.item);
    if (dfm.currentPage.page.external_authors.length === 1) {
      dfm.currentPage.page.external_authors = [];
    }
    else {
      dfm.currentPage.page.external_authors.splice(itemNum, 1);
    }
    dfm.modelChanged = true;
    this.displayExtAuthorsList();
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
    if (dfm.currentPageSet) {
      let refObj = {};
      refObj.id = null;
      refObj.source = Misc.stripHTML(document.getElementById("modelReferenceSource").value).trim();
      refObj.author = {id: null, author: Misc.stripHTML(document.getElementById("modelReferenceAuthor").value).trim()};
      refObj.title = Misc.stripHTML(document.getElementById("modelReferenceTitle").value).trim();
      if (refObj.title === "") return;
      if (!(refObj.source === "" && refObj.author.author === "" && refObj.title === "")) {
        document.getElementById("modelReferenceSource").value = "";
        document.getElementById("modelReferenceAuthor").value = "";
        document.getElementById("modelReferenceTitle").value = "";
        dfm.currentPage.page.references.push(refObj);
        dfm.modelChanged = true;
        let start = false;
        flowModelPage.showSaveOnPageEdit(start);
        this.displayReferencesList();
        document.getElementById("modelReferenceTick").style.display = "inline";
      }
    }
  },
  
  displayReferencesList: function () {
    if (document.getElementById("modelReferencesList")) {
      document.getElementById("modelReferencesList").remove();
    }
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
    dfm.modelChanged = true;
    this.displayReferencesList();
  },

  beginModelImport: async function() {
    if (dfm.userStatus === "unregistered") {
      return;
    }
    // Check whether there is a model already loaded
    if (dfm.currentPageSet && dfm.modelChanged) {
      let response = await flowModelPage.saveModelRequired("Save Current Model");
      if (response === "yes") {
          let reload = false;
          dfm.currentPage.saveModel(reload);
      }
      else if (response === "cancel") {
        return;
      }
    }
    document.getElementById("importModal").style.display = "block";
    document.getElementById("importFileInput").value = "";
    document.getElementById("importStatus").innerText = "";
    document.getElementById("importGoodDiv").style.display = "none";
  },

  importModel: async function(event) {
    event.preventDefault();
    dfm.importTitle = "";
    const fileInput = document.getElementById("importFileInput");
    const file = fileInput.files[0];
    document.getElementById("importGoodDiv").style.display = "none";
    if (file) {
      let filename = file.name;
      let formData = new FormData();
      formData.append('file', file);
      formData.append('username', dfm.username);
      formData.append('userStatus', dfm.userStatus);
      formData.append('stageWidth', GLOBALS.minStageWidth);
      formData.append('stageHeight', dfm.stageHeight);
      formData.append('nodeWidth', dfm.nodeTemplate.width);
      formData.append('nodeHeight', dfm.nodeTemplate.height);

      let progname = `${dfm.phpPath}flow-model/import.php`;
      fetch(progname, {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if (data.result === true) {
              document.getElementById("importStatus").innerHTML = data.status;
              document.getElementById("importGoodDiv").style.display = "block";
              dfm.importTitle = data.flow_model_title;
              // Update the select model by title list
              flowModelPage.getModelSelectionList();
          }
          else {
              document.getElementById("importStatus").innerHTML = data.status + `<br>Problem uploading file ${filename}<br>`;
              document.getElementById("importStatus").style.display = "block";
          }
      })
      .catch (error => {
          document.getElementById("importStatus").innerText = `Problem uploading file ${filename}`;
          document.getElementById("importStatus").style.display = "block";
          console.log("Problem uploading import file " + filename + " " + error);
      });
    }
  },

  dismissImportModal: function () {
    document.getElementById("importModal").style.display = "none";
  },

  loadImportedModel: async function () {
    if (dfm.importTitle === "") return;
    // Check whether a page is already on display
    if (dfm.currentPageSet) {
      flowModelPage.cancelModel();
    }
    document.getElementById("importModal").style.display = "none";
    dfm.currentPage = new dfm.FlowPageData();
    dfm.currentVisual = new dfm.FlowVisuals();
    await dfm.currentPage.selectModel(dfm.importTitle);
    this.displaySelectedModel();
  },

  beginModelExport: async function () {
    // Check there is a current page
    if (!dfm.currentPageSet || dfm.userStatus === "unregistered") return;
    // If the current model has been altered, then save it
    if (dfm.modelChanged) {
      await dfm.currentPage.saveModel(true);
    }
    document.getElementById("exportModal").style.display = "block";
    window.scrollTo(0, 0);
  },

  exportModel: async function(modelType) {

    let message = {};
    let downloadFilename = "";
    if (modelType === "page") {
      message = {
          request: "export page",
          flow_model_id: dfm.currentPage.flow_model_id,
          hierarchical_id: dfm.currentPage.page.hierarchical_id,
          username: dfm.username
      }
      downloadFilename = dfm.currentPage.flow_model_title + dfm.currentPage.page.hierarchical_id + ".json";
    }
    else {
      message = {
        request: "export model",
        flow_model_id: dfm.currentPage.flow_model_id,
        flow_model_title: dfm.currentPage.flow_model_title,
        username: dfm.username
      }
      downloadFilename = dfm.currentPage.flow_model_title + ".json";
    }

    let messageJSON = JSON.stringify(message);
    try {
      let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: messageJSON
      })

      let responseData = await response.json();
      if (responseData.result) {
        document.getElementById("exportModal").style.display = "none";
        document.getElementById("noticeRow").style.display = "block";
        document.getElementById("noticeText").innerText = "Export and Download Initiated OK";
        setTimeout(() => {
          document.getElementById("noticeRow").style.display = "none";
        }, 5000);

        // Download the data
        // Create a URL for the blob object
        let indent = 4;
        const dataStr = JSON.stringify(responseData.data, null, indent);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link element and trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename; // Optional: Set if you know the file type or get it from response headers
        document.body.appendChild(a);
        a.click();

        // Clean up
        a.remove();
        window.URL.revokeObjectURL(url); // Free up memory by revoking the blob URL

      }
      else {
        document.getElementById("exportModal").style.display = "none";
        document.getElementById("noticeRow").style.display = "block";
        document.getElementById("noticeText").innerText = `Export model problem encountered ${responseData.status}`;
        setTimeout(() => {
          document.getElementById("noticeRow").style.display = "none";
        }, 5000);
      }      
    }
    catch {(error) => {
        console.error("modelExport: Problem with receive-page script call", error);
        document.getElementById("exportModal").style.display = "none";
        document.getElementById("noticeRow").style.display = "block";
        document.getElementById("noticeText").innerText = "Export model error encountered";
        setTimeout(() => {
          document.document.getElementById("noticeRow").style.display = "none";
        }, 3000);
    }};

  }

}