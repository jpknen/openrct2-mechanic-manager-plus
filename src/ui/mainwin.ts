// mainwin.ts

import { globals } from "../conf";
import { storage } from "../storage"
import { occupiedTiles, workers, StaffWindow } from "../classes";
import { Release, UpdateWorkersData } from "../logic"

let listData: string[][] = []
let selectAll: boolean[] = [false, false, false];
let deleteSelected: boolean = false;

const userActions = {
	enabled(): void {
		let enabled = storage.sharedStorage.get("enabled");
		storage.sharedStorage.set("enabled", !enabled);
		for (let id in workers.data)
			Release(Number(id));
		storage.sharedStorage.set("enabledAVR", false);
	},
	deleteSelected(): void {
		deleteSelected = !deleteSelected;
		mainWin.win().findWidget<ButtonWidget>("deleteSelected").isPressed = deleteSelected;
	},
	new(): void {
		context.executeAction(
			"staffhire",
			{
				autoPosition: true,
				staffType: 1, // 0: handyman, 1: mechanic, 2: security, 3: entertainer
				entertainerType: 11,
				staffOrders: 3
			}
		);
	},
	setWorkerColor(name: string, color: number): void {
		for (var id in workers.data) {
			let staffMember: Staff = <Staff>map.getEntity(Number(id));
			if (name == "colorDefault" && !workers.data[id].isAdditionFixer)
				staffMember.colour = color;
			else if (name == "colorFixer" && workers.data[id].isAdditionFixer)
				staffMember.colour = color;
		}
	},
	workersListViewItemsEdit(column: number, id: number) {
		let staffMember: Staff = <Staff>map.getEntity(Number(id));
		// click on the name
		if (column == 0) {
			if (deleteSelected) {
				let staffMemberWin: Window = ui.getWindow(staffMember.name + id);
				if (staffMemberWin)
					staffMemberWin.close();
				context.executeAction("stafffire", { id: id });
			} else {
				const staffwin: StaffWindow = new StaffWindow(staffMember);
			}
		}
		// changeDuties
		else if (column == 1 || column == 2) {
			var newordersList = { 1: [1, 0, 3, 2], 2: [2, 3, 0, 1] };
			staffMember.orders = newordersList[column][staffMember.orders];
			mainWin.update();
		}
		// changeAdditionFixerStatus
		else if (column == 3) {
			var bool = !workers.data[id].isAdditionFixer;
			workers.data[id].isAdditionFixer = bool;
			staffMember.colour = bool ? storage.parkStorage.get("colorFixer") : storage.parkStorage.get("colorDefault");
			if (!bool && workers.data[id].isRepairing)
				Release(id);
			mainWin.update();
		}
		workers.save();
	},
	selectAll(index: number) {
		selectAll[index] = !selectAll[index];
		var newordersList = { 0: [1, 0, 3, 2], 1: [2, 3, 0, 1] };
		for (var id in workers.data) {
			let staffMember: Staff = <Staff>map.getEntity(Number(id));
			if (index == 2) {
				if (selectAll[2])
					workers.data[id].isAdditionFixer = true;
				else
					workers.data[id].isAdditionFixer = false;
				staffMember.colour = workers.data[id].isAdditionFixer ? storage.parkStorage.get("colorFixer") : storage.parkStorage.get("colorDefault");
				if (!workers.data[id].isAdditionFixer && workers.data[id].isRepairing)
					Release(Number(id));
			}
		}
		workers.save();
		mainWin.update();
	}
};

const widgetUpdates = {
	workersListView(widgetName: string): void {
		listData = [];
		for (var id in workers.data) {
			const worker: Staff = <Staff>map.getEntity(Number(id));
			listData.push([
				`{WHITE}${worker.name}`,
				worker.orders & 1 ? "{WHITE}✓" : "",
				worker.orders & 2 ? "{WHITE}✓" : "",
				workers.data[id].isAdditionFixer ? "{WHITE}✓" : " ",
				id
			]);
		}
		let widget = mainWin.win().findWidget(widgetName);
		if ("items" in widget)
			widget.items = listData;
	}
};

function Widgets(): WidgetDesc[] {

	const widgets: WidgetDesc[] = [];

	widgets.push({
		type: "checkbox",
		x: 5, y: 20, width: 60, height: 15,
		isChecked: storage.sharedStorage.get("enabled"),
		text: "Enabled",
		onChange: userActions.enabled
	});

	widgets.push({
		type: "button",
		x: 5, y: 40, width: 50, height: 15,
		text: "new mechanic",
		onClick: userActions.new
	});

	widgets.push({
		type: "button",
		x: 60, y: 40, width: 50, height: 15,
		name: "deleteSelected",
		isPressed: deleteSelected,
		text: "delete selected",
		onClick: userActions.deleteSelected
	});

	widgets.push({
		type: "colourpicker",
		name: "colorDefault",
		x: 137, y: 43, width: 20, height: 20,
		colour: storage.parkStorage.get("colorDefault"),
		onChange: function (color: number) {
			userActions.setWorkerColor("colorDefault", color);
		}
	});

	widgets.push({
		type: "colourpicker",
		name: "colorFixer",
		x: 167, y: 43, width: 20, height: 20,
		colour: storage.parkStorage.get("colorFixer"),
		onChange: function (color: number) {
			userActions.setWorkerColor("colorFixer", color);
		}
	});

	widgets.push({
		type: 'listview',
		name: 'workersListView',
		x: 5, y: 60, width: 190, height: 100,
		scrollbars: "vertical",
		showColumnHeaders: true,
		columns: [
			{ canSort: false, header: "{WHITE}Name", width: 123 },
			{ canSort: false, header: "{WHITE}IR", width: 18 },
			{ canSort: false, header: "{WHITE}FR", width: 18 },
			{ canSort: false, header: "{WHITE}FA", width: 18 }
		],
		items: [],
		onClick: function (index, column) {
			if (listData !== undefined && Array.isArray(listData[index]))
				userActions.workersListViewItemsEdit(column, Number(listData[index][4]));
		}
	});

	// buttons & tooltips for listview headers
	widgets.push({ type: "button", x: 123, y: 61, width: 20, height: 12, tooltip: "Inspect rides", text: "IR", onClick: function () { /*widgetUpdates.selectAll(0);*/ } });
	widgets.push({ type: "button", x: 143, y: 61, width: 20, height: 12, tooltip: "Fix rides", text: "FR", onClick: function () { /*widgetUpdates.selectAll(1);*/ } });
	widgets.push({ type: "button", x: 163, y: 61, width: 20, height: 12, tooltip: "Fix additions", text: "FA", onClick: function () { userActions.selectAll(2); } });

	if (globals.isDebug) {

		widgets.push({
			type: "button",
			x: 5, y: 165, width: 190, height: 20,
			text: "log",
			onClick: () => {
				console.log(workers.data);
				console.log(occupiedTiles.data);
			}
		});

		widgets.push({
			type: "button",
			x: 5, y: 185, width: 190, height: 20,
			text: "clear",
			onClick: () => {
				workers.data = {};
				occupiedTiles.data = {};
				UpdateWorkersData();
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
			width: 200, height: globals.isDebug ? 210 : 165,
			title: "Mechanic manager +",
			widgets: Widgets(),
			onClose() {
				deleteSelected = false;
			},
		};
		ui.openWindow(winDesc);
		mainWin.update();
	}
};