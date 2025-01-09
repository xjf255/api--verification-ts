import { v2 as cloudinary } from 'cloudinary';
import { CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET } from '../config.js';
// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
});
class CloudinaryStorage {
    constructor() { }
    _handleFile(req, file, cb) {
        const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error || !result) {
                return cb(error);
            }
            cb(null, {
                path: result.secure_url,
                filename: result.public_id,
            });
        });
        console.log(file);
        file.stream.pipe(uploadStream);
    }
    _removeFile(req, file, cb) {
        cloudinary.uploader.destroy(file.path, (error, result) => {
            if (error) {
                return cb(error);
            }
            cb(null);
        });
    }
}
export default CloudinaryStorage;
