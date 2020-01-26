/**
 * Created by Diana on 5/1/2017.
 */
angular
  .module('Conta')
  .controller("expensesCtrl", function ($scope, $http, $state, Expenses, SweetAlert) {
    $scope.title = "Cheltuieli";
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

    $scope.getList = () =>
      Expenses
        .all($scope.getListParams())
        .then(data => {
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows / $scope.limit);
        });
    $scope.getList();

    $scope.edit = id => $state.go('app.expenses-edit', {entityID: id});
    $scope.add = () => $state.go('app.expenses-add');
    $scope.view = id => $state.go('app.expenses-view', {entityID: id});
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
        isConfirm => isConfirm &&  $state.go('app.expenses-delete', { entityID: id }));

    $scope.changeSort = (column) => {
      if ($scope.sort == column) {
        $scope.direction = $scope.direction === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.sort = column;
        $scope.direction = "asc";
      }

      $scope.getList();
    };

    $scope.downloadSheet = item =>
      Expenses
        .downloadSheet(item.id)
        .then(data => {
          const hiddenElement = document.createElement('a');
          hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
          hiddenElement.target = '_blank';
          hiddenElement.download = 'Decont cheltuieli '+ item.doc.document_number + '.pdf';
          hiddenElement.click();
          hiddenElement.remove();
        })
  });

angular
  .module('Conta')
  .controller("expensesAddCtrl", function ($scope, $http, Expenses, Currency, ExchangeRates, $state, Organisation, ExpensesAttachmentUpload, $controller) {
    $scope.title = 'Noua cheltuiala';
    $scope.subtitle = 'Cheltuieli';
    $scope.item = {
      'items' : []
    };

    $controller('bootstrapCtrl', { $scope });
    $scope
      .loadCurrencies()
      .then(() => $scope.item.currency = $scope.main_currency);


    const getOrganisations = () => Organisation.list('name').then(data => $scope.organisations = data.rows);
    getOrganisations();

    $scope.addSubitem = () => $scope.item.items.push({'deductible': 25});

    $scope.delSubitem = index => $scope.item.items.splice(index, 1);

    $scope.$watch('item.items', () => {
      $scope.item.amount = 0;
      $scope.item.deductible_amount = 0;
      angular.forEach($scope.item.items, (item) => {
        $scope.item.amount += item.amount;
        item.deductible_amount = item.amount * parseFloat(item.deductible) / 100;
        $scope.item.deductible_amount += item.deductible_amount;
      })
    }, true);

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      $scope.item.type = 'object';

      Expenses
        .create($scope.item)
        .then(result => {
          $scope.item._id = result.id;
          $scope.item._rev = result.rev;

          if ($scope.attachments) {
            ExpensesAttachmentUpload
              .upload($scope.attachments, $scope.item)
              .then(() => $state.go('app.expenses'));
          } else {
            $state.go('app.expenses');
          }
        })
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("expensesEditCtrl", function ($scope, $http, Expenses, Currency, ExchangeRates, $state, $stateParams, ExpensesAttachmentUpload, Organisation, $controller) {
    $scope.title = 'Modificare';
    $scope.subtitle = 'Cheltuieli';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {};
    Expenses.get($scope.entityID).then((data) => {
      $scope.item = data;
      $scope.item.date = $scope.item.date_clear;
      $scope.subtitle = $scope.item.name;
    });

    $controller('bootstrapCtrl', { $scope });
    $scope.loadCurrencies();

    const getOrganisations = () => Organisation.list('name').then(data => $scope.organisations = data.rows);
    getOrganisations();

    $scope.addSubitem = () => $scope.item.items.push({'deductible': 25});

    $scope.delSubitem = index => $scope.item.items.splice(index, 1);

    $scope.$watch('item.items', () => {
      $scope.item.amount = 0;
      $scope.item.deductible_amount = 0;
      angular.forEach($scope.item.items, (item) => {
        $scope.item.amount += item.amount;
        item.deductible_amount = item.amount * parseFloat(item.deductible) / 100;
        $scope.item.deductible_amount += item.deductible_amount;
      })
    }, true);

    $scope.downloadSheet = () =>
      Expenses
        .downloadSheet($scope.item._id)
        .then(data =>{
          const hiddenElement = document.createElement('a');
          hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
          hiddenElement.target = '_blank';
          hiddenElement.download = 'Decont cheltuieli '+ $scope.item.document_number + '.pdf';
          hiddenElement.click();
          hiddenElement.remove();
        });

    $scope.submit = isValid => {
      if (!isValid) {
        return;
      }

      $scope.item.type = 'object';

      Expenses
        .create($scope.item)
        .then(result => {
          $scope.item._rev = result.rev;
          if ($scope.attachments) {
            ExpensesAttachmentUpload
              .upload($scope.attachments, $scope.item)
              .then(() => $state.go('app.expenses'));
          } else {
            $state.go('app.expenses');
          }
        })
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("expensesDeleteCtrl", function($scope, $http, Expenses, $state, $stateParams){
    $scope.item_id = $stateParams.entityID;

    Expenses
      .delete($scope.item_id)
      .then(() => $state.go('app.expenses'))
  });
