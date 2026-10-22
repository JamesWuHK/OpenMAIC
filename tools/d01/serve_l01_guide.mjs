import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const guide=await realpath(path.join(here,'guide'));
const assets=await realpath(path.join(here,'../../output/d01-l01-blender/20260923-r01'));
const files=['index.html','styles.css','app.mjs','model.mjs','renderer.mjs','content.mjs'];
const downloads=['D01_L01_v00_starter.blend','D01_L01_v01.blend','D01_L01_v02.blend'];
const images=['v01','v02'].flatMap(v=>['front','side','three-quarter'].map(view=>`${v}-${view}.png`));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.blend':'application/octet-stream'};
const port=Number(process.env.D01_GUIDE_PORT||4381);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid D01_GUIDE_PORT');
const server=http.createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});return res.end();}
    const url=new URL(req.url,'http://localhost');
    let name=decodeURIComponent(url.pathname),root=guide;
    if(name==='/favicon.ico'){res.writeHead(204,headers);return res.end();}
    if(name==='/')name='index.html';
    else if(name.startsWith('/assets/')){name=name.slice(8);root=assets;if(![...downloads,...images].includes(name))throw Error('not found');}
    else{name=name.slice(1);if(!files.includes(name))throw Error('not found');}
    const full=await realpath(path.join(root,name));
    if(path.dirname(full)!==root)throw Error('outside root');
    const info=await stat(full);if(!info.isFile())throw Error('not a file');
    const extra=downloads.includes(name)?{'Content-Disposition':`attachment; filename="${name}"`}:{};
    res.writeHead(200,{...headers,...extra,'Content-Type':types[path.extname(name)],'Content-Length':info.size});
    res.end(req.method==='HEAD'?undefined:await readFile(full));
  }catch{res.writeHead(404,{...headers,'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`D01 local guide: http://127.0.0.1:${port} (read-only; no external service)`));
