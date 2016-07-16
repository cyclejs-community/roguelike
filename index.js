import {run} from '@cycle/xstream-run';
import xs from 'xstream';
import {makeDOMDriver, div} from '@cycle/dom';
import _ from 'lodash';

// Milestones:
// ✅  0. a room with walls and floor
// 1. a character that can move within the room's bounds
// 2. a training dummy that can be destroyed by the character
const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;

const initialState = {
  floor: Floor({width: 30, height: 30})
};

initialState.floor = placeAt(
  initialState.floor,
  Room({width: 13, height: 10}),
  Position({row: 1, column: 1})
);

function Empty () {
  return {string: ' '};
}

function Floor ({width, height}) {
  return _.range(height).map(() => _.range(width).map(() => Empty()));
}

function Wall () {
  return {string: '█'};
}

function range (n) {
  return _.range(n);
}

function Room ({width, height}) {
  return range(height).map(row => {
    return range(width).map(column => {
      const onTopBoundary = row === 0;
      const onLeftBoundary = column === 0;
      const onBottomBoundary = row === height - 1;
      const onRightBoundary = column === width - 1;

      if (onTopBoundary || onLeftBoundary || onBottomBoundary || onRightBoundary) {
        return Wall();
      } else {
        return Empty();
      }
    });
  });
}

function transformPosition (a, b, operator) {
  return Position({
    row: operator(a.row, b.row),
    column: operator(a.column, b.column)
  });
}

function Position (position) {
  const {row, column} = position;

  return {
    minus: (otherPosition) => transformPosition(position, otherPosition, (a, b) => a - b),
    plus: (otherPosition) => transformPosition(position, otherPosition, (a, b) => a + b),
    inside: (area) => {
      const areaHeight = area.length;
      const areaWidth = area[0].length;

      return row >= 0 && column >= 0 && row < areaHeight && column < areaWidth;
    },
    row,
    column
  };
}

function tileAtPosition (area, position) {
  if (!position.inside(area)) { return; }
  return area[position.row][position.column];
}

function placeAt (floor, room, position) {
  return floor.map((row, rowIndex) => {
    return row.map((tile, tileIndex) => {
      const tilePosition = Position({row: rowIndex, column: tileIndex});
      const positionToCheck = tilePosition.minus(position);

      const possibleNewTile = tileAtPosition(room, positionToCheck);

      if (possibleNewTile) {
        return possibleNewTile;
      } else {
        return tile;
      }
    });
  });
}

function renderTile (tile, row, column) {
  const style = {
    position: 'absolute',
    transform: `translate(${column * TILE_WIDTH}px, ${row * TILE_HEIGHT}px)`
  };

  return div('.tile', {style}, tile.string);
}

function renderRow (row, rowIndex) {
  return div('.row', row.map((tile, tileIndex) => renderTile(tile, rowIndex, tileIndex)));
}

function view (state) {
  return (
    div('.floor', state.floor.map(renderRow))
  );
}

function main ({DOM}) {
  const state$ = xs.of(initialState);

  return {
    DOM: state$.map(view)
  };
}

const drivers = {
  DOM: makeDOMDriver('.app')
};

run(main, drivers);
