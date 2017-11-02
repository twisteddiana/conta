/**
 * Created by Diana on 11/12/2016.
 */
Conta.controller("paymentsCtrl", function ($scope, $http, $state, Entity, $controller, SweetAlert) {
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

    $scope.edit = function(id) {;
        $state.go('app.payments-edit', {entityID: id})
    };
    $scope.add = function() {
        $state.go('app.payments-add');
    };
    $scope.delete = function(id) {
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
                $state.go('app.payments-delete', {entityID: id})
            } else {

            }
        });
    };

});

Conta.controller("paymentsAddCtrl", function($scope, $http, Entity, Currency, Organisation, ExchangeRates, $state, $controller, EntityAttachmentUpload){
    $scope.title = 'Add payment entity';
    $scope.subtitle = 'Income';
    $scope.item = {};

    $scope.currencies = [];
    $scope.item.deductible = 100;

    $controller('entityAddCtrl', { $scope: $scope });

    $scope.submit = function(isValid) {
        if (isValid) {
            $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
            $scope.item.deductible_amount = $scope.item.real_amount * $scope.item.deductible / 100;
            $scope.item.type = 'payment';

            Entity.create($scope.item)
                .success(function (data) {
                    var entity = {
                        '_id': data.id,
                        '_rev': data.rev
                    };
                    if ($scope.attachments) {
                        var uploaded = 0;
                        angular.forEach($scope.attachments, function(attachment) {
                            EntityAttachmentUpload.upload(attachment, entity).success(function (data) {
                                uploaded++;
                                if (uploaded == $scope.attachments.length)
                                    $state.go('app.payments');
                            })
                        })
                    } else {
                        $state.go('app.payments');
                    }
                    $state.go('app.payments');
                })
                .error(function (data, status) {
                    if (status == 500)
                        $scope.errors = data;
                });
        }
    }
})


Conta.controller("paymentsEditCtrl", function($scope, $http, Entity, Organisation, Currency, ExchangeRates, $state, $stateParams, $controller, EntityAttachmentUpload){
    $scope.title = 'Edit payment entity';
    $scope.subtitle = 'Payment';
    $scope.item_id = $stateParams.entityID;
    $scope.item = {}
    Entity.getOne($scope.item_id).success(function(data) {
        $scope.item = data;
        $scope.item.date = $scope.item.date_clear;
        $scope.updateExchangeRate();
    })

    $controller('entityAddCtrl', { $scope: $scope });

    $scope.submit = function(isValid) {
        if (isValid) {
            $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
            $scope.item.deductible_amount = $scope.item.real_amount * $scope.item.deductible / 100;
            $scope.item.type = 'payment';
            Entity.create($scope.item)
                .success(function (data) {
                    var entity = {
                        '_id':  data.id,
                        '_rev': data.rev
                    };
                    if ($scope.attachments) {
                        var uploaded = 0;
                        angular.forEach($scope.attachments, function(attachment) {
                            EntityAttachmentUpload.upload(attachment, entity).success(function (data) {
                                uploaded++;
                                if (uploaded == $scope.attachments.length)
                                    $state.go('app.payments');
                            })
                        })
                    } else {
                        $state.go('app.payments');
                    }
                })
                .error(function (data, status) {
                    if (status == 500)
                        $scope.errors = data;
                });
        }
    }
})

Conta.controller("paymentsDeleteCtrl", function($scope, $http, Entity, $state, $stateParams){
    $scope.item_id = $stateParams.entityID;

    Entity.delete($scope.item_id)
        .success(function(data) {
            $state.go('app.payments');
        })
})