// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content')

    try {
        // Get apps from main process
        const apps = await window.electronAPI.getApps()

        if (apps.length === 0) {
            contentDiv.innerHTML = `
                <div class="no-apps">
                    <h3>No applications found</h3>
                    <p>Make sure your React apps are in subdirectories with package.json files</p>
                </div>
            `
            return
        }

        // Create apps grid
        const appsGrid = document.createElement('div')
        appsGrid.className = 'apps-grid'

        apps.forEach(app => {
            const appCard = document.createElement('div')
            appCard.className = 'app-card'
            appCard.innerHTML = `
                <div class="app-title">${app.title}</div>
                <div class="app-description">${app.description || 'Click to launch'}</div>
            `

            // Add click handler
            appCard.addEventListener('click', async () => {
                try {
                    await window.electronAPI.launchApp(app)
                } catch (error) {
                    console.error('Failed to launch app:', error)
                }
            })

            appsGrid.appendChild(appCard)
        })

        contentDiv.innerHTML = ''
        contentDiv.appendChild(appsGrid)

    } catch (error) {
        console.error('Failed to load apps:', error)
        contentDiv.innerHTML = `
            <div class="no-apps">
                <h3>Error loading applications</h3>
                <p>${error.message}</p>
            </div>
        `
    }
}) 