const MODS={bazin:'1. Bazin (histórico)',dyproj:'2. DY projetivo',roe:'3. ROE projetivo',peg:'4. PEG Ratio',longo:'5. Longo prazo (15 anos)'};
const FIELDS={
 ticker:{l:'Ticker',t:'text',m:['bazin','dyproj','peg']},
 price:{l:'Cotação (R$)',m:['bazin','dyproj'],h:'Buscada no Investidor10'},
 dpaHist:{l:'DPA pago por ano (R$)',t:'text',m:['bazin'],h:'Separe por vírgula ou ponto e vírgula. Vazio: usa DY médio ou o DPA do módulo 2'},
 dyMedio:{l:'DY médio anual (%)',m:['bazin'],h:'Alternativa ao DPA histórico'},
 payout:{l:'Payout (%)',m:['dyproj','roe','peg','longo']},
 lucro:{l:'Lucro líquido projetivo / inicial (R$)',m:['dyproj','roe','longo'],r:1},
 nPapeis:{l:'Nº de papéis',m:['dyproj','longo']},
 plIni:{l:'Patrimônio líquido inicial (R$)',m:['roe','longo']},
 div:{l:'Dividendos esperados (R$)',m:['roe'],h:'Vazio: lucro × payout'},
 roe:{l:'ROE (%)',m:['roe','peg','longo'],r:1,h:'No módulo 3 pode ser usado no lugar do lucro'},
 pl:{l:'P/L',m:['peg'],r:1},
 psr:{l:'P/S (PSR)',m:['peg'],h:'Usado só se a empresa não tiver lucro'},
 pvp:{l:'P/VP',m:['longo'],r:1}
};
const state={stocks:[],sel:0,method:'todos',reuse:true,win:5,seq:0};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{if(v===''||v==null)return null;let s=String(v).trim();if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=parseFloat(s);return isNaN(n)?null:n};
const pct=v=>{const n=num(v);return n==null?null:n/100};
const fmt=(n,d=2)=>n==null||!isFinite(n)?'—':n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const brl=n=>n==null?'—':'R$ '+fmt(n);
const sgn=n=>`<span class="${n>=0?'pos':'neg'}">${n>=0?'+':''}${fmt(n*100,1)}%</span>`;
const newStock=(o={})=>({id:++state.seq,ticker:'',...o});

