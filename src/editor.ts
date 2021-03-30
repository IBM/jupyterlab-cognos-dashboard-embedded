import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget
} from "@jupyterlab/docregistry";

import { JSONValue, PromiseDelegate } from "@lumino/coreutils";

import { Widget } from "@lumino/widgets";

import { ServerConnection } from "@jupyterlab/services";

import { Dialog, showDialog } from "@jupyterlab/apputils";

import { Message } from "@lumino/messaging";

import { IChangedArgs, PathExt, URLExt } from "@jupyterlab/coreutils";

import $ = require("jquery");

declare global {
  interface Window {
    jupyterlabCDEPlugin: any;
    currentDashboard: any;
    Appcues: any;
  }
}

export interface ICredential {
  client_id: string;
  client_secret: string;
  api_endpoint_url: string;
}

export class CognosDashboardWidget extends DocumentWidget<
  Widget,
  DocumentRegistry.IModel
> {
  // @ts-ignore
  public content: Widget;
  // @ts-ignore
  public toolbar: any;
  // @ts-ignore
  public revealed: Promise<void>;

  get dashboardMode() {
    return this._dashboardMode;
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get cognosReady(): Promise<void> {
    return this._cognosReady.promise;
  }

  get cognosApi(): any {
    return this._cognosApi;
  }

  set cognosApi(cognosApi: any) {
    this._cognosApi = cognosApi;
  }

  get dashboardApi(): any {
    return this._dashboardApi;
  }

  set dashboardApi(dashboardApi: any) {
    this._dashboardApi = dashboardApi;
  }
  public credentialsSubmitButton: any;

  public client_id: string;
  public client_secret: string;
  public api_endpoint_url: string;
  public readonly context: DocumentRegistry.Context;
  public readonly container: HTMLDivElement;

  public readonly saveButton: HTMLButtonElement;

  public readonly undoButton: HTMLButtonElement;

  public readonly redoButton: HTMLButtonElement;

  public modeSelect: HTMLSelectElement;

  public readonly propertiesButton: HTMLButtonElement;

  public readonly shareButton: HTMLButtonElement;

  public readonly tutorialButton: HTMLButtonElement;

  private _dashboardMode: any;
  private _cognosApi: any;
  private _dashboardApi: any;
  private _ready = new PromiseDelegate<void>();
  private _cognosReady = new PromiseDelegate<void>();
  private cognosOpen = false;

  constructor(options: DocumentWidget.IOptions<Widget>) {
    super({ ...options });
    this.context = options.context;

    // create toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "p-Widget jp-Toolbar jp-NotebookPanel-toolbar";

    const saveButtonDiv = document.createElement("div");
    saveButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    saveButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Save the Cognos Dashboard" disabled>
          <span class="jp-SaveIcon jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const saveButton = saveButtonDiv.querySelector("button");
    saveButton.addEventListener("click", this.saveDashboard);
    this.saveButton = saveButton;

    const undoButtonDiv = document.createElement("div");
    undoButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    undoButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Undo the last action" disabled>
          <span class="jp-RefreshIcon reversed jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const undoButton = undoButtonDiv.querySelector("button");
    undoButton.addEventListener("click", this.undo);
    this.undoButton = undoButton;

    const redoButtonDiv = document.createElement("div");
    redoButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    redoButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Redo the last action" disabled>
          <span class="jp-RefreshIcon jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const redoButton = redoButtonDiv.querySelector("button");
    redoButton.addEventListener("click", this.redo);
    this.redoButton = redoButton;

    const modeSelectDiv = document.createElement("div");
    modeSelectDiv.className =
      "bp3-html-select bp3-minimal jp-Notebook-toolbarCellTypeDropdown jp-HTMLSelect";
    // modeSelectDiv.style.height = "28px"; // this is kind of hacky, can't figure out why it's necessary
    modeSelectDiv.innerHTML = `
      <div>
        <select title="Change the dashboard mode" class="bp3-html-select bp3-minimal jp-Notebook-toolbarCellTypeDropdown jp-HTMLSelect">
          <option value="VIEW">View Only</option>
          <option value="EDIT">Edit</option>
          <option value="EDIT_GROUP">Edit Group</option>
        </select>
        <span class="jp-MaterialIcon jp-DownCaretIcon bp3-icon"></span>
      </div>
    `;
    const modeSelect = modeSelectDiv.querySelector("select");
    modeSelect.addEventListener("change", this.onModeSelectChange);
    this.modeSelect = modeSelect;

    const propertiesButtonDiv = document.createElement("div");
    propertiesButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    propertiesButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Toggle the properties sidebar" disabled>
          <span class="jp-SettingsIcon jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const propertiesButton = propertiesButtonDiv.querySelector("button");
    propertiesButton.addEventListener("click", this.toggleProperties);
    this.propertiesButton = propertiesButton;

    const shareButtonDiv = document.createElement("div");
    shareButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    shareButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Share this dashboard">
          <span class="jp-LinkIcon jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const shareButton = shareButtonDiv.querySelector("button");
    shareButton.addEventListener("click", this.shareDashboard);
    this.shareButton = shareButton;

    const tutorialButtonDiv = document.createElement("div");
    tutorialButtonDiv.className = "p-Widget jp-ToolbarButton jp-Toolbar-item";
    tutorialButtonDiv.innerHTML = `
        <button class="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button" title="Start Cognos Dashboard tutorial">
          <span class="jp-LauncherIcon jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
        </button>
      </div>
    `;
    const tutorialButton = tutorialButtonDiv.querySelector("button");
    tutorialButton.addEventListener("click", this.openTutorialMenu);
    this.tutorialButton = tutorialButton;

    toolbar.appendChild(saveButtonDiv);
    toolbar.appendChild(undoButtonDiv);
    toolbar.appendChild(redoButtonDiv);
    toolbar.appendChild(modeSelectDiv);
    toolbar.appendChild(propertiesButtonDiv);
    toolbar.appendChild(shareButtonDiv);
    toolbar.appendChild(tutorialButtonDiv);
    this.node.appendChild(toolbar);

    $.getScript(
      "https://dde-us-south.analytics.ibm.com/daas/CognosApi.js",
      () => {
        this.startCognosDashboard();
      }
    );

    $.getScript(
      "https://unpkg.com/@cognitive-class/jupyterlab-cde-plugin@latest/standalone/jupyterlab-cde-plugin.js",
      () => {}
    );

    $.getScript("//fast.appcues.com/37752.js", () => {
      window.Appcues.anonymous();
      window.Appcues.show("-LIrR_X_GfWJHRVQVwz8");
    });

    this.container = document.createElement("div");
    this.container.className =
      "p-Widget jp-Notebook jp-NotebookPanel-notebook jp-mod-commandMode";
    this.container.id = "cognos-container";
    this.node.appendChild(this.container);

    this.container.appendChild($("<div/>", { id: "jupyterlab-cde-plugin" })[0]);

    this.id = "cognos-jupyterlab";
    this.title.closable = true;
    this.addClass("jp-cognosWidget");

    this._onTitleChanged();
    this.context.pathChanged.connect(this._onTitleChanged, this);

    this.context.ready.then(() => {
      this._onContextReady();
    });
    this.context.ready.then(() => {
      this._handleDirtyStateCognos();
    });
  }

  public setCredential = async (credential: ICredential) => {
    // Send request to /cognos/credentials to set current session credential
    const setting = ServerConnection.makeSettings();
    const url = URLExt.join(setting.baseUrl, "/cognos/credentials");
    return ServerConnection.makeRequest(
      url,
      { method: "PUT", body: JSON.stringify({ credentials: credential }) },
      setting
    ).then((resp: any) => resp.json());
  };

  public getSession = async () => {
    // Send request to /cognos/sessionCode to retrieve session code
    const setting = ServerConnection.makeSettings();
    const url = URLExt.join(setting.baseUrl, "/cognos/sessionCode");
    const data = await ServerConnection.makeRequest(
      url,
      {
        method: "POST",
        body: JSON.stringify({ origin: window.location.origin })
      },
      setting
    ).then((resp: any) => resp.json());
    if (data.sessionCode) {
      return data;
    } else if (data.description === "Quota overflow.") {
      throw new Error("Quota overflow");
    } else {
      console.table(data);
      throw new Error(data);
    }
  };

  public openCognosDashboard = (
    sessionCode: string,
    apiEndpointUrl: string
  ) => {
    this._ready.resolve(void 0);
    $("<script>")
      .attr("type", "text/javascript")
      .text(
        `

        window.api = new CognosApi({
          cognosRootURL: "${apiEndpointUrl}",
          sessionCode: "${sessionCode}",
          initTimeout: 10000,
          node: document.getElementById("cognos-container")
        }); \
    `
      )
      .appendTo("head");
    setTimeout(() => {
      this.cognosApi = (window as any).api;
      this._cognosReady.resolve(void 0);
    }, 1500);
  };

  public handleDataOverflow = () => {
    const overflowErrorPage = document.createElement("div");
    const title = document.createElement("h2");
    title.innerHTML = "Ready for an Upgrade?";
    const explanation = document.createElement("p");
    explanation.innerHTML = `It looks like you have a <em>Lite</em> (free) plan, and have used up all of your sessions for this month.</br>\
    <a href="https://console.bluemix.net/catalog/services/ibm-cognos-dashboard-embedded" rel="noopener" target="_blank">\
      Please consider upgrading from a <em>Lite</em> plan to a <em>Pay as you go</em> plan.
    </a>
    </br>`;
    const updateCredentialsButton = document.createElement("button");
    updateCredentialsButton.className =
      "jp-Dialog-button jp-mod-accept jp-mod-styled";
    updateCredentialsButton.innerHTML =
      "Click here to enter your new credentials after upgrading";
    updateCredentialsButton.onclick = () => {
      this.setCredential({
        client_id: "",
        client_secret: "",
        api_endpoint_url: ""
      }).then(() => {
        this.startCognosDashboard();
      });
    };

    overflowErrorPage.appendChild(title);
    overflowErrorPage.appendChild(explanation);
    overflowErrorPage.appendChild(updateCredentialsButton);
    this.container.appendChild(overflowErrorPage);

    this._ready.resolve(void 0);
  };

  public handleInvalidCredential = async (errMsg: string) => {
    this.credentialsSubmitButton = Dialog.okButton();
    const errorMsg =
      errMsg === "Client credentials are required for this API"
        ? ""
        : "The service credentials you entered were invalid.";

    const result: any = await showDialog({
      title:
        errorMsg +
        "Please enter Cognos Dashboard Embedded service credentials on IBM Cloud:",
      body: new Private.CredentialsForm(this),
      buttons: [Dialog.cancelButton(), this.credentialsSubmitButton]
    });
    $(".jp-Dialog-button").click(() => {});
    if (!result.button.accept) {
      throw new Error("User cancelled");
    } else {
      await this.setCredential({
        client_id: this.client_id,
        client_secret: this.client_secret,
        api_endpoint_url:
          this.api_endpoint_url ||
          "https://us-south.dynamic-dashboard-embedded.cloud.ibm.com/daas/"
      });

      try {
        const { sessionCode, apiEndpointUrl } = await this.getSession();
        this.openCognosDashboard(sessionCode, apiEndpointUrl);
      } catch (error) {
        console.error(error);
        if (error.message === "Quota overflow") {
          this.handleDataOverflow();
        } else {
          this.handleInvalidCredential("Invalid Credentials");
        }
      }
    }
  };

  public startCognosDashboard = async () => {
    // Entrypoint of this mess
    try {
      const { sessionCode, apiEndpointUrl } = await this.getSession();
      this._ready.resolve(void 0);
      $("<script>")
        .attr("type", "text/javascript")
        .text(
          `
          window.api = new CognosApi({
            cognosRootURL: "${apiEndpointUrl}",
            sessionCode: "${sessionCode}",
            initTimeout: 10000,
            node: document.getElementById("cognos-container")
          }); \
      `
        )
        .appendTo("head");
      setTimeout(() => {
        this.cognosApi = (window as any).api;
        this._cognosReady.resolve(void 0);
      }, 1500);
    } catch (error) {
      console.error(error);
      if (error.message === "Quota overflow") {
        this.handleDataOverflow();
      } else if (error.message === "User cancelled") {
      } else {
        this.handleInvalidCredential(error);
      }
    }
  };

  public addSource = () => {
    window.jupyterlabCDEPlugin.openSourceManager();
  };

  public dashboardSpec = () =>
    new Promise((resolve, reject) => {
      this.dashboardApi.getSpec().then((spec: JSONValue) => {
        if (spec) {
          resolve(spec);
        } else {
          reject(); // empty dashboard
        }
      });
    });

  public handleEvent(event: Event): void {}

  public setDashboardMode = (dashboardMode: any) => {
    this._dashboardMode = dashboardMode;
    // update availability of toolbar options
    for (const button of [
      this.saveButton,
      this.undoButton,
      this.redoButton,
      this.propertiesButton
    ]) {
      button.disabled = dashboardMode === "VIEW";
      //
    }
    if (this.dashboardApi) {
      this.dashboardApi.setMode(this.dashboardApi.MODES[dashboardMode]);
    }

    // update toolbar select dropdown
    this.modeSelect.value = dashboardMode;
  };

  public saveDashboard = () => {
    this._saveToContext().then(() => {
      this.context.save();
    });
  };
  public undo = () => {
    this.dashboardApi.undo();
  };
  public redo = () => {
    this.dashboardApi.redo();
  };
  public onModeSelectChange = (selectObject: any) => {
    this.setDashboardMode(selectObject.target.value);
  };
  public toggleProperties = () => {
    this.dashboardApi.toggleProperties();
  };
  public shareDashboard = () => {
    this.saveDashboard();
    const cognos_root_url = this.api_endpoint_url;
    const client_id = this.client_id;
    const client_secret = this.client_secret;
    this.dashboardSpec().then(dashboard_spec => {
      const dashboard = {
        client_id,
        client_secret,
        cognos_root_url,
        dashboard_spec
      };
      const setting = ServerConnection.makeSettings();
      const url = URLExt.join(setting.baseUrl, "/share-cde");

      ServerConnection.makeRequest(
        url,
        { method: "POST", body: JSON.stringify(dashboard) },
        setting
      ).then((response: any) => {
        response.json().then((data: any) => {
          const link = data.data.url_path;

          showDialog({
            title:
              "Your dashboard is now available on Skills Network Showcase:",
            body: new Private.ShowcaseLink(this, link),
            buttons: [Dialog.okButton({ label: "Dismiss" })]
          }).then((result: any) => {
            // no op
          });
        });
      });
    });
  };

  public openTutorialMenu = () => {
    showDialog({
      title: "Select a tutorial section",
      body: new Private.TutorialMenu(this),
      buttons: [Dialog.okButton()]
    });
  };

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
    const node = this.container;
    node.addEventListener("click", this);
    node.addEventListener("p-dragenter", this);
    node.addEventListener("p-dragleave", this);
    node.addEventListener("p-dragover", this);
    node.addEventListener("p-drop", this);
  }

  private _onContextReady(): void {
    const contextModel = this.context.model;

    // Set the editor model value.
    this._onContentChanged();

    contextModel.contentChanged.connect(this._onContentChanged, this);
    contextModel.stateChanged.connect(this._onModelStateChangedCognos, this);
  }
  // private sessionCode: String;

  private _onTitleChanged(): void {
    this.title.label = PathExt.basename(this.context.localPath);
  }

  private _onContentChanged = () => {
    if (this.cognosOpen) {
      return;
    } // don't waste a session by creating a new dashboard

    this.cognosReady.then(() => {
      this.setDashboardMode("VIEW");

      this.cognosApi
        .initialize()
        .then(
          () => {
            const dashboardSpec = this.context.model.toJSON();
            if (dashboardSpec) {
              this.cognosApi.dashboard
                .openDashboard({ dashboardSpec })
                .then((api: any) => {
                  this.setDashboardMode("VIEW");
                  api.on("addSource:clicked", this.addSource);
                  this.dashboardApi = api;
                  window.currentDashboard = api;
                  this.cognosOpen = true;
                });
            } else {
              this.cognosApi.dashboard
                .createNew()
                .then((api: any) => {
                  this.setDashboardMode("EDIT");
                  this.dashboardApi = api;
                  this.dashboardApi.on("addSource:clicked", this.addSource);
                  window.currentDashboard = api;
                  this.cognosOpen = true;
                })
                .catch((err: any) => {
                  console.error(err);
                });
            }
          },
          (error: any) => {
            console.error(error);
          }
        )
        .catch((err: any) => {
          console.error(err);
        });
    });
  };

  private _onModelStateChangedCognos = (
    sender: DocumentRegistry.IModel,
    args: IChangedArgs<any>
  ): void => {
    if (args.name === "dirty") {
      this._handleDirtyStateCognos();
    }
  };

  private _handleDirtyStateCognos = (): void => {
    return;
  };

  private _saveToContext = () =>
    new Promise((resolve, reject) => {
      this.dashboardSpec()
        .then(spec => {
          this.context.model.fromJSON(spec as any);
          resolve(void 0);
        })
        .catch(() => {
          resolve(void 0);
        });
    });
}

