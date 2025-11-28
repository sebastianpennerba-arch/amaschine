// packages/creativeLibrary/index.js
// Creative Library Package – public API

const CreativeLibraryPackage = {
    init(options = {}) {
        console.debug("[CreativeLibraryPackage] init()", options);
    },

    render(options = {}) {
        console.debug("[CreativeLibraryPackage] render()", options);
        // Rendering erfolgt später über creativeLibrary.render.js
    },

    update(options = {}) {
        console.debug("[CreativeLibraryPackage] update()", options);
    },

    destroy() {
        console.debug("[CreativeLibraryPackage] destroy()");
    }
};

export default CreativeLibraryPackage;
