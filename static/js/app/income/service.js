angular
  .module('Conta')
  .service('IncomeCalculationService', function(EntityCalculationService) {
    const service = Object.assign({}, EntityCalculationService);
    service.init = (mainCurrency) => ({
      vat: 0,
      type: 'income',
      classification: 'Incasare',
      deductible: 100,
      currency: mainCurrency,
    });

    return service;
  });
