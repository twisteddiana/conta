/**
 * Created by Diana on 11/16/2016.
 */
angular.module('Conta').directive('currencies', ['Currency', 'ExchangeRates', (Currency, ExchangeRates) => {
    return {
        templateUrl: 'static/templates/utils/currencies/currencies.html',
        link: ($scope) => {
            $scope.currencies = [];
            $scope.exchange_rates = [];

            const getCurrencies = () => {
                Currency.get().then((data) => {
                    $scope.currencies = data.rows;
                    $scope.currencies.forEach((currency, key) => {
                        if (!currency.doc.main) {
                            ExchangeRates.get(currency.doc.iso).then((data) => {
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

angular.module('Conta').directive('total', () => {
    return {
        template: "{{total}} RON",
        link: function($scope) {
            $scope.$watch('rows', () => {
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

angular.module('Conta').directive('nrRows', () => {
    return {
        template: "{{nr_rows}}",
        link: function($scope) {
            $scope.$watch('rows', () => {
                $scope.nr_rows = 0;
                if (typeof $scope.rows != 'undefined') {
                    $scope.nr_rows = $scope.rows.length;
                }
            })
        }
    }
})

angular.module('Conta').directive('deductibleTotal', () => {
    return {
        template: "{{deductible_total}} RON",
        link: ($scope) => {
            $scope.$watch('rows', function() {
                $scope.deductible_total = 0;
                if (typeof $scope.rows != 'undefined') {
                    $scope.rows.forEach((item) => {
                        $scope.deductible_total += parseFloat(item.doc.deductible_amount);
                    })
                }

                $scope.deductible_total = parseFloat($scope.deductible_total).toFixed(2);
            })
        }
    }
})

angular.module('Conta').directive('filter', ['Entity', 'Currency', (Entity, Currency) => {
    return {
        templateUrl: 'static/templates/utils/filter/filter.html',
        link: ($scope) => {
            angular.forEach($scope.filters, (filter, filter_name) => {
                if (typeof filter.resource != 'undefined') {
                    var params = {
                        design: $scope.design,
                        sort: filter.resource,
                        reduce: true,
                        group: true
                    };
                    Entity.post(params).then((data) => {
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

            $scope.updateFilter = (filter) => {
                filter.value = [];
                filter.values.forEach((value) => {
                    if (value.checked)
                        filter.value.push(value.key[0]);
                })
            }
        }
    }
}])

angular.module('Conta').directive('pagination', () => {
    return {
        templateUrl: 'static/templates/utils/pagination/pagination.html',
        link: ($scope) => {
            $scope.range = (min, max, step) => {
                step = step || 1;
                var input = [];
                for (var i = min; i <= max; i += step) input.push(i);
                return input;
            };

            $scope.prevPage = () => {
                $scope.skip -= $scope.limit;
                if ($scope.skip < 0)
                    $scope.skip = 0;
                $scope.getList();

            }

            $scope.nextPage = () => {
                $scope.skip += $scope.limit;
                $scope.getList();
            }

            $scope.setPage = (page) => {
                $scope.skip = (page - 1) * $scope.limit;
                $scope.getList();
            }

            $scope.changeLimit = () => {
                $scope.skip = 0;
                // $scope.limit = parseInt($scope.limit);
                $scope.getList();
            }
        }
    }
})


angular.module('Conta').directive('expenseattachments', ['ExpensesAttachmentUpload', 'SweetAlert', 'Expenses', (ExpensesAttachmentUpload, SweetAlert, Expenses) => {
    return {
        templateUrl: 'static/templates/utils/attachments/attachments.html',
        link: ($scope) => {
            $scope.deleteAttachment = (attachment_name) => {
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
                }, (isConfirm) => {
                    if (isConfirm) {
                        ExpensesAttachmentUpload.deleteAttachment(attachment_name, doc).then((data) => {
                            Expense.getOne($scope.item._id).then((data) => {
                                $scope.item = data;
                                $scope.item.date = $scope.item.date_clear;
                            })
                        })
                    }
                });


            }

            $scope.getAttachment = (attachment_name, attachment) => {
                var attach = {}
                attach[attachment_name] = attachment;
                var doc = {
                    '_id': $scope.item._id,
                    '_attachments': attach
                };

                ExpensesAttachmentUpload.getAttachment(attachment_name, doc).then((data) => {
                    var blob = new Blob([data], {type: attachment.content_type})
                    var url = URL.createObjectURL(blob);

                    var hiddenElement = document.createElement('a');
                    hiddenElement.href = url;
                    hiddenElement.target = '_blank';
                    hiddenElement.download = attachment_name;
                    hiddenElement.click();
                    hiddenElement.remove();
                });
            }
        }
    }
}])

angular.module('Conta').directive('attachments', ['EntityAttachmentUpload', 'SweetAlert', 'Entity', (EntityAttachmentUpload, SweetAlert, Entity) => {
    return {
        templateUrl: 'static/templates/utils/attachments/attachments.html',
            link: ($scope) => {
            $scope.deleteAttachment = (attachment_name) => {
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
                        EntityAttachmentUpload.deleteAttachment(attachment_name, doc).then((data) => {
                            Entity.getOne($scope.item._id).then((data) => {
                                $scope.item = data;
                                $scope.item.date = $scope.item.date_clear;
                            })
                        })
                    }
                });


            }

            $scope.getAttachment = (attachment_name, attachment) => {
                var attach = {}
                attach[attachment_name] = attachment;
                var doc = {
                    '_id': $scope.item._id,
                    '_attachments': attach
                }

                EntityAttachmentUpload.getAttachment(attachment_name, doc).then((data) => {
                    var blob = new Blob([data], {type: attachment.content_type})
                    var url = URL.createObjectURL(blob);

                    var hiddenElement = document.createElement('a');
                    hiddenElement.href = url;
                    hiddenElement.target = '_blank';
                    hiddenElement.download = attachment_name;
                    hiddenElement.click();
                    hiddenElement.remove();
                });
            }
        }
    }
}]);

angular.module('Conta').directive('fileModel', ['$parse',  ($parse) => {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: (scope, element, attrs, ngModel) => {
            element.bind('change', () => {
                ngModel.$setViewValue(element[0].files);
            });
        }
    };
}]);

angular.module('Conta').directive('fileUpload', () => {
    return {
        templateUrl: 'static/templates/utils/attachments/upload.html',
        require: 'ngModel',
        link: (scope, element, attrs, ngModel) => {
            scope.$watch('files', (newVal) => {
                newVal = (newVal && Array.prototype.slice.call(newVal)) || [];
                let oldVal = ngModel.$viewValue || [];
                ngModel.$setViewValue(oldVal.concat(newVal));
                scope.model = ngModel.$viewValue;
            });

            scope.delete = (key) => {
                let content = ngModel.$viewValue;
                content.splice(key, 1);
                ngModel.$setViewValue(content);
                scope.model = ngModel.$viewValue;
            };
        }
    }
});