const fs=require('fs'),path=require('path');
const LOC=__dirname+'/langs';
const TD=__dirname+'/_translations';
const ZH=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','business.json'),'utf8'));
const ZHP=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','page.json'),'utf8'));
const EN=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','business.json'),'utf8'));
const ENP=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','page.json'),'utf8'));
const COMM_BASE='D:/Code/open/ydsz-micro/comm/locales/src/langs';
function comm(loc){try{return JSON.parse(fs.readFileSync(path.join(COMM_BASE,loc,'common.json'),'utf8'));}catch{return {};}}
const CMR={create:'create',edit:'edit',delete:'delete',refresh:'refresh',enabled:'enabled',disabled:'disabled',cancelBtn:'cancel',confirmBtn:'confirm',confirm:'confirm',unknown:'noData',seq:'seq',status:'status',name:'name',type:'type',action:'action',version:'version',required:'required',operation:'operation'};
// Values that indicate an untranslated/placeholder key (English fallback)
function isPlaceholder(val){
  return val===undefined||val===null||val===''||(typeof val==='string'&&val===val.toUpperCase()&&val.length<=1);
}

const files=fs.readdirSync(TD).filter(f=>f.endsWith('.json'));
let ok=0,fail=0;
for(const file of files){
  const loc=file.replace('.json','');
  try{
    const data=JSON.parse(fs.readFileSync(path.join(TD,file),'utf8'));
    const btrans=data.business||{};
    const ptrans=data.page||{};
    const c=comm(loc);
    const biz={};
    for(const k of Object.keys(ZH)){
      const bt=btrans[k];
      if(bt!==undefined && !isPlaceholder(bt)){
        biz[k]=bt;
      }else if(CMR[k] && c[CMR[k]]!==undefined){
        biz[k]=c[CMR[k]];
      }else{
        biz[k]=EN[k]||'';
      }
    }
    const pag={};
    const pkeys=Object.keys(ptrans);
    for(const k of Object.keys(ZHP)){
      pag[k]=pkeys.length>0 && ptrans[k]!==undefined?ptrans[k]:ENP[k]||'';
    }
    const dir=path.join(LOC,loc);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'business.json'),JSON.stringify(biz,null,2));
    if(pkeys.length>0){
      fs.writeFileSync(path.join(dir,'page.json'),JSON.stringify(pag,null,2));
    }
    ok++;
    process.stdout.write('.');
  }catch(e){
    fail++;
    process.stdout.write('X');
    console.error('\nFAIL',loc,e.message);
  }
}
console.log(`\nDone. OK=${ok} FAIL=${fail}`);
