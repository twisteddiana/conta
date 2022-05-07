from components.expenses.expenses import Expenses
import tornado.web
from lib.controller import ContaController
import pdfkit
from lib.env import env

expenses = Expenses()

class ExpensesHandler(ContaController):
    async def init(self):
        await expenses.initialise()

    async def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        docs = await expenses.collection(params)
        self.write(docs)

    async def get(self, id):
        doc = await expenses.get(id)
        if doc is None:
            self.set_status(404)
        else:
            self.write(doc)

    async def put(self):
        dict = tornado.escape.json_decode(self.request.body)
        doc = await expenses.post(dict)
        self.write(doc)

    async def delete(self, id):
        doc = await expenses.delete(id)
        self.write(doc)


class ExpensesUploadHandler(ContaController):
    async def init(self):
        await expenses.initialise()

    async def put(self):
        result = {}
        post_expense = tornado.escape.json_decode(self.get_body_argument("expense"))
        for file in self.request.files:
            result = await expenses.save_attachment(post_expense, self.request.files[file][0])
            post_expense = { '_id': result['id'], '_rev': result['rev'] }
        self.write(result)

    async def post(self, attachment_name):
        doc = tornado.escape.json_decode(self.request.body)

        result = await expenses.get_attachment(doc, attachment_name)
        self.write(result)

    async def delete(self):
        doc = {
            '_id': self.get_argument('doc_id'),
            '_rev': self.get_argument('rev')
        }
        result = await expenses.delete_attachment(doc, self.get_argument('name'))
        self.write(result)


class ExpensesSheetHandler(ContaController):
    async def init(self):
        await expenses.initialise()

    async def get(self, id):
        doc = await expenses.prepare_sheet(id)
        if doc:
            html = self.render_string("reports/expenses.html", item=doc)
            my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=env['pdfkit_config'])
            self.write(my_pdf)
        else:
            self.write('')
