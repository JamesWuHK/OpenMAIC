import {shapes} from './model.mjs';

const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const VERT=`attribute vec3 pos; attribute vec3 normal; attribute vec3 color;
uniform vec3 right; uniform vec3 up; uniform vec3 depth; uniform float aspect;
varying vec3 shade;
void main(){vec3 p=pos-vec3(0.,0.,1.36);
gl_Position=vec4(dot(p,right)/(1.8*aspect),dot(p,up)/1.8,dot(p,depth)/10.,1.);
float light=.56+.33*max(dot(normal,normalize(vec3(-3.,-5.,7.))),0.)+.11*max(dot(normal,normalize(vec3(4.,2.,3.))),0.);
shade=color*light;}`;
const FRAG=`precision mediump float; varying vec3 shade; void main(){gl_FragColor=vec4(shade,1.);}`;

function geometry(state) {
  const out=[];
  const vertex=(p,n,c)=>out.push(...p,...n,...c);
  const sphere=(shape, lat=18, lon=28)=>{
    const point=(a,b)=>{
      const u=a*Math.PI/lat,v=b*2*Math.PI/lon,unit=[Math.sin(u)*Math.cos(v),Math.sin(u)*Math.sin(v),Math.cos(u)];
      return [unit.map((n,i)=>shape.p[i]+n*shape.r[i]),norm(unit.map((n,i)=>n/shape.r[i]))];
    };
    for(let a=0;a<lat;a++) for(let b=0;b<lon;b++){
      for(const [u,v] of [[a,b],[a+1,b],[a+1,b+1],[a,b],[a+1,b+1],[a,b+1]]) vertex(...point(u,v),shape.color);
    }
  };
  // Base disc is a real cylinder, not a flattened ellipsoid.
  for(let i=0;i<64;i++) {
    const a=i*Math.PI/32,b=(i+1)*Math.PI/32;
    const p=(angle,z)=>[Math.cos(angle)*1.18,Math.sin(angle)*1.18,z];
    const c=[.91,.87,.74];
    for(const z of [0,.18]) for(const v of [[0,0,z],p(a,z),p(b,z)]) vertex(v,[0,0,z?1:-1],c);
    for(const [angle,z] of [[a,0],[b,0],[b,.18],[a,0],[b,.18],[a,.18]]) vertex(p(angle,z),[Math.cos(angle),Math.sin(angle),0],c);
  }
  for(const shape of shapes(state)) sphere(shape);
  // Soft cheek marks help both eyes and the mouth read as one friendly face.
  for(const x of [-.59,.59]) {
    const z=1.18,y=-.72*Math.sqrt(1-(x/.95)**2)-.035;
    sphere({p:[x,y,z],r:[.095,.028,.048],color:[.96,.63,.52]},10,14);
  }
  for(let i=0;i<=24;i++){
    const x=-.23+i*.46/24,z=.94+.1*(x/.23)**2;
    const y=-.72*Math.sqrt(1-(x/.95)**2-(z-1.18)**2)-.017;
    sphere({p:[x,y,z],r:[.024,.024,.024],color:[.045,.18,.22]},6,8);
  }
  return new Float32Array(out);
}
export class CreatureRenderer {
  constructor(canvas,onFailure) {
    this.canvas=canvas; this.onFailure=onFailure;
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
    if(!gl) {this.available=false;return;}
    this.gl=gl;this.available=true;
    const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));return s;};
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,VERT));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    this.program=program;this.buffer=gl.createBuffer();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.available=false;onFailure();});
    canvas.addEventListener('webglcontextrestored',()=>{this.available=false;onFailure();});
    this.observer=new ResizeObserver(()=>{if(this.state)this.draw(this.state);});this.observer.observe(canvas);
  }
  draw(state) {
    this.state=state;if(!this.available)return;
    const gl=this.gl, p=this.program,rect=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=Math.round(rect.height*ratio);
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.useProgram(p);
    const eye=state.view==='front'?[0,-9,1.36]:state.view==='side'?[9,0,1.36]:[5,-8,4];
    const depth=norm(sub([0,0,1.36],eye)),right=norm(cross(depth,[0,0,1])),up=norm(cross(right,depth));
    for(const [key,val] of Object.entries({right,up,depth}))gl.uniform3fv(gl.getUniformLocation(p,key),val);
    gl.uniform1f(gl.getUniformLocation(p,'aspect'),rect.width/Math.max(rect.height,1));
    const vertices=geometry(state);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
    ['pos','normal','color'].forEach((name,i)=>{const loc=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,i*12);});
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
  }
}
