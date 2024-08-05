// actions.ts

import { newordersList } from "./conf";
import { storage } from "./storage"
import { workers, StaffWindow, staffWindows, StatusFA } from "./classes";
import { Release, RandomTileCoordsXYZ } from "./logic"
import { mainWin } from "./ui/mainwin"

export let selectAll: boolean[] = [false, false, false];
export let deleteSelected: boolean = false;

export const userActions = {
	enabled(): void {
		let enabled = storage.sharedStorage.get("enabled");
		storage.sharedStorage.set("enabled", !enabled);
		for (let id in workers.data)
			Release(Number(id));
	},
	fixingRidesIsPriority(): void {
		let fixingRidesIsPriority = storage.sharedStorage.get("fixingRidesIsPriority");
		storage.sharedStorage.set("fixingRidesIsPriority", !fixingRidesIsPriority);
	},
	deleteSelected(): void {
		deleteSelected = !deleteSelected;
		mainWin.win().findWidget<ButtonWidget>("deleteSelected").isPressed = deleteSelected;
		mainWin.update();
	},
	new(): void {
		context.executeAction(
			"staffhire",
			{
				autoPosition: true,
				staffType: 1, // 0: handyman, 1: mechanic, 2: security, 3: entertainer
				entertainerType: 11,
				staffOrders: 3
			},
			(result) => {
				let staffMember: Mechanic = <Mechanic>map.getEntity(Number(result.peep));
				staffMember.colour = storage.parkStorage.get("colorFixer");
				// weird, if position is 0, 0
				if (staffMember.x < 32 && staffMember.y < 32) {
					const randPos: CoordsXYZ = RandomTileCoordsXYZ();
					staffMember.x = randPos.x * 32;
					staffMember.y = randPos.y * 32;
					staffMember.z = randPos.z + 32;
				}
				// open worker window
				staffWindows[Number(staffMember.id)] = new StaffWindow(staffMember);
			}
		);
		deleteSelected = false;
		mainWin.win().findWidget<ButtonWidget>("deleteSelected").isPressed = deleteSelected;
	},
	setWorkerColor(name: string, color: number): void {
		if (name == "colorDefault")
			storage.parkStorage.set("colorDefault", color);
		else if (name == "colorFixer")
			storage.parkStorage.set("colorFixer", color);
		for (let id in workers.data) {
			let staffMember: Mechanic = <Mechanic>map.getEntity(Number(id));
			if (name == "colorDefault" && !workers.data[id].isAdditionFixer)
				staffMember.colour = color;
			else if (name == "colorFixer" && workers.data[id].isAdditionFixer)
				staffMember.colour = color;
		}
	},
	workersListViewItemsEdit(column: number, id: number) {
		let staffMember: Mechanic = <Mechanic>map.getEntity(Number(id));
		if (column == 0) {
			// delete worker
			if (deleteSelected) {
				context.executeAction("stafffire", { id: id });
			} else {
				// open worker window
				staffWindows[id] = new StaffWindow(staffMember);
			}
		}
		// changeDuties
		else if (column == 1 || column == 2) {
			staffMember.orders = newordersList[column][staffMember.orders];
			mainWin.update();
		}
		// changeAdditionFixerStatus
		else if (column == 3) {
			let bool = !workers.data[id].isAdditionFixer;
			workers.data[id].isAdditionFixer = bool;
			staffMember.colour = bool ? storage.parkStorage.get("colorFixer") : storage.parkStorage.get("colorDefault");
			if (!bool && workers.data[id].statusFA == StatusFA.Fixing)
				Release(id);
			mainWin.update();
		}
		workers.save();
	},
	selectAll(index: number) {
		selectAll[index] = !selectAll[index];
		for (let id in workers.data) {
			let staffMember: Mechanic = <Mechanic>map.getEntity(Number(id));
			// inspectRides
			if (index == 0) {
				if (selectAll[index]) {
					if (staffMember.orders == 0)
						staffMember.orders = 1;
					else if (staffMember.orders == 2)
						staffMember.orders = 3;
				} else {
					if (staffMember.orders == 1)
						staffMember.orders = 0;
					else if (staffMember.orders == 3)
						staffMember.orders = 2;
				}
			}
			// fixRides
			else if (index == 1) {
				if (selectAll[index]) {
					if (staffMember.orders == 0)
						staffMember.orders = 2;
					else if (staffMember.orders == 1)
						staffMember.orders = 3;
				} else {
					if (staffMember.orders == 2)
						staffMember.orders = 0;
					else if (staffMember.orders == 3)
						staffMember.orders = 1;
				}
			}
			// additionFixer
			else if (index == 2) {
				if (selectAll[2])
					workers.data[id].isAdditionFixer = true;
				else
					workers.data[id].isAdditionFixer = false;
				staffMember.colour = workers.data[id].isAdditionFixer ? storage.parkStorage.get("colorFixer") : storage.parkStorage.get("colorDefault");
				if (!workers.data[id].isAdditionFixer && workers.data[id].statusFA == StatusFA.Fixing)
					Release(Number(id));
			}
		}
		workers.save();
		mainWin.update();
	},
	exitWin() {
		deleteSelected = false;
	}
};