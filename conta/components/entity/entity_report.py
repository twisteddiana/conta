from components.couch import CouchClass
from components.entity.exchange_rate import ExchangeRate
from components.settings.settings import Settings
from lib.moment import *

exchange_rate = ExchangeRate()
settings = Settings()

class EntityReport(CouchClass):
    db_name = 'enitites'

    def get_amount(self, item, vat_registered, deductible_only):
        real_amount = item['real_amount']
        if vat_registered:
            real_amount -= item['real_vat']
        if deductible_only:
            real_amount = real_amount * item['deductible'] / 100
        return round(real_amount, 2)

    async def report(self, query, include_vat = False):
        await settings.initialise()
        dictionary = {
            'design': 'all',
            'reduce': False,
            'include_docs': True,
        }

        date_start = start_of_month(get_date(query['date_start']))
        date_start_year = start_of_year(date_start)
        date_start_timestamp = timestamp(date_start)

        date_end = end_of_month(get_date(query['date_end']))

        vat_registered = await settings.vat_registered(get_date(query['date_start']).year)
        exclude_vat = not include_vat and vat_registered

        if query['report'] == 'registry' or query['report'] == 'fiscal_evidence':
            dictionary['view'] = 'date'
            dictionary['start_key'] = timestamp(date_start_year)
            dictionary['end_key'] = timestamp(date_end)
        else:
            dictionary['view'] = 'classification'
            dictionary['start_key'] = [query['classification'], timestamp(date_start_year)]
            dictionary['end_key'] = [query['classification'], timestamp(date_end)]

        result = await self.db.view(dictionary['design'], dictionary['view'], **dictionary)
        # group by months
        report = 0
        transactions = []
        deductible_only = query['report'] == 'journal'
        for item in result['rows']:
            item = item['doc']
            transaction_date = datetime.fromtimestamp(item['date'])

            if item['date'] < date_start_timestamp:
                report += self.get_amount(item, exclude_vat, deductible_only)
            else:
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
                transaction['amount'] = self.get_amount(item, exclude_vat, deductible_only)
                transaction['deductible'] = item['deductible']

                transactions.append(transaction)
        return {
            'report': report,
            'transactions': transactions
        }

    async def fiscal_evidence_report(self, query):
        await settings.initialise()
        vat_registered = await settings.vat_registered(get_date(query['date_start']).year)

        classifications_result = await self.db.view('all', 'classification', reduce=True, group_level=1)
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

            result = await self.db.view('all', 'classification', **classifications_query)
            for row in result['rows']:
                transaction_date = datetime.fromtimestamp(row['doc']['date'])
                amount = self.get_amount(row['doc'], vat_registered, True)
                if amount == 0:
                    continue
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

            if len(transactions) == 0:
                continue

            classifications.append({
                'name': classification_name,
                'transactions': transactions,
                'total': round(total, 2)
            })

        return {
            'classifications': classifications,
            'year': date_start.year
        }

    async def export(self, query):
        exchange_rate.update()
        await settings.initialise()
        vat_registered = await settings.vat_registered(get_date(query['date_start']).year)

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

        result = await self.db.view(dictionary['design'], dictionary['view'], **dictionary)
        rows = result['rows']

        csv = ''
        headers = ['Data', 'Tip', 'Descriere', 'Tip tranzactie', 'Valuta', 'Valoare', 'TVA', 'Curs', 'Valoare RON',
                   'TVA RON', 'Deductibil %', 'Deductibil RON']
        csv += ','.join(headers) + '\n'

        for doc in rows:
            doc = doc['doc']
            rate = '1' if doc['currency'] == 'RON' else \
                (await exchange_rate.get(doc['currency'], doc['date_clear'], False))['exchange_rate']
            deductible = doc['deductible'] if doc['type'] == 'payment' else ''
            deductible_amount = self.get_amount(doc, vat_registered, deductible)

            if 'vat' not in doc:
                doc['vat'] = ''
                doc['real_vat'] = ''
            dict = {
                'Data': doc['date_clear'],
                'Tip': 'Plata' if doc['type'] == 'payment' else 'Incasare',
                'Descriere': doc['description'],
                'Tip tranzactie': 'Banca' if doc['payment_type'] == 'Bank' else 'Numerar',
                'Valuta': doc['currency'],
                'Valoare': doc['amount'],
                'TVA': doc['vat'],
                'Curs': rate,
                'Valoare RON': doc['real_amount'],
                'TVA RON': doc['real_vat'],
                'Deductibil %': deductible,
                'Deductibil RON': deductible_amount if deductible != '' else ''
            }
            row = []
            for header in headers:
                row.append(str(dict[header]))
            csv += ','.join(row) + '\n'

        return csv

    async def statement(self, query):
        date_start = start_of_year(get_date(query['year'], '%Y'))
        date_end = end_of_year(get_date(query['year'], '%Y'))

        await settings.initialise()
        vat_registered = await settings.vat_registered(query['year'])
        income_tax_percent = await settings.income_tax(query['year'])
        cas_percent = await settings.cas_percent(query['year'])
        cas_from_total = await settings.cas_from_total(query['year'])
        calculate_cas = await settings.calculate_cas(query['year'])
        cass_percent = await settings.cass_percent(query['year'])
        cass_from_total = await settings.cass_from_total(query['year'])
        base_salary = await settings.base_salary(query['year'])

        dictionary = {
            'design': 'all',
            'view': 'date',
            'start_key': timestamp(date_start),
            'end_key': timestamp(date_end),
            'reduce': False,
            'include_docs': True
        }

        result = await self.db.view(dictionary['design'], dictionary['view'], **dictionary)
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
                real_amount = self.get_amount(doc['doc'], vat_registered, False)
                brut_income += real_amount
                if doc['doc']['deductible'] < 100:
                    untaxable_income += round(real_amount * (100 - doc['doc']['deductible']) / 100, 2)
            else:
                amount = self.get_amount(doc['doc'], vat_registered, True)
                if doc['doc']['classification'] == 'CAS (pensie)' or doc['doc']['classification'] == 'CASS (sanatate)':
                    social_payments[doc['doc']['classification']] += round(amount, 2)
                else:
                    payments += round(amount, 2)

        brut_income = round(brut_income, 2)
        untaxable_income = round(untaxable_income, 2)
        payments = round(payments, 2)
        social_payments['CAS (pensie)'] = round(social_payments['CAS (pensie)'], 2)
        social_payments['CASS (sanatate)'] = round(social_payments['CASS (sanatate)'], 2)
        net_income = round(brut_income - payments, 2)

        if calculate_cas:
            if cas_from_total:
                pension = round((net_income - untaxable_income) * cas_percent / 100, 2)
            else:
                pension = round(base_salary * 12 * cas_percent / 100, 2)
        else:
            pension = social_payments['CAS (pensie)']

        if cass_from_total:
            medical_insurance = round((net_income - untaxable_income) * cass_percent / 100, 2)
        else:
            medical_insurance = round(base_salary * 12 * cass_percent / 100, 2)

        income_tax = round((net_income - untaxable_income - medical_insurance) * income_tax_percent / 100, 2)

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

    # if query['year'] <= '2015':
    #     medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
    #     pension = round((net_income - untaxable_income) * 10.5 / 100, 2)
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
    # elif query['year'] == '2016':
    #     medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
    #     pension = social_payments['CAS (pensie)']
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
    # elif query['year'] == '2017':
    #     medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
    #     pension = social_payments['CAS (pensie)']
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
    # elif query['year'] == '2018':
    #     base = 1900
    #     medical_insurance = round(base * 12 * 10 / 100, 2)
    #     pension = round(base * 12 * 25 / 100, 2)
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 10 / 100, 2)
    # elif query['year'] == '2019':
    #     base = 2080
    #     medical_insurance = round(base * 12 * 10 / 100, 2)
    #     pension = round(base * 12 * 25 / 100, 2)
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 10 / 100, 2)
    # elif query['year'] == '2020':
    #     base = 2230
    #     medical_insurance = round(base * 12 * 10 / 100, 2)
    #     pension = round(base * 12 * 25 / 100, 2)
    #     income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 10 / 100, 2)