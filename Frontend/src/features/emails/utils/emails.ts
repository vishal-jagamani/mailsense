export const isInputElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) {
        return false;
    }
    const tagName = target.tagName.toUpperCase();
    return (
        tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable || target.getAttribute('role') === 'textbox'
    );
};
