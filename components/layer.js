

export default {
    template: "#layer-template",
    props: {
        itemList: {
            type: Array,
            default: () => []
        },
        canvas: {
            type: Object
        },
    },
    data() {
        return {
            draggedItemIndex: null, // 正在拖動的項目的索引
            touchStartY: 0, // 觸摸開始時的 Y 位置
            touchStartY: 0, // 觸摸開始時的 Y 位置
            itemPositions: [] // 記錄每個項目的 Y 坐標
        }
    },
    methods: {
        changeType(str) {
            return str[0].toUpperCase() + str.slice(1);
        },
        reversedIndex(index) {
            return this.itemList.length - 1 - index;
        },
        dragStart(index, event) {
            this.itemList.forEach((item, itemIndex) => {
                item.isSelect = itemIndex === index
            })
            event.dataTransfer.effectAllowed = 'move';
            this.draggedItemIndex = index;
        },
        dragOver(targetIndex) {
            // 只在清單內部交換項目，還未渲染到畫布
            if (this.draggedItemIndex !== targetIndex) {
                this.swapItems(this.draggedItemIndex, targetIndex);
                this.draggedItemIndex = targetIndex;  // 更新拖動索引
            }
        },
        drop() {
            this.updateCanvasOrder()
        },
        // 手機端的觸摸開始事件
        touchStart(index, event) {
            this.itemList.forEach((item, itemIndex) => {
                item.isSelect = itemIndex === index
            })
            this.draggedItemIndex = index; // 記錄觸摸的開始項目索引
            this.touchStartY = event.touches[0].clientY; // 記錄初始觸摸的 Y 位置

            // 記錄每個項目的 Y 位置，方便後續比較手指移動
            this.itemPositions = Array.from(this.$refs.layerList.children).map((item) => item.getBoundingClientRect().top);
            event.stopPropagation(); // 阻止事件冒泡
        },
        // 手機端的觸摸移動事件
        touchMove(index, event) {
            const currentTouchY = event.touches[0].clientY; // 當前觸摸的 Y 位置

            // 遍歷所有項目的位置，找到手指跨越的項目
            for (let i = 0; i < this.itemPositions.length; i++) {
                const isWithinItem = currentTouchY > this.itemPositions[i] && currentTouchY < this.itemPositions[i + 1];

                // 處理最下方項目的邊界條件
                const isAtLastItem = currentTouchY >= this.itemPositions[this.itemPositions.length - 1];

                if (isWithinItem || (isAtLastItem && i === this.itemPositions.length - 1)) {
                    if (i !== this.draggedItemIndex) {
                        this.swapItems(this.draggedItemIndex, i);
                        this.draggedItemIndex = i;
                    }
                    break; // 一旦交換，結束循環
                }
            }
        },

        // 手機端的觸摸結束事件
        touchEnd(event) {
            this.updateCanvasOrder(); // 更新畫布上的順序
            this.draggedItemIndex = null; // 重置拖曳的項目索引
            this.lastTouchIndex = null; // 重置最後觸摸的圖層索引
        },

        // 交換兩個項目的位置
        swapItems(fromIndex, toIndex) {
            const draggedItem = this.itemList[fromIndex];
            this.itemList.splice(fromIndex, 1); // 刪除當前項目
            this.itemList.splice(toIndex, 0, draggedItem); // 插入到新的位置
        },
        updateCanvasOrder() {
            // 重新排列 itemList 的順序
            // 根據 itemList 中的順序更新 Fabric.js 畫布物件順序
            this.itemList.forEach((item, index) => {
                this.canvas.moveTo(item, this.reversedIndex(index));
            });
            this.canvas.renderAll();  // 重新渲染畫布
        },
        toggleVisibility(item) {
            item.set('visible', !item.visible);
            item.set('hasControls', !item.hasControls);
            item.set('hasBorders', !item.hasBorders);
            this.$emit('update-layer-list');
        },
        selectLayer(id) {
            // 通過 layerList 查找對應的 fabricObject
            const selectedLayer = this.itemList.find(layer => layer.id === id);

            if (selectedLayer) {

                // 將此圖層設置為當前選中的物件
                this.canvas.setActiveObject(selectedLayer);

                // 強制渲染畫布以顯示新的選中狀態
                this.canvas.renderAll();
            }
        },
        toggleLock(item) {
            if (item.selectable) {
                item.set({
                    hasControls: false,
                    selectable: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    lockScalingX: true,
                    lockScalingY: true,
                    lockRotation: true
                })
            } else {
                item.set({
                    selectable: true,
                    hasControls: true,
                    lockMovementX: false,
                    lockMovementY: false,
                    lockScalingX: false,
                    lockScalingY: false,
                    lockRotation: false
                });
            }
        },


    }
}
