import { useEffect } from 'react';

/**
 * Toggles a class on document.body for as long as the calling page is mounted,
 * so page-specific SCSS can target `body.<className>` to override the shared
 * ant-layout/Content chrome (background, height, overflow) without touching
 * LayoutContainer itself. Reusable across any page that needs this.
 */
export function usePageBodyClass(className: string, isActive: boolean = true) {
    useEffect(() => {
        const { body } = document;
        if (isActive) {
            body.classList.add(className);
        }
        return () => {
            body.classList.remove(className);
        };
    }, [className, isActive]);
}
