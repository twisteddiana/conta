/**
 * Created by Diana on 12/3/2016.
 */
/**
 * Created by Diana on 11/22/2016.
 */
angular.module('Conta').factory('Inventory', function($http) {
    return {
        post: function (data) {
            if (typeof data == 'undefined')
                data = {};

            if (data['direction'] == 'desc')
                data['descending'] = true;
            else
                data['descending'] = false;

            if (typeof data['reduce'] == 'undefined')
                data['reduce'] = false;

            return $http.post('/inventory', data).then(data => data.data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/inventory' + extension).then(data => data.data);
        },
        create: function(data) {
            return $http.put('/inventory', data).then(data => data.data);
        },
        delete: function(id){
            return $http.delete('/inventory/' + id).then(data => data.data);
        },
        report: function(data) {
            return $http.post('/inventory/report', data, {responseType: 'arraybuffer'}).then(data => data.data);
        }
    }
})