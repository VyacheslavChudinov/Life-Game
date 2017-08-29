(function(){
	'use strict';

	var lifeApp = angular.module('lifeApp', []);
	    lifeApp.controller('lifeController', function ($scope) {
	    $scope.gameIsRunning = false;

	    $scope.fieldWidth = 1000;
	    $scope.fieldHeight = 1000;
	    $scope.speed = 200;
		$scope.columnSize =  20,
		$scope.rowSize = 20,
		$scope.circleBorders =  true,
		$scope.targetColor = '#aaa',
	 	$scope.selectedColor =  '#333';

	    var life = new LifeGame(
			document.getElementById('lifeField'),
			document.getElementById('startButton'),
			document.getElementById('stopButton'),
	    {
	    	columnSize: $scope.columnSize,
	    	rowSize: $scope.rowSize,
	    	speed: $scope.speed,
	    	circleBorders: $scope.circleBorders,
	    	targetColor: $scope.targetColor,
	    	selectedColor: $scope.selectedColor
	    });
	    
	    function LifeGame(field, start, stop, options) {
			var width = field.width,
				height = field.height,
				previousColumn = 0,
				previousRow= 0,
				currentColumn = 0,
				currentRow= 0,
				map,
				processId,
				states = {empty : 0, present : 1, dead : 2, born : 3},
				borders,
				columnCount,
				rowCount,
				context  = field.getContext('2d'),
				columnSize = options.columnSize || 20,
				rowSize = options.rowSize || 20,
				speed = options.speed || 50,
				circleBorders = options.circleBorders || false,
				targetColor = options.targetColor || '#aaa',
			 	selectedColor = options.selectedColor || '#333';

			function createMap(){
				var i = 0, 
					j = 0,
					middleColumn,
					middleRow;
				columnCount = Math.ceil(width / columnSize);
				rowCount = Math.ceil(height / rowSize);
				map = new Array(rowCount);

				for (i = columnCount; i--;){
					map[i] = new Array(columnCount);
				};

				for (i = rowCount; i--;){
					for (j = columnCount; j--;){
							map[i][j] = states.empty;
					}	
				}

				middleColumn = Math.round(columnCount / 2) - 1;
				middleRow = Math.round(rowCount / 2) - 1;

				borders = {
					top : 0,
					left : 0,
					right : columnCount - 1,
					bottom : rowCount - 1
				};
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
				return map[i][j] === states.empty;
			}

			function isPresent(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return map[i][j] === states.present;
			}
			
			function isBorn(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return map[i][j] === states.born;
			}
			
			function isDead(i, j){
				if (i === undefined || j === undefined){
					return false;
				}
				return map[i][j] === states.dead;
			}

			function getCorrectedBorders(borders){
				if (borders.top <= 0){
					borders.top = 0;
					if (circleBorders){
						borders.bottom = rowCount - 1;
					}
				}

				if (borders.bottom >= rowCount - 1){
					borders.bottom = rowCount - 1;
					if (circleBorders){
						borders.top = 0;
					}
				}
				
				if (borders.right >= columnCount - 1){
					borders.right = columnCount - 1;
					if (circleBorders){
						borders.left = 0;
					}
				}

				if (borders.left <= 0){
					borders.left = 0;
					if (circleBorders){
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

				//borders = getCorrectedBorders(result);	

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
				return map[currentRow - 1][currentColumn - 1] === states.present;
			}

			function selectCell(){
				var i = currentRow - 1,
				j = currentColumn - 1,
				currentState = map[i][j];

				if (currentState === states.present){
					map[i][j] = states.empty;					
				} else {
					map[i][j] = states.present;					
				}

				//borders = getCellsBorders(0, 0, columnCount - 1, rowCount - 1);		
				
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
							map[i][j] = states.dead;	
							fillCell(context, i + 1, j + 1, '#f00');		;
						} else if (thereIsOnlyThreeNeighbors(i, j) && isEmpty(i, j)){
							map[i][j] = states.born;					
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
								map[i][j] = states.present;
								fillCell(context, i + 1, j + 1, selectedColor);
							} else {
								map[i][j] = states.empty;
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
						return circleBorders ? columnCount - 1 : undefined;
					} else if (x > (columnCount - 1)){
						return circleBorders ? 0 : undefined;
					}
					return x;
				}

				function yClosure(y){
					if (y < 0){
						return circleBorders ? rowCount - 1 : undefined;
					} else if (y > (rowCount - 1)){
						return circleBorders ? 0 : undefined;
					}
					return y;
				}
			}

			createMap();
			field.onmousemove = targetCell;
			field.onclick = selectCell;
			start.onclick = (function(){
				$scope.gameIsRunning = true;

				if (processId === undefined){
					processId = setInterval(step, $scope.speed);
				}				
			});

			stop.onclick =  (function(){
				$scope.gameIsRunning = false;	

				clearInterval(processId);
				processId = undefined;	
				
			});
		}	    
	});	
})()