/* QUEST · js/sound.js — generative soundscape. One scene per destination (SC), all synthesised, no audio files. */
window.QUEST = window.QUEST || {};
(function (Q) {
const $=s=>document.querySelector(s);
Q.SND=(()=>{let ctx,master,on=false,layers={},scene='title',pink;
  const SC={title:{pad:.55,ocean:.45},hq:{pad:.6,rain:.35},falls:{pad:.25,falls:.9,birds:1},wind:{pad:.5,wind:.9,shimmer:.7},stadium:{pad:.2,beat:1,crowd:.5},ocean:{pad:.35,ocean:1},forest:{pad:.4,wind:.35,birds:.8},city:{pad:.45,beat:.35,rain:.4},book:{pad:.65},travel:{pad:.4,wind:.5}};
  function nb(type){const len=ctx.sampleRate*4,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);let l=0,b0=0,b1=0,b2=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;if(type==='brown'){l=(l+.02*w)/1.02;d[i]=l*3.5}else{b0=.997*b0+w*.029;b1=.985*b1+w*.032;b2=.95*b2+w*.048;d[i]=(b0+b1+b2+w*.1)*.5}}return b}
  const src=b=>{const s=ctx.createBufferSource();s.buffer=b;s.loop=true;s.start();return s};
  const lfo=(f,dep,t)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.value=dep;o.connect(g).connect(t);o.start()};
  const bus=()=>{const g=ctx.createGain();g.gain.value=0;g.connect(master);return g};
  function build(){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
    pink=nb('pink');const brown=nb('brown');
    layers.pad=bus();const pf=ctx.createBiquadFilter();pf.type='lowpass';pf.frequency.value=900;pf.connect(layers.pad);lfo(.05,400,pf.frequency);
    [110,164.81,220,246.94,329.63].forEach((f,i)=>['sine','triangle'].forEach((t,j)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=t;o.frequency.value=f*(j?1.003:1);g.gain.value=(j?.018:.03)/(1+i*.3);lfo(.07+i*.02,(j?.01:.015),g.gain);o.connect(g).connect(pf);o.start()}));
    layers.ocean=bus();{const s=src(brown),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=500;g.gain.value=.5;lfo(.09,.45,g.gain);lfo(.09,300,f.frequency);s.connect(f).connect(g).connect(layers.ocean)}
    layers.wind=bus();{const s=src(pink),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.Q.value=1.2;f.frequency.value=700;lfo(.06,450,f.frequency);g.gain.value=.35;lfo(.13,.2,g.gain);s.connect(f).connect(g).connect(layers.wind)}
    layers.rain=bus();{const s=src(pink),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=2500;g.gain.value=.18;s.connect(f).connect(g).connect(layers.rain)}
    layers.shimmer=bus();[880,1318.5,1760].forEach((fq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=fq;g.gain.value=.006;lfo(.2+i*.07,.006,g.gain);o.connect(g).connect(layers.shimmer);o.start()});
    layers.falls=bus();{const s=src(pink),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),g=ctx.createGain();hp.type='highpass';hp.frequency.value=350;lp.type='lowpass';lp.frequency.value=5200;g.gain.value=.45;s.connect(hp).connect(lp).connect(g).connect(layers.falls)}
    layers.crowd=bus();{const s=src(pink),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=480;f.Q.value=.6;g.gain.value=.25;lfo(.3,.08,g.gain);s.connect(f).connect(g).connect(layers.crowd)}
    layers.birds=bus();layers.beat=bus();const blp=ctx.createBiquadFilter();blp.type='lowpass';blp.frequency.value=320;blp.connect(layers.beat);
    let step=0;setInterval(()=>{if(!on)return;const t=ctx.currentTime+.05;if(step%4===0){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g).connect(blp);o.start(t);o.stop(t+.4)}
      if(step%4===2){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=pink;f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);s.connect(f).connect(g).connect(layers.beat);s.start(t,Math.random()*3);s.stop(t+.08)}step++},60000/92/2);
    setInterval(()=>{if(!on||Math.random()<.45)return;const t=ctx.currentTime+.02,n=2+Math.random()*4|0,base=2400+Math.random()*1800;for(let i=0;i<n;i++){const o=ctx.createOscillator(),g=ctx.createGain(),tt=t+i*.11;o.frequency.setValueAtTime(base,tt);o.frequency.exponentialRampToValueAtTime(base*1.4,tt+.07);g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.05,tt+.01);g.gain.exponentialRampToValueAtTime(.001,tt+.09);o.connect(g).connect(layers.birds);o.start(tt);o.stop(tt+.1)}},1300)}
  function set(n){scene=n;if(!ctx)return;const sc=SC[n]||SC.hq,t=ctx.currentTime;Object.entries(layers).forEach(([k,g])=>{g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(sc[k]||0,t,1.2)})}
  function toggle(force){const want=force!==undefined?force:!on;if(want&&!ctx)build();if(!ctx)return;on=want;if(on)ctx.resume();master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(on?.55:0,ctx.currentTime,.6);$('#sndBtn').classList.toggle('on',on);$('#sndBtn').setAttribute('aria-pressed',on);set(scene)}
  function tone(f,d=.35,v=.05,at=0){if(!on||!ctx)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(master);o.start(t);o.stop(t+d+.05)}
  const tick=f=>tone(f||1320);
  const chord=()=>[660,880,1320].forEach((f,i)=>tone(f,.6,.05,i*.09));
  const loot=()=>[880,1108.7,1318.5,1760,2217.5].forEach((f,i)=>tone(f,.5,.04,i*.07));
  const level=()=>[220,330,440,554.4,659.3,880].forEach((f,i)=>tone(f,1.4,.05,i*.12));
  function whoosh(ms){if(!on||!ctx)return;const t=ctx.currentTime,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=pink;f.type='bandpass';f.Q.value=2;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(2200,t+ms/2000);f.frequency.exponentialRampToValueAtTime(400,t+ms/1000);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+ms/2000);g.gain.linearRampToValueAtTime(0,t+ms/1000);s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+ms/1000+.1)}
  return{toggle,set,tick,chord,loot,level,whoosh,get on(){return on}}})();
})(window.QUEST);
