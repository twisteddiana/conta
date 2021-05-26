from components.couch import CouchClass

class Settings(CouchClass):
    doc_name = 'settings'
    db_name = 'settings'

    async def get(self, year):
        settings = await super().get(self.doc_name)
        per_year = await super().get(self.get_id(year))
        return self.merge(settings, per_year)

    def get_id(self, year):
        return self.doc_name + year

    def merge(self, settings, per_year):
        merged = settings.copy
        merged.update(per_year)
        return merged

    async def paying_vat(self, year):
        settings = await self.get(year)
        return settings['paying_vat']

    async def base_salary(self, year):
        settings = await self.get(year)
        return settings['base_salary']

    async def max_installment(self, year):
        settings = await self.get(year)
        return settings['max_installment']

    async def income_tax(self, year):
        settings = await self.get(year)
        return settings['income_tax']

    async def post(self, year, dict):
        if '_rev' not in dict.keys():
            dict['_id'] = self.get_id(year)
        return await self.db.save_doc(dict)
