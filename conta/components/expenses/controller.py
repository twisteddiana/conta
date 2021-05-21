from components.expenses.expenses import Expenses
import tornado.web
from lib.controller import ContaController
from tornado import gen
import pdfkit
from lib.settings import settings

expenses = Expenses()
expenses.initialise()

class ExpensesHandler(ContaController):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        docs = yield expenses.collection(params)
        self.write(docs)

    @gen.coroutine
    def get(self, id):
        doc = yield expenses.get(id)
        if doc is None:
            self.set_status(404)
        else:
            self.write(doc)

    @gen.coroutine
    def put(self):
        dict = tornado.escape.json_decode(self.request.body)
        doc = yield expenses.post(dict)
        self.write(doc)

    @gen.coroutine
    def delete(self, id):
        doc = yield expenses.delete(id)
        self.write(doc)


class ExpensesUploadHandler(ContaController):
    @gen.coroutine
    def put(self):
        result = {}
        post_expense = tornado.escape.json_decode(self.get_body_argument("expense"))
        for file in self.request.files:
            result = yield expenses.save_attachment(post_expense, self.request.files[file][0])
            post_expense = { '_id': result['id'], '_rev': result['rev'] }
        self.write(result)

    @gen.coroutine
    def post(self, attachment_name):
        doc = tornado.escape.json_decode(self.request.body)

        result = yield expenses.get_attachment(doc, attachment_name)
        self.write(result)

    @gen.coroutine
    def delete(self):
        doc = {
            '_id': self.get_argument('doc_id'),
            '_rev': self.get_argument('rev')
        }
        result = yield expenses.delete_attachment(doc, self.get_argument('name'))
        self.write(result)


class ExpensesSheetHandler(ContaController):
    @gen.coroutine
    def get(self, id):
        doc = yield expenses.prepareSheet(id)
        if doc:
            html = self.render_string("reports/expenses.html", item=doc)
            my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=settings['pdfkit_config'])
            self.write(my_pdf)
        else:
            self.write('')
