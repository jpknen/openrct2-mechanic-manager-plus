// conf.ts

import { StorageDefaults, Worker, OccupiedTile } from './classes';

export const storageDefaults: StorageDefaults = {
	sharedStorage: {
		//"enabledAVR": { path: "AnimatedVandalismRepairing.pluginEnabled", value: false },
		"enabled": { path: "MechanicManagerPlus.pluginEnabled", value: true },
	},
	parkStorage: {
		"workers": { path: "MechanicManagerPlus.workers", value: {} as Record<number, Worker> },
		"occupiedTiles": { path: "MechanicManagerPlus.occupiedTiles", value: {} as Record<number, OccupiedTile> },
		"colorDefault": { path: "MechanicManagerPlus.colorDefault", value: 7 },
		"colorFixer": { path: "MechanicManagerPlus.colorFixer", value: 28 }
	}
}

// possible animations
export const animations: StaffAnimation[] = ["staffFix", "staffFix2", "staffFix3", "staffFixGround"];

// possible temporary direction while repairing, key = element.edges
export const repairDirs: { [key in number]: Direction[] } = { 0: [0, 1, 2, 3], 1: [1, 2, 3], 2: [0, 2, 3], 3: [2, 3], 4: [0, 1, 3], 5: [1, 3], 6: [0, 3], 7: [3], 8: [0, 1, 2], 9: [1, 2], 10: [0, 2], 11: [2], 12: [0, 1], 13: [1], 14: [0] };

export const globals = { isDebug: false };