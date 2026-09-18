const fs=require('fs'),path=require('path');
const LOC=__dirname+'/langs';
const ZH=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','business.json'),'utf8'));
const ZHP=JSON.parse(fs.readFileSync(path.join(LOC,'zh-CN','page.json'),'utf8'));
const EN=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','business.json'),'utf8'));
const ENP=JSON.parse(fs.readFileSync(path.join(LOC,'en-US','page.json'),'utf8'));
const COMM_BASE='D:/Code/open/ydsz-micro/comm/locales/src/langs';
function comm(loc){try{return JSON.parse(fs.readFileSync(path.join(COMM_BASE,loc,'common.json'),'utf8'));}catch{return {};}}

const CMR={create:'create',edit:'edit',delete:'delete',refresh:'refresh',enabled:'enabled',disabled:'disabled',cancelBtn:'cancel',confirmBtn:'confirm',confirm:'confirm',unknown:'noData',seq:'seq',status:'status',name:'name',type:'type',action:'action',version:'version',required:'required',operation:'operation'};
// cepPushPush is the typo key in en-US, we map it to cepPushTest
const businessTranslations=TRANSLATIONS;
const pageTranslations=PAGE_TRANS;

let ok=0,fail=0;
for(const loc of Object.keys(businessTranslations)){
  try{
    const c=comm(loc);
    const bkey=Object.keys(businessTranslations[loc]);
    const biz={};
    for(const k of Object.keys(ZH)){
      if(bkey.indexOf(k)>=0 && businessTranslations[loc][k]!==undefined){
        biz[k]=businessTranslations[loc][k];
      }else if(CMR[k] && c[CMR[k]]!==undefined){
        biz[k]=c[CMR[k]];
      }else if(EN[k]!==undefined){
        biz[k]=EN[k];
      }else{
        biz[k]='';
      }
    }
    const pageTr=pageTranslations[loc]||{};
    const pag={};
    for(const k of Object.keys(ZHP)){
      pag[k]=pageTr[k]!==undefined?pageTr[k]:ENP[k]||'';
    }
    const dir=path.join(LOC,loc);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'business.json'),JSON.stringify(biz,null,2));
    fs.writeFileSync(path.join(dir,'page.json'),JSON.stringify(pag,null,2));
    ok++;
    process.stdout.write('.');
  }catch(e){
    fail++;
    process.stdout.write('X');
    console.error('\nFAIL',loc,e.message);
  }
}
console.log(`\nDone. OK=${ok} FAIL=${fail}`);
