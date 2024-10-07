export default {
  template: "#toolbar-template",
  props: {
    config: {
      type: Object,
    },
    canvas: {
      type: Object,
    },
  },
  data() {
    return {
      type: {
        none: 0,
        shape: 1,
        image: 2,
        text: 3,
        line: 4,
        layer: 5,
        aiType:6
      },
      currentType: 0,
      defaultConfig: {
        isEnabledDownLoad: true,
        isEnabledShape: true,
        isEnabledText: true,
        isEnabledImg: true,
        isEnabledUpdateImg: true,
      },
      imageList: [
        {
          title: "sofa",
          imgUrl: "./image/sofa.png",
          left: 50,
          top: 50,
        },
        {
          title: "tree-sofa",
          imgUrl: "./image/tree-sofa.png",
          left: 200,
          top: 100,
        },
      ],
      editCanvasEl: null,
      isOpenOption: false,
    };
  },
  created() {},
  mounted() {
    this.init();
    this.editCanvasEl = document.getElementById("edit-canvas");
    fabric.Object.prototype.set({
      left: 300,
      top: 150,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      isSelect: true,
    });
    fabric.Object.prototype.setInitShape = function () {
      // 這邊 this 為使用的物件本身
      this.fill = "#D3D3D3";
    };
  },
  computed: {
    evenImageList(){
      return this.imageList.filter((item,index)=> index % 2 === 0)
    },
    oddImageList(){
      return this.imageList.filter((item,index)=> index % 2 !== 0)
    }
  },
  methods: {
    init() {
      this.imageList.forEach((element) => {
        this.addImagInCanvas(element);
      });
    },
    addCanvasObj(obj) {
      this.$emit("add-canvas-obj", obj);
    },
    uploadImages(event) {
      const files = event.target.files;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        // 讀取圖片完成後
        reader.onload = (e) => {
          const dataUrl = e.target.result; // 圖片的 Base64 URL
          const data = {
            title: file.name,
            imgUrl:dataUrl // 可選：存儲圖片URL
          }
          // 將圖片信息添加到圖片列表
          this.imageList.push(data);
          this.addImagInCanvas(data)
        };

        reader.readAsDataURL(file);  // 讀取圖片為 Data URL
      }
    },
    getImgList(){
      //可以在這邊取得預設圖片
    },
    addImagInCanvas(data) {
      fabric.Image.fromURL(data.imgUrl, (imgInstance) => {
        //i create an extra const for to change some image properties
        imgInstance.set({
          id: "image_" + Date.now(),
          scaleX: 0.5,
          scaleY: 0.5,
          name: data.title ? data.title : "圖層",
        });
        this.addCanvasObj(imgInstance);
      });
    },
    addCircleInCanvas() {
      const circle = new fabric.Circle({
        id: "circle_" + Date.now(),
        name: "圖層",
        radius: 50,
      });
      circle.setInitShape()
      this.addCanvasObj(circle);
    },
    addRectInCanvas() {
      const rect = new fabric.Rect({
        id: "rect_" + Date.now(),
        name: "圖層",
        width: 200,
        height: 200,
      });
      rect.setInitShape()

      this.addCanvasObj(rect);
    },
    addTriangleInCanvas() {
      const rect = new fabric.Triangle({
        id: "triangle_" + Date.now(),
        name: "圖層",
        width: 200,
        height: 200,
      });
      rect.setInitShape()

      this.addCanvasObj(rect);
    },
    addLineInCanvas() {
      const line = new fabric.Line([50, 100, 200, 200], {
        id: "line_" + Date.now(),
        name: "圖層",
        stroke: "#000000",
        strokeWidth: 5,
      });

      this.addCanvasObj(line);
    },
    addTextInCanvas() {
      const text = new fabric.Textbox("Hello", {
        id: "textbox_" + Date.now(),
        name: "文字",
        fontFamily: "Roboto Regular",
        fontSize: 30,
        fill: "#000000",
        breakWords: true,

      });
      this.addCanvasObj(text);
    /*   document.fonts.load('10pt "Roboto Regular"').then(() => {
        // 渲染畫布，確保字體應用
      }); */
    },
    saveCanvas() {
      this.download(this.canvas.toDataURL(), "test.png");
    },
    download(url, name) {
      const a = document.createElement("a");
      (a.href = url), (a.download = name);
      a.click();
      a.remove();
    },
    openOption(type) {
      if (window.innerWidth > 768 && !this.isOpenOption) {
        this.canvas.setWidth(this.editCanvasEl.clientWidth - 350);
        this.editCanvasEl.width = this.editCanvasEl.clientWidth - 350;
        this.isOpenOption = true;
      } else {
        if (this.currentType === type) {
          this.isOpenOption = !this.isOpenOption;
        } else {
          this.isOpenOption = true;
        }
      }
      this.currentType = type;
    },
    closeOption() {
      if (window.innerWidth > 768) {
        this.canvas.setWidth(this.editCanvasEl.clientWidth + 350);
        this.editCanvasEl.width = this.editCanvasEl.clientWidth + 350;
      }
      this.isOpenOption = false;
      this.currentType = this.type.none;
    },
  },
};