/* ---------- Cálculo ---------- */
function calc(s){
 const reuse=state.reuse,P=num(s.price),pay=pct(s.payout),N=num(s.nPapeis),roeIn=pct(s.roe),plI=num(s.plIni),div=num(s.div);
 const R={notes:{}};
 // 3. ROE projetivo
 let L=num(s.lucro);
 if(plI!=null&&(L!=null||roeIn!=null)){
  let Lc=L;
  if(Lc==null){
   if(div!=null)Lc=roeIn*(2*plI-div)/(2-roeIn);
   else if(pay!=null)Lc=roeIn*plI/(1-roeIn*(1-pay)/2);
  }
  const D=div!=null?div:(pay!=null&&Lc!=null?Lc*pay:null);
  if(Lc!=null&&D!=null){const plF=plI+Lc-D,plM=(plI+plF)/2;R.roe={lucro:Lc,div:D,plF,plM,roe:Lc/plM,derived:L==null}}
 }
 const Lf=L??(reuse&&R.roe?R.roe.lucro:null);
 const roeEff=roeIn??(reuse&&R.roe?R.roe.roe:null);
 // 2. DY projetivo
 if(Lf!=null&&N&&pay!=null){const lpa=Lf/N;R.dyproj={lpa,dpa:lpa*pay,fromRoe:L==null}}
 // 1. Bazin
 const hist=String(s.dpaHist||'').split(/[;,]\s*|\s+/).map(num).filter(v=>v!=null).slice(-state.win);
 const dy=pct(s.dyMedio);
 let dpa=null,src='';
 if(hist.length){dpa=hist.reduce((a,b)=>a+b,0)/hist.length;src=`média de ${hist.length} ano(s)`}
 else if(dy!=null&&P){dpa=P*dy;src='cotação × DY médio'}
 else if(reuse&&R.dyproj){dpa=R.dyproj.dpa;src='DPA do módulo 2'}
 if(dpa!=null)R.bazin={dpa,src,lv:[15,12,10,8,6].map(y=>{const t=dpa/(y/100);return{y,teto:t,marg:P?t/P-1:null}})};
 // 4. PEG
 const PL=num(s.pl)??(reuse&&P&&Lf&&N?P/(Lf/N):null);
 if(PL!=null&&roeEff!=null&&pay!=null){
  const noProfit=(Lf!=null&&Lf<=0)||PL<=0;
  const g=roeEff*100*(1-pay);
  R.peg={PL,g,peg:noProfit||g<=0?null:PL/g,noProfit,psr:num(s.psr)};
 }else if(((Lf!=null&&Lf<=0)||(PL!=null&&PL<=0))&&num(s.psr)!=null)R.peg={PL,noProfit:true,psr:num(s.psr)};
 // 5. Longo prazo
 const pvp=num(s.pvp)??(reuse&&P&&N&&plI?P/(plI/N):null);
 if(plI!=null&&roeEff!=null&&pay!=null&&pvp&&N){
  let pl=plI;const rows=[];
  for(let a=1;a<=15;a++){const lu=pl*roeEff,ret=lu*(1-pay),plF=pl+ret,lpa=lu/N;rows.push({a,lu,ret,plF,lpa,dpa:lpa*pay,eq:roeEff/pvp});pl=plF}
  R.longo={rows,pvp,roe:roeEff};
 }
 R.eff={Lf,roeEff,PL,pvp,P};
 return R;
}
function missing(s,m){
 const R=calc(s),out=[];
 if(R[m])return out;
 const has=k=>String(s[k]??'').trim()!=='';
 const rf=state.reuse;
 const need={
  bazin:()=>{if(!has('dpaHist')&&!has('dyMedio')&&!(rf&&R.dyproj))out.push('DPA dos últimos anos ou DY médio')},
  dyproj:()=>{if(R.eff.Lf==null)out.push('Lucro líquido projetivo');if(!has('nPapeis'))out.push('Nº de papéis');if(!has('payout'))out.push('Payout')},
  roe:()=>{if(!has('plIni'))out.push('PL inicial');if(!has('lucro')&&!has('roe'))out.push('Lucro projetivo ou ROE');if(!has('div')&&!has('payout'))out.push('Dividendos ou payout')},
  peg:()=>{if(R.eff.PL==null)out.push('P/L');if(R.eff.roeEff==null)out.push('ROE');if(!has('payout'))out.push('Payout');if(!out.length&&!R.peg)out.push('P/S (empresa sem lucro)')},
  longo:()=>{if(!has('plIni'))out.push('PL inicial');if(R.eff.roeEff==null)out.push('ROE');if(!has('payout'))out.push('Payout');if(!has('nPapeis'))out.push('Nº de papéis');if(R.eff.pvp==null)out.push('P/VP')}
 };
 need[m]();return out;
}

