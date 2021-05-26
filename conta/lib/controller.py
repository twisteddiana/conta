import tornado.web
from tornado import httpclient
from lib.env import env


class ContaController(tornado.web.RequestHandler):
    async def prepare(self):
        await self.init()
        uri = env['couch_url'] + '/_session'
        headers = {}
        if 'Cookie' in self.request.headers:
            headers['Cookie'] = self.request.headers['Cookie']

        req = httpclient.HTTPRequest(uri, method='GET', headers=headers)
        try:
            await httpclient.AsyncHTTPClient().fetch(req)
        except httpclient.HTTPError as e:
            self.set_status(401)
            self.finish(e.response.body)

    def write_or_404(self, doc):
        if doc is None:
            self.set_status(404)
        else:
            self.write(doc)

class LoginHandler(tornado.web.RequestHandler):
    async def get(self):
        uri = env['couch_url'] + '/_session'
        req = httpclient.HTTPRequest(uri, method='GET', headers=self.request.headers)
        response = await httpclient.AsyncHTTPClient().fetch(req)
        self.write(response.body)

    async def post(self):
        uri = env['couch_url'] + '/_session'
        req = httpclient.HTTPRequest(uri, method='POST', body=self.request.body, headers=self.request.headers)

        try:
            resp = await httpclient.AsyncHTTPClient().fetch(req)
            self.set_header('Set-Cookie', resp.headers['set-cookie'])
            self.write(resp.body)
        except httpclient.HTTPError as e:
            self.set_status(401)
            self.write(e.response.body)
