let plan = [
    '##################',
    '#  o       *     #',
    '#               o#',
    '#                #',
    '#   *     ####   #',
    '#        *#      #',
    '#               *#',
    '#                #',
    '#   *####        #',
    '#        *#      #',
    '#               *#',
    '# o              #',
    '##################',
];

class World {
    constructor(map) {
        this._map = map;
        this._wObjects = this._createWorldObjects();
    }

    step() {
        this._wObjects.forEach((wObject) => {
            let action = wObject.action(this._wObjects);
            if (action) {
                switch (action.type) {
                    case "add": {
                        this._pushNewObject(action.worldObject);
                        break;
                    }
                    case "delete": {
                        this._deleteObject(action.worldObject);
                        break;
                    }
                }
            }
        });
        this._map.refresh(this._wObjects);
    }

    _pushNewObject(newObject) {
        this._wObjects.push(newObject);
    }

    _deleteObject(delObject) {
        this._wObjects.forEach((wObject, index) => {
            if (JSON.stringify(wObject.sayYourPlace()) == JSON.stringify(delObject.sayYourPlace())) {
                this._wObjects.splice(index, 1);
            }
        });
    }
    _createWorldObjects() {
        let wObjects = [];
        this._map.content().forEach((str, line) => {
            for (let col = 0; col < str.length; col++) {
                switch (str[col]) {
                    case '#':
                        wObjects.push(new Wall(new Place(line, col)));
                        break;
                    case 'o':
                        wObjects.push(new PlantEating(new Place(line, col)));
                        break;
                    case '*':
                        wObjects.push(new Plant(new Place(line, col)));
                        break;
                    default:
                        break;
                }
            }
        });
        return wObjects;
    }
}

class Map {
    constructor(map) {
        this._map = map;
        this._drawMap();
    }

    content() {
        return this._map;
    }
    // Refresh and render MAP
    refresh(wObjects) {
        let grid = document.querySelectorAll('.world_cell');
        for (let key in grid) {
            if (grid.hasOwnProperty(key)) {
                grid[key].style.backgroundImage = '';
            }
        }
        // Draw world objects in map
        wObjects.forEach((wObject) => {
            switch (wObject.constructor.name) {
                case 'Wall': {
                    let wallClass = '._' + wObject.sayYourPlace().line + wObject.sayYourPlace().col;
                    let wall = document.querySelector(wallClass);
                    wall.style.backgroundImage = "url(./images/crateWood.png)";
                }
                break;
            case 'PlantEating': {
                let PlantEatingClass = '._' + wObject.sayYourPlace().line + wObject.sayYourPlace().col;
                let PlantEating = document.querySelector(PlantEatingClass);
                PlantEating.style.backgroundImage = "url(./images/buffalo.png)";
            }
            break;
            case 'Plant': {
                let PlantClass = '._' + wObject.sayYourPlace().line + wObject.sayYourPlace().col;
                let Plant = document.querySelector(PlantClass);
                Plant.style.backgroundImage = "url(./images/treeGreen_small.png)";
            };
            break;
            }
        });
    }

    _drawMap() {
        // get size maxLine of the map
        let maxLine = this._map.map((line) => {
                return line.length
            })
            .reduce((a, b) => {
                return a > b ? a : b
            });
        // draw map and create class name cells 
        let wrapper = document.querySelector('.wrapper_for_world');
        wrapper.style.width = 40 * maxLine + 'px';
        plan.forEach((str, line) => {
            for (let col = 0; col < str.length; col++) {
                let X = line.toString().length < 2 ? '0' + line.toString() : line.toString();
                let Y = col.toString().length < 2 ? '0' + col.toString() : col.toString();
                wrapper.innerHTML += `<div class="world_cell _${X}${Y}"></div>`;
            }
        });
    }
}

class Place {
    constructor(line, col) {
        this.line = line.toString().length < 2 ? '0' + line : line;
        this.col = col.toString().length < 2 ? '0' + col : col;
    }
}