namespace Private {
  export class CredentialsForm extends Widget {
    constructor(widget: any) {
      super({ node: createFormNode(widget) });
    }
  }

  export class ShowcaseLink extends Widget {
    constructor(widget: any, link: string) {
      super({ node: createShowcaseLinkNode(widget, link) });
    }
  }

  export class TutorialMenu extends Widget {
    constructor(widget: any) {
      super({ node: createTutorialNode(widget) });
    }
  }

  function createTutorialNode(widgetContext: any) {
    const flowMap = {
      registration: "-LJy1LgGAnFLvYdOft_2",
      credentials: "-LJy2maJY76FqYQmeGt6",
      addingSource: "-LJy4NSwY2WcbecdaMNg"
    };
    // Create the dialog body.
    const body = document.createElement("div");

    const registrationTutorialButton = document.createElement("button");
    let text = document.createTextNode("Signing up with IBM Cloud");
    registrationTutorialButton.className = "jp-mod-accept jp-mod-styled";
    registrationTutorialButton.value = "Signing up with IBM Cloud";
    registrationTutorialButton.onclick = () => {
      window.Appcues.show(flowMap.registration);
    };
    registrationTutorialButton.style.cssText = "margin: 4px;";
    registrationTutorialButton.appendChild(text);
    body.appendChild(registrationTutorialButton);

    const credentialsTutorialButton = document.createElement("button");
    text = document.createTextNode("Creating credentials");
    credentialsTutorialButton.className = "jp-mod-accept jp-mod-styled";
    credentialsTutorialButton.value = "Creating credentials";
    credentialsTutorialButton.onclick = () => {
      window.Appcues.show(flowMap.credentials);
    };
    credentialsTutorialButton.style.cssText = "margin: 4px;";
    credentialsTutorialButton.appendChild(text);
    body.appendChild(credentialsTutorialButton);

    const addingSourceTutorialButton = document.createElement("button");
    text = document.createTextNode("Adding data source");
    addingSourceTutorialButton.className = "jp-mod-accept jp-mod-styled";
    addingSourceTutorialButton.value = "Adding data source";
    addingSourceTutorialButton.onclick = () => {
      window.Appcues.show(flowMap.addingSource);
    };
    addingSourceTutorialButton.style.cssText = "margin: 4px;";
    addingSourceTutorialButton.appendChild(text);
    body.appendChild(addingSourceTutorialButton);

    return body;
  }

