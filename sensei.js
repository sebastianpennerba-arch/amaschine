// sensei.js
// Legacy-Shim für App.js & alte API

import SenseiPackage from "./packages/sensei/index.js";

export function updateSenseiView(connected) {
    return SenseiPackage.render({ connected });
}
