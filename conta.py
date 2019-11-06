import tornado.ioloop
import tornado.web
import signal
import logging
from tornado.options import options
from settings.settings import settings
from tornado import gen
from components.organisations.controller import OrganisationsHandler, OrganisationHandler
from components.entity.controller import EntityHandler, EntitiesHandler, CurrencyHandler, CurrenciesHandler, ExchangeRateHandler, EntityUploadHandler
from components.amortizations.controller import AmortizationsHandler, AmortizationHandler, AmortizationSheetHandler
from components.reports.controller import ReportHandler, StatementHandler, ExportHandler
from components.inventory.controller import InventoryHandler, InventoryReportHandler
from components.expenses.controller import ExpensesHandler, ExpensesUploadHandler, ExpensesSheetHandler

is_closing = False

def signal_handler(signum, frame):
    global is_closing
    logging.info('exiting...')
    is_closing = True

def try_exit():
    global is_closing
    if is_closing:
        # clean up here
        tornado.ioloop.IOLoop.instance().stop()
        logging.info('exit success')

class MainHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        self.render("index.html")

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/organisations", OrganisationsHandler),
        (r"/organisations/(.*)", OrganisationsHandler),
        (r"/organisation", OrganisationHandler),
        (r"/organisation/(.*)", OrganisationHandler),
        (r"/entities", EntitiesHandler),
        (r"/entity", EntityHandler),
        (r"/entity/upload", EntityUploadHandler),
        (r"/entity/attachment", EntityUploadHandler),
        (r"/entity/attachment/(.*)", EntityUploadHandler),
        (r"/entity/(.*)", EntityHandler),
        (r"/amortizations", AmortizationsHandler),
        (r"/amortization", AmortizationHandler),
        (r"/amortization/sheet/(.*)", AmortizationSheetHandler),
        (r"/amortization/(.*)", AmortizationHandler),
        (r"/report", ReportHandler),
        (r"/statement", StatementHandler),
        (r"/inventory", InventoryHandler),
        (r"/inventory/report", InventoryReportHandler),
        (r"/inventory/(.*)", InventoryHandler),
        (r"/currencies", CurrenciesHandler),
        (r"/currency/?(?P<param_name>[A-Za-z0-9-]+)?/", CurrencyHandler),
        (r"/exchange_rates/(?P<iso>[^\/]+)/?(?P<request_date>[^\/]+)?", ExchangeRateHandler),
        (r"/expenses", ExpensesHandler),
        (r"/expenses/sheet/(.*)", ExpensesSheetHandler),
        (r"/expense/upload", ExpensesUploadHandler),
        (r"/expense/attachment", ExpensesUploadHandler),
        (r"/expense/attachment/(.*)", ExpensesUploadHandler),
        (r"/expense/(.*)", ExpensesHandler),
        (r"/expense", ExpensesHandler),
        (r"/currency/?(?P<param_name>[A-Za-z0-9-]+)?/", CurrencyHandler),
        (r"/export", ExportHandler),
    ],  **settings)

if __name__ == "__main__":
    tornado.options.parse_command_line()
    signal.signal(signal.SIGINT, signal_handler)
    app = make_app()
    app.listen(8888)
    tornado.ioloop.PeriodicCallback(try_exit, 100).start()
    tornado.ioloop.IOLoop.instance().start()