  function createShowcaseLinkNode(widgetContext: any, link: string) {
    const body = document.createElement("div");
    body.setAttribute(
      "style",
      "display: inline-flex; align-items: center;  flex-direction: row; padding-bottom: 15px;"
    );

    const fullUrl = "https://showcase.labs.skills.network/dashboards/" + link;

    const copyButton = document.createElement("button");
    copyButton.className =
      "p-Widget jp-mod-styled jp-CopyIcon jp-ToolbarButtonComponent copyShowcaseUrl";
    copyButton.title = "Copy link to clipboard";
    copyButton.setAttribute("style", "width: 30px; height: 30px;");

    const copyIcon = document.createElement("span");
    copyIcon.className = "jp-CopyIcon jp-Icon jp-Icon-16";
    copyButton.appendChild(copyIcon);

    const linkText = document.createElement("span");
    linkText.setAttribute("style", "padding-right: 10px;");
    linkText.innerHTML = fullUrl;

    copyButton.onclick = () => {
      // Select the email link anchor text
      const range = document.createRange();
      range.selectNode(linkText);
      window.getSelection().addRange(range);

      try {
        // Now that we've selected the anchor text, execute the copy command
        document.execCommand("copy");
      } catch (err) {
        console.log("Oops, unable to copy");
      }

      // Remove the selections - NOTE: Should use
      // removeRange(range) when it is supported
      window.getSelection().removeAllRanges();
    };

    body.appendChild(linkText);
    body.appendChild(copyButton);
    return body;
  }

