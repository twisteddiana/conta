/**
 * Created by Diana on 11/25/2016.
 */
angular
  .module('Conta')
  .controller("reportsCtrl", function ($scope, $http, $state, Entity, Inventory) {
    $scope.reportsConfig = {
      'sheet': { action: 'sheet', yearly: false, classification: true },
      'journal': { action: 'journal', yearly: false, classification: true },
      'registry': { action: 'registry', yearly: true, classification: false },
      'fiscal_evidence': { action: 'fiscal_evidence', yearly: true, classification: false },
      'inventory': { action: 'inventory', yearly: true, classification: false },
      'export': { action: 'export', yearly: false, classification: false }
    };
    $scope.reports = [
      { name: 'Fisa operatiuni diverse', type: 'sheet' },
      { name: 'Jurnal operatiuni diverse', type: 'journal' },
      { name: 'Registru de incasari si plati', type: 'registry' },
      { name: 'Registru de evidenta fiscala', type: 'fiscal_evidence' },
      { name: 'Registru inventar', type: 'inventory' },
      { name: 'CSV export', type: 'export' }
    ];

    Entity
      .all({
        design: 'all',
        sort: 'classification',
        reduce: true,
        group_level: 1
      })
      .then((data) => $scope.classifications = data.rows);

    $scope.title = "Rapoarte";
    $scope.current_year = (new Date()).getFullYear();

    $scope.crange = (min, max, step) => {
      step = step || 1;
      const input = [];
      if (step < 0)
        for (let i = max; i >= min; i += step) input.push(i);
      else
        for (let i = min; i <= max; i += step) input.push(i);
      return input;
    };

    $scope.chosen_report = '';
    $scope.chosen_classification = '';

    $scope.submit = (report) => {
      let start_date,
          end_date;
      const config = $scope.reportsConfig[report.type];
      if (config.yearly || report.month == 0) {
        start_date = '01-01-' + report.year;
        end_date = '31-12-' + report.year;
      } else {
        start_date = '01-' + report.month + '-' + report.year;
        end_date = '01-' + report.month + '-' + report.year;
      }
      const data = {
        date_start: start_date,
        date_end: end_date,
        report: config.action,
        classification: config.classification && report.classification
      };

      if (config.action === 'inventory') {
        return Inventory
          .report(data)
          .then(data => downloadReport(data, report))
      }

      if (config.action === 'export') {
        return Entity
          .export(data)
          .then(data => downloadExport(data, report))
      }

      Entity
        .report(data)
        .then(data => downloadReport(data, report))
    };

    const downloadReport = (data, report) => {
      let name = report.name + ' ';
      if (typeof report.month != 'undefined' && report.month > 0)
        name += report.month + '.';
      name += report.year;

      const hiddenElement = document.createElement('a');
      hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
      hiddenElement.target = '_blank';
      hiddenElement.download = name + '.pdf';
      hiddenElement.click();
      hiddenElement.remove();
    };

    const downloadExport = (data, report) => {
      let name = report.name + ' ';
      if (typeof report.month != 'undefined' && report.month > 0)
        name += report.month + '.';
      name += report.year;

      const hiddenElement = document.createElement('a');
      hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'text/csv'}));
      hiddenElement.target = '_blank';
      hiddenElement.download = name + '.csv';
      hiddenElement.click();
      hiddenElement.remove();
    };
  });


angular
  .module('Conta')
  .controller("statementCtrl", function ($scope, $http, $state, Entity) {
    $scope.title = "Declaratia unica";
    $scope.subtitle = "Rapoarte";

    $scope.current_year = (new Date()).getFullYear();

    $scope.crange = (min, max, step) => {
      step = step || 1;
      const input = [];
      if (step < 0)
        for (let i = max; i >= min; i += step) input.push(i);
      else
        for (let i = min; i <= max; i += step) input.push(i);
      return input;
    };

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      Entity
        .statement({year: $scope.year})
        .then((data) => $scope.response = data)
    }
  });
