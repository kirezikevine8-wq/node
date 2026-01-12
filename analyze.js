const fs = require('fs');
const s = fs.readFileSync('server.js','utf8');
console.log('file length:', s.length, 'chars');
const lines = s.split('\n');
console.log('lines:', lines.length);
for(let i=Math.max(0,lines.length-20);i<lines.length;i++) console.log((i+1).toString().padStart(4)+': '+lines[i]);

let stack = [];
let inSingle=false,inDouble=false,inBack=false,inComment=false,inLineComment=false;
for(let i=0;i<s.length;i++){
  const c=s[i];
  const nxt=s[i+1]||'';
  if(inLineComment){ if(c==='\n') inLineComment=false; continue; }
  if(inComment){ if(c==='*' && nxt==='/' ){ inComment=false; i++; continue;} else continue; }
  if(!inSingle && !inDouble && !inBack){
    if(c==='/' && nxt==='*'){ inComment=true; i++; continue; }
    if(c==='/' && nxt==='/'){ inLineComment=true; i++; continue; }
  }
  if(!inDouble && !inBack && c==="'"){ inSingle=!inSingle; continue; }
  if(!inSingle && !inBack && c==='"'){ inDouble=!inDouble; continue; }
  if(!inSingle && !inDouble && c==='`'){ inBack=!inBack; continue; }
  if(inSingle||inDouble||inBack) continue;
  if(c==='{') stack.push('{');
  if(c==='}') stack.pop();
  if(c==='(') stack.push('(');
  if(c===')') stack.pop();
  if(c==='[') stack.push('[');
  if(c===']') stack.pop();
}
console.log('inSingle',inSingle,'inDouble',inDouble,'inBack',inBack,'inComment',inComment,'inLineComment',inLineComment);
console.log('stack length',stack.length, 'top=', stack[stack.length-1]);
