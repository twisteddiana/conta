/**
 * Created by Diana on 11/22/2016.
 */
angular
  .module('Conta')
  .controller("amortizationsCtrl", function ($scope, $http, $state, Amortization, SweetAlert) {
    $scope.title = "Mijloace fixe";
    $scope.subtitle = "Lista";

    $scope.design = 'objects';
    $scope.limit = 50;
    $scope.sort = 'date';
    $scope.direction = 'desc';
    $scope.skip = 0;

    $scope.getListParams = () => ({
      design: $scope.design,
      skip: $scope.skip,
      limit: parseInt($scope.limit),
      sort: $scope.sort,
      direction: $scope.direction
    });

    $scope.getList = () => {
      Amortization
        .all($scope.getListParams())
        .then(data => {
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows / $scope.limit);
        })
    };

    $scope.getList();

    $scope.edit = id => $state.go('app.amortizations-edit', { entityID: id });

    $scope.add = () => $state.go('app.amortizations-add');
    $scope.view = id => $state.go('app.amortizations-view', { entityID: id });

    $scope.delete = id =>
      SweetAlert.swal({
        title: "Are you sure?",
        text: "Your will not be able to recover this document!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel plx!",
        closeOnConfirm: true,
        closeOnCancel: true
      }, (isConfirm) => {
        if (isConfirm) {
          $state.go('app.amortizations-delete', {entityID: id})
        }
      });

    $scope.changeSort = column => {
      if ($scope.sort === column) {
        $scope.direction = $scope.direction === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.sort = column;
        $scope.direction = "asc";
      }

      $scope.getList();
    };

    $scope.synchronizing = false;
    $scope.synchronizePayments = () => {
      $scope.synchronizing = true;
      Amortization
        .synchronize()
        .then(() => $scope.synchronizing = false)
    };

    $scope.downloadSheet = item =>
      Amortization
        .downloadSheet(item.id)
        .then(data => {
          const hiddenElement = document.createElement('a');
          hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
          hiddenElement.target = '_blank';
          hiddenElement.download = `Fisa mijlocului fix ${item.doc.name}.pdf`;
          hiddenElement.click();
          hiddenElement.remove();
        });
  });


angular
  .module('Conta')
  .controller("amortizationsAddCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state, $controller) {
    $scope.title = 'Noua amortizare';
    $scope.subtitle = 'Amortizari';
    $scope.item = {};

    $controller('bootstrapCtrl', { $scope });
    $scope
      .loadCurrencies()
      .then(() => $scope.item.currency = $scope.main_currency);

    $scope.submit = isValid => {
      if (!isValid) {
        return;
      }

      $scope.item.type = 'object';
      Amortization
        .create($scope.item)
        .then(() => $state.go('app.amortizations'))
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("amortizationsViewCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state, $stateParams, $controller) {
    $scope.title = 'Transe Amortizare';
    $scope.subtitle = 'Income';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {};

    $controller('bootstrapCtrl', { $scope });
    $scope.loadCurrencies();

    Amortization
      .get($scope.entityID)
      .then(item => {
        $scope.item = item;
        $scope.subtitle = $scope.item.name;

        $scope.getList();
      });

    $scope.getListParams = () => ({
      design: 'installments',
      skip: 0,
      limit: $scope.item.duration,
      sort: 'object',
      direction: 'asc',
      start_key: [ $scope.entityID ],
      end_key: [ $scope.entityID , {}],
      reduce: false
    });

    $scope.getList = () =>
      Amortization
        .all($scope.getListParams())
        .then(data => {
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
        });
  });

angular
  .module('Conta')
  .controller("amortizationsEditCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state, $stateParams, $controller) {
    $scope.title = 'Modificare';
    $scope.subtitle = 'Amortizari';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {};

    $controller('bootstrapCtrl', { $scope });
    $scope.loadCurrencies();

    Amortization
      .get($scope.entityID)
      .then(item => {
        $scope.item = item;
        $scope.item.date = $scope.item.date_clear;
        $scope.subtitle = $scope.item.name;
      });

    $scope.downloadSheet = () => {
      Amortization.downloadSheet($scope.item._id).then((data) => {
        var blob = new Blob([data], {type: 'application/pdf'})
        var url = URL.createObjectURL(blob);

        var name = 'Fisa mijlocului fix '+ $scope.item.name;

        var hiddenElement = document.createElement('a');
        hiddenElement.href = url;
        hiddenElement.target = '_blank';
        hiddenElement.download = name + '.pdf';
        hiddenElement.click();
        hiddenElement.remove();
      })
    };

    $scope.submit = isValid => {
      if (!isValid) {
        return;
      }
      $scope.item.type = 'object';

      Amortization
        .create($scope.item)
        .then(() => $state.go('app.amortizations'))
        .catch(errors => $scope.errors = errors);
    }
  });
