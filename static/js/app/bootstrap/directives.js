/**
 * Created by Diana on 11/16/2016.
 */
angular
  .module('Conta')
  .directive('currencies', (Currency, ExchangeRates, $controller) => ({
    templateUrl: 'static/templates/utils/currencies/currencies.html',
    link: $scope => {
      $controller('bootstrapCtrl', { $scope });

      $scope
        .loadCurrencies()
        .then(() => {
          $scope.currencies.forEach(currency => {
            if (currency.main) {
              return;
            }

            ExchangeRates
              .get(currency.iso)
              .then(exchange_rate => currency.exchange_rate = exchange_rate.exchange_rate);
          })
        });
    }}));

angular
  .module('Conta')
  .directive('total', () => ({
    template: "{{total}} RON",
    link: $scope =>
      $scope.$watch('rows', () =>
        $scope.total = ($scope.rows ? $scope.rows.reduce((acc, row) => acc + row.doc.real_amount, 0) : 0).toFixed(2))
  }));

angular
  .module('Conta')
  .directive('nrRows', () => ({
    template: "{{nr_rows}}",
    link: $scope => $scope.$watch('rows', () => $scope.nr_rows = $scope.rows && $scope.rows.length || 0)
  }));

angular
  .module('Conta')
  .directive('deductibleTotal', () => ({
    template: "{{deductible_total}} RON",
    link: ($scope) =>
      $scope.$watch('rows', () =>
        $scope.deductible_total =
          ($scope.rows ? $scope.rows.reduce((acc, row) => acc + row.doc.deductible_amount, 0) : 0).toFixed(2))
  }));

angular
  .module('Conta')
  .directive('filter', (Entity) => ({
    templateUrl: 'static/templates/utils/filter/filter.html',
    link: $scope => {
      angular.forEach($scope.filters, (filter, filter_name) => {
        if (filter.resource) {
          const params = {
            design: $scope.design,
            sort: filter.resource,
            reduce: true,
            group: true
          };

          Entity
            .all(params)
            .then(results => {
              $scope.filters[filter_name].values = results.rows;

              angular.forEach($scope.filters[filter_name].values, filter_val => {
                angular.forEach($scope.filters[filter_name].value, val => {
                  if (filter_val.key[0] === val) {
                    filter_val.checked = true;
                  }
                })
              })
            })
        }
      });

      $scope.updateFilter = filter => {
        filter.value = [];
        filter.values.forEach(value => {
          if (value.checked) {
            filter.value.push(value.key[0]);
          }
        })
      }
    }
  }));

angular
  .module('Conta')
  .directive('pagination', () => ({
    templateUrl: 'static/templates/utils/pagination/pagination.html',
    link: $scope => {
      $scope.range = (min, max, step) => {
        step = step || 1;
        const input = [];
        for (let i = min; i <= max; i += step) input.push(i);
        return input;
      };

      $scope.prevPage = () => {
        $scope.skip -= $scope.limit;
        if ($scope.skip < 0) {
          $scope.skip = 0;
        }
        $scope.getList();
      };

      $scope.nextPage = () => {
        $scope.skip += $scope.limit;
        $scope.getList();
      };

      $scope.setPage = page => {
        $scope.skip = (page - 1) * $scope.limit;
        $scope.getList();
      };

      $scope.changeLimit = () => {
        $scope.skip = 0;
        $scope.getList();
      }
    }
  }));


angular
  .module('Conta')
  .directive('expenseattachments', (ExpensesAttachmentUpload, SweetAlert) => ({
    templateUrl: 'static/templates/utils/attachments/attachments.html',
    link: $scope => {
      $scope.deleteAttachment = attachment_name =>
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
          isConfirm => isConfirm && ExpensesAttachmentUpload
            .delete(attachment_name, $scope.item)
            .then(result => {
              delete $scope.item._attachments[attachment_name];
              console.log($scope.item._attachments);
              $scope.item._rev = result.rev;
            }));

      $scope.getAttachment = (attachment_name, attachment) => {
        const attach = {};
        attach[attachment_name] = attachment;
        const doc = { _id: $scope.item._id, _attachments: attach };

        ExpensesAttachmentUpload
          .get(attachment_name, doc)
          .then(data => {
            const hiddenElement = document.createElement('a');
            hiddenElement.href = URL.createObjectURL(new Blob([data], { type: attachment.content_type }));
            hiddenElement.target = '_blank';
            hiddenElement.download = attachment_name;
            hiddenElement.click();
            hiddenElement.remove();
          });
      }
    }
  }));

angular
  .module('Conta')
  .directive('attachments', (EntityAttachmentUpload, SweetAlert, Entity) => ({
    templateUrl: 'static/templates/utils/attachments/attachments.html',
    link: ($scope) => {
      $scope.deleteAttachment = (attachment_name) =>
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
          isConfirm => isConfirm && EntityAttachmentUpload
            .delete(attachment_name, $scope.item)
            .then(data => $scope.item._rev = data.rev));

      $scope.getAttachment = (attachment_name, attachment) => {
        const attach = {};
        attach[attachment_name] = attachment;
        const doc = { _id: $scope.item._id, _attachments: attach };

        EntityAttachmentUpload
          .get(attachment_name, doc)
          .then(data => {
            const hiddenElement = document.createElement('a');
            hiddenElement.href = URL.createObjectURL(new Blob([data], {type: attachment.content_type}));
            hiddenElement.target = '_blank';
            hiddenElement.download = attachment_name;
            hiddenElement.click();
            hiddenElement.remove();
          });
      }
    }
  }));

angular
  .module('Conta')
  .directive('fileModel', $parse => ({
    restrict: 'A',
    require: 'ngModel',
    link: (scope, element, attrs, ngModel) => element.bind('change', () => ngModel.$setViewValue(element[0].files))
  }));

angular
  .module('Conta')
  .directive('fileUpload', () => ({
    templateUrl: 'static/templates/utils/attachments/upload.html',
    require: 'ngModel',
    link: (scope, element, attrs, ngModel) => {
      scope.$watch('files', (newVal) => {
        newVal = (newVal && Array.prototype.slice.call(newVal)) || [];
        let oldVal = ngModel.$viewValue || [];
        ngModel.$setViewValue(oldVal.concat(newVal));
        scope.model = ngModel.$viewValue;
      });

      scope.delete = key => {
        let content = ngModel.$viewValue;
        content.splice(key, 1);
        ngModel.$setViewValue(content);
        scope.model = ngModel.$viewValue;
      };
    }
  }));
