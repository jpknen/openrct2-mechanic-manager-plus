// conf.ts

import { StorageDefaults, Worker, OccupiedTile } from './classes';

export const storageDefaults: StorageDefaults = {
	sharedStorage: {
		"enabled": { path: "MechanicManagerPlus.pluginEnabled", value: true },
		"fixingRidesIsPriority": { path: "MechanicManagerPlus.fixingRidesIsPriority", value: false }
	},
	parkStorage: {
		"workers": { path: "MechanicManagerPlus.workers", value: {} as Record<number, Worker> },
		"occupiedTiles": { path: "MechanicManagerPlus.occupiedTiles", value: {} as Record<number, OccupiedTile> },
		"colorDefault": { path: "MechanicManagerPlus.colorDefault", value: 7 },
		"colorFixer": { path: "MechanicManagerPlus.colorFixer", value: 7 }
	}
}

// possible animations
export const animationsFixing: StaffAnimation[] = ["staffFix", "staffFix2", "staffFix3", "staffFixGround"];
export const animationsPhone: StaffAnimation[] = ["staffAnswerCall", "staffAnswerCall2"];

// possible temporary direction while repairing, key = element.edges
export const repairDirs: { [key in number]: Direction[] } = { 0: [0, 1, 2, 3], 1: [1, 2, 3], 2: [0, 2, 3], 3: [2, 3], 4: [0, 1, 3], 5: [1, 3], 6: [0, 3], 7: [3], 8: [0, 1, 2], 9: [1, 2], 10: [0, 2], 11: [2], 12: [0, 1], 13: [1], 14: [0] };

export const newordersList = { 1: [1, 0, 3, 2], 2: [2, 3, 0, 1] };

export const globals = { isDebug: false };