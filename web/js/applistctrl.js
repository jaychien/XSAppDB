/**
 * Created by Derek on 2014/9/22.
 */

angular.module('AppList')
.constant('url', '/applist')
.controller('AppListCtrl', function($scope, $http, url) {
    $scope.appList = [];
    $scope.error = null;
    $scope.nameFilter = '';
    $scope.orderByField = '';

    $http.get(url)
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

    $scope.getExecClassName = function(app) {
        if (app.execId == 0)
            return "";
        else
            return "";
    };

})
.filter('filterByName', function() {
    return function(appList, nameFilter) {
        return _.filter(appList, function(app) {
            return app.name.indexOf(nameFilter) >= 0;
        });
    };
});
