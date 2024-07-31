// classes.ts

import { storage } from "./storage";

export enum StorageType { sharedStorage = "sharedStorage", parkStorage = "parkStorage" }

export interface StorageDefaults {
	[storageType: string]: { [memberName: string]: { path: string; value: any } };
}

export class Worker {
	public isAdditionFixer: boolean = true;
	public isRepairing: boolean = false;
	public fixedAdditions: number = 0;
	public animationOffset: number = 0;
	public lastAnimationIndex: number = 0;
	public orgDirection: Direction = 0;
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

	private window: Window | null = null;
	private intervalTick: IDisposable | null = null;

	private staffMember: Staff;

	private winName: string;
	private winTitle: string;

	constructor(staffMember: Staff) {
		this.winName = staffMember.name + staffMember.id;
		this.winTitle = staffMember.name;
		this.staffMember = staffMember;

		this.createWindow();
	}

	private createWindow() {
		this.window = ui.getWindow(this.winName);

		if (this.window) {
			this.window.bringToFront();
			return;
		}

		let winDesc: WindowDesc = {
			classification: this.winName,
			width: 150, height: 150,
			title: this.winTitle,
			widgets: [
				{
					type: "viewport",
					name: "viewport",
					x: 5, y: 20, width: 140, height: 115,
				},
				{
					type: "label",
					name: "status",
					textAlign: "centred",
					x: 0, y: 137, width: 150, height: 15,
					text: "walking"
				}
			], onClose: () => {
				this.dispose();
			},
		};

		ui.openWindow(winDesc);

		this.intervalTick = context.subscribe("interval.tick", () => {
			ui.getWindow(this.winName).findWidget<ViewportWidget>("viewport").viewport.moveTo(this.staffMember);
		});
	}

	private dispose() {
		this.intervalTick?.dispose();
		this.intervalTick = null;
	}

}