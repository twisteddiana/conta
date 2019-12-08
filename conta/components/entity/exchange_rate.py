from components.couch import CouchClass
from tornado import gen
from tornado.httpclient import AsyncHTTPClient
import xml.etree.ElementTree as ET
from components.entity.currency import Currency
from lib.moment import *


class ExchangeRate(CouchClass):
    @gen.coroutine
    def initialise(self):
        yield super().initialise('exchange_rates')

    @gen.coroutine
    def update(self):
        currency = Currency()
        currency.initialise()

        currencies = (yield currency.collection())['rows']
        today = date.today()
        for item in currencies:
            if item['doc']['iso'] != 'RON':
                yield self.import_rates(today.year, item['doc']['iso'])
                yield self.import_rates(today.year - 1, item['doc']['iso'])
        currency.close()

    @gen.coroutine
    def post(self, dict):
        doc = yield self.db.save_doc(dict)
        return doc

    @gen.coroutine
    def get(self, iso, request_date=None, import_rates=True):
        if request_date is None:
            request_date = last_working_day(date.today())
        else:
            request_date = last_working_day(get_date(request_date))
        request_timestamp = str(timestamp(request_date))

        try:
            doc = yield self.db.get_doc(iso + ':' + request_timestamp)
        except:
            # the pair was not found
            # import the thing
            year = request_date.year
            print('requested date not found ' + iso + ':' + request_timestamp + ' ' + str(request_date))

            if import_rates:
                current = yield self.import_rates(year, iso)
                prev = yield self.import_rates(year - 1, iso)

            try:
                doc = yield self.db.get_doc(iso + ':' + request_timestamp)
            except:
                result = yield self.db.view('filter', 'by_date_and_iso', start_key=iso + request_timestamp, descending=True, limit=1, inclusive_end=True)
                doc = {
                    'exchange_rate': result['rows'][0]['value']
                }

        return doc

    @gen.coroutine
    def import_rates(self, year, iso):
        url = 'http://www.bnr.ro/files/xml/years/nbrfxrates' + str(year) + '.xml'
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url)

        root = ET.fromstring(response.body)
        for cube in root[1].findall('{http://www.bnr.ro/xsd}Cube'):
            dict = cube.attrib
            exchange_rate_date = str(int(time.mktime(datetime.strptime(dict['date'], '%Y-%m-%d').timetuple())))
            dict['_id'] = '%s:%s' % (iso, exchange_rate_date)
            dict['date'] = exchange_rate_date
            dict['iso'] = iso

            for rate in cube.findall('{http://www.bnr.ro/xsd}Rate'):
                if rate.attrib['currency'] == iso:
                    dict['exchange_rate'] = rate.text

            try:
                doc = yield self.db.get_doc(dict['_id'])
            except:
                doc = yield self.db.save_doc(dict)
        return doc