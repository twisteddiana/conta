/**
 * Created by Diana on 11/12/2016.
 */
angular
  .module('Conta')
  .controller("incomeCtrl", function ($scope, $http, $state, Entity, $controller, SweetAlert) {
    $scope.title = "Incasari";
    $scope.subtitle = "Lista";

    $scope.design = 'income';
    $controller('entityController', { $scope: $scope });

    $scope.getList();

    $scope.edit = id => $state.go('app.income-edit', {entityID: id});
    $scope.add = () => $state.go('app.income-add');

    $scope.delete = id =>
      SweetAlert.swal(
        {
          title: "Are you sure?",
          text: "Your will not be able to recover this document!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "No, cancel plx!",
          closeOnConfirm: true,
          closeOnCancel: true
        },
        isConfirm => isConfirm ? $state.go('app.income-delete', {entityID: id}): '');
  });

angular
  .module('Conta')
  .controller("incomeAddCtrl", function ($scope, $http, Entity, Currency, Organisation, ExchangeRates, $state, $controller, EntityAttachmentUpload, IncomeCalculationService) {
    $scope.title = 'Add income entity';
    $scope.item = {};
    $scope.subtitle = 'Income';
    $scope.currencies = [];

    $controller('entityAddCtrl', { $scope: $scope });
    const currencyPromise = $scope.loadCurrencies().then(() => {
        $scope.item = IncomeCalculationService.init($scope.main_currency);
    });

    const calculate = (newItem, oldItem = {}) => {
      return currencyPromise.then(() => {
        if (IncomeCalculationService.shouldUpdateExchangeRate(newItem, oldItem)) {
          return $scope.updateExchangeRate().then(() => IncomeCalculationService.calculate($scope.item, $scope.exchange_rate));
        }
      })
    };
    $scope.$watchCollection('item', calculate);

    $scope.submit = isValid => {
      if (!isValid) {
        return;
      }
      return calculate().then(() => {
        return Entity
          .create($scope.item)
          .then(result => {
            $scope.item._id = result.id;
            $scope.item._rev = result.rev;

            if ($scope.attachments) {
              EntityAttachmentUpload
                .upload($scope.attachments, $scope.item)
                .then(() => $state.go('app.income'));
            } else {
              $state.go('app.income');
            }
          })
          .catch(errors => $scope.errors = errors);
      });
    }
  });

angular
  .module('Conta')
  .controller("incomeEditCtrl", function ($scope, $http, Entity, Organisation, Currency, ExchangeRates, $state, $stateParams, $controller, EntityAttachmentUpload, IncomeCalculationService) {
    $scope.title = 'Edit income entity';
    $scope.subtitle = 'Income';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {};
    $scope.attachments = [];

    $controller('entityAddCtrl', { $scope: $scope });
    const currencyPromise = $scope
      .loadCurrencies()
      .then(() => Entity.get($scope.entityID))
      .then(item => {
        $scope.item = item;
        $scope.item.date = $scope.item.date_clear;
        return $scope.updateExchangeRate();
      });

    const calculate = (newItem, oldItem = {}) => {
      return currencyPromise.then(() => {
        if (IncomeCalculationService.shouldUpdateExchangeRate(newItem, oldItem)) {
          return $scope.updateExchangeRate().then(() => IncomeCalculationService.calculate($scope.item, $scope.exchange_rate));
        }
      })
    };
    $scope.$watchCollection('item', calculate);

    $scope.submit = function(isValid) {
      if (!isValid) {
        return;
      }
      return calculate().then(() => {
        return Entity
          .create($scope.item)
          .then(result => {
            $scope.item._rev = result.rev;
            if ($scope.attachments.length) {
              EntityAttachmentUpload
                .upload($scope.attachments, $scope.item)
                .then(() => $state.go('app.income'));
            } else {
              $state.go('app.income');
            }
          })
          .catch(errors => $scope.errors = errors);
      });
    }
  });

angular
  .module('Conta')
  .controller("incomeDeleteCtrl", function ($scope, $http, Entity, $state, $stateParams) {
  $scope.item_id = $stateParams.entityID;

  Entity
    .delete($scope.item_id)
    .then(() => $state.go('app.income'));
});
