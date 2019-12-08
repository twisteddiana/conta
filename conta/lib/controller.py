import tornado.web
from tornado import httpclient, gen
from lib.settings import settings


class ContaController(tornado.web.RequestHandler):
    @gen.coroutine
    def prepare(self):
        uri = settings['couch_url'] + '/_session'
        headers = {}
        if 'Cookie' in self.request.headers:
            headers['Cookie'] = self.request.headers['Cookie']

        req = httpclient.HTTPRequest(uri, method='GET', headers=headers)
        try:
            resp = yield httpclient.AsyncHTTPClient().fetch(req)
            print(resp.body)
        except httpclient.HTTPError as e:
            print(e.response.body)
            self.set_status(401)
            self.finish(e.response.body)


class LoginHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        uri = settings['couch_url'] + '/_session'
        req = httpclient.HTTPRequest(uri, method='GET', headers=self.request.headers)
        response = yield httpclient.AsyncHTTPClient().fetch(req)
        self.write(response.body)

    @gen.coroutine
    def post(self):
        uri = settings['couch_url'] + '/_session'
        req = httpclient.HTTPRequest(uri, method='POST', body=self.request.body, headers=self.request.headers)

        try:
            resp = yield httpclient.AsyncHTTPClient().fetch(req)
            self.set_header('Set-Cookie', resp.headers['set-cookie'])
            self.write(resp.body)
        except httpclient.HTTPError as e:
            self.set_status(401)
            self.write(e.response.body)
