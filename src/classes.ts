// classes.ts

import { storage } from "./storage";
import { newordersList } from "./conf"
import { mainWin } from "./ui/mainwin";
import { Release } from "./logic";

export enum StorageType { sharedStorage = "sharedStorage", parkStorage = "parkStorage" }

export interface StorageDefaults {
	[storageType: string]: { [memberName: string]: { path: string; value: any } };
}

export enum StatusFA {
	None,
	Fixing
}

export enum StatusFR {
	None,
	Answering,
	Heading,
	//Inspecting,
	Fixing
}

export class Worker {
	public isAdditionFixer: boolean = true;
	public fixedAdditions: number = 0;
	public animationOffset: number = 0;
	public lastAnimationIndex: number = 0;
	public orgDirection: Direction = 0;
	public statusFA: StatusFA = StatusFA.None;
	public statusFR: StatusFR = StatusFR.None;
}

export class OccupiedTile {
	public x: number = 0;
	public y: number = 0;
	public z: number = 0;
}

export class StorageHandler<T> {

	private storageName: string;
	private storageType: StorageType;

	constructor(storageName: string, storageType: StorageType, private factory: () => T) { this.storageName = storageName; this.storageType = storageType; }

	public get data(): Record<number, T> {
		return storage[this.storageType].get(this.storageName);
	}

	public new(id: number): void {
		if (!this.exist(id))
			this.data[id] = Object.assign({}, this.factory());
	}

	public delete(id: number): void {
		if (this.exist(id))
			delete this.data[id];
	}

	public exist(id: number): boolean {
		return id in this.data;
	}

	public save(): void {
		this.data = this.data;
	}

	public set data(newdata: Record<number, T>) {
		storage[this.storageType].set(this.storageName, newdata);
	}

}

export const workers = new StorageHandler<Worker>("workers", StorageType.parkStorage, () => new Worker());
export const occupiedTiles = new StorageHandler<OccupiedTile>("occupiedTiles", StorageType.parkStorage, () => new OccupiedTile());

export class StaffWindow {

	private intervalTick: IDisposable | null = null;
	private staffMember: Staff;
	private winName: string;

	public window: Window | null = null;

	constructor(staffMember: Staff) {
		this.winName = staffMember.name + staffMember.id;
		this.staffMember = staffMember;

		this.createWindow();
		this.updateWin();
	}

