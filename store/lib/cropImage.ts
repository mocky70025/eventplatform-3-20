export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (err) => reject(err));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });
}

// Crop an image (from object URL) to the given pixel area and return a JPEG Blob.
// Output is downscaled so its width never exceeds maxWidth.
export async function getCroppedImg(
    imageSrc: string,
    crop: PixelCrop,
    maxWidth = 1600,
    quality = 0.9
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");

    let outW = Math.round(crop.width);
    let outH = Math.round(crop.height);
    if (outW > maxWidth) {
        const scale = maxWidth / outW;
        outW = Math.round(outW * scale);
        outH = Math.round(outH * scale);
    }

    canvas.width = outW;
    canvas.height = outH;
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("画像の生成に失敗しました"))),
            "image/jpeg",
            quality
        );
    });
}
