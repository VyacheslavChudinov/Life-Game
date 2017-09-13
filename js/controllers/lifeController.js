(function(){
	'use strict';

	var lifeApp = angular.module('lifeApp', ['ng-fileDialog']);

	    lifeApp.controller('lifeController', function ($scope, FileDialog) {		

	    $scope.gameIsRunning = false;

	    $scope.fieldWidth = 1000;
	    $scope.fieldHeight = 1000;
	    $scope.speed = 2000;
		$scope.columnSize =  20,
		$scope.rowSize = 20,
		$scope.circleBorders = true,
		$scope.targetColor = '#aaa',
	 	$scope.selectedColor =  '#333';
	 	$scope.matrixSize = 45;

	 	$scope.map = [];

	 	function readSingleFile(evt) {

		    var f = evt.target.files[0]; 

		    if (f) {
	        	var r = new FileReader();
	        	r.onload = function(e) { 
			  		var contents = e.target.result;
			  		$scope.map = JSON.parse(contents);	
			  		life.redrawMap();		      		        
		      	}
		      	r.readAsText(f);
		    } else { 
		    	alert("Failed to load file");
		    }

		    document.getElementById('fileInput').value = null;
	  	}

	  	document.getElementById('fileInput').addEventListener('change', readSingleFile, false);


	    $scope.getMapJSON = function(){
	    	return JSON.stringify($scope.map);
	    }


	    var life = new LifeGame(
			document.getElementById('lifeField'),
			document.getElementById('startButton'),
			document.getElementById('stopButton'),
	    {
	    	columnSize: $scope.columnSize,
	    	rowSize: $scope.rowSize,
	    	speed: $scope.speed,
	    	targetColor: $scope.targetColor,
	    	selectedColor: $scope.selectedColor
	    });

	 	$scope.clearMap = life.clearMap;
	 	$scope.changeSpeed = life.changeSpeed;

	    $scope.downloadMatrix = function downloadMatrix(text, name, type) {
		    var a = document.createElement("a");
		    var file = new Blob([text], {type: type});
		    a.href = URL.createObjectURL(file);
		    a.download = name;
		    a.click();
		}	
	    
	    function LifeGame(field, start, stop, options) {
			var width = field.width,
				height = field.height,
				previousColumn = 0,
				previousRow= 0,
				currentColumn = 0,
				currentRow= 0,				
				processId,
				states = {empty : 0, present : 1, dead : 2, born : 3},
				borders,
				columnCount,
				rowCount,
				context  = field.getContext('2d'),
				columnSize = options.columnSize || 20,
				rowSize = options.rowSize || 20,
				speed = options.speed || 50,
				targetColor = options.targetColor || '#aaa',
			 	selectedColor = options.selectedColor || '#333';

			function createMap(){
				var i = 0, 
					j = 0;
				columnCount = Math.ceil(width / columnSize);
				rowCount = Math.ceil(height / rowSize);
				$scope.map = new Array(rowCount);

				for (i = columnCount; i--;){
					$scope.map[i] = new Array(columnCount);
				};

				for (i = rowCount; i--;){
					for (j = columnCount; j--;){
							$scope.map[i][j] = states.empty;
					}	
				}

				borders = {
					top : 0,
					left : 0,
					right : columnCount - 1,
					bottom : rowCount - 1
				};
			}

			this.redrawMap = function redrawMap(){				

				for (var i = borders.top; i <= borders.bottom; i++){
					for (var j = borders.left; j <= borders.right; j++){
						if(isBorn(i, j) || isPresent(i, j)){							
							fillCell(context, i + 1, j + 1, selectedColor);
						} else {
							clearCell(i + 1, j + 1);
						}
					}
				}	
			}

			this.clearMap = function clearMap(){

				for (var i = 0; i < rowCount; i++){
					for (var j = 0; j < columnCount; j++){
						clearCell(i + 1, j + 1);
					}
				}	

				createMap();				
			}

			this.changeSpeed = function changeSpeed(newSpeed){
				$scope.speed = newSpeed;

				clearInterval(processId);
				processId = setInterval(step, $scope.speed);

			}

			function getColumIndex(x){
				var columnIndex = Math.ceil(x / columnSize);

				if (columnIndex < 1){
					columnIndex = 1;
				} else if (columnIndex > columnCount){
					columnIndex = columnCount;
				}

				return columnIndex;	 
			}

			function getRowIndex(y){
				var rowIndex = Math.ceil(y / rowSize);

				if (rowIndex < 1)		{
					rowIndex = 1;
				} else if (rowIndex > rowCount){
					rowIndex = rowCount;
				}

				return  rowIndex;	 
			}

			function getColumnX(columnNumber){
				return (columnNumber - 1) * columnSize;
			}

			function getColumnY(rowNumber){
				return (rowNumber - 1) * rowSize;
			}

			function fillCell(context, rowNumber, columnNumber, color){
				var x = getColumnX(columnNumber);
				var y = getColumnY(rowNumber);
				var currentColor = context.fillStyle;

				context.fillStyle = color;

				context.fillRect(x + 1, y + 1, columnSize - 1, rowSize - 1);
				context.fillStyle = currentColor;
			}

			function clearCell(rowNumber, columnNumber){		
				var x = getColumnX(columnNumber);
				var y = getColumnY(rowNumber);

				context.clearRect(x + 0.5, y + 0.5, columnSize - 0.5, rowSize - 0.5);
			}

			function targetCell(e){
				var x = Math.floor(e.pageX - field.offsetLeft),
				    y = Math.floor(e.pageY - field.offsetTop);

				currentColumn = getColumIndex(x);
				currentRow = getRowIndex(y);

				clearCell(previousRow, previousColumn);

				if (!isSelectedCell(currentRow, currentColumn)){		
					previousColumn = currentColumn;
					previousRow = currentRow;
					
					fillCell(context, currentRow, currentColumn, targetColor);	
				}
			}

			

			function isEmpty(i, j){
				if (i === undefined || j === undefined){
					return true;
				}
				return $scope.map[i][j] === states.empty;
			}

			function isPresent(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return $scope.map[i][j] === states.present;
			}
			
			function isBorn(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return $scope.map[i][j] === states.born;
			}
			
			function isDead(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return $scope.map[i][j] === states.dead;
			}

			function getCorrectedBorders(borders){
				if (borders.top <= 0){
					borders.top = 0;
					if ($scope.circleBorders){
						borders.bottom = rowCount - 1;
					}
				}

				if (borders.bottom >= rowCount - 1){
					borders.bottom = rowCount - 1;
					if ($scope.circleBorders){
						borders.top = 0;
					}
				}
				
				if (borders.right >= columnCount - 1){
					borders.right = columnCount - 1;
					if ($scope.circleBorders){
						borders.left = 0;
					}
				}

				if (borders.left <= 0){
					borders.left = 0;
					if ($scope.circleBorders){
						borders.right = columnCount - 1;
					}
				}

				return borders;
			}

			function isEmptyVerticalLine(j, from, to){
				j = j < 0 ? 0 : j;		
				j = j > columnCount - 1 ? columnCount - 1 : j;

				for (var i = from; i <= to; i++){
					if(isPresent(i, j) || isBorn(i, j)){
						return false;
					}
				}

				return true;
			}

			function isEmptyHorizontalLine(i, from, to){
				i = i < 0 ? 0 : i;		
				i = i > rowCount - 1 ? rowCount - 1 : i;
				for (var j = from; j <= to; j++){
					if(isPresent(i,j) || isBorn(i,j)){
						return false;
					}
				}

				return true;
			}
			function getCellsBorders(top, left, right, bottom){			
				var result = {},
					i = 0,
					j = 0;

				result.left = getLeftBorder() - 1;
				result.top = getTopBorder() - 1;
				result.right = getRightBorder() + 1;
				result.bottom = getBottomBorder() + 1;		

				borders = getCorrectedBorders(result);	

				return result;
			

				function getLeftBorder(){
					for (j = left; j <= right; j++){
						for (i = bottom; i >= top; i--){
							if (isPresent(i, j) || isBorn(i, j)){ 
								return j;
							}
						}
					}

					return 0;
				}

				function getRightBorder(){
					for (j = right; j >= left; j--){
						for (i = bottom; i >= top; i--){
							if (isPresent(i, j) || isBorn(i, j)){
								return j;
							}
						}
					}

					return columnCount - 1;
				}

				function getTopBorder(){
					for (i = top; i <= bottom; i++){
						for (j = right; j >= left; j--){
							if (isPresent(i, j) || isBorn(i, j)){
								return i;
							}
						}
					}

					return 0;
				}

				function getBottomBorder(){
					for (i = bottom; i >= top; i--){
						for (j = right; j >= left; j--){
							if (isPresent(i, j) || isBorn(i, j)){
								return i;
							}
						}
					}
					return rowCount - 1;
				}
			}		

			function isSelectedCell(currentRow, currentColumn){
				return $scope.map[currentRow - 1][currentColumn - 1] === states.present;
			}

			function selectCell(){
				var i = currentRow - 1,
				j = currentColumn - 1,
				currentState = $scope.map[i][j];

				if (currentState === states.present){
					$scope.map[i][j] = states.empty;					
				} else {
					$scope.map[i][j] = states.present;					
				}

				borders = getCellsBorders(0, 0, columnCount - 1, rowCount - 1);		
				
				fillCell(context, currentRow, currentColumn, selectedColor);	
				previousColumn = 0;
				previousRow = 0;		
			}

			function step(){
				var directions = [[-1,-1],[-1,0],[-1,+1],[0,+1],[+1,+1],[+1,0],[+1,-1],[0,-1]];

				borders = getCorrectedBorders(borders);
				
				for (var i = borders.top; i < borders.bottom + 1; i++){
					for (var j = borders.left; j < borders.right + 1; j++){
						if ((isAlone(i,j) || isOvercrowded(i, j)) && isPresent(i, j)){
							$scope.map[i][j] = states.dead;	
							fillCell(context, i + 1, j + 1, '#f00');		;
						} else if (thereIsOnlyThreeNeighbors(i, j) && isEmpty(i, j)){
							$scope.map[i][j] = states.born;					
							fillCell(context, i + 1, j + 1, '#0f0');	
						}				
					}
				}

				updateStates();
				borders = getCellsBorders(borders.top, borders.left, borders.right, borders.bottom);

				function updateStates(){
					for (var i = borders.top; i <= borders.bottom; i++){
						for (var j = borders.left; j <= borders.right; j++){
							if(isBorn(i, j) || isPresent(i, j)){
								$scope.map[i][j] = states.present;
								fillCell(context, i + 1, j + 1, selectedColor);
							} else {
								$scope.map[i][j] = states.empty;
								clearCell(i + 1, j + 1);
							}
						}
					}	
				}

				function isAlone(i, j){
					var neighborsCount = 0,
						dy = 0,
						dx = 0,
						neighborY = 0,
						neighborX = 0,
						k = 0;

					for (k = 8; k--;){
						dy = i + directions[k][0];
						dx = j + directions[k][1];
						neighborY = yClosure(dy);
						neighborX = xClosure(dx);

						if (isDead(neighborY, neighborX) || isPresent(neighborY, neighborX)){
							neighborsCount++;
						}

						if (neighborsCount > 1){
							return false;
						}
					}		

					return true;	
				}

				function isOvercrowded(i, j){
					var neighborsCount = 0,
						dy = 0,
						dx = 0,
						neighborY = 0,
						neighborX = 0,
						k = 0;

					for (k = 8; k--;){
						dy = i+directions[k][0];
						dx = j+directions[k][1];
						neighborY = yClosure(dy);
						neighborX = xClosure(dx);

						if (isDead(neighborY, neighborX) || isPresent(neighborY, neighborX)){
							neighborsCount++;
						}

						if (neighborsCount > 3){
							return true;
						}
					}		

					return false;	
				}

				function thereIsOnlyThreeNeighbors(i, j){
					var neighborsCount = 0,
						dy = 0,
						dx = 0,
						neighborY = 0,
						neighborX = 0,
						k = 0;

					for (k = 8; k--;){
						dy = i + directions[k][0];
						dx = j + directions[k][1];

						neighborY = yClosure(dy);
						neighborX = xClosure(dx);

						if (neighborsCount > 3){
							return false;
						}
						if (isDead(neighborY, neighborX) || isPresent(neighborY, neighborX)){
							neighborsCount++;
						}
					}		

					return (neighborsCount === 3) ? true : false;
				}

				function xClosure(x){		
					if (x < 0){
						return $scope.circleBorders ? columnCount - 1 : undefined;
					} else if (x > (columnCount - 1)){
						return $scope.circleBorders ? 0 : undefined;
					}
					return x;
				}

				function yClosure(y){
					if (y < 0){
						return $scope.circleBorders ? rowCount - 1 : undefined;
					} else if (y > (rowCount - 1)){
						return $scope.circleBorders ? 0 : undefined;
					}
					return y;
				}
			}

			createMap();
			field.onmousemove = targetCell;
			field.onclick = selectCell;
			start.onclick = (function(){
				if (processId === undefined){
					processId = setInterval(step, $scope.speed);
				}				
			});

			stop.onclick =  (function(){
				clearInterval(processId);
				processId = undefined;	
				
			});
		}	    
	});	
})()