// mainwin.ts

import { globals } from "../conf";
import { storage } from "../storage"
import { occupiedTiles, workers, staffWindows } from "../classes";
import { UpdateWorkersData } from "../logic"
import { userActions, deleteSelected } from "../actions"

let listData: string[][] = [];

const widgetUpdates = {
	workersListView(widgetName: string): void {
		listData = [];
		for (let id in workers.data) {
			const worker: Staff = <Staff>map.getEntity(Number(id));
			let color: string = deleteSelected ? "{RED}" : "{WHITE}";
			listData.push([
				`${color}${worker.name}`,
				worker.orders & 1 ? `${color} ✓` : "",
				worker.orders & 2 ? `${color} ✓` : "",
				workers.data[id].isAdditionFixer ? `${color} ✓` : " ",
				id
			]);
		}
		if (mainWin.win()) {
			let widget = mainWin.win().findWidget(widgetName);
			if ("items" in widget)
				widget.items = listData;
		}
	}
};

function Widgets(): WidgetDesc[] {

	const widgets: WidgetDesc[] = [];

	widgets.push({
		type: "button",
		x: 5, y: 20, width: 25, height: 25,
		tooltip: "Hire new mechanic",
		image: 5196,
		onClick: userActions.new
	});

	widgets.push({
		type: "button",
		x: 30, y: 20, width: 25, height: 25,
		name: "deleteSelected",
		tooltip: "Fire selected mechanic",
		isPressed: deleteSelected,
		image: 5165,
		onClick: userActions.deleteSelected
	});

	widgets.push({
		type: "label",
		text: "Uniform colors:",
		x: 150, y: 35, width: 125, height: 15
	});

	widgets.push({
		type: "colourpicker",
		name: "colorDefault",
		x: 240, y: 33, width: 20, height: 20,
		colour: storage.parkStorage.get("colorDefault"),
		onChange: (color: number) => {
			userActions.setWorkerColor("colorDefault", color);
		}
	});

	widgets.push({
		type: "colourpicker",
		name: "colorFixer",
		x: 267, y: 33, width: 20, height: 20,
		colour: storage.parkStorage.get("colorFixer"),
		onChange: (color: number) => {
			userActions.setWorkerColor("colorFixer", color);
		}
	});

	widgets.push({
		type: 'listview',
		name: 'workersListView',
		x: 5, y: 50, width: 290, height: 100,
		scrollbars: "vertical",
		showColumnHeaders: true,
		columns: [
			{ canSort: false, header: "{WHITE}Name", width: 223 },
			{ canSort: false, header: "{WHITE}", width: 18 },
			{ canSort: false, header: "{WHITE}", width: 18 },
			{ canSort: false, header: "{WHITE}", width: 18 }
		],
		items: [],
		onClick: (index, column) => {
			if (listData !== undefined && Array.isArray(listData[index]))
				userActions.workersListViewItemsEdit(column, Number(listData[index][4]));
		}
	});

	// buttons & tooltips for listview headers
	widgets.push({ type: "button", x: 229, y: 51, width: 18, height: 12, tooltip: "Inspect rides", image: 5115, onClick: () => { userActions.selectAll(0); } });
	widgets.push({ type: "button", x: 247, y: 51, width: 18, height: 12, tooltip: "Fix rides", image: 5116, onClick: () => { userActions.selectAll(1); } });
	widgets.push({ type: "button", x: 265, y: 51, width: 18, height: 12, tooltip: "Fix additions", image: 5113, onClick: () => { userActions.selectAll(2); } });

	widgets.push({
		type: "groupbox",
		x: 5, y: 155, width: 290, height: 50,
		text: "Settings",

	});

	widgets.push({
		type: "checkbox",
		x: 15, y: 170, width: 250, height: 15,
		isChecked: storage.sharedStorage.get("fixingRidesIsPriority"),
		text: "Fixing rides is priority (experimental)",
		tooltip: "If this is checked mechanic will walk pass vandalized additions even if mechanic is marked as addition fixer when heading for fixing the ride.",
		onChange: userActions.fixingRidesIsPriority
	});


	widgets.push({
		type: "checkbox",
		x: 15, y: 185, width: 250, height: 15,
		isChecked: storage.sharedStorage.get("enabled"),
		text: "Enabled",
		onChange: userActions.enabled
	});

	if (globals.isDebug) {

		widgets.push({
			type: "button",
			x: 5, y: 215, width: 290, height: 20,
			text: "log",
			onClick: () => {
				console.log(workers.data);
				console.log(occupiedTiles.data);
			}
		});

		widgets.push({
			type: "button",
			x: 5, y: 235, width: 290, height: 20,
			text: "clear",
			onClick: () => {
				workers.data = {};
				occupiedTiles.data = {};
				UpdateWorkersData();
			}
		});

		widgets.push({
			type: "button",
			x: 5, y: 255, width: 290, height: 20,
			text: "staffWindows.length",
			onClick: () => {
				console.log(Object.keys(staffWindows).length);
			}
		});

	}

	return widgets;
}

export const mainWin = {
	classification: "mechanic_manager_plus",
	win(): Window { return ui.getWindow(mainWin.classification) },
	update(): void {
		widgetUpdates.workersListView("workersListView");
	},
	open(): void {
		if (mainWin.win()) {
			mainWin.win().bringToFront();
			return;
		}
		let winDesc: WindowDesc = {
			classification: mainWin.classification,
			width: 300, height: globals.isDebug ? 280 : 215,
			title: "Mechanic manager +",
			widgets: Widgets(),
			onClose: userActions.exitWin
		};
		ui.openWindow(winDesc);
		mainWin.update();
	}
};