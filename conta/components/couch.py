from tornado import gen
import couch.couch
from couch.couch import json_encode
import os


class MyAsyncCouch(couch.AsyncCouch):
    @gen.coroutine
    def find(self, body):
        url = '{0}/_find'.format(self.db_name)
        r = yield self._http_post(url, body=json_encode(body))
        raise gen.Return(r)

    @gen.coroutine
    def explain(self, body):
        url = '{0}/_explain'.format(self.db_name)
        r = yield self._http_post(url, body=json_encode(body))
        raise gen.Return(r)

    def __init__(self, db_name='', **request_args):
        couch_url = os.environ.get('COUCH_URL') or 'http://127.0.0.1:5984/'
        request_args['auth_username'] = os.environ.get('COUCH_USER') or None
        request_args['auth_password'] = os.environ.get('COUCH_PWD') or None

        super(MyAsyncCouch, self).__init__(db_name, couch_url, None, **request_args)


class CouchClass:
    db = None

    @gen.coroutine
    def initialise(self, db_name):
        self.db = MyAsyncCouch(db_name)
        try:
            yield self.db.create_db()
        except:
            pass

    def close(self):
        self.db.close()