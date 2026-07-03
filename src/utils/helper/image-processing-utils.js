// // utils/imageResize.js
//  async function resizeImage(file, maxWidth = 1024, maxHeight = 1024, steps = 2, quality = 0.8) {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     const reader = new FileReader();

//     reader.onload = e => {
//       img.src = e.target.result;
//     };
//     reader.onerror = reject;

//     img.onload = () => {
//       // คำนวณขนาดใหม่ให้ไม่เกิน maxWidth / maxHeight
//       let width = img.width;
//       let height = img.height;
//       const aspect = width / height;

//       if (width > maxWidth) {
//         width = maxWidth;
//         height = width / aspect;
//       }
//       if (height > maxHeight) {
//         height = maxHeight;
//         width = height * aspect;
//       }

//       // canvas หลัก
//       const canvas = document.createElement("canvas");
//       canvas.width = width;
//       canvas.height = height;
//       const ctx = canvas.getContext("2d");

//       // สร้าง canvas ขั้นกลาง
//       let oc = document.createElement("canvas");
//       let octx = oc.getContext("2d");
//       oc.width = img.width;
//       oc.height = img.height;

//       octx.drawImage(img, 0, 0, oc.width, oc.height);

//       // ทำขั้นตอนหลายขั้น (step-down) เพื่อลดรอยหยัก
//       for (let i = 0; i < steps; i++) {
//         const nw = Math.max(1, oc.width * 0.8);
//         const nh = Math.max(1, oc.height * 0.8);

//         const tmp = document.createElement("canvas");
//         tmp.width = nw;
//         tmp.height = nh;
//         tmp.getContext("2d").drawImage(oc, 0, 0, oc.width, oc.height, 0, 0, nw, nh);

//         oc = tmp;
//         octx = oc.getContext("2d");
//       }

//       // วางลง canvas หลัก
//       ctx.drawImage(oc, 0, 0, oc.width, oc.height, 0, 0, canvas.width, canvas.height);

//       // แปลงเป็น Blob / File
//       canvas.toBlob(
//         blob => {
//           if (blob) resolve(blob);
//           else reject(new Error("Resize failed"));
//         },
//         "image/jpeg",
//         quality
//       );
//     };

//     reader.readAsDataURL(file);
//   });
// }


// /src/utils/imageResize.js
import pica from "pica";
import imageCompression from "browser-image-compression";

/**
 * resizeImage(file, maxWidth=1024, maxHeight=1024, steps=2, quality=0.8)
 * - คืนค่า: Promise<Blob>
 * - พยายามลดขนาดให้มากที่สุด แต่คงคุณภาพไว้
 * - ใช้ pica สำหรับ resampling คุณภาพสูง + browser-image-compression สำหรับ strip metadata และ extra compress
 */
