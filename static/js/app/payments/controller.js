/**
 * Created by Diana on 11/12/2016.
 */
angular
  .module('Conta')
  .controller("paymentsCtrl", function ($scope, $http, $state, Entity, $controller, SweetAlert) {
    $scope.title = "Plati";
    $scope.subtitle = "Lista";

    $scope.design = 'payments';
    $controller('entityController', { $scope: $scope });

    $scope.filters['deductible_amount'] = {
      name: 'Val. deductibila',
      type: 'range',
      format: 'number'
    };
    $scope.applyCookieFilter();
    $scope.getList();

    $scope.edit = (id) => $state.go('app.payments-edit', {entityID: id});
    $scope.add = () => $state.go('app.payments-add');
    $scope.clone = (id) => $state.go('app.payments-clone', {entityID: id});

    $scope.delete = (id) =>
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
        isConfirm => isConfirm && $state.go('app.payments-delete', {entityID: id}));
  });

angular
  .module('Conta')
  .controller("paymentsAddCtrl", function ($scope, $http, Entity, Currency, Organisation, ExchangeRates, $state, $controller, EntityAttachmentUpload) {
    $scope.title = 'Add payment entity';
    $scope.subtitle = 'Income';
    $scope.item = {
      type: 'payment',
      deductible: 100,
      vat: 0,
    };

    $scope.currencies = [];

    $controller('entityAddCtrl', { $scope: $scope });
    $controller('dashboardCtrl', { $scope: $scope });
    const currencyPromise = $scope.loadCurrencies().then(() => $scope.item.currency = $scope.main_currency);

    $scope.$watchCollection('item', () => currencyPromise.then(() => calculate()));

    const calculate = () => {
      $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
      $scope.item.deductible_amount = $scope.item.real_amount * $scope.item.deductible / 100;
      $scope.item.real_vat = $scope.item.vat * $scope.exchange_rate;
    };

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }

      currencyPromise.then(() => {
        calculate();

        Entity
          .create($scope.item)
          .then(result => {
            $scope.item._id = result.id;
            $scope.item._rev = result.rev;

            if ($scope.attachments) {
              EntityAttachmentUpload
                .upload($scope.attachments, $scope.item)
                .then(() => $state.go('app.payments'));
            } else {
              $state.go('app.payments');
            }
          })
          .catch(errors => $scope.errors = errors);
      });
    }
  });

angular
  .module('Conta')
  .controller("paymentsEditCtrl", function($scope, $http, Entity, Organisation, Currency, ExchangeRates, $state, $stateParams, $controller, EntityAttachmentUpload){
    $scope.title = 'Edit payment entity';
    $scope.subtitle = 'Payment';
    $scope.item_id = $stateParams.entityID;
    $scope.item = {};
    $controller('entityAddCtrl', { $scope: $scope });
    $controller('dashboardCtrl', { $scope: $scope });

    const currencyPromise = $scope.loadCurrencies();

    currencyPromise
      .then(() => Entity.get($scope.item_id))
      .then((data) => {
        $scope.item = data;
        $scope.item.date = $scope.item.date_clear;
        $scope.updateExchangeRate();
      });

    $scope.$watchCollection('item', () => currencyPromise.then(() => calculate()));

    const calculate = () => {
      $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
      $scope.item.deductible_amount = $scope.item.real_amount * $scope.item.deductible / 100;
      $scope.item.type = 'payment';
      $scope.item.real_vat = $scope.item.vat * $scope.exchange_rate;
    };

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      calculate();

      Entity
        .create($scope.item)
        .then(result => {
          $scope.item._rev = result.rev;
          if ($scope.attachments) {
            EntityAttachmentUpload
              .upload($scope.attachments, $scope.item)
              .then(() => $state.go('app.payments'));
          } else {
            $state.go('app.payments');
          }
        })
        .catch(errors => $scope.errors = errors);
    }
  });


angular
  .module('Conta')
  .controller("paymentsCloneCtrl", function($scope, $http, Entity, Organisation, Currency, ExchangeRates, $state, $stateParams, $controller, EntityAttachmentUpload){
    $scope.title = 'Edit payment entity';
    $scope.subtitle = 'Payment';
    $scope.item_id = $stateParams.entityID;
    $scope.item = {};

    $controller('entityAddCtrl', { $scope: $scope });
    $controller('dashboardCtrl', { $scope: $scope });
    const currencyPromise = $scope.loadCurrencies();

    currencyPromise
      .then(() => Entity.get($scope.item_id))
      .then((data) => {
        $scope.item = data;
        delete $scope.item._id;
        delete $scope.item._rev;
        delete $scope.item._attachments;
        $scope.item.date = $scope.item.date_clear;
        $scope.updateExchangeRate();
      });

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }

      $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
      $scope.item.deductible_amount = $scope.item.real_amount * $scope.item.deductible / 100;
      $scope.item.type = 'payment';
      $scope.item.vat = $scope.item.amount * $scope.item.vat_percent / 100;
      $scope.item.real_vat = $scope.item.vat * $scope.exchange_rate;

      Entity.create($scope.item)
        .then(result => {
          $scope.item._id = result.id;
          $scope.item._rev = result.rev;

          if ($scope.attachments) {
            EntityAttachmentUpload
              .upload($scope.attachments, $scope.item)
              .then(() => $state.go('app.payments'));
          } else {
            $state.go('app.payments');
          }
        })
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("paymentsDeleteCtrl", function($scope, $http, Entity, $state, $stateParams){
  $scope.item_id = $stateParams.entityID;

  Entity
    .delete($scope.item_id)
    .then(() => $state.go('app.payments'))
});
