export default {
  template: "#element-toolbar-template",
  props: {
    config: {
      type: Object,
    },
    canvas: {
      type: Object,
    },
    activeObjects: {
      default: {},
    },
  },
  data() {
    return {
      state: null, // 目前狀態
      undoStack: [], // 儲存之前的步驟
      redoStack: [], // 儲存後退的步驟
      undoDebounce: null,
      redoDebounce: null,
      isUndoRedoAction: false,
      currentElFill: null,
    };
  },
  watch: {
    activeObjects(obj) {
      if (
        obj.length === 1 &&
        obj[0].type !== "image" &&
        obj[0].type !== "group"
      ) {
        const fillColor = obj[0].get("fill");
        this.currentElFill = fillColor;
      } else {
        this.currentElFill = null;
      }
    },
  },
  computed: {
    hasActiveObj() {
      return this.activeObjects.length > 0;
    },
    hasMoreActiveObj() {
      return this.activeObjects.length > 1;
    },
    isGroup() {
      if (this.hasMoreActiveObj) {
        return false;
      } else {
        return this.activeObjects[0]?.type === "group";
      }
    },
    groupObj() {
      return {
        text: this.isGroup ? "UnGroup" : "Group",
        event: this.isGroup ? this.unGroupObjects : this.groupObjects,
      };
    },
    hasUndoStack() {
      return this.undoStack.length > 0;
    },
    hasRedoStack() {
      return this.redoStack.length > 0;
    },
  },
  created() {
    this.createDebouncedFunctions();
  },
  mounted() {
    setTimeout(() => {
      this.state = this.getCanvasJSON();
      this.canvas.on("object:added", (event) => {
        if (!this.isUndoRedoAction) {
          this.saveCanvasState();
        }
      });
      this.canvas.on("object:removed", (event) => {
        if (!this.isUndoRedoAction) {
          this.saveCanvasState();
        }
      });
    }, 200);
    this.canvas.on("object:modified", () => {
      this.saveCanvasState();
    });
  },
  beforeUnmount() {
    this.cancelDebouncedFunctions();
  },
  methods: {
    addCanvasObj(obj) {
      this.$emit("add-canvas-obj", obj);
    },
    updateLayerList() {
      this.$emit("update-layer-list");
    },
    updateActiveObject() {
      this.$emit("update-active-object");
    },
    restoreEditableProperties() {
      this.canvas.getObjects().forEach(function (obj) {
        console.log(obj);
        if (obj.type === "i-text" || obj.type === "textbox") {
          obj.set({
            editable: true, // 確保可編輯屬性被正確恢復
            selectable: true, // 確保物件可選中
          });
        }
      });
    },
    loadFromStateJson(state) {
      this.$emit("load-from-json", state, () => {
        this.updateLayerList();
        /* this.restoreEditableProperties(); */
        this.isUndoRedoAction = false; // 撤銷完成後，恢復事件偵測
      });
    },
    copyPasteElement() {
      const activeObject = this.canvas.getActiveObject();
      activeObject.clone((clonedObj) => {
        if (clonedObj.type === "activeSelection") {
          clonedObj.forEachObject((obj) => {
            obj.set({
              id: obj.type + "_" + Date.now(),
              name: obj.name ? obj.name + "-複製" : "複製",
              left: obj.left + 10,
              top: obj.top + 10,
            });
            this.addCanvasObj(obj);
          });
          // this should solve the unselectability
          clonedObj.setCoords();
        } else {
          clonedObj.set({
            id: clonedObj.type + "_" + Date.now(),
            name: clonedObj.name ? clonedObj.name + "-複製" : "複製",
            left: clonedObj.left + 10,
            top: clonedObj.top + 10,
          });
          this.addCanvasObj(clonedObj);
        }
      });
    },
    changeFill(e) {
      this.objectSet("fill",e.target.value )
    },
    objectSet(option,value){
      const activeObject = this.canvas.getActiveObject();
      activeObject.set(option, value);
      this.canvas.renderAll();
      this.canvas.fire('object:modified', { target: activeObject });
    },
    removeObj() {
      if (this.activeObjects.length > 0) {
        this.activeObjects.forEach((object) => {
          this.canvas.remove(object); // 刪除每個選中的物件
        });
        this.canvas.discardActiveObject(); // 清除選中狀態
        this.updateLayerList(); // 重新渲染畫布
      }
    },
    groupObjects() {
      // 獲取當前選中的對象
     const  group  = this.canvas.getActiveObject().toGroup();
     group.set({ 
      id: "group_" + Date.now(),
      name: '群組' });
      this.updateActiveObject();
    },
    unGroupObjects() {
      this.canvas.getActiveObject().toActiveSelection();
      this.updateActiveObject();
    },
    saveCanvasState() {
      this.undoStack.push(this.state);
      this.state = this.getCanvasJSON();
      this.redoStack = []; // 清空 redoStack 堆疊，因為新操作不可重做
    },
    getCanvasJSON(){
      return this.canvas.toJSON(["id","name","text"])
    },
    createDebouncedFunctions() {
      this.undoDebounce = _.debounce(this.undo, 200);
      this.redoDebounce = _.debounce(this.redo, 200);
    },
    cancelDebouncedFunctions() {
      this.undoDebounce.cancel();
      this.redoDebounce.cancel();
    },
    undo() {
      this.isUndoRedoAction = true;
      const lastState = this.undoStack.pop();
      this.redoStack.push(this.state); // 將當前狀態推回 redo 堆疊
      this.state = lastState;
      this.loadFromStateJson(lastState);
    },
    redo() {
      this.isUndoRedoAction = true;
      const nextState = this.redoStack.pop();
      this.undoStack.push(this.state); // 將當前狀態推回 undo 堆疊
      this.state = nextState;
      this.loadFromStateJson(nextState);
    },
    clickUndoBtn() {
      this.undoDebounce();
    },
    clickRedoBtn() {
      this.redoDebounce();
    },
  },
};
