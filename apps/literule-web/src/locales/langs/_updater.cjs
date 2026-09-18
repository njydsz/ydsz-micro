// Add business-specific translations to existing files
const fs=require('fs'),path=require('path');
const LOC=__dirname;
const T=require('./_td.cjs');
let ok=0,fail=0;
for(const loc of Object.keys(T)){
  try{
    const bp=path.join(LOC,loc,'business.json');
    const biz=JSON.parse(fs.readFileSync(bp,'utf8'));
    const tr=T[loc];
    for(const k of Object.keys(tr))biz[k]=tr[k];
    fs.writeFileSync(bp,JSON.stringify(biz,null,2));
    ok++;
  }catch(e){fail++;console.error('FAIL',loc,e.message);}
}
console.log('Updated:',ok,'Failed:',fail);