/* ---------- Renderização ---------- */
const cur=()=>state.stocks[state.sel];
function renderList(){
 $('stockList').innerHTML=state.stocks.map((s,i)=>`<li data-i="${i}" class="${i===state.sel?'on':''}"><span>${esc(s.ticker)||'(sem ticker)'} ${s.src?'<span class="tag">JSON</span>':''}</span><button class="x" data-del="${i}" aria-label="Remover">✕</button></li>`).join('');
}
function renderForm(){
 const s=cur();if(!s){$('form').innerHTML='';return}
 const keys=Object.keys(FIELDS).filter(k=>state.method==='todos'||FIELDS[k].m.includes(state.method));
 $('form').innerHTML=keys.map(k=>{const f=FIELDS[k];
  const use=state.method==='todos'?`Usado em: ${f.m.map(m=>MODS[m].slice(0,2).replace('.','')).join(', ')}`:'';
  const ph=f.r&&state.reuse?'automático se vazio':'';
  return `<label>${f.l}<input ${f.t==='text'?'type="text"':'inputmode="decimal"'} data-k="${k}" value="${esc(s[k])}" placeholder="${ph}"><small>${[f.h,use&&'módulos '+f.m.map(m=>m[0]==='b'?1:m==='dyproj'?2:m==='roe'?3:m==='peg'?4:5).join(', ')].filter(Boolean).join(' · ')}</small></label>`}).join('');
}
function modHTML(m,s,R){
 const miss=missing(s,m);
 let body;
 if(miss.length)body=`<div class="need">Falta preencher: ${miss.join(', ')}.</div>`;
 else if(m==='bazin'){const b=R.bazin;body=`<div class="kpis"><div class="kpi"><b>${brl(b.dpa)}</b><span>DPA (${b.src})</span></div><div class="kpi"><b>${brl(R.eff.P)}</b><span>Cotação</span></div></div>
  <div class="pyr">${b.lv.map((l,i)=>`<div class="lv ${R.eff.P&&R.eff.P<=l.teto?'up':''}" style="width:${50+i*12.5}%"><span>DY ${l.y}%</span><b>${brl(l.teto)}</b><span>${l.marg==null?'':sgn(l.marg)}</span></div>`).join('')}</div>
  <p class="note">Topo = DY 15% (preço mais baixo); base = DY 6% (preço mais alto). Contorno verde: cotação abaixo do preço teto.</p>`}
 else if(m==='dyproj'){const d=R.dyproj;body=`<div class="kpis"><div class="kpi"><b>${brl(d.lpa)}</b><span>LPA</span></div><div class="kpi"><b>${brl(d.dpa)}</b><span>DPA</span></div></div>
  <div class="pyr">${[15,12,10,8,6].map((y,i)=>{const t=d.dpa/(y/100),mg=R.eff.P?t/R.eff.P-1:null;return `<div class="lv ${R.eff.P&&R.eff.P<=t?'up':''}" style="width:${50+i*12.5}%"><span>DY ${y}%</span><b>${brl(t)}</b><span>${mg==null?'':sgn(mg)}</span></div>`}).join('')}</div>${d.fromRoe?'<p class="note">Lucro projetivo calculado a partir do ROE (módulo 3).</p>':''}`}
 else if(m==='roe'){const r=R.roe;body=`<div class="kpis"><div class="kpi"><b>${fmt(r.roe*100)}%</b><span>ROE projetivo</span></div><div class="kpi"><b>${fmt(r.lucro,0)}</b><span>Lucro projetivo (R$)</span></div><div class="kpi"><b>${fmt(r.plF,0)}</b><span>PL final (R$)</span></div><div class="kpi"><b>${fmt(r.plM,0)}</b><span>PL médio (R$)</span></div></div>
  <p class="note">Mantenha o mesmo prazo (ex.: 12 meses) em todos os dados. Alavancagem e recompras podem inflar o ROE.</p>`}
 else if(m==='peg'){const p=R.peg;
  if(p.noProfit){const ok=p.psr!=null&&p.psr<1;body=`<div class="alert">Sem lucro: P/L e PEG não se aplicam. Análise pelo PSR.</div><div class="kpis"><div class="kpi"><b>${fmt(p.psr)}</b><span>PSR (ideal abaixo de 1)</span></div></div><p class="${ok?'pos':'neg'}">${ok?'PSR abaixo de 1.':'PSR acima de 1.'}</p>`}
  else{const v=p.peg,lab=v<1?'Muito barato':v<=2?'Valor bom':v<=3?'Cara':'Sobrevalorizada';const al=[];
   if(v<1&&p.PL<6)al.push('PEG baixo com P/L baixo pode indicar empresa de baixa qualidade (value trap).');
   if(v<=2&&p.PL>=10)al.push('P/L mais alto com PEG baixo é comum em empresas de boa qualidade.');
   if(p.PL>=15&&v>3)al.push('P/L alto e PEG alto é aposta, não investimento.');
   body=`<div class="kpis"><div class="kpi"><b>${fmt(v)}</b><span>PEG</span></div><div class="kpi"><b>${lab}</b><span>Interpretação</span></div><div class="kpi"><b>${fmt(p.PL)}</b><span>P/L</span></div><div class="kpi"><b>${fmt(p.g)}</b><span>Crescimento = ROE × (1 − payout), em p.p.</span></div></div>${al.map(a=>`<div class="alert">${a}</div>`).join('')}`}}
 else if(m==='longo'){const l=R.longo;body=`<div class="kpis"><div class="kpi"><b>${fmt(l.roe*100)}%</b><span>ROE</span></div><div class="kpi"><b>${fmt(l.pvp)}</b><span>P/VP</span></div><div class="kpi"><b>${fmt(l.rows[0].eq*100)}%</b><span>ROE equivalente (ROE ÷ P/VP)</span></div></div>
  <div class="tw"><table><tr><th>Ano</th><th>Lucro</th><th>Retido</th><th>PL final</th><th>LPA</th><th>DPA</th><th>ROE eq.</th></tr>${l.rows.map(r=>`<tr><td>${r.a}</td><td>${fmt(r.lu,0)}</td><td>${fmt(r.ret,0)}</td><td>${fmt(r.plF,0)}</td><td>${fmt(r.lpa)}</td><td>${fmt(r.dpa)}</td><td>${fmt(r.eq*100)}%</td></tr>`).join('')}</table></div>`}
 return `<article class="mod"><h2>${MODS[m]}</h2>${body}</article>`;
}
function renderResults(){
 const s=cur();if(!s){$('results').innerHTML='';return}
 const R=calc(s),ms=state.method==='todos'?Object.keys(MODS):[state.method];
 $('results').innerHTML=ms.map(m=>modHTML(m,s,R)).join('');
}
function renderAll(){renderList();renderForm();renderResults()}

