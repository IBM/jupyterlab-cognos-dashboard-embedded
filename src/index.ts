import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { ICommandPalette } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { IFileBrowserFactory } from "@jupyterlab/filebrowser";

import "../style/index.css";

import { CognosDashboardFactory } from "./editor";

const FACTORY = "Cognos";

const activate = (
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  restorer: ILayoutRestorer,
  launcher: ILauncher,
  browserFactory: IFileBrowserFactory
) => {
  const factory = new CognosDashboardFactory({
    name: FACTORY,
    fileTypes: ["cognos"],
    defaultFor: ["cognos"]
  });
  const { commands } = app;

  const createNewCognosDashboard = (cwd: string) => {
    return commands
      .execute("docmanager:new-untitled", {
        path: cwd,
        type: "file",
        ext: ".cognos"
      })
      .then((model: any) => {
        return commands.execute("docmanager:open", {
          path: model.path,
          factory: FACTORY
        });
      });
  };

  const command = "cognosdashboard:create-new";
  commands.addCommand(command, {
    execute: () => {
      const cwd = browserFactory.defaultBrowser.model.path;
      return createNewCognosDashboard(cwd);
    },
    label: "Cognos Dashboard",
    caption: "Cognos Dashboard",
    iconClass: "jp-MaterialIcon jp-CognosIcon"
  });

  if (launcher) {
    launcher.add({
      command,
      category: "Other"
    });
  }

  console.log("Cognos Dashboard Extension enabled!");

  app.docRegistry.addWidgetFactory(factory);

  // register the filetype
  app.docRegistry.addFileType({
    name: "cognos",
    displayName: "Cognos Dashboard",
    mimeTypes: ["application/cognos"],
    extensions: [".cognos"],
    iconClass: "jp-CognosIcon jp-ImageIcon",
    fileFormat: "json"
  });
};

/**
 * Initialization data for the jupyterlab_cognos extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab_cognos",
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, ILauncher, IFileBrowserFactory],
  optional: [],
  activate
};

export default extension;
