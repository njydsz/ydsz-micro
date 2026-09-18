const fs=require('fs'),path=require('path');
const LOC=__dirname;
const ZH=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','business.json'),'utf8'));
const ZHP=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','page.json'),'utf8'));
const EN=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','business.json'),'utf8'));
const ENP=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','page.json'),'utf8'));
// comm -> business key merge map
const CM={create:'create',edit:'edit',delete:'delete',refresh:'refresh',enabled:'enabled',disabled:'disabled',cancelBtn:'cancel',confirmBtn:'confirm',confirm:'confirm',unknown:'noData',seq:'seq',status:'status',name:'seq',action:'actions',operation:'actions',noData:'noData'};
function comm(loc){try{return JSON.parse(fs.readFileSync(path.join(LOC,'../../../../comm/locales/src/langs',loc,'common.json'),'utf8'));}catch{return {};}}
function build(loc){
  const c=comm(loc),d=DT[loc]||{},p=DP[loc]||{};
  const biz={};
  for(const k of Object.keys(ZH)){
    if(d[k]!==undefined)biz[k]=d[k];
    else if(CM[k]&&c[CM[k]]!==undefined)biz[k]=c[CM[k]];
    else biz[k]=EN[k]||'';
  }
  const pag={};
  for(const k of Object.keys(ZHP))pag[k]=p[k]!==undefined?p[k]:ENP[k]||'';
  return {biz,pag};
}
const DT=require('./DT.cjs');const DP=require('./DPP.cjs');
for(const loc of process.argv.slice(2)){
  try{
    const {biz,pag}=build(loc);
    fs.mkdirSync(path.join(LOC,loc),{recursive:true});
    fs.writeFileSync(path.join(LOC,loc,'business.json'),JSON.stringify(biz,null,2));
    fs.writeFileSync(path.join(LOC,loc,'page.json'),JSON.stringify(pag,null,2));
    process.stdout.write('.');
  }catch(e){process.stdout.write('X');console.error('\nFAIL',loc,e.message);}
}
console.log('\nDone');