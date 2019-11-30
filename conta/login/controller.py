import tornado.web
from tornado import gen
from components.couch import MyAsyncCouch
import couch.couch


class LoginHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        db = MyAsyncCouch()
        response = yield db._http_get('/_session', self.request.headers)
        self.write(response)
        db.close()

    @gen.coroutine
    def post(self):
        db = MyAsyncCouch()
        print(self.request.body)
        try:
            response = yield db._http_post('/_session', self.request.body, headers=self.request.headers)
            self.write(response)
        except:
            self.set_status(401)
        db.close()