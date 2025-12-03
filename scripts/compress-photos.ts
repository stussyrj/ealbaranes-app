import { db } from "../server/db";
import { deliveryNotes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { createCanvas, loadImage } from "canvas";

async function compressPhotos() {
  console.log("Starting photo compression...");
  
  const notes = await db.select().from(deliveryNotes);
  const largePhotoNotes = notes.filter(n => n.photo && n.photo.length > 100000);
  
  console.log(`Found ${largePhotoNotes.length} notes with large photos`);
  
  let compressed = 0;
  let totalSaved = 0;
  
  for (const note of largePhotoNotes) {
    if (!note.photo) continue;
    
    const originalSize = note.photo.length;
    
    try {
      const base64Data = note.photo.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const img = await loadImage(buffer);
      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBuffer = canvas.toBuffer('image/jpeg', { quality: 0.7 });
      const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      
      await db.update(deliveryNotes)
        .set({ photo: compressedBase64 })
        .where(eq(deliveryNotes.id, note.id));
      
      const newSize = compressedBase64.length;
      totalSaved += originalSize - newSize;
      compressed++;
      
      console.log(`Compressed photo for note #${note.noteNumber}: ${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB`);
    } catch (err) {
      console.error(`Error compressing photo for note ${note.id}:`, err);
    }
  }
  
  console.log(`\nCompression complete!`);
  console.log(`Compressed: ${compressed} photos`);
  console.log(`Total saved: ${Math.round(totalSaved / 1024 / 1024 * 10) / 10} MB`);
  
  process.exit(0);
}

compressPhotos().catch(console.error);
