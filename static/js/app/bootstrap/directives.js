/**
 * Created by Diana on 11/16/2016.
 */
Conta.directive('currencies', ['Currency', 'ExchangeRates', function(Currency, ExchangeRates) {
    return {
        templateUrl: 'static/templates/utils/currencies/currencies.html',
        link: function ($scope, $element, $attrs) {
            $scope.currencies = [];
            $scope.exchange_rates = [];

            function getCurrencies() {
                Currency.get().success(function(data) {
                    $scope.currencies = data.rows;
                    $scope.currencies.forEach(function(currency, key) {
                        if (!currency.doc.main) {
                            ExchangeRates.get(currency.doc.iso).success(function(data) {
                                $scope.currencies[key].doc.exchange_rate = data.rows[0].value;
                            });
                        } else {
                            $scope.main_currency = currency;
                        }
                    })
                })
            }
            getCurrencies();
        }
    }
}]);

Conta.directive('total', function() {
    return {
        template: "{{total}} RON",
        link: function($scope) {
            $scope.$watch('rows', function() {
                $scope.total = 0;
                if (typeof $scope.rows != 'undefined') {
                    $scope.rows.forEach(function (item) {
                        $scope.total += parseFloat(item.doc.real_amount);
                    })
                }

                $scope.total = parseFloat($scope.total).toFixed(2);
            })
        }
    }
})

Conta.directive('nrRows', function() {
    return {
        template: "{{nr_rows}}",
        link: function($scope) {
            $scope.$watch('rows', function() {
                $scope.nr_rows = 0;
                if (typeof $scope.rows != 'undefined') {
                    $scope.nr_rows = $scope.rows.length;
                }
            })
        }
    }
})

Conta.directive('deductibleTotal', function() {
    return {
        template: "{{deductible_total}} RON",
        link: function($scope) {
            $scope.$watch('rows', function() {
                $scope.deductible_total = 0;
                if (typeof $scope.rows != 'undefined') {
                    $scope.rows.forEach(function (item) {
                        $scope.deductible_total += parseFloat(item.doc.deductible_amount);
                    })
                }

                $scope.deductible_total = parseFloat($scope.deductible_total).toFixed(2);
            })
        }
    }
})

Conta.directive('filter', ['Entity', 'Currency', function(Entity, Currency) {
    return {
        templateUrl: 'static/templates/utils/filter/filter.html',
        link: function ($scope) {
            angular.forEach($scope.filters, function(filter, filter_name) {
                if (typeof filter.resource != 'undefined') {
                    var params = {
                        design: $scope.design,
                        sort: filter.resource,
                        reduce: true,
                        group: true
                    };
                    Entity.post(params).success(function(data) {
                        $scope.filters[filter_name].values = data.rows;

                        angular.forEach($scope.filters[filter_name].values, function(filter_val) {
                            angular.forEach($scope.filters[filter_name].value, function(val) {
                                if (filter_val.key[0] == val)
                                    filter_val.checked = true;
                            })
                        })


                    })
                }
            })

            $scope.updateFilter = function(filter) {
                filter.value = [];
                filter.values.forEach(function(value) {
                    if (value.checked)
                        filter.value.push(value.key[0]);
                })
            }
        }
    }
}])

Conta.directive('pagination', function() {
    return {
        templateUrl: 'static/templates/utils/pagination/pagination.html',
        link: function($scope) {

            $scope.range = function(min, max, step){
                step = step || 1;
                var input = [];
                for (var i = min; i <= max; i += step) input.push(i);
                return input;
            };

            $scope.prevPage = function() {
                $scope.skip -= $scope.limit;
                if ($scope.skip < 0)
                    $scope.skip = 0;
                $scope.getList();

            }

            $scope.nextPage = function() {
                $scope.skip += $scope.limit;
                $scope.getList();
            }

            $scope.setPage = function(page) {
                $scope.skip = (page - 1) * $scope.limit;
                $scope.getList();
            }

            $scope.changeLimit = function() {
                $scope.skip = 0;
                // $scope.limit = parseInt($scope.limit);
                $scope.getList();
            }
        }
    }
})


Conta.directive('expenseattachments', ['ExpensesAttachmentUpload', 'SweetAlert', 'Expenses', function(ExpensesAttachmentUpload, SweetAlert, Expenses) {
    return {
        templateUrl: 'static/templates/utils/attachments/attachments.html',
        link: function($scope) {
            $scope.deleteAttachment = function(attachment_name) {
                var doc = {
                    '_id': $scope.item._id,
                    '_rev': $scope.item._rev
                }

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
                }, function(isConfirm){
                    if (isConfirm) {
                        ExpensesAttachmentUpload.deleteAttachment(attachment_name, doc).success(function(data) {
                            Expense.getOne($scope.entityID).success(function(data) {
                                $scope.item = data;
                                $scope.item.date = $scope.item.date_clear;
                            })
                        })
                    } else {

                    }
                });


            }

            $scope.getAttachment = function(attachment_name, attachment) {
                var attach = {}
                attach[attachment_name] = attachment;
                var doc = {
                    '_id': $scope.item._id,
                    '_attachments': attach
                }

                ExpensesAttachmentUpload.getAttachment(attachment_name, doc).success(function(data) {
                    var blob = new Blob([data], {type: attachment.content_type})
                    var url = URL.createObjectURL(blob);

                    var hiddenElement = document.createElement('a');
                    hiddenElement.href = url;
                    hiddenElement.target = '_blank';
                    hiddenElement.download = attachment_name;
                    hiddenElement.click();
                    hiddenElement.remove();
                })

            }
        }
    }
}])

Conta.directive('attachments', ['EntityAttachmentUpload', 'SweetAlert', 'Entity', function(EntityAttachmentUpload, SweetAlert, Entity) {
    return {
        templateUrl: 'static/templates/utils/attachments/attachments.html',
        link: function($scope) {
            $scope.deleteAttachment = function(attachment_name) {
                var doc = {
                    '_id': $scope.item._id,
                    '_rev': $scope.item._rev
                }

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
                }, function(isConfirm){
                    if (isConfirm) {
                        EntityAttachmentUpload.deleteAttachment(attachment_name, doc).success(function(data) {
                            Entity.getOne($scope.entityID).success(function(data) {
                                $scope.item = data;
                                $scope.item.date = $scope.item.date_clear;
                            })
                        })
                    } else {

                    }
                });


            }

            $scope.getAttachment = function(attachment_name, attachment) {
                var attach = {}
                attach[attachment_name] = attachment;
                var doc = {
                    '_id': $scope.item._id,
                    '_attachments': attach
                }

                EntityAttachmentUpload.getAttachment(attachment_name, doc).success(function(data) {
                    var blob = new Blob([data], {type: attachment.content_type})
                    var url = URL.createObjectURL(blob);

                    var hiddenElement = document.createElement('a');
                    hiddenElement.href = url;
                    hiddenElement.target = '_blank';
                    hiddenElement.download = attachment_name;
                    hiddenElement.click();
                    hiddenElement.remove();
                })

            }
        }
    }
}])

function parseDate(input) {
    var parts = input.match(/(\d+)/g);
    // note parts[1]-1
    return new Date(parts[2], parts[1]-1, parts[0]);
}

function isValidDate(dateString)
{
    // First check for the pattern
    if(!/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};

Conta.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files);
                });
            });
        }
    };
}]);