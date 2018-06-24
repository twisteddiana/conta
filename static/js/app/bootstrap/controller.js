angular
  .module('Conta')
  .controller("bootstrapCtrl", function ($scope, $http, $state, Currency) {
    $scope.loadCurrencies = () => {
      $scope.exchangeRate = 1;

      return Currency
        .all()
        .then(currencies => {
          $scope.currencies = currencies;
          $scope.main_currency = currencies.find(currency => currency.main).iso;
        });
    };
  });