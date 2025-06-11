# Smart Folders Flow

A React Flow application where you can create "smart folders" that execute Python functions and subscribe to each other through a visual node interface. Now featuring a stunning **3D Neural Network Visualization**! 🌐

## 🚀 **What It Does**

- **Smart Folders**: Visual nodes containing Python functions
- **Subscriptions**: Connect folders so they automatically execute when their "publisher" runs
- **Python**: Functions execute on a Python backend via FastAPI
- **Chain Reactions**: When one folder executes, it triggers all its subscribers with the output
- **3D Visualization**: See your workflow as an interactive 3D neural network on a globe! 🧠

## 🌐 **3D Neural Network Visualization**

Experience your Smart Folders workflow like never before with our immersive 3D visualization:

- **Globe Interface**: Nodes positioned on a 3D sphere like continents
- **Workflow Flow**: Source nodes start at the front, subscribers flow westward around the globe
- **Animated Connections**: Flowing particles show data movement between connected nodes
- **Interactive Controls**: Spin, tilt, and zoom the globe to explore your network
- **Smart Positioning**: Nodes cluster in realistic latitudes like Earth's landmasses
- **Real-time Updates**: Reflects your actual Smart Folders data and connections

### Running the 3D Visualization
```bash
cd neural-graph-3d
npm install
npm start
# Opens at http://localhost:3000
```

## 🏗️ **Architecture**

```
React Flow App (Frontend)  ←→  FastAPI Server (Python Backend)  ←→  3D Neural Viz
    Port 3000                     Port 8000                          Port 3000
```

## 🛠️ **Running the Application**

### 1. Start the Python API Server
```bash
cd python-api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the React App
```bash
cd smart-folders-flow
npm install
npm start
```

### 3. Start the 3D Visualization (Optional)
```bash
cd neural-graph-3d
npm install
npm start
```

### 4. Open Your Browser
- **React App**: http://localhost:3000
- **3D Visualization**: http://localhost:3000 (if running neural-graph-3d)
- **API Docs**: http://localhost:8000/docs

## 🎯 **How to Use**

1. **Add Smart Folders**: Double-click anywhere to create new folders
2. **Edit Functions**: Click on the Python code to edit functions
3. **Create Subscriptions**: Drag from the right handle (●) of one folder to the left handle (●) of another
4. **Execute**: Click "Execute" on any folder to run its function and trigger subscribers
5. **Watch the Magic**: Connected folders automatically execute in sequence!
6. **3D View**: Launch the neural visualization to see your workflow as a living 3D network

## 🐍 **Python Function Format**

All functions must be named `process` and take one argument:

```python
def process(input_text):
    return input_text.upper()
```

**Available Modules:**
- `math`, `string`, `re`, `json`
- `datetime`, `random`, `collections`, `itertools`

## 📁 **Project Structure**

```
boost-xypy/
├── smart-folders-flow/     # React app
│   ├── src/
│   │   ├── App.tsx         # Main flow interface
│   │   ├── store.ts        # Zustand state management
│   │   ├── SmartFolderNode.tsx  # Node component
│   │   └── App.css         # Styling
│   └── package.json
├── neural-graph-3d/        # 3D Neural Network Visualization
│   ├── src/
│   │   ├── components/     # 3D React components
│   │   │   ├── NeuralNetwork3D.tsx    # Main 3D canvas
│   │   │   ├── NeuronNode.tsx         # 3D node spheres
│   │   │   └── NeuralConnection.tsx   # Animated connections
│   │   ├── utils/
│   │   │   └── sphereLayout.ts        # Globe positioning logic
│   │   └── types.ts        # TypeScript interfaces
│   └── package.json
├── python-api/             # FastAPI backend
│   ├── main.py             # FastAPI app
│   ├── executor.py         # Safe Python execution
│   └── requirements.txt
└── README.md
```

## 🎨 **Example Use Cases**

**Text Processing Chain:**
1. **Folder 1**: `def process(input_text): return input_text.upper()`
2. **Folder 2**: `def process(input_text): return input_text.replace(' ', '_')`
3. **Folder 3**: `def process(input_text): return f"FINAL: {input_text}"`

**Data Pipeline:**
1. **Extract**: Parse JSON data
2. **Transform**: Apply mathematical operations
3. **Format**: Create final output

Connect them in sequence and watch the data flow through your pipeline! Then visualize it in 3D to see your data flowing around the globe like neural pathways! 🌍⚡

## Custom Nodes

The Smart Folders system includes several specialized node types:

### IP Webcam Recorder Node 🎥
Record IP camera streams into 1-minute videos with authentication support.

**Features:**
- Connection testing with status indicators
- Configurable recording duration (default 60 seconds)
- Quality settings (low/medium/high)
- Authentication support (username/password)
- Toggle-able Python function view (hidden by default)
- Automatic downstream processing

**Supported Camera Formats:**
- Generic HTTP streams: `http://IP:PORT/video`
- MJPEG streams: `http://IP:PORT/mjpeg.cgi`
- RTSP streams: `rtsp://IP:PORT/stream`
- Axis cameras: `http://IP/mjpg/video.mjpg`
- With authentication: `http://username:password@IP:PORT/video`

**Prerequisites:**
- `ffmpeg` installed and available in PATH
- IP camera accessible on network
- Python `requests` library (included in requirements)

**Usage:**
1. Add IP Webcam Node to your flow
2. Configure camera settings (IP, port, credentials)
3. Test connection (green indicator = success)
4. Set recording duration and quality
5. Click "Start Recording" to capture video
6. Recorded file path automatically passed to downstream nodes

**Testing:**
Run the included test script to verify your camera setup:
```bash
python ip_webcam.py
```

---

**Built with**: React Flow, FastAPI, RestrictedPython, Zustand, TypeScript, Three.js, React Three Fiber