class WorldObject {
    constructor(place) {
        this._place = place;
        if (this.constructor.name === 'WorldObject') {
            throw new Error(`${this.constructor.name}: can not create instance of abstract class`);
        }
    }

    action() {}

    sayYourPlace() {
        return this._place;
    }
}

class LivingObjects extends WorldObject {
    constructor(place) {
        super(place);
        this._place = place;
        this._years = 0;
        this._aroundObjects = {
            freePlaces: [],
        }

        if (this.constructor.name === 'LivingObjects') {
            throw new Error(`${this.constructor.name}: can not create instance of abstract class`);
        }
    }

    action(wObjects) {
        this._years += 1;
        this._look(wObjects);
        return this._selectStep();
    }

    _selectStep() {

    }

    _die() {
        return new Action("delete", this);
    }

    _multiply() {

    }

    _look(wObjects) {
        this._aroundObjects = {
            freePlaces: []
        };

        for (let line = Number(this._place.line) - 1; line <= Number(this._place.line) + 1; line++) {
            for (let col = Number(this._place.col) - 1; col <= Number(this._place.col) + 1; col++) {
                let direction = new Place(line, col);
                let objectToDirection = wObjects.filter((wObject) => {
                    if (JSON.stringify(direction) == JSON.stringify(wObject.sayYourPlace())) {
                        return true
                    } else {
                        return false
                    }
                })[0];

                if (objectToDirection) {
                    if (this._aroundObjects[objectToDirection.constructor.name]) {
                        this._aroundObjects[objectToDirection.constructor.name].push(direction);
                    } else {
                        this._aroundObjects[objectToDirection.constructor.name] = []
                        this._aroundObjects[objectToDirection.constructor.name].push(direction);
                    }
                } else {
                    this._aroundObjects.freePlaces.push(direction);
                }
            }
        }
    }
}

class PlantEating extends LivingObjects {
    constructor(place) {
        super(place);
        this._place = place;
        this._health = 60;
        this._multyplyHealth = 120;
    }

    _selectStep() {
        if (this._aroundObjects["Plant"]) {
            return this._eat();
        } else if (this._health <= 0) {
            return this._die();
        } else if (this._health >= this._multyplyHealth) {
            return this._multiply();
        } else if (this._aroundObjects.freePlaces.length != 0) {
            this._move();
        }
    }

    _multiply() {
        let chilPlace = this._aroundObjects.freePlaces[Math.floor(Math.random() * this._aroundObjects.freePlaces.length)];
        this._health = this._health / 10;
        return new Action("add", new PlantEating(chilPlace));
    }

    _eat() {
        let eatPlantPlace = this._aroundObjects["Plant"][Math.floor(Math.random() * this._aroundObjects["Plant"].length)];
        this._health += 1;
        return new Action("delete", new Plant(eatPlantPlace));
    }

    _move() {
        this._health -= 1;
        this._place = this._aroundObjects.freePlaces[Math.floor(Math.random() * this._aroundObjects.freePlaces.length)];
    }
}

class Plant extends LivingObjects {
    constructor(place) {
        super(place);
        this._place = place;
        this._multiplyYears = 5;
        this._dieYears = 30;
    }
    _selectStep() {
        if (this._years == this._multiplyYears && this._aroundObjects.freePlaces.length != 0) {
            return this._multiply();
        } else if (this._years == this._dieYears) {
            return this._die();
        }
    }

    _multiply() {
        let chilPlace = this._aroundObjects.freePlaces[Math.floor(Math.random() * this._aroundObjects.freePlaces.length)];
        this._multiplyYears += this._multiplyYears;
        return new Action("add", new Plant(chilPlace));
    }


}

class Wall extends WorldObject {
    constructor(place) {
        super(place);
        this._place = place;
    }
}

class Action {
    constructor(type, worldObject) {
        this.type = type;
        this.worldObject = worldObject;
    }
}

let w = new World(new Map(plan));

setInterval(() => {
    w.step();
}, 500);