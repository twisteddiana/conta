from components.expenses.expenses import Expenses
import tornado.web
from tornado import gen
import pdfkit
from settings.settings import settings


class ExpensesHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}
        expenses = Expenses()
        expenses.initialise()

        docs = yield expenses.collection(params)
        self.write(docs)
        expenses.close()

    @gen.coroutine
    def get(self, id):
        expenses = Expenses()
        expenses.initialise()
        doc = yield expenses.get(id)
        if doc is None:
            self.set_status(404)
        else:
            self.write(doc)
        expenses.close()

    @gen.coroutine
    def put(self):
        dict = tornado.escape.json_decode(self.request.body)
        expenses = Expenses()
        expenses.initialise()
        doc = yield expenses.post(dict)
        self.write(doc)
        expenses.close()

    @gen.coroutine
    def delete(self, id):
        expenses = Expenses()
        expenses.initialise()

        doc = yield expenses.delete(id)
        self.write(doc)
        expenses.close()


class ExpensesUploadHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def put(self):
        result = {}
        post_expense = tornado.escape.json_decode(self.get_body_argument("expense"))
        expense = Expenses()
        expense.initialise()
        for file in self.request.files:
            result = yield expense.save_attachment(post_expense, self.request.files[file][0])
            post_expense = { '_id': result['id'], '_rev': result['rev'] }
        self.write(result)
        expense.close()

    @gen.coroutine
    def post(self, attachment_name):
        doc = tornado.escape.json_decode(self.request.body)
        expense = Expenses()
        expense.initialise()

        result = yield expense.get_attachment(doc, attachment_name)
        self.write(result)
        expense.close()

    @gen.coroutine
    def delete(self):
        doc = {
            '_id': self.get_argument('doc_id'),
            '_rev': self.get_argument('rev')
        }
        expense = Expenses()
        expense.initialise()

        result = yield expense.delete_attachment(doc, self.get_argument('name'))
        self.write(result)
        expense.close()


class ExpensesSheetHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self, id):
        expenses = Expenses()
        expenses.initialise()

        doc = yield expenses.prepareSheet(id)
        if doc:
            html = self.render_string("reports/expenses.html", item=doc)
            my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=settings['pdfkit_config'])
            self.write(my_pdf)
        else:
            self.write('')
        expenses.close()