angular
  .module('Conta')
  .controller('bootstrapCtrl', function ($scope, $http, $state, Currency) {
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

angular.module('Conta').controller('loginCtrl', function($scope, $state, Authorization) {
  $scope.submit = (isValid) => {
    if (!isValid) {
      return;
    }

    return Authorization
      .authenticate($scope.username, $scope.password)
      .then(() => {
        $state.go('app.dashboard');
      })
      .catch(err => {
        $scope.error = err.statusText;
      });
  }
});