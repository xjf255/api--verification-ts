import path from "path";
import { fileURLToPath } from "url";
export default function getDirname() {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
}
