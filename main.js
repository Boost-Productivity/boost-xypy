const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process');

// Store references to app windows
const appWindows = new Map()

let pythonProcess;

function createLauncherWindow() {
    const launcher = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hiddenInset',
        title: 'Boost Desktop Apps'
    })

    launcher.loadFile('launcher.html')
    return launcher
}

function createAppWindow(appConfig) {
    // Check if app window already exists
    if (appWindows.has(appConfig.name)) {
        const existingWindow = appWindows.get(appConfig.name)
        if (!existingWindow.isDestroyed()) {
            existingWindow.focus()
            return existingWindow
        }
    }

    const appWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: appConfig.title || appConfig.name
    })

    // Load the app's dev server or built files
    if (appConfig.devPort) {
        appWindow.loadURL(`http://localhost:${appConfig.devPort}`)
    } else if (appConfig.buildPath) {
        appWindow.loadFile(appConfig.buildPath)
    }

    // Clean up window reference when closed
    appWindow.on('closed', () => {
        appWindows.delete(appConfig.name)
    })

    appWindows.set(appConfig.name, appWindow)
    return appWindow
}

// Auto-discover apps by looking for package.json files
function discoverApps() {
    const apps = []
    const directories = fs.readdirSync('.', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.') && !name.startsWith('node_modules'))

    for (const dir of directories) {
        const packagePath = path.join(dir, 'package.json')
        if (fs.existsSync(packagePath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
                if (packageJson.scripts && packageJson.scripts.start) {
                    apps.push({
                        name: dir,
                        title: packageJson.name || dir,
                        description: packageJson.description || '',
                        devPort: getDevPort(packageJson.scripts.start),
                        buildPath: path.join(dir, 'build', 'index.html')
                    })
                }
            } catch (err) {
                console.log(`Could not read package.json in ${dir}:`, err.message)
            }
        }
    }

    return apps
}

function getDevPort(startScript) {
    // Extract port from React scripts (default 3000) or other common patterns
    if (startScript.includes('react-scripts')) return 3000
    const portMatch = startScript.match(/--port[=\s]+(\d+)/)
    return portMatch ? parseInt(portMatch[1]) : null
}

// IPC handlers for communication with renderer
const { ipcMain } = require('electron')

ipcMain.handle('get-apps', () => {
    return discoverApps()
})

ipcMain.handle('launch-app', (event, appConfig) => {
    createAppWindow(appConfig)
})

// App lifecycle
app.whenReady().then(() => {
    // Start the Python server
    pythonProcess = spawn('python3', ['python-api/main.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });
    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });

    createLauncherWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createLauncherWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (pythonProcess) pythonProcess.kill();
    if (process.platform !== 'darwin') {
        app.quit()
    }
}) 