/* ---------- Investidor10 ---------- */
const N_RE='(-?\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?)';
function parseI10(html){
 const d=new DOMParser().parseFromString(html,'text/html');
 const cells=[...d.querySelectorAll('._card,.cell,.item')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
 const get=re=>{for(const c of cells){const m=c.match(new RegExp(re,'i'));if(m)return m[1]}return null};
 return{price:get('^cota[çc][ãa]o\\s*(?:r\\$)?\\s*'+N_RE),pl:get('^p/l\\s*'+N_RE),pvp:get('^p/vp\\s*'+N_RE),psr:get('^p/receitas?[^\\d-]*'+N_RE),nPapeis:get('^n[°º] total de pap[ée]is\\s*'+N_RE)};
}
async function fetchI10(t){
 const url=`https://investidor10.com.br/acoes/${t.toLowerCase()}/`;
 const proxies=[u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),u=>'https://corsproxy.io/?'+encodeURIComponent(u)];
 for(const p of proxies){try{const r=await fetch(p(url));if(!r.ok)continue;const o=parseI10(await r.text());if(Object.values(o).some(v=>v))return o}catch(e){}}
 return null;
}

/* ---------- Exportar / Importar ---------- */
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const clean=s=>{const o={};Object.keys(FIELDS).forEach(k=>o[k]=s[k]??'');return o};
function exportJson(){download('valuation.json',new Blob([JSON.stringify({app:'valuation',versao:1,acoes:state.stocks.map(clean)},null,2)],{type:'application/json'}))}
function exportXlsx(){
 if(!window.XLSX){alert('Biblioteca de Excel não carregou. Verifique a conexão.');return}
 const wb=XLSX.utils.book_new(),add=(n,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{aviso:'Sem dados'}]),n);
 const all=state.stocks.map(s=>({s,R:calc(s)}));
 add('Entradas',state.stocks.map(s=>{const o={};Object.keys(FIELDS).forEach(k=>o[FIELDS[k].l]=s[k]??'');return o}));
 add('Bazin',all.filter(x=>x.R.bazin).flatMap(({s,R})=>R.bazin.lv.map(l=>({Ticker:s.ticker,DPA:R.bazin.dpa,'DY mínimo %':l.y,'Preço teto':l.teto,'Cotação':R.eff.P,'Margem':l.marg}))));
 add('DY Projetivo',all.filter(x=>x.R.dyproj).flatMap(({s,R})=>[15,12,10,8,6].map(y=>({Ticker:s.ticker,LPA:R.dyproj.lpa,DPA:R.dyproj.dpa,'DY mínimo %':y,'Preço teto':R.dyproj.dpa/(y/100)}))));
 add('ROE Projetivo',all.filter(x=>x.R.roe).map(({s,R})=>({Ticker:s.ticker,'Lucro projetivo':R.roe.lucro,Dividendos:R.roe.div,'PL final':R.roe.plF,'PL médio':R.roe.plM,'ROE projetivo':R.roe.roe})));
 add('PEG',all.filter(x=>x.R.peg).map(({s,R})=>({Ticker:s.ticker,'P/L':R.peg.PL,PEG:R.peg.peg,PSR:R.peg.psr})));
 add('Longo Prazo',all.filter(x=>x.R.longo).flatMap(({s,R})=>R.longo.rows.map(r=>({Ticker:s.ticker,Ano:r.a,Lucro:r.lu,Retido:r.ret,'PL final':r.plF,LPA:r.lpa,DPA:r.dpa,'ROE equivalente':r.eq}))));
 XLSX.writeFile(wb,'valuation.xlsx');
}
function importJson(file){
 const rd=new FileReader();
 rd.onload=()=>{try{
  const d=JSON.parse(rd.result),list=Array.isArray(d)?d:(d.acoes||d.stocks||[]);
  if(!list.length)throw 0;
  let first=null;
  list.forEach(o=>{const t=String(o.ticker||'').toUpperCase();const ex=state.stocks.findIndex(x=>t&&x.ticker.toUpperCase()===t);
   const ns=newStock({...clean(o),src:'json'});if(ex>=0){ns.id=state.stocks[ex].id;state.stocks[ex]=ns}else state.stocks.push(ns);
   if(first==null)first=ex>=0?ex:state.stocks.length-1});
  state.stocks=state.stocks.filter((s,i)=>!(i===0&&!s.src&&!s.ticker&&state.stocks.length>1&&Object.keys(FIELDS).every(k=>!s[k])));
  state.sel=Math.max(0,Math.min(first??0,state.stocks.length-1));renderAll();$('status').textContent=`${list.length} ação(ões) importada(s).`;
 }catch(e){$('status').textContent='Arquivo JSON inválido.'}};
 rd.readAsText(file);
}

