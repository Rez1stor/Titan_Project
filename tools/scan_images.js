const fs = require('fs');
const path = require('path');
const products = JSON.parse(fs.readFileSync(path.join(__dirname,'..','products.json'),'utf8'));
const imagesDir = path.join(__dirname,'..','Titan_Project.Server','wwwroot','product-images');
const images = fs.readdirSync(imagesDir);
const results = [];
for(const p of products){
  if(p.imageUrl){
    const file = p.imageUrl.replace(/^\/product-images\//,'');
    const full = path.join(imagesDir, file);
    if(fs.existsSync(full)){
      results.push({id:p.id,name:p.name,imageUrl:p.imageUrl,status:'OK',existingFile:file,candidates:''});
    } else {
      const base = path.parse(file).name;
      const candidates = images.filter(i => path.parse(i).name === base).join(';');
      results.push({id:p.id,name:p.name,imageUrl:p.imageUrl,status:'MISSING',existingFile:'',candidates});
    }
  } else {
    results.push({id:p.id,name:p.name,imageUrl:'',status:'NO_IMAGE',existingFile:'',candidates:''});
  }
}
const csv = ['Id,Name,ImageUrl,Status,ExistingFile,Candidates',...results.map(r=>`${r.id},"${r.name.replace(/"/g,'""')}","${r.imageUrl}",${r.status},${r.existingFile},"${r.candidates}"`)].join('\n');
fs.writeFileSync(path.join(__dirname,'..','report_images.csv'),csv,'utf8');
console.log('REPORT_WRITTEN to report_images.csv');
