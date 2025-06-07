# Smart Folders Flow

A React Flow application where you can create "smart folders" that execute Python functions and subscribe to each other through a visual node interface.

## 🚀 **What It Does**

- **Smart Folders**: Visual nodes containing Python functions
- **Subscriptions**: Connect folders so they automatically execute when their "publisher" runs
- **Python**: Functions execute on a Python backend via FastAPI
- **Chain Reactions**: When one folder executes, it triggers all its subscribers with the output

## 🏗️ **Architecture**

```
React Flow App (Frontend)  ←→  FastAPI Server (Python Backend)
    Port 3000                     Port 8000
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

### 3. Open Your Browser
- **React App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

## 🎯 **How to Use**

1. **Add Smart Folders**: Double-click anywhere to create new folders
2. **Edit Functions**: Click on the Python code to edit functions
3. **Create Subscriptions**: Drag from the right handle (●) of one folder to the left handle (●) of another
4. **Execute**: Click "Execute" on any folder to run its function and trigger subscribers
5. **Watch the Magic**: Connected folders automatically execute in sequence!

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

Connect them in sequence and watch the data flow through your pipeline!

---

**Built with**: React Flow, FastAPI, RestrictedPython, Zustand, TypeScript 
