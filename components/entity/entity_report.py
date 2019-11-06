from components.couch import MyAsyncCouch
from tornado import gen
from components.entity.exchange_rate import ExchangeRate
from components.lib.moment import *


class EntityReport:
    db = None

    @gen.coroutine
    def initialise(self):
        self.db = MyAsyncCouch('enitites')
        try:
            yield self.db.create_db()
        except:
            pass

    @gen.coroutine
    def report(self, query):
        dictionary = {'design': 'all'}

        date_start = start_of_month(get_date(query['date_start']))
        date_start_year = start_of_year(date_start)
        date_start_timestamp = timestamp(date_start)

        date_end = end_of_month(get_date(query['date_end']))

        if query['report'] == 'registry' or query['report'] == 'fiscal_evidence':
            dictionary['view'] = 'date'
            dictionary['start_key'] = timestamp(date_start_year)
            dictionary['end_key'] = timestamp(date_end)
        else:
            dictionary['view'] = 'classification'
            dictionary['start_key'] = [query['classification'], timestamp(date_start_year)]
            dictionary['end_key'] = [query['classification'], timestamp(date_end)]

        dictionary['reduce'] = False
        dictionary['include_docs'] = True
        result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)

        rows = result['rows']

        # group by months

        report = 0
        transactions = []
        deductible_only = query['report'] == 'journal'
        for item in rows:
            item = item['doc']
            if item['date'] < date_start_timestamp:
                if deductible_only:
                    # sum up only deductible
                    report += round(item['real_amount'] * item['deductible'] / 100, 2)
                else:
                    # sum up the amount
                    report += round(item['real_amount'], 2)
            else:
                transaction_date = datetime.fromtimestamp(item['date'])

                transaction = {
                    'date': item['date_clear'],
                    'document_type': item['document_type'],
                    'document_number': item['document_number'],
                    'description': item['description'],
                    'month': transaction_date.month,
                    'year': transaction_date.year,
                    'payment_type': item['payment_type'],
                    'type': item['type'],
                    'foreign_currency_amount': str(item['amount']) + " " + item['currency'] if item['currency'] != 'RON' else '',
                }
                if 'real_amount' in item.keys():
                    if deductible_only:
                        # sum up only deductible
                        transaction['amount'] = round(item['real_amount'] * item['deductible'] / 100, 2)
                    else:
                        transaction['amount'] = round(item['real_amount'], 2)
                        transaction['deductible'] = item['deductible']
                transactions.append(transaction)
        return {
            'report': report,
            'transactions': transactions
        }

    @gen.coroutine
    def fiscal_evidence_report(self, query):
        classifications_result = yield self.db.view('all', 'classification', reduce=True, group_level=1)
        classifications = []

        date_start = start_of_month(get_date(query['date_start']))
        date_end = end_of_month(get_date(query['date_end']))

        for classification in classifications_result['rows']:
            classification_name = classification['key'][0]
            if classification_name == 'CAS (pensie)' or classification_name == 'CASS (sanatate)':
                continue

            transactions = []
            total = 0
            classifications_query = {
                'start_key': [classification_name, timestamp(date_start)],
                'end_key': [classification_name, timestamp(date_end)],
                'reduce': False,
                'include_docs': True
            }

            result = yield self.db.view('all', 'classification', **classifications_query)
            for row in result['rows']:
                transaction_date = datetime.fromtimestamp(row['doc']['date'])
                amount = row['doc']['deductible_amount'] if 'deductible_amount' in row['doc'] else row['doc'][
                    'real_amount']
                transaction = {
                    'date': row['doc']['date_clear'],
                    'document_type': row['doc']['document_type'],
                    'document_number': row['doc']['document_number'],
                    'description': row['doc']['description'],
                    'month': transaction_date.month,
                    'year': transaction_date.year,
                    'payment_type': row['doc']['payment_type'],
                    'type': row['doc']['type'],
                    'amount': round(amount, 2)
                }
                transactions.append(transaction)
                total += round(transaction['amount'], 2)

            classifications.append({
                'name': classification_name,
                'transactions': transactions,
                'total': round(total, 2)
            })

        return {
            'classifications': classifications,
            'year': date_start.year
        }

    @gen.coroutine
    def export(self, query):
        exchange_rate = ExchangeRate()
        exchange_rate.initialise()
        exchange_rate.update()

        date_start = start_of_month(get_date(query['date_start']))
        date_end = end_of_month(get_date(query['date_end']))

        dictionary = {
            'design': 'all',
            'view': 'date',
            'start_key': timestamp(date_start),
            'end_key': timestamp(date_end),
            'reduce': False,
            'include_docs': True
        }

        result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)
        rows = result['rows']

        csv = ''
        headers = ['Data', 'Tip', 'Descriere', 'Tip tranzactie', 'Valuta', 'Valoare', 'Curs', 'Valoare RON',
                   'Deductibil %', 'Deductibil RON']
        csv += ','.join(headers) + '\n'

        for doc in rows:
            doc = doc['doc']
            rate = '1' if doc['currency'] == 'RON' else \
                (yield exchange_rate.get(doc['currency'], doc['date_clear'], False))['exchange_rate']
            deductible = doc['deductible'] if doc['type'] == 'payment' else ''
            dict = {
                'Data': doc['date_clear'],
                'Tip': 'Plata' if doc['type'] == 'payment' else 'Incasare',
                'Descriere': doc['description'],
                'Tip tranzactie': 'Banca' if doc['payment_type'] == 'Bank' else 'Numerar',
                'Valuta': doc['currency'],
                'Valoare': doc['amount'],
                'Curs': rate,
                'Valoare RON': doc['real_amount'],
                'Deductibil %': deductible,
                'Deductibil RON': round(doc['deductible_amount'], 2) if deductible != '' else ''
            }
            row = []
            for header in headers:
                row.append(str(dict[header]))
            csv += ','.join(row) + '\n'

        return csv

    @gen.coroutine
    def statement(self, query):
        date_start = start_of_year(get_date(query['year'], '%Y'))
        date_end = end_of_year(get_date(query['year'], '%Y'))

        dictionary = {
            'design': 'all',
            'view': 'date',
            'start_key': timestamp(date_start),
            'end_key': timestamp(date_end),
            'reduce': False,
            'include_docs': True
        }

        result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)
        rows = result['rows']

        brut_income = 0
        untaxable_income = 0
        payments = 0
        social_payments = {
            'CAS (pensie)': 0,
            'CASS (sanatate)': 0
        }

        for doc in rows:
            if doc['doc']['type'] == 'income':
                brut_income += round(doc['doc']['real_amount'], 2)
                if doc['doc']['deductible'] < 100:
                    untaxable_income += round(doc['doc']['real_amount'] * (100 - doc['doc']['deductible']) / 100, 2)
            else:
                if doc['doc']['classification'] == 'CAS (pensie)' or doc['doc']['classification'] == 'CASS (sanatate)':
                    social_payments[doc['doc']['classification']] += round(doc['doc']['deductible_amount'], 2)
                else:
                    payments += round(doc['doc']['deductible_amount'], 2)

        brut_income = round(brut_income, 2)
        untaxable_income = round(untaxable_income, 2)
        payments = round(payments, 2)
        social_payments['CAS (pensie)'] = round(social_payments['CAS (pensie)'], 2)
        social_payments['CASS (sanatate)'] = round(social_payments['CASS (sanatate)'], 2)
        net_income = round(brut_income - payments, 2)

        if query['year'] <= '2015':
            medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
            pension = round((net_income - untaxable_income) * 10.5 / 100, 2)
            income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
        elif query['year'] == '2016':
            medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
            pension = social_payments['CAS (pensie)']
            income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
        elif query['year'] == '2017':
            medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
            pension = social_payments['CAS (pensie)']
            income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
        elif query['year'] == '2018':
            base = 1900
            medical_insurance = round(base * 12 * 10 / 100, 2)
            pension = round(base * 12 * 25 / 100, 2)
            income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 10 / 100, 2)

        return {
            'brut_income': brut_income,
            'untaxable_income': untaxable_income,
            'payments': payments,
            'social_payments': social_payments,
            'net_income': net_income,
            'medical_insurance': medical_insurance,
            'pension': pension,
            'income_tax': income_tax
        }