  function createFormNode(widgetContext: any) {
    // Create the dialog body.
    const body = document.createElement("div");

    body.appendChild(
      $(
        '<label><a href="https://console.bluemix.net/catalog/services/ibm-cognos-dashboard-embedded" target="_blank">Learn more</a></label>'
      )[0]
    );

    const clientIdLabel = document.createElement("label");
    clientIdLabel.innerHTML = `client_id`;
    body.appendChild(clientIdLabel);
    const clientDdField = document.createElement("input");
    clientDdField.id = "client_id";
    $(clientDdField).change((event: any) => {
      widgetContext.client_id = $("#" + clientDdField.id).val();
    });
    body.appendChild(clientDdField);

    const clientSecretLabel = document.createElement("label");
    clientSecretLabel.innerHTML = `client_secret`;
    body.appendChild(clientSecretLabel);
    const clientSecretField = document.createElement("input");
    clientSecretField.id = "client_secret";
    $(clientSecretField).change((event: any) => {
      widgetContext.client_secret = $("#" + clientSecretField.id).val();
    });
    body.appendChild(clientSecretField);

    const endpoints = [
      "https://us-south.dynamic-dashboard-embedded.cloud.ibm.com/daas/",
      "https://eu-gb.dynamic-dashboard-embedded.cloud.ibm.com/daas/",
      "https://dde-us-south.analytics.ibm.com/daas/",
      "https://dde-uk-south.analytics.ibm.com/daas/"
    ];
    const endpointsDatalist = document.createElement("datalist");
    endpointsDatalist.id = "endpoints";
    endpoints.forEach(endpoint => {
      const option = document.createElement("option");
      option.value = endpoint;
      option.text = endpoint;
      endpointsDatalist.appendChild(option);
    });
    body.appendChild(endpointsDatalist);
    console.log(endpointsDatalist);

    const apiEndpointUrlLabel = document.createElement("label");
    apiEndpointUrlLabel.innerHTML = `api_endpoint_url`;
    body.appendChild(apiEndpointUrlLabel);
    const apiEndpointUrlField = document.createElement("input");
    apiEndpointUrlField.id = "api_endpoint_url";
    apiEndpointUrlField.setAttribute("list", "endpoints");

    $(apiEndpointUrlField).change((event: any) => {
      widgetContext.api_endpoint_url = $("#" + apiEndpointUrlField.id).val();
    });
    body.appendChild(apiEndpointUrlField);

    return body;
  }
}

export class CognosDashboardFactory extends ABCWidgetFactory<
  CognosDashboardWidget,
  DocumentRegistry.IModel
> {
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    super(options);
  }

  protected createNewWidget(
    context: DocumentRegistry.Context
  ): CognosDashboardWidget {
    return new CognosDashboardWidget({ context, content: new Widget() });
  }
}
