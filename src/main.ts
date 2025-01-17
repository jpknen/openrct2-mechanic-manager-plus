// main.ts

import { storage } from "./storage";
import { workers } from "./classes";
import { UpdateWorkersData, RepairAdditions, SetWorkerStatus, Release, IsTileOccupied, DeleteWorkerData } from "./logic"
import { mainWin } from "./ui/mainwin"

export function main(): void {

	ui.registerMenuItem("Mechanic manager +", mainWin.open);

	// first load to integrate in game workers to workersData
	UpdateWorkersData();

	context.subscribe("interval.tick", () => {

		if (!storage.sharedStorage.get("enabled"))
			return;

		SetWorkerStatus()
		RepairAdditions();

	});

	// then listen for staff & other changes
	context.subscribe("action.execute", (e: GameActionEventArgs) => {

		if (e.action == "staffhire" && 'peep' in e.result && "staffType" in e.args && e.args.staffType == 1) {
			workers.new(Number(e.result.peep));
			mainWin.update();
		}

		else if (e.action == "stafffire" && 'id' in e.args) {
			DeleteWorkerData(Number(e.args.id));
		}

		else if (e.action == "staffsetorders" || e.action == "staffsetname")
			mainWin.update();

		else if (e.action == "peeppickup" && 'id' in e.args)
			Release(Number(e.args.id));

		else if (e.action == "footpathplace" || e.action == "footpathremove" || e.action == "footpathadditionplace" || e.action == "footpathadditionremove") {
			if ("x" in e.args && "y" in e.args && "z" in e.args) {
				const occupiedId: number = IsTileOccupied({ x: Number(e.args.x) / 32, y: Number(e.args.y) / 32, z: Number(e.args.z) });
				if (occupiedId > -1)
					Release(occupiedId);
			}
		}

	});

}