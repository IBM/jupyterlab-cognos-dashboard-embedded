# jupyterlab-cognos-dashboard-embedded
A JupyterLab extension for working with Cognos Embedded Dashboards.


## Initial Setup

- install jupyterlab: `conda install -c conda-forge jupyterlab`
- install dependencies and build: `npm install && npm run build`
- install the server extension: `pip install .`
- install the jupyterlab extension: `jupyter labextension install`


## Development

- To watch and automatically rebuild the extension run `npm run watch`
- In a separate terminal window, run `jupyter lab --watch` to start jupyterlab in develpment mode.
- Changes made to the server extension (i.e. the stuff in `jupyterlab_cognos_dashboard_embedded/`) will require a manual reinstall and restart (`pip install . && jupyter lab --watch`), but otherwise the extension will automatically rebuild as you make changes.