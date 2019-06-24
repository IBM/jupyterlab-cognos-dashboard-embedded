# jupyterlab-cognos-dashboard-embedded [![Build Status](https://travis.ibm.com/cognitive-class-labs/jupyterlab-cognos-dashboard-embedded.svg?token=xeywPRUyHm9VWQkDxLoo&branch=master)](https://travis.ibm.com/cognitive-class-labs/jupyterlab-cognos-dashboard-embedded)

A JupyterLab extension for working with Cognos Embedded Dashboards.

## Initial Setup

- Create a conda environment for developing this extension: `conda create -n jupyterlab-cognos-dashboard-embedded -y && conda activate jupyterlab-cognos-dashboard-embedded`
- install jupyterlab: `pip install jupyterlab==1.0.0rc.0` #`conda install jupyterlab`

## Development

- install dependencies and build: `yarn install && yarn run build`
- install the lab extension: `jupyter labextension link .`
- install the server extension: `pip install .`

- To watch and automatically rebuild the lab extension run `yarn run watch`
- In a separate terminal window, run `jupyter lab` to start jupyterlab.
- Changes to the lab extension will trigger automatic rebuilds of the extension as you make changes.
- Changes made to the server extension (i.e. the python code in `jupyterlab_cognos_dashboard_embedded/`) will require a manual reinstall (`pip install .`) and restart (i.e. `ctrl+c` and `jupyter lab`).

## Release Publishing

To publish a new version of the lab extension and/or server extension:

- Update the version in [package.json](package.json)
- Update the version in [setup.py](setup.py)
  - note: you need to update _both_ versions, even if you modified just the lab extension or just the server extension one or the other
- Merge/push to the master branch.
- `git tag <TAG> && git push origin <TAG>` to trigger a travis build/release.
