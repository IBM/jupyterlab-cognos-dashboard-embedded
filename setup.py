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
    author='James Reeve',
    author_email='james.reeve@ibm.com',
    url='https://github.com/IBM/jupyterlab-cognos-dashboard-embedded',
    license='Apache 2',
    platforms="Linux, Mac OS X, Windows",
    keywords=['Jupyter', 'JupyterLab', 'S3'],
    python_requires='>=3.5',
    classifiers=[
        'Intended Audience :: Developers',
        'Intended Audience :: Education',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
    ],
    install_requires=[
        'notebook',
        'requests',
        'traitlets'
    ]
)

setuptools.setup(
    version='1.1.1',
    **setup_dict
)
