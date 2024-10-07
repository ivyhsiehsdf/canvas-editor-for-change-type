import { ComfyUIService } from '../service/comfyUIService.js';
import { retryWithDelay } from '../assets/js/utilities/retryWithDelay.js';
const promptOptions = [
    {
        label: 'Custom Style',
        value: 'Custom Style Here....'
    },
    {
        label: 'Minimalist Scandinavian Style',
        value: 'Convert the furniture image into a sleek Minimalist Scandinavian design. Use clean lines, light wood tones, soft neutral colors, and an uncluttered aesthetic to evoke simplicity and functionality.'
    },
    {
        label: 'Industrial Loft Style',
        value: 'Transform the furniture image into an Industrial Loft design. Incorporate raw, unfinished textures like exposed brick, steel, and reclaimed wood. Use darker tones and an edgy, utilitarian look with visible hardware and mechanical elements.'
    },
    {
        label: 'Mid-Century Modern Style',
        value: 'Convert the furniture image into a Mid-Century Modern design. Use organic shapes, tapered legs, and vibrant hues such as mustard yellow, teal, and olive green. Combine sleek lines with natural materials like walnut wood for a retro vibe.'
    },
    {
        label: 'Bohemian Chic Style',
        value: 'Transform the furniture image into a Bohemian Chic design. Incorporate vibrant patterns, eclectic textures, and warm, earthy colors. Use natural materials like rattan, macramé, and woven fabrics to create a laid-back, artistic aesthetic.'
    },
    {
        label: 'Art Deco Glamour Style',
        value: 'Convert the furniture image into an Art Deco Glamour design. Incorporate luxurious materials like velvet, marble, and gold accents. Use bold geometric patterns, rich jewel tones, and sleek, symmetrical lines to evoke opulence and sophistication.'
    }
];


export default {
    template: "#ai-type-template",
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
            width: 1024,
            height: 768,
            seed: 1,
            styleSelect: "Select Style Prompt",
            stylePrompt: "",
            stylePromptOptions: [],
            canvasImageUrl: "",
            changedImageUrl: "",
            isClickChangeStyleBtn: false,
            promptId: null,
            getPromptResultState: false
        }
    },
    created() {
        this.init()
    },
    watch: {
        styleSelect(val) {
            this.stylePrompt = this.stylePromptOptions.find(x => x.label === val).value
        }
    },
    computed: {
        isEnabledChangeStyleBtn() {
            return !(this.width > 0 && this.height > 0 && this.seed > 0 && this.stylePrompt != "")
        }
    },
    methods: {
        init() {
            const defaultList = [{
                label: 'Select Style Prompt',
                value: ''
            }]
            this.stylePromptOptions = defaultList.concat(promptOptions)
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
        getCanvasImageUrL() {
            const bbox = this.calculateBoundingBox(this.canvas);

            // 使用 toDataURL 生成裁剪後的圖片，只包含物件
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                left: bbox.minX,  // 設置導出的區域
                top: bbox.minY,
                width: bbox.maxX - bbox.minX,
                height: bbox.maxY - bbox.minY,
                multiplier: 2  // 提高解析度
            });
            return dataURL

        },
        dataURLtoBlob(dataUrl) {
            const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        },
        async changeStyle() {
            this.isClickChangeStyleBtn = true;
            this.$emit("form-loading")
            const canvasImageUrL = this.getCanvasImageUrL()
            const file = this.dataURLtoBlob(canvasImageUrL)
            const uploadResult = await ComfyUIService.uploadStyleChangeImage(file);
           const sourceImageName = uploadResult.name;
            const sourceImageUrlResult = await ComfyUIService.getPublicImageUrl(sourceImageName);
            this.canvasImageUrl = sourceImageUrlResult.publicUrl;
            this.changedImageUrl = ""
            this.createFurnitureDesign(sourceImageName)
        },
        async createFurnitureDesign(url) {
            const body = {
                image_path: url,
                style: this.stylePrompt,
                seed: this.seed
            };
            try {
                const result = await ComfyUIService.createFurnitureDesignImage(body);
                this.promptId = result.body.prompt_id;
                this.getPromptResultState = true;
                this.toastShow(true, result.message)

            } catch (error) {
                console.error(error);
                this.toastShow(false, '圖片建立失敗')
            } finally {
                this.$emit("form-loaded")
                this.isClickChangeStyleBtn = false
            }
        },
        toastShow(isSuccess, mag) {
            let styleObj = {}
            if (isSuccess) {
                styleObj = {
                    background: "rgb(5 150 105)",

                }
            } else {
                styleObj = {
                    background: "rgb(190 18 60)",
                }
            }
            Toastify({
                text: mag,
                duration: 3000,
                newWindow: true,
                close: false,
                gravity: "top", // `top` or `bottom`
                position: "right", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: styleObj
            }).showToast();
        },
        async getPromptResult() {
            try {
                this.$emit("form-loading")
                this.isClickChangeStyleBtn = true;
                const result = await retryWithDelay(
                    async () => {
                        const response = await ComfyUIService.getFurnitureDesignImage(this.promptId);
                        if (response.body.is_success !== true) {
                            throw new Error('Result not ready');
                        }
                        return response;
                    },
                    {
                        maxRetries: 5,
                        delay: 5000,
                        onRetry: (retryCount) => {
                            this.toastShow(false, `嘗試第 ${retryCount} 次失敗。將在 ${5000 / 1000} 秒後重新嘗試`)

                        }
                    }
                );
                this.changedImageUrl = result.body.public_url;
                this.getPromptResultState = false;
                this.toastShow(true, '取得結果成功')

            } catch (error) {
                console.error(error);
                this.toastShow(false, '取得結果失敗')

            } finally {
                this.$emit("form-loaded")
                this.isClickChangeStyleBtn = false;

            }
        }
    },
}