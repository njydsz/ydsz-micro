const fs=require('fs'),path=require('path');
const LOC=__dirname;
const ZH=JSON.parse(fs.readFileSync('./zh-CN/business.json','utf8'));
const ZHP=JSON.parse(fs.readFileSync('./zh-CN/page.json','utf8'));
const EN=JSON.parse(fs.readFileSync('./en-US/business.json','utf8'));
const ENP=JSON.parse(fs.readFileSync('./en-US/page.json','utf8'));
const PD=JSON.parse(fs.readFileSync('./dp.json','utf8'));
const BD=JSON.parse(fs.readFileSync('./db.json','utf8'));
function comm(loc){try{return JSON.parse(fs.readFileSync(path.join('D:/Code/open/ydsz-micro/comm/locales/src/langs',loc,'common.json'),'utf8'));}catch{return {};}}
const CMR={create:'create',edit:'edit',delete:'delete',refresh:'refresh',enabled:'enabled',disabled:'disabled',cancelBtn:'cancel',confirmBtn:'confirm',confirm:'confirm',unknown:'noData',seq:'seq',status:'status',noData:'noData'};
for(const loc of process.argv.slice(2)){
  try{
    const c=comm(loc),dd=BD[loc]||{},pp=PD[loc]||{};
    const biz={};for(const k of Object.keys(ZH)){if(dd[k]!==undefined)biz[k]=dd[k];else if(CMR[k]&&c[CMR[k]]!==undefined)biz[k]=c[CMR[k]];else biz[k]=EN[k]||'';}
    const pag={};for(const k of Object.keys(ZHP))pag[k]=pp[k]!==undefined?pp[k]:ENP[k]||'';
    fs.mkdirSync(path.join(LOC,loc),{recursive:true});
    fs.writeFileSync(path.join(LOC,loc,'business.json'),JSON.stringify(biz,null,2));
    fs.writeFileSync(path.join(LOC,loc,'page.json'),JSON.stringify(pag,null,2));
    process.stdout.write('.');
  }catch(e){process.stdout.write('X');console.error('FAIL',loc,e.message);}
}