	private createWindow() {

		this.window = ui.getWindow(this.winName);

		if (this.window) {
			this.window.bringToFront();
			return;
		}

		const winDesc: WindowDesc = {
			classification: this.winName,
			width: 150, height: 150,
			title: this.staffMember.name,
			//colours: [1, 4],
			tabs: [
				{
					image: {
						frameBase: 11442,
						frameCount: 2,
						frameDuration: 8,
						//frameSkip: 4, colors: [7, null, 18] 
						offset: { x: 16, y: 21 }
					},
					widgets: [
						{
							type: "viewport",
							name: "viewport",
							x: 3, y: 48, width: 123, height: 90,
						},
						{
							type: "label",
							name: "status",
							textAlign: "centred",
							x: 0, y: 137, width: 125, height: 15
						},
						{
							type: "label",
							name: "dest",
							textAlign: "centred",
							x: 0, y: 157, width: 125, height: 15
						},
						{
							type: "button",
							name: "pickup",
							x: 126, y: 45, width: 23, height: 24,
							image: 5174,
							isDisabled: true
						},
						{
							type: "button",
							name: "name",
							x: 126, y: 45 + 24, width: 23, height: 24,
							image: 5168,
							onClick: () => {
								ui.showTextInput({
									title: "Staff member name",
									description: "Enter new name for this member of staff:",
									initialValue: this.staffMember.name,
									maxLength: 50,
									callback: (newName: string) => {
										if (newName == this.staffMember.name)
											return;
										context.executeAction("staffsetname", { id: Number(this.staffMember.id), name: newName });
									}
								});
							},
						},
						{
							type: "button",
							name: "locate",
							x: 126, y: 45 + (24 * 2), width: 23, height: 24,
							image: 5167,
							onClick: () => {
								ui.mainViewport.scrollTo(this.staffMember);
							}
						},
						{
							type: "button",
							name: "delete",
							x: 126, y: 45 + (24 * 3), width: 23, height: 24,
							image: 5165,
							onClick: () => {
								context.executeAction("stafffire", { id: this.staffMember.id });
							},
						}
					],
				},
				{
					image: {
						frameBase: 5319,
						frameCount: 4,
						frameDuration: 4,
					},
					widgets: [
						// Inpect Rides
						{
							type: "custom",
							x: 15, y: 48, width: 15, height: 15,
							onDraw: (d) => { d.image(5115, 0, 0); }
						},
						{
							type: "label",
							text: "Inpect Rides",
							x: 30, y: 48, width: 100, height: 15,
						},
						{
							type: "checkbox",
							name: "inspectRides",
							x: 5, y: 48, width: 190, height: 15,
							onChange: () => {
								this.staffMember.orders = newordersList[1][this.staffMember.orders];
								mainWin.update();
							}
						},
						// Fix Rides
						{
							type: "custom",
							x: 15, y: 48 + (15), width: 15, height: 15,
							onDraw: (d) => { d.image(5116, 0, 0); }
						},
						{
							type: "label",
							text: "Fix Rides",
							x: 30, y: 48 + (15), width: 100, height: 15,
						},
						{
							type: "checkbox",
							name: "fixRides",
							x: 5, y: 48 + (15), width: 190, height: 15,
							onChange: () => {
								this.staffMember.orders = newordersList[2][this.staffMember.orders];
								mainWin.update();
							}
						},
						// Fix Additions
						{
							type: "custom",
							x: 15, y: 48 + (15 * 2), width: 15, height: 15,
							onDraw: (d) => { d.image(5113, 0, 0); }
						},
						{
							type: "label",
							text: "Fix Additions",
							x: 30, y: 48 + (15 * 2), width: 100, height: 15,
						},
						{
							type: "checkbox",
							name: "fixAdditions",
							x: 5, y: 48 + (15 * 2), width: 190, height: 15,
							onChange: () => {
								const id: number = Number(this.staffMember.id)
								let bool = !workers.data[id].isAdditionFixer;
								workers.data[id].isAdditionFixer = bool;
								this.staffMember.colour = bool ? storage.parkStorage.get("colorFixer") : storage.parkStorage.get("colorDefault");
								if (!bool && workers.data[id].statusFA == StatusFA.Fixing)
									Release(id);
								mainWin.update();
								workers.save();
							}
						},
					],
				},
				{
					image: {
						frameBase: 5277,
						frameCount: 4,
						frameDuration: 4,
					},
					widgets: [
						{
							type: "label",
							name: "fixedAdditions",
							x: 5, y: 48, width: 145, height: 10,
						},
						{
							type: "label",
							text: `Id: {BLACK}${this.staffMember.id}`,
							x: 5, y: 48 + (10), width: 145, height: 10,
						},
						{
							type: "label",
							name: "dir",
							x: 5, y: 48 + (10 * 2), width: 145, height: 10,
						},
						{
							type: "label",
							name: "pos",
							x: 5, y: 48 + (10 * 3), width: 145, height: 10,
						},
						{
							type: "label",
							name: "dest",
							x: 5, y: 48 + (10 * 4), width: 145, height: 10,
						}
					]
				}
			], onClose: () => {
				this.disposeWin();
				delete staffWindows[Number(this.staffMember.id)];
			}, onUpdate: () => {
				if (this.window) {
					this.window.title = this.staffMember.name;
					if (this.window.tabIndex == 1) {
						this.window.findWidget<CheckboxWidget>("inspectRides").isChecked = this.staffMember.orders & 1 ? true : false;
						this.window.findWidget<CheckboxWidget>("fixRides").isChecked = this.staffMember.orders & 2 ? true : false;
						this.window.findWidget<CheckboxWidget>("fixAdditions").isChecked = workers.data[Number(this.staffMember.id)].isAdditionFixer;
					}
					if (this.window.tabIndex == 2) {
						this.window.findWidget<LabelWidget>("fixedAdditions").text = `Fixed additions: {BLACK}${workers.data[Number(this.staffMember.id)].fixedAdditions}`;
						this.window.findWidget<LabelWidget>("dir").text = `Dir: {BLACK}${this.staffMember.direction}`;
						this.window.findWidget<LabelWidget>("pos").text = `Pos: {BLACK}[x: ${this.staffMember.x / 32}, y: ${this.staffMember.y / 32}]`;
						this.window.findWidget<LabelWidget>("dest").text = `Dest: {BLACK}[x: ${this.staffMember.destination.x / 32}, y: ${this.staffMember.destination.y / 32}]`;
					}
				}
			}
		}

		this.window = ui.openWindow(winDesc);

	}

	private updateWin() {
		this.intervalTick = context.subscribe("interval.tick", () => {

			if (this.window && this.window.tabIndex == 0) {

				let viewPort: ViewportWidget = this.window.findWidget<ViewportWidget>("viewport");

				if (viewPort)
					viewPort.viewport.moveTo(this.staffMember);

				let statusFA: StatusFA = workers.data[Number(this.staffMember.id)].statusFA;
				let statusFR: StatusFR = workers.data[Number(this.staffMember.id)].statusFR;

				let status: string = "";

				if (statusFA == StatusFA.None && statusFR == StatusFR.None)
					status = "Walking";

				if (statusFR == StatusFR.Answering)
					status = "Answering radio call";

				if (statusFR == StatusFR.Heading)
					status = "Heading for ride";

				if (statusFA == StatusFA.Fixing)
					status = "Fixing addition";

				//if (statusFR == StatusFR.Inspecting)
				//status = "Inspecting ride";

				if (statusFR == StatusFR.Fixing)
					status = "Fixing ride";

				let statusText: LabelWidget = this.window.findWidget<LabelWidget>("status");

				if (statusText)
					statusText.text = `{BLACK}${status}`;

			}

		});
	}

	public disposeWin() {
		this.intervalTick?.dispose();
		this.intervalTick = null;
	}

}

export let staffWindows: { [key: number]: StaffWindow } = {};