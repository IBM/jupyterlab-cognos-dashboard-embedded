import setuptools
from setupbase import (
    create_cmdclass, find_packages
    )

data_files_spec = [
    ('etc/jupyter/jupyter_notebook_config.d',
     'jupyter-config/jupyter_notebook_config.d',
     'jupyterlab_cognos_dashboard_embedded.json'),
]

cmdclass = create_cmdclass(data_files_spec=data_files_spec)

setup_dict = dict(
    name='jupyterlab_cognos_dashboard_embedded',
    packages=find_packages(),
    cmdclass=cmdclass,
    author          = 'James Reeve',
    author_email    = 'james.reeve@ibm.com',
    install_requires=[
        'notebook',
        'requests',
        'traitlets'
    ]
)

setuptools.setup(
    version='1.0.0rc.0',
    **setup_dict
)
