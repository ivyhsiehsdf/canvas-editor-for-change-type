import { API_ROUTES } from '../routes/comfyUIRoutes.js';
import { fetchWrapper } from '../assets/js/utilities/fetchWrapper.js';

export const ComfyUIService = {
    uploadStyleChangeImage(file) {
        const formData = new FormData();
        formData.append('file', file,'canvas_image.png');
        return fetchWrapper.upload(API_ROUTES.UPLOAD_STYLE_CHANGE_IMAGE, formData);
    },
    getPublicImageUrl(imageName) {
        return fetchWrapper.get(`${API_ROUTES.GET_PUBLIC_IMAGE_URL}?imageName=${imageName}`);
    },
    createStyleSwapImage(body) {
        return fetchWrapper.post(`${API_ROUTES.CREATE_STYLE_SWAP_IMAGE}`, body);
    },
    getSwapStyleImage(promptId) {
        return fetchWrapper.get(`${API_ROUTES.GET_STYLE_SWAP_IMAGE}?promptId=${promptId}`);
    },
    createFurnitureDesignImage(body) {
        return fetchWrapper.post(`${API_ROUTES.CREATE_FURNITURE_DESIGN_IMAGE}`, body);
    },
    getFurnitureDesignImage(promptId) {
        return fetchWrapper.get(`${API_ROUTES.GET_FURNITURE_DESIGN_IMAGE}?promptId=${promptId}`);
    }
};
