import json
import requests
import csv
import codecs
import os

from contextlib import closing
from requests.auth import HTTPBasicAuth
from notebook.utils import url_path_join
from notebook.base.handlers import APIHandler
from os import listdir
from os.path import isfile, join
from traitlets import Unicode, Bool
from traitlets.config import SingletonConfigurable


class CognosDashboardConfig(SingletonConfigurable):

    client_id = Unicode(
        '', config=True
    )
    client_secret = Unicode(
        '', config=True
    )
    api_endpoint_url = Unicode(
        '', config=True
    )


class CognosDashboardGalleryApiHandler(APIHandler):
    def post(self, path=''):
        config = CognosDashboardConfig.instance()

        client_id = config.client_id
        client_secret = config.client_secret
        cognos_root_url = config.api_endpoint_url

        headers = {'Content-Type': 'application/json'}
        body = json.loads(self.request.body)
        data = {
            'cognos_dashboard': {
                'client_id': client_id,
                'client_secret': client_secret,
                'cognos_root_url': cognos_root_url,
                'user': 'Anonymous',
                'dashboard_spec': body['dashboard_spec']
            }
        }
        print(data)
        res = requests.post(os.environ.get("SHOWCASE_URL")+'/api/dashboards', auth=HTTPBasicAuth(os.environ.get(
            'SHOWCASE_ADMIN_USERNAME'), os.environ.get('SHOWCASE_ADMIN_PASSWORD')), data=json.dumps(data), headers=headers)
        self.finish(json.dumps(res.json()))


class CognosDashboardApiHandler(APIHandler):
    # GET /filesPreview?url=<http://example.com/file.csv>
    def get(self, path='/filePreview'):
        query = self.request.query_arguments
        with closing(requests.get(query['url'][0].decode(), stream=True)) as r:
            reader = csv.reader(codecs.iterdecode(
                r.iter_lines(), 'utf-8'), delimiter=',', quotechar='"')
            preview = [row for index, row in enumerate(reader) if index <= 5]
            for i in range(len(preview)):
                preview[i] = ','.join(preview[i])
            result = '\n'.join(preview)
            self.finish(result)

    def post(self, path='/sessionCode'):
        config = CognosDashboardConfig.instance()
        api_endpoint_url = config.api_endpoint_url

        if not api_endpoint_url:
            self.finish(json.dumps({
                'description': 'Client credentials are required for this API'
            }))
        else:
            client_id = config.client_id
            client_secret = config.client_secret

            headers = {'Accept': 'application/json'}
            data = {
                'expiresIn': 10000,
                'webDomain': json.loads(self.request.body)['origin']
            }

            res = requests.post('{}v1/session'.format(api_endpoint_url), auth=HTTPBasicAuth(
                client_id, client_secret), data=json.dumps(data), headers=headers)
            respondJson = res.json()
            respondJson['apiEndpointUrl'] = api_endpoint_url
            print(respondJson)
            self.finish(json.dumps(respondJson))

    def put(self, path='/credentials'):
        config = CognosDashboardConfig.instance()

        api_endpoint_url = json.loads(self.request.body)[
            'credentials'].get('api_endpoint_url', '')
        client_id = json.loads(self.request.body)[
            'credentials'].get('client_id', '')
        client_secret = json.loads(self.request.body)[
            'credentials'].get('client_secret', '')

        config.api_endpoint_url = api_endpoint_url
        config.client_id = client_id
        config.client_secret = client_secret

        self.finish(json.dumps({
            'api_endpoint_url': config.api_endpoint_url,
            'client_id': config.client_id,
            'client_secret': config.client_secret
        }))


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_cognos_dashboard_embedded'
    }]


def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    endpoint = url_path_join(base_url, 'cognos')
    handlers = [(endpoint + "(.*)", CognosDashboardApiHandler),
                (url_path_join(base_url, 'share-cde') + "(.*)", CognosDashboardGalleryApiHandler)]
    web_app.add_handlers('.*$', handlers)
