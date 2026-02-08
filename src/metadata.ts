
// Declare global constants injected by Vite
declare const __COMMIT_SHA__: string;
declare const __BUILD_TIME__: string;
declare const __DEPLOY_ID__: string;

export function injectBuildMetadata() {
    // Check for admin flag (localStorage 'debug_metadata' or query param 'admin_debug')
    const isAdmin = localStorage.getItem('debug_metadata') === 'true' ||
        new URLSearchParams(window.location.search).has('admin_debug');

    if (isAdmin) {
        const footer = document.createElement('div');
        footer.id = 'build-metadata-footer';
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.right = '0';
        footer.style.backgroundColor = 'rgba(0,0,0,0.7)';
        footer.style.color = '#fff';
        footer.style.fontSize = '10px';
        footer.style.padding = '4px 8px';
        footer.style.zIndex = '99999';
        footer.style.fontFamily = 'monospace';
        footer.style.pointerEvents = 'none';

        footer.innerText = `Build: ${__COMMIT_SHA__} | Time: ${__BUILD_TIME__} | Deploy: ${__DEPLOY_ID__}`;

        document.body.appendChild(footer);
        console.log(`[Build Metadata] SHA: ${__COMMIT_SHA__}, Time: ${__BUILD_TIME__}, Deploy: ${__DEPLOY_ID__}`);
    }
}
