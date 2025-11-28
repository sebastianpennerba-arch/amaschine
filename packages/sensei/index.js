// packages/sensei/index.js
// Sensei Strategy Package – public API

const SenseiPackage = {
    init(options = {}) {
        console.debug("[SenseiPackage] init()", options);
    },

    render(options = {}) {
        console.debug("[SenseiPackage] render()", options);
    },

    update(options = {}) {
        console.debug("[SenseiPackage] update()", options);
    },

    destroy() {
        console.debug("[SenseiPackage] destroy()");
    }
};

export default SenseiPackage;
