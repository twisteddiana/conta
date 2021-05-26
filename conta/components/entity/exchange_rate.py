from components.couch import CouchClass
from tornado.httpclient import AsyncHTTPClient
import xml.etree.ElementTree as ET
from components.entity.currency import Currency
from lib.moment import *

currency = Currency()

class ExchangeRate(CouchClass):
    db_name = 'exchange_rates'

    async def update(self):
        currencies = (await currency.collection())['rows']
        today = date.today()
        for item in currencies:
            if item['doc']['iso'] != 'RON':
                await self.import_rates(today.year, item['doc']['iso'])
                await self.import_rates(today.year - 1, item['doc']['iso'])

    async def post(self, dict):
        doc = await self.db.save_doc(dict)
        return doc

    async def get(self, iso, request_date=None, import_rates=True):
        if request_date is None:
            request_date = last_working_day(datetime.combine(date.today(), datetime.min.time()))
        else:
            request_date = last_working_day(get_date(request_date))
        request_timestamp = str(timestamp(request_date))

        try:
            doc = await self.db.get_doc(iso + ':' + request_timestamp)
        except:
            # the pair was not found
            # import the thing
            year = request_date.year
            print('requested date not found ' + iso + ':' + request_timestamp + ' ' + str(request_date))

            if import_rates:
                await self.import_rates(year, iso)
                await self.import_rates(year - 1, iso)

            try:
                doc = await self.db.get_doc(iso + ':' + request_timestamp)
            except:
                result = await self.db.view('filter', 'by_date_and_iso', start_key=iso + request_timestamp, descending=True, limit=1, inclusive_end=True)
                doc = {'exchange_rate': result['rows'][0]['value']}

        return doc

    async def import_rates(self, year, iso):
        url = 'http://www.bnr.ro/files/xml/years/nbrfxrates' + str(year) + '.xml'
        http_client = AsyncHTTPClient()
        response = await http_client.fetch(url)

        root = ET.fromstring(response.body)
        for cube in root[1].findall('{http://www.bnr.ro/xsd}Cube'):
            dict = cube.attrib
            exchange_rate_date = timestamp(get_date(dict['date'], '%Y-%m-%d'))
            dict['_id'] = '%s:%s' % (iso, exchange_rate_date)
            dict['date'] = exchange_rate_date
            dict['iso'] = iso

            for rate in cube.findall('{http://www.bnr.ro/xsd}Rate'):
                if rate.attrib['currency'] == iso:
                    dict['exchange_rate'] = rate.text

            try:
                await self.db.get_doc(dict['_id'])
            except:
                await self.db.save_doc(dict)