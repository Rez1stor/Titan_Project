const fs = require('fs');
const path = require('path');
const products = JSON.parse(fs.readFileSync(path.join(__dirname,'..','products.json'),'utf8'));
const imagesDir = path.join(__dirname,'..','Titan_Project.Server','wwwroot','product-images');
const images = fs.readdirSync(imagesDir);
let copied = [];
for(const p of products){
  if(p.imageUrl){
    const file = p.imageUrl.replace(/^\/product-images\//,'');
    const full = path.join(imagesDir, file);
    if(!fs.existsSync(full)){
      const base = path.parse(file).name;
      const candidates = images.filter(i => path.parse(i).name === base);
      if(candidates.length>0){
        const src = path.join(imagesDir, candidates[0]);
        fs.copyFileSync(src, full);
        copied.push({id:p.id, name:p.name, src:candidates[0], dest:file});
      }
    }
  }
}
if(copied.length>0){
  console.log('COPIED:');
  for(const c of copied) console.log(`${c.src} -> ${c.dest}`);
} else {
  console.log('NO_CHANGES');
}
