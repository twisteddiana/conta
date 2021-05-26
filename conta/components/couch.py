import couch.couch
from couch.couch import json_encode
import os


class MyAsyncCouch(couch.AsyncCouch):
    async def find(self, body):
        url = '{0}/_find'.format(self.db_name)
        return await self._http_post(url, body=json_encode(body))

    async def explain(self, body):
        url = '{0}/_explain'.format(self.db_name)
        return await self._http_post(url, body=json_encode(body))

    def __init__(self, db_name='', **request_args):
        couch_url = os.environ.get('COUCH_URL') or 'http://127.0.0.1:5984/'
        request_args['auth_username'] = os.environ.get('COUCH_USER') or None
        request_args['auth_password'] = os.environ.get('COUCH_PWD') or None
        request_args['use_gzip'] = False

        super(MyAsyncCouch, self).__init__(db_name, couch_url, None, **request_args)


class CouchClass:
    db = None
    db_name = None

    async def initialise(self):
        if self.db is not None:
            return self
        if self.db_name is None:
            return

        self.db = MyAsyncCouch(self.db_name)
        try:
            await self.db.create_db()
        except:
            pass
        return self

    async def get(self, id):
        await self.initialise()
        try:
            return await self.db.get_doc(id)
        except:
            return None

    async def delete(self, id):
        await self.initialise()
        try:
            doc = await self.db.get_doc(id)
            return await self.db.delete_doc(doc)
        except:
            return None

    async def collection(self, dict):
        await self.initialise()
        return await self.db.view(dict['design'], dict['sort'], include_docs=True, **dict)

    def close(self):
        self.db.close()