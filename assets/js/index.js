import Layer from "../../components/layer.js";
import Toolbar from "../../components/toolbar.js";
import ElementToolbar from "../../components/elementToolbar.js";
import AItype from "../../components/aiType.js";
const { createApp } = Vue;
let canvas = null;
createApp({
  data() {
    return {
      canvas: null,
      layerList: [],
      activeObjects: [],
      canvasUrl:"",
      isLoading:false
    };
  },
  components: {
    vLayer: Layer,
    vToolbar: Toolbar,
    vElementToolbar: ElementToolbar,
    vAiType: AItype,
  },
  mounted() {
    this.$nextTick(() => {
      const editCanvasEl = this.$refs.editCanvas;
      const canvasEl = this.$refs.canvas; // 使用 Vue 的 ref 確保正確獲取 DOM 元素
      canvas = new fabric.Canvas(canvasEl, {
        width: canvasEl.clientWidth,
        height: canvasEl.clientHeight,
        backgroundColor: "transparent",
        selection: true,
        preserveObjectStacking: true,
      });
      this.canvas = canvas;
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // 更新元素的寬高
          this.canvas.setWidth(entry.contentRect.width);
          this.canvas.setHeight(entry.contentRect.height);
        }
      });

      // 開始監聽元素的變動
      this.resizeObserver.observe(editCanvasEl);
      this.init();
    });
    window.addEventListener("resize", this.resizeCanvas);
  },
  beforeUnmount() {
    // 在元件卸載前取消監聽
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },
  methods: {
    init() {
      canvas.on("selection:created", this.updateActiveObject);
      canvas.on("selection:updated", this.updateActiveObject);
      canvas.on("selection:cleared", this.updateActiveObject);
    },
    updateLayerList() {
      this.canvas.renderAll();
      this.layerList = canvas.getObjects().reverse();
    },
    addObjInCanvasAdd(obj) {
      canvas.add(obj);
      this.canvas.setActiveObject(obj);
      this.updateLayerList();
    },
    updateActiveObject() {
      this.updateLayerList();
      this.activeObjects = canvas.getActiveObjects();
      this.layerList.forEach((x) => {
        x.isSelect = this.activeObjects.find((o) => o.id === x.id)
          ? true
          : false;
      });
    },
    loadFromJson(state, onChange) {
      canvas.loadFromJSON(state, canvas.renderAll.bind(canvas), onChange);
    },
    calculateBoundingBox(canvas) {
      const objects = canvas.getObjects();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      objects.forEach(function (obj) {
        const bound = obj.getBoundingRect(true);  // true 表示包括旋轉和縮放
        minX = Math.min(minX, bound.left);
        minY = Math.min(minY, bound.top);
        maxX = Math.max(maxX, bound.left + bound.width);
        maxY = Math.max(maxY, bound.top + bound.height);
      });

      return { minX, minY, maxX, maxY };
    },
    getCanvasImageUrl() {
      const bbox = this.calculateBoundingBox(canvas);

      // 使用 toDataURL 生成裁剪後的圖片，只包含物件
      const dataURL = canvas.toDataURL({
        format: 'png',
        left: bbox.minX,  // 設置導出的區域
        top: bbox.minY,
        width: bbox.maxX - bbox.minX,
        height: bbox.maxY - bbox.minY,
        multiplier: 2  // 提高解析度
      });
      this.canvasUrl = dataURL
    },
    clearCanvasImageUrl(){
      this.canvasUrl = ""
    },
    formLoading(){
      this.isLoading = true
    },
    formLoaded(){
      this.isLoading = false
    }
  },
}).mount("#app");
