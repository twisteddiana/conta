from tornado import httpclient, gen

import couch.couch
from couch.couch import json_encode
from tornado.escape import json_decode, url_escape
import base64

class MyAsyncCouch(couch.AsyncCouch):
	@gen.coroutine
	def find(self, body):
		url = '{0}/_find'.format(self.db_name)
		r = yield self._http_post(url, body = json_encode(body))
		raise gen.Return(r)

	@gen.coroutine
	def explain(self, body):
		url = '{0}/_explain'.format(self.db_name)
		r = yield self._http_post(url, body=json_encode(body))
		raise gen.Return(r)