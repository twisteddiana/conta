import tornado.web
from couch.couch import AsyncCouch
from tornado import httpclient, gen


class LoginHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        db = AsyncCouch()
        response = yield db._http_get('/_session', self.request.headers)
        self.write(response)
        db.close()

    @gen.coroutine
    def post(self):
        uri = 'http://127.0.0.1:5984/_session'
        req = httpclient.HTTPRequest(uri, method='POST', body=self.request.body, headers=self.request.headers)

        try:
            resp = yield httpclient.AsyncHTTPClient().fetch(req)
            print(resp)
            self.write(resp)
        except httpclient.HTTPError as e:
            resp = e.response
            print(e)
            self.set_status(401)


        # print(self.request.body)
        # print(self.request.headers)
        # try:
        #     response = yield db._http_post('/_session', self.request.body, headers=self.request.headers)
        #     print(response)
        #     self.write(response)
        # except:
        #     self.set_status(401)
        # db.close()