export async function resizeImage(
    file,
    maxWidth = 1024,
    maxHeight = 1024,
    steps = 2,
    quality = 0.8
) {
    // helper: ตรวจสอบเบราว์เซอร์รองรับ WebP ไหม
    async function supportsWebP() {
        if (!self.createImageBitmap) return false;
        const webpData = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
        try {
            const blob = await fetch(webpData).then(r => r.blob());
            await createImageBitmap(blob);
            return true;
        } catch {
            return false;
        }
    }

    // 1) โหลดภาพเป็น ImageBitmap (เร็วและไม่ใช้องค์ประกอบ DOM)
    let imgBitmap;
    try {
        imgBitmap = await createImageBitmap(file);
    } catch (err) {
        // fallback: อ่านด้วย Image แล้วสร้าง canvas -> createImageBitmap
        const dataUrl = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = e => res(e.target.result);
            fr.onerror = rej;
            fr.readAsDataURL(file);
        });
        await new Promise((r) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                c.getContext("2d").drawImage(img, 0, 0);
                createImageBitmap(c).then(bitmap => { imgBitmap = bitmap; r(); });
            };
            img.src = dataUrl;
        });
    }

    // 2) คำนวณขนาดเป้าหมาย (รักษาสัดส่วน)
    let width = imgBitmap.width;
    let height = imgBitmap.height;
    const aspect = width / height;

    if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspect);
    }
    if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspect);
    }

    // 3) เตรียม pica และ canvas ต้นทาง
    const p = pica({ features: ["js", "wasm", "ww"] }); // ให้พยายามใช้ wasm ถ้ามี
    let srcCanvas = document.createElement("canvas");
    srcCanvas.width = imgBitmap.width;
    srcCanvas.height = imgBitmap.height;
    srcCanvas.getContext("2d").drawImage(imgBitmap, 0, 0);

    // 4) ทำ step-down resampling ด้วย pica (แต่ละรอบ shrink ประมาณ 80%)
    //    ปรับให้ไม่ลดต่ำกว่า final size
    for (let i = 0; i < steps; i++) {
        const targetW = Math.max(Math.round(srcCanvas.width * 0.8), width);
        const targetH = Math.max(Math.round(srcCanvas.height * 0.8), height);

        // ถ้าขนาด srcCanvas อยู่แล้วเล็กกว่าหรือเท่ากับ target ให้ break
        if (srcCanvas.width <= targetW && srcCanvas.height <= targetH) break;

        const tmp = document.createElement("canvas");
        tmp.width = targetW;
        tmp.height = targetH;

        // pica resize (คุณภาพดี) — คืนค่า promise
        // options: ใช้ unsharp เพื่อให้รายละเอียดคมขึ้นหลังย่อลง
        await p.resize(srcCanvas, tmp, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2,
        });

        srcCanvas = tmp;
    }

    // 5) resize สุดท้ายไปยัง canvas เป้าหมาย (exact size)
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = height;
    await p.resize(srcCanvas, finalCanvas, {
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2,
    });

    // 6) แปลงเป็น Blob โดยพยายามใช้ WebP (ถ้า browser รองรับ) เพื่อขนาดที่เล็กกว่า
    const useWebP = await supportsWebP();
    const mime = useWebP ? "image/webp" : "image/jpeg";
    const mimeQuality = Number(quality);

    // pica.toBlob จะคืน blob คุณภาพดีและเร็วกว่า canvas.toBlob ในหลายกรณี
    let blob;
    try {
        blob = await p.toBlob(finalCanvas, mime, mimeQuality);
    } catch (err) {
        // fallback: canvas.toBlob
        blob = await new Promise((resolve, reject) => {
            finalCanvas.toBlob(
                b => {
                    if (b) resolve(b);
                    else reject(new Error("toBlob failed"));
                },
                mime,
                mimeQuality
            );
        });
    }

    // 7) ใช้ browser-image-compression เพื่อ:
    //    - strip metadata (EXIF) และ
    //    - ทำ optimization / extra pass ของ encoder (และใช้ web worker ถ้าเป็นไปได้)
    //    - ใส่ maxWidthOrHeight เพื่อการ safety (แต่เราตั้งไว้แล้ว)
    const compressionOptions = {
        maxSizeMB: 1, // ไม่บังคับ แต่ช่วยให้ library พยายามลดถ้าจำเป็น (1MB เพียงค่าเริ่มต้นปลอดภัย)
        maxWidthOrHeight: Math.max(width, height),
        useWebWorker: true,
        initialQuality: mimeQuality,
        fileType: mime, // ถ้า WebP ได้ ก็เลือก webp
        // always keep metadata default false => จะถูกลบ
    };

    let finalBlob;
    try {
        finalBlob = await imageCompression(blob, compressionOptions);
    } catch (err) {
        // ถ้าเกิด error ตอน compression ให้ fallback คืน blob เดิม
        finalBlob = blob;
    }
    return finalBlob;
}

export default resizeImage;


// export { resizeImage };