export class LoadingState {
    private static overlay: HTMLElement | null = null;
    private static activeProcesses = new Set<string>();

    /**
     * Toggles the global loading state for a specific process.
     * Uses a reference counter/set to handle concurrent loading states.
     */
    static set(processId: string, isLoading: boolean) {
        if (isLoading) {
            this.activeProcesses.add(processId);
        } else {
            this.activeProcesses.delete(processId);
        }

        this.render();
    }

    private static render() {
        const isLoading = this.activeProcesses.size > 0;
        const app = document.getElementById('app') || document.body;

        if (isLoading && !this.overlay) {
            // Create Overlay
            this.overlay = document.createElement('div');
            this.overlay.id = 'global-loading-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 22, 44, 0.7);
                backdrop-filter: blur(4px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;

            this.overlay.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner"></div>
                </div>
            `;

            document.body.appendChild(this.overlay);

            // Force reflow
            void this.overlay.offsetWidth;
            this.overlay.style.opacity = '1';

            // Disable interactions
            app.style.pointerEvents = 'none';
            app.setAttribute('aria-busy', 'true');

        } else if (!isLoading && this.overlay) {
            // Remove Overlay
            this.overlay.style.opacity = '0';

            // Wait for transition
            setTimeout(() => {
                if (this.overlay && this.activeProcesses.size === 0) {
                    this.overlay.remove();
                    this.overlay = null;
                    app.style.pointerEvents = '';
                    app.removeAttribute('aria-busy');
                }
            }, 200);
        }
    }
}
