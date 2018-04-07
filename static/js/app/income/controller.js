/**
 * Created by Diana on 11/12/2016.
 */
angular.module('Conta').controller("incomeCtrl", function ($scope, $http, $state, Entity, $controller, SweetAlert) {
    $scope.title = "Incasari";
    $scope.subtitle = "Lista";

    $scope.design = 'income';
    $controller('entityController', { $scope: $scope });

    $scope.getList();

    $scope.edit = function(id) {;
        $state.go('app.income-edit', {entityID: id})
    };
    $scope.add = function() {
        $state.go('app.income-add');
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
				$state.go('app.income-delete', {entityID: id})
			} else {

			}
		});

    };

});

angular.module('Conta').controller("incomeAddCtrl", function ($scope, $http, Entity, Currency, Organisation, ExchangeRates, $state, $controller, EntityAttachmentUpload) {
    $scope.title = 'Add income entity';
    $scope.subtitle = 'Income';
    $scope.item = {};
    $scope.currencies = [];

    $controller('entityAddCtrl', { $scope: $scope });

    $scope.submit = function(isValid) {
        if (isValid) {
            $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
            $scope.item.type = 'income';
            $scope.item.classification = 'Incasare';
            $scope.item.deductible = 100;

            Entity.create($scope.item)
                .then((data) => {
                     var entity = {
                        '_id': data.id,
                        '_rev': data.rev
                    };
                    if ($scope.attachments) {
                        EntityAttachmentUpload.upload($scope.attachments, entity).then(() => {
                            $state.go('app.payments');
                        });
                    } else {
                        $state.go('app.income');
                    }
                })
                .catch((data, status) => {
                    if (status == 500)
                        $scope.errors = data;
                });
        }
    }
})

angular.module('Conta').controller("incomeEditCtrl", function ($scope, $http, Entity, Organisation, Currency, ExchangeRates, $state, $stateParams, $controller, EntityAttachmentUpload, SweetAlert) {
    $scope.title = 'Edit income entity';
    $scope.subtitle = 'Income';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {}
    $scope.attachments = [];
    Entity.getOne($scope.entityID).then((data) => {
        $scope.item = data;
        $scope.item.date = $scope.item.date_clear;
        $scope.updateExchangeRate();
    })

    $controller('entityAddCtrl', { $scope: $scope });

    $scope.submit = function(isValid) {
        if (isValid) {
            $scope.item.real_amount = $scope.item.amount * $scope.exchange_rate;
            $scope.item.type = 'income';
            $scope.item.classification = 'Incasare';
            $scope.item.deductible = 100;
            Entity.create($scope.item)
                .then((data) => {
                    var entity = {
                        '_id': $scope.entityID,
                        //'_rev': data.rev
                    };
                    if ($scope.attachments.length) {
                        EntityAttachmentUpload.upload($scope.attachments, entity).then(() => {
                            $state.go('app.payments');
                        });
                    } else {
                        $state.go('app.income');
                    }
                })
                .catch((data, status) => {
                    if (status == 500)
                        $scope.errors = data;
                });
        }
    }
})

angular.module('Conta').controller("incomeDeleteCtrl", function ($scope, $http, Entity, $state, $stateParams) {
    $scope.item_id = $stateParams.entityID;

    Entity.delete($scope.item_id)
        .then((data) => {
            $state.go('app.income');
        })
})