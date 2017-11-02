/**
 * Created by Diana on 12/3/2016.
 */
/**
 * Created by Diana on 11/22/2016.
 */
Conta.factory('Inventory', function($http) {
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

            return $http.post('/inventory', data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/inventory' + extension);
        },
        create: function(data) {
            return $http.put('/inventory', data);
        },
        delete: function(id){
            return $http.delete('/inventory/' + id);
        },
        report: function(data) {
            return $http.post('/inventory/report', data, {responseType: 'arraybuffer'})
        }
    }
})