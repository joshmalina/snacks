'use strict';

/**
 * @ngdoc function
 * @name snacksApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the snacksApp
 */

/* 
 * things to be concerend about:
 *
 * 1) users who delete their cookies can get unlimited votes
 * 
 * 2) since we are keeping track of time by month, if someone waits an entire year to login again,
 * the system would still think it's the same motnh
 */	

 angular.module('snacksApp')
 .controller('MainCtrl', ['$scope', '$cookies', '$http', '$q', 'lodash', function ($scope, $cookies, $http, $q, lodash) {

 	var BASE_API_URL = 'http://Joshuas-MacBook-Pro.local:3000';
 	var AUTHORIZATION = 'Bearer 33b55673-57c7-413f-83ed-5b4ae8d18827';  	

  	// start the clock
  	var timeZero = new Date();

  	// current month
  	var thisMonth = timeZero.getMonth();	

  	// for new users
  	if(!$cookies.get('numVotes')) {

  		// give them three votes
  		$cookies.put('numVotes', 3);  		

	// returning user
	} else {

  		// checking to see if a month has gone by  		 
  		if($cookies.get('timeZero') && parseInt($cookies.get('timeZero')) !== thisMonth) {    			

			// reset count to 3
			$cookies.put('numVotes', 3);	
		}		

	}

	// after conditionals, make available to view
	$scope.numVotes = parseInt($cookies.get('numVotes'));

  	// set the cookie clock
  	$cookies.put('timeZero', timeZero.getMonth());

	// make month available to view
	$scope.month = $cookies.get('timeZero');	

	if(!$cookies.get('alreadyVoted')) {
		$cookies.put('alreadyVoted', []);
	}

	$scope.alreadyVoted = JSON.parse("[" + $cookies.get('alreadyVoted') + "]");

	// decrease vote count
	function alterVoteCount(byWhat) {

		$scope.numVotes += byWhat;

		$cookies.put('numVotes', $scope.numVotes);

	}

	function pushVote(itemID) {

		var defer = $q.defer();

		var req = {
			method: 'POST',
			url: BASE_API_URL + '/snacks/vote/' + itemID,
			headers: {
				'Authorization': AUTHORIZATION
			}
		}

		$http(req).then(function(response) {

			defer.resolve(response);

		})

		return defer.promise;

	}

	// returns snacks from node api
	function getSnacks() {

		var defer = $q.defer();

		var req = {
			method: 'GET',
			url: BASE_API_URL + '/snacks',
			headers: {
				'Authorization': AUTHORIZATION
			}
		}

		$http(req).then(function(snacks) {
			defer.resolve(snacks);
		});

		return defer.promise;

		
	}

	getSnacks().then(function(snacks) {
		$scope.snacks = snacks;

		// could be DRYed up into a reusable function
		var result = lodash.partition(snacks.data, function(snack) {
			return $scope.alreadyVoted.indexOf(parseInt(snack.id)) > -1;
		})

		$scope.mySnacks = result[0];
		$scope.theirSnacks = result[1];
		

	});
	

	// keep track of snacks voted for
	function addToSnacksVoted(itemID) {


		var defer = $q.defer();
		

		if($scope.alreadyVoted.indexOf(itemID) > -1) {

			defer.reject('Already voted');

			return defer.promise;


		} else {


			pushVote(itemID).then(function(response) {

				// add to snacks voted
				$scope.alreadyVoted.push(itemID);

				$cookies.put('alreadyVoted', $scope.alreadyVoted);

				defer.resolve(response);

			})			
			
		}		

		return defer.promise;

	}

	$scope.alerts = [];

	$scope.vote = function(itemID) {

		// not enough votes
		if($scope.numVotes < 1) {

			$scope.alerts.splice(0, 1);

			// send message
			$scope.alerts.push('You do not have enough votes. Wait for next month');

			return;

		} else {

			addToSnacksVoted(parseInt(itemID)).then(function(result) {

				$scope.alerts.push('Good vote!');			

				// deduct a vote
				alterVoteCount(-1);					

				// refresh vote count
				getSnacks().then(function(resp) {
					$scope.snacks = resp;

					// improvement: could iterate through snacks once using lodash.partition

					$scope.mySnacks = resp.data.filter(function(snack) {
						return $scope.alreadyVoted.indexOf(parseInt(snack.id)) > -1;
					})
					$scope.theirSnacks = resp.data.filter(function(snack) {
						return $scope.alreadyVoted.indexOf(parseInt(snack.id)) === -1;
					})
				});

			}, function(error) {

				$scope.alerts.push('You already voted on this snack!');

			})					

		}		

	}


}]);