/* ---------- Eventos ---------- */
$('stockList').addEventListener('click',e=>{
 const del=e.target.closest('[data-del]');
 if(del){state.stocks.splice(+del.dataset.del,1);if(!state.stocks.length)state.stocks.push(newStock());state.sel=Math.min(state.sel,state.stocks.length-1);renderAll();return}
 const li=e.target.closest('li');if(li){state.sel=+li.dataset.i;renderAll()}
});
$('form').addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;cur()[k]=e.target.value;if(k==='ticker')renderList();renderResults()});
$('method').onchange=e=>{state.method=e.target.value;renderForm();renderResults()};
$('win').onchange=e=>{state.win=+e.target.value;renderResults()};
$('reuse').onchange=e=>{state.reuse=e.target.checked;renderForm();renderResults()};
$('btnAdd').onclick=()=>{state.stocks.push(newStock());state.sel=state.stocks.length-1;renderAll()};
$('btnJson').onclick=exportJson;$('btnXlsx').onclick=exportXlsx;
$('btnImport').onclick=()=>$('fileJson').click();
$('fileJson').onchange=e=>{if(e.target.files[0])importJson(e.target.files[0]);e.target.value=''};
$('btnFetch').onclick=async()=>{
 const s=cur(),t=(s.ticker||'').trim();if(!t){$('status').textContent='Informe o ticker primeiro.';return}
 $('status').textContent='Buscando…';
 const o=await fetchI10(t);
 if(!o){$('status').textContent='Não foi possível buscar (bloqueio do site ou do proxy). Preencha manualmente.';return}
 ['price','pl','pvp','psr','nPapeis'].forEach(k=>{if(o[k]!=null)s[k]=o[k]});
 renderForm();renderResults();$('status').textContent='Dados atualizados. Confira os valores.';
};
state.stocks.push(newStock());renderAll();
