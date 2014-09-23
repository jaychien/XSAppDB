/**
 * Created by Derek on 2014/9/22.
 */

angular.module('AppList')
.controller('AppListCtrl', function($scope, $http) {
    var url_applist = "/api/applist";
    var url_setappexecid = "/api/setappexecid";

    $scope.appList = [];
    $scope.error = null;
    $scope.nameFilter = '';
    $scope.propNameFilter = '';
    $scope.propValueFilter = '';
    $scope.orderByField = '';
    $scope.maxExecId = 2;           // 目前這是寫在client端的, 以後可以挪到server side

    $scope.execIdOptions = generateExecIdOptions($scope.maxExecId);
    $scope.execIdList = generateExecIdList($scope.maxExecId);

    $http.get(url_applist)
        .success(function(appList) {
            console.log(appList);
            $scope.appList = appList;
            $scope.error = null;
        })
        .error(function(error) {
            $scope.error = error;
        });

    $scope.getTotalCount = function() {
        return $scope.appList.length;
    };

    $scope.getMarketStatusCount = function(status) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.marketStatus == status)
                return count+1;
            else
                return count;
        }, 0);
    };

    $scope.getExecCount = function(execId) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.execId == execId)
                return count+1;
            else
                return count;
        }, 0);
    };

    $scope.getMarketStatusClassName = function(app) {
        if (app.marketStatus == 0) {
            return "text-center danger";
        }
        else if (app.marketStatus == 1) {
            return "text-center info";
        }
        else {
            return "text-center warn";
        }
    };

    $scope.getMarketStatusString = function(app) {
        if (app.marketStatus == 0) {
            return "尚未上架";
        }
        else if (app.marketStatus == 1) {
            return "上架";
        }
        else {
            return "下架";
        }
    };

    $scope.updateAppItem = function(app) {
        console.log('Guid=' + app.guid + ' set ExecId=' + app.execId);
        var url = url_setappexecid + '?guid=' + app.guid + '&execId=' + app.execId;
        $http.get(url)
            .success(function() {
                $scope.error = null;
            })
            .error(function(error) {
                $scope.error = error;
            });
    };

    $scope.setPropFilter = function(propName, propValue) {
        $scope.propNameFilter = propName;
        $scope.propValueFilter = propValue;
    };

    // Return [{value:'0', name:'未指定'},{value:'1', name:'1'}, ..]
    function generateExecIdOptions(max) {
        var list = [{value:0, name:'未指定'}];
        for (var i = 1; i <= max; i++) {
            list.push({value:i, name:i.toString()});
        }
        return list;
    }

    // Return [1, 2, 3..]
    //
    function generateExecIdList(max) {
        var list = [];
        for (var i = 1; i <= max; i++) {
            list.push(i);
        }
        return list;
    }

})
.filter('filterByName', function() {
    return function(appList, nameFilter) {
        return _.filter(appList, function(app) {
            return app.name.indexOf(nameFilter) >= 0;
        });
    };
})
.filter('filterByPropValue', function() {
    return function(appList, propName, propValue) {
        console.log('filterByPropValue: propName=' + propName + ' propValue=' + propValue);
        propName = propName || '';
        return _.filter(appList, function(app) {
            if (propName == '')
                return app;
            else if (app[propName] == propValue)
                return app;
        });
    };
});
