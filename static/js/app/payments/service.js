angular
  .module('Conta')
  .service('PaymentCalculationService', function(EntityCalculationService) {
    const service = Object.assign({}, EntityCalculationService);
    service.init = (mainCurrency) => ({
      vat: 0,
      type: 'payment',
      deductible: 100,
      currency: mainCurrency,
    });

    return service;
  });
