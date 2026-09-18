const fs=require('fs'),path=require('path');
const TD=__dirname+'/_translations';
fs.mkdirSync(TD,{recursive:true});
function write(loc,data){
  fs.writeFileSync(path.join(TD,loc+'.json'),JSON.stringify(data,null,2));
  process.stdout.write('.');
}

// ====== pt-BR (3 keys that differ from comm layer) ======
write('pt-BR',{
  page:{rule:'Regra',ruleList:'Regras',dsl:'DSL',variable:'Variável',advanced:'Avançado',cep:'CEP',breakpoint:'Ponto de Interrupção',audit:'Auditoria',auditLog:'Log de Auditoria'},
  business:{}
});
