// logic.ts

import { animationsFixing, animationsPhone, repairDirs } from "./conf";
import { workers, occupiedTiles, staffWindows, StatusFA, StatusFR } from "./classes";
import { storage } from "./storage";
import { mainWin } from "./ui/mainwin";

let tick_repairAdditions: number = 0;
let tick_getWorkerStatus: number = 0;

function RandomIndex(lastIndex: number, max: number): number {
	let randomIndex = Math.floor(Math.random() * max);
	if (randomIndex == lastIndex)
		return RandomIndex(lastIndex, max);
	return randomIndex;
}

export function RandomTileCoordsXYZ(): CoordsXYZ {
	let tiles: CoordsXYZ[] = [];
	for (let y = 0; y < map.size.y; y++) {
		for (let x = 0; x < map.size.x; x++) {
			let tile: Tile = map.getTile(x, y);
			tile.elements.forEach(element => {
				if (element.type == "footpath") {
					tiles.push({ x, y, z: element.baseZ });
				}
			});
		}
	}
	return tiles[Math.floor(Math.random() * tiles.length)];
}

// return worker id instead of true
export function IsTileOccupied(xyz: { x: number, y: number, z: number }): number {
	for (let key in occupiedTiles.data)
		if (xyz.x == occupiedTiles.data[key].x && xyz.y == occupiedTiles.data[key].y && xyz.z == occupiedTiles.data[key].z)
			return Number(key);
	return -1;
}

export function Release(id: number): void {
	if (workers.exist(id)) {
		workers.data[id].animationOffset = 0;
		workers.data[id].statusFA = StatusFA.None;
		let worker: Staff = <Staff>map.getEntity(id);
		worker.setFlag("positionFrozen", false);
		worker.animation = "walking";
		occupiedTiles.delete(id);
	}
}

// this should handle all possible deleting, window, worker ...
export function DeleteWorkerData(id: number): void {
	if (staffWindows[id]) {
		staffWindows[id].disposeWin();
		staffWindows[id].window?.close();
	}
	workers.delete(id);
	occupiedTiles.delete(id);
	delete staffWindows[id];
	mainWin.update();
}

export function UpdateWorkersData(): void {

	let workerIds: number[] = [];

	let staff: Staff[] = map.getAllEntities("staff");

	// get in game worker ids to list
	staff.forEach(staffMember => {
		if (staffMember.staffType == "mechanic")
			workerIds.push(staffMember.id as number);
	});

	// loop workerIds and add new worker in to workersData if not already in there
	workerIds.forEach(id => {
		if (!workers.exist(id))
			workers.new(id);
	});

	// remove workers from workers.data if they does not exist anymore in game
	for (var key in workers.data) {
		if (workers.data.hasOwnProperty(key) && workerIds.indexOf(Number(key)) === -1)
			delete workers.data[key];
	}

}

// need better way to check and set the worker status
export function SetWorkerStatus(): void {

	tick_getWorkerStatus++;

	if (tick_getWorkerStatus >= 30) {

		for (let id in workers.data) {

			let staffMember: Staff = <Staff>map.getEntity(Number(id));
			let tile: Tile = map.getTile(staffMember.x / 32, staffMember.y / 32);

			if (workers.data[id].statusFR == StatusFR.None)
				if (animationsPhone.indexOf(staffMember.animation) !== -1)
					workers.data[id].statusFR = StatusFR.Answering;

			if (workers.data[id].statusFR == StatusFR.Answering && animationsPhone.indexOf(staffMember.animation) === -1)
				workers.data[id].statusFR = StatusFR.Heading;

			tile.elements.forEach((element) => {

				// check if staffMember is on same height
				if (staffMember.z >= element.baseZ && staffMember.z < element.baseZ + 16) {

					if (element.type == "track") {
						workers.data[id].statusFR = StatusFR.Fixing;

					} else if (element.type == "entrance" && workers.data[id].statusFR == StatusFR.Fixing) {
						workers.data[id].statusFR = StatusFR.None;
					}

				}

			});

		}

		tick_getWorkerStatus = 0;
	}
}

export function RepairAdditions(): void {

	tick_repairAdditions++;

	if (tick_repairAdditions >= 30) {

		for (let id in workers.data) {

			// could be something else
			if (park.cash < 100) {

				// if theres no cash and worker is stuck repairing, release it
				if (workers.data[id].statusFA == StatusFA.Fixing)
					Release(Number(id));

				continue;
			}

			// if worker is not marked as addition fixer, continue to next
			if (!workers.data[id].isAdditionFixer)
				continue;

			// if fixing rides priority is true and worker is heading for ride, continue to next
			if (storage.sharedStorage.get("fixingRidesIsPriority") && workers.data[id].statusFR == StatusFR.Heading) {

				// release if repairing
				if (workers.data[id].statusFA == StatusFA.Fixing)
					Release(Number(id));

				continue;
			}

			let staffMember: Staff = <Staff>map.getEntity(Number(id));

			let tile: Tile = map.getTile(staffMember.x / 32, staffMember.y / 32);

			tile.elements.forEach(element => {

				if (
					element.type == "footpath" && element.isAdditionBroken &&
					// check if staffMember is on same height
					staffMember.z >= element.baseZ && staffMember.z < element.baseZ + 16 &&
					// will ignore intersections
					element.edges != 15
				) {

					// check if staffMember is not repairing
					if (workers.data[id].statusFA != StatusFA.Fixing) {

						// check if tile is already being fixed by other workers
						const occupiedId: number = IsTileOccupied({ x: tile.x, y: tile.y, z: element.baseZ });

						// start repairing the addition and set the repair animation if tile not occupiedId
						if (occupiedId == -1) {

							workers.data[id].orgDirection = staffMember.direction; // save original direction
							workers.data[id].statusFA = StatusFA.Fixing; // set worker status
							workers.data[id].animationOffset = 0;

							let lastAnimationIndex = workers.data[id].lastAnimationIndex;
							let newAnimationIndex = RandomIndex(lastAnimationIndex, animationsFixing.length);
							workers.data[id].lastAnimationIndex = newAnimationIndex;

							staffMember.animation = animationsFixing[newAnimationIndex];
							staffMember.direction = repairDirs[element.edges][Math.floor(Math.random() * repairDirs[element.edges].length)];
							staffMember.setFlag("positionFrozen", true);

							// set this tile as occupied
							occupiedTiles.data[id] = { x: tile.x, y: tile.y, z: element.baseZ };

							occupiedTiles.save();

						}
					}

					// loop this as long as animationOffset is set and finally repair & release the staffMember
					if (workers.data[id].statusFA == StatusFA.Fixing) {

						if (staffMember.animationOffset > workers.data[id].animationOffset)
							workers.data[id].animationOffset = staffMember.animationOffset;

						if (staffMember.animationOffset < workers.data[id].animationOffset) {

							context.executeAction(
								"footpathadditionplace",
								{
									x: occupiedTiles.data[id].x * 32,
									y: occupiedTiles.data[id].y * 32,
									z: occupiedTiles.data[id].z,
									object: element.addition
								}
							);

							workers.data[id].statusFA = StatusFA.None; // set worker status
							workers.data[id].fixedAdditions++;
							workers.data[id].animationOffset = 0;

							staffMember.animation = "walking";
							staffMember.direction = workers.data[id].orgDirection; // set back original direction
							staffMember.setFlag("positionFrozen", false);

							occupiedTiles.delete(Number(id));

							occupiedTiles.save();

						}

					}
				}
			});
		}

		tick_repairAdditions = 0;
	}
}