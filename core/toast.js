// core/toast.js
// Toast notification system skeleton.
// Die echte Implementierung liegt derzeit noch in uiCore.js.

export const ToastType = {
    INFO: "info",
    SUCCESS: "success",
    ERROR: "error"
};

export function showToast(message, type = ToastType.INFO) {
    // Placeholder, damit spätere Importe nicht crashen.
    console.debug("[Toast]", type, message);
}
