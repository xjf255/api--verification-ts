import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from "stream";
import { CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET } from '../config.js';
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET
});
export async function loaderImage({ file }) {
    const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "image",
            public_id: `avatar-${Date.now()}`,
            folder: "trello-copy--avatars"
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
        const bufferStream = new PassThrough();
        bufferStream.end(file?.buffer);
        bufferStream.pipe(uploadStream);
    });
    const result = await uploadPromise;
    return result.secure_url;
}
export async function deleteImage(public_url) {
    const response = cloudinary.uploader.destroy(public_url);
    console.log("response delete img", response);
    return response;
}
