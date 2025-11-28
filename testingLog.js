// testingLog.js
// Legacy-Shim, kompatibel zu app.js

import TestingPackage from "./packages/testing/index.js";

export async function updateTestingLogView(connected) {
    return TestingPackage.render({ connected });
}

export function initTestingLog() {
    TestingPackage.init();
}
