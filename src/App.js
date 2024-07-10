import { useState, useEffect, useRef } from "react";

function App() {
  function symtoname(sym) {
    return({"":"", "kl":"lowdriver","ku":"updriver","kn":"numdriver","ks":"symdriver","tp":"touchpad","dev":"dev","sw":"shopware",
    "km":"multidriver","bf":"bruteforcer","dg":"devguard","lc":"labcontrol","cm":"coinminer","mb":"mythblock","noteh":"HCK code",
    "notep":"PIN code","notes":"SEC code","noteu":"UNI code","pleak":"powerleak"}[sym])
  }

  function savestate() {
    localStorage.setItem('state',JSON.stringify(vstate.current.map(i => i.getattridict())));
  }

  class Cell {
    constructor(d) {
      this.sel = d.sel || false; //bool: selected?
      this.type = d.type || "e"
      this.def = d.def || false;
      this.celltype= "e"; //e: empty, b: block, l: locked
      this.upgrading = d.upgrading || 0;
      this.loc = d.loc;
      this.latency = d.latency || rdint(1,900);
      this.setlatency = d.setlatency !== undefined && d.setlatency<=2000 ? d.setlatency : Date.now();
      this.latency2 = d.latency2 || rdint(1,900);
      this.setlatency2 = d.setlatency2 !== undefined && d.setlatency<=2000 ? d.setlatency : Date.now();
    }

    itimerf() {}
    itimerf2() {}

    getattridict() {
      return({"sel":this.sel, "type":this.type, "def":this.def, "celltype":this.celltype, "upgrading":this.upgrading,
      "loc":this.loc, "latency":this.latency, "setlatency":this.setlatency, "latency2":this.latency, "setlatency2":this.setlatency})
    }

    cparity() {return 0}
    inuse() {return false}
    usable() {return false}
    movable() {return true}

    dpdetails() {
      return((this.def ? "default " : "")+symtoname(this.type));
    }

    handlekeypress(k,loc) {
      console.log("Cell at",loc,"received keypress ",k);
    }

    getshowtext() {return <></>;}
    getupgradebuttons() {return <></>;}

    getclass() {
      if (this.upgrading!==0) {
        return "upgrading";
      }
      if (vselecting.current!==-1 && vstate.current[vselecting.current].type!=="d" && (this.loc%14===13)) {
        return "blueshade_redhover";
      }
      if (vselecting.current!==-1 && vstate.current[vselecting.current].type!=="d" && (this.type !== 'e' || vstate.current[vselecting.current].movable()===false || vmerging.current!==-1)) {
        return "redhover";
      }
      if (this.loc%14===13) {
        return "blueshade_yellowhover";
      }
      if (this.loc%14===0) {
        return "redshade_yellowhover";
      }
    }

    getstyle() {
      const sd={"borderRadius":"0"};
      if ((vselecting.current===-1 || vstate.current[vselecting.current].type==="d") && this.celltype !== "e") {
        sd["cursor"] = "grab";
      }
      if (vselecting.current!==-1 && vstate.current[vselecting.current].type!=="d" && this.type === 'e' && vstate.current[vselecting.current].movable()===true && vmerging.current===-1 && this.loc%14>0 && this.loc%14!==13) {
        sd["cursor"] = "grabbing";
      }
      if (vselecting.current!==-1 && vstate.current[vselecting.current].type!=="d" && this.loc%14===0) {
        sd["backgroundColor"] = "#FFCCCC";
        sd["borderColor"] = "#e60000";
        sd["cursor"] = "not-allowed";
      }
      if (this.sel) {
        sd["borderColor"] = "#0AA";
        sd["borderStyle"] = "solid";
        sd["borderRadius"] = "2px";
        sd["backgroundColor"] = "#99EDC3";
        sd["zIndex"] = "1";
        if (this.type !== "d") {sd["cursor"] = "grabbing";}
      }
      if (this.celltype !== "e") {
        if (this.type==="dev") {
          if (this.progress[3]>0) {
            sd["backgroundImage"] = "url(./img/blocks/dev/"+this.devicetype.toLowerCase()+"g.gif)";
          }
          else {
            sd["backgroundImage"] = "url(./img/blocks/dev/"+this.devicetype.toLowerCase()+".gif)";
          }
        }
        else {
          sd["backgroundImage"] = "url(./img/blocks/"+this.type+".gif)";
        }
      }
      if (this.type[0]==="n") {
        sd["backgroundImage"] = "url(./img/notes/"+this.type+this.cstatus+".gif)";
      }
      return sd;
    }

    distrans(dir="udlr",active=true,fail=true) {}
  }

  class PLeak extends Cell {
    constructor(d) {
      super(d);
      this.type="pleak";
      this.gonetime=d.gonetime!==undefined ? d.gonetime : rdint(40,59);
      this.minfixtime=d.minfixtime || 30;
      this.fixcost=rdint(150,249);
      this.var=1;
    }

    movable() {return false}

    getattridict() {
      const sd=super.getattridict();
      sd["type"]=this.type;
      sd["gonetime"]=this.gonetime;
      sd["minfixtime"]=this.minfixtime;
      sd["fixcost"]=this.fixcost;
      sd["var"]=this.var;
      return(sd);
    }

    getupgradebuttons() {return this.minfixtime<this.gonetime ? <>Instant fix availiable in⠀<span className="time">{distime(this.gonetime-this.minfixtime)}</span></> :
    <button className={vcash.current<this.fixcost ? "dbutton disabled" : "dbutton"} onClick={() => {sell(-this.fixcost,this.loc);}}>Instant fix<br></br>with ${this.fixcost}</button>}

    itimerf() {
      if (this.gonetime>0) {
        this.gonetime-=1;
      }
      if (this.gonetime===0) {
        sell(0,this.loc);
      }
    }

    dpdetails() {
      return (<>powerleak {"<"}Autofix in <span className="time">{distime(this.gonetime)}</span>{">"}</>);
    }

    getstyle() {
      const sd=super.getstyle();
      sd["backgroundImage"] = "url(./img/pleak"+this.var+".gif)";
      return(sd)
    }
  }

  class Delivery extends Cell {
    constructor(d) {
      super(d);
      this.type="d";
      this.dtype=d.dtype;
      this.dtime=d.dtime || 10;
      this.dsellprice=d.dsellprice !==undefined ? d.dsellprice : 0;
      this.deployarea=d.deployarea;
    }

    itimerf() {
      if (this.dtime>0) {
        this.dtime-=1;
        rfs();
      }
      if (this.dtime===0) {
        this.findelivery();
      }
    }

    getattridict() {
      const sd=super.getattridict();
      sd["type"]=this.type;
      sd["dtype"]=this.dtype;
      sd["dtime"]=this.dtime;
      sd["dsellprice"]=this.dsellprice;
      sd["deployarea"]=this.deployarea;
      sd["deliveryintervalon"]=this.deliveryintervalon;
      return(sd);
    }

    dpdetails() {
      return(<>{"deliverying "+symtoname(this.dtype)+" in "}<span className="time">{distime(this.dtime,true)}</span></>);
    }

    getshowtext() {return (this.dtime!==0 ? <>Delivering...<br></br>({this.dtime})</> : <></>)}

    getclass() {
      if (vselecting.current!==-1 && vstate.current[vselecting.current].type!=="d") {
        return "delivering_redhover";
      }
      else {
        return("delivering");
      }
    }

    getstyle() {
      const sd=super.getstyle();
      sd["backgroundImage"] = (this.dtype[0]==="n" ? "url(./img/notes/"+this.dtype+".gif)" : "url(./img/blocks/"+this.dtype+".gif)");
      return (sd);
    }

    findelivery() {
      const temp = [...vstate.current];
      const tempdev = [...vdeliveryings.current];
      temp[this.deployarea*14+13]=gencell(this.deployarea*14+13,this.dtype,{"sel":this.sel, "sellprice":this.dsellprice});
      tempdev[this.deployarea]=false;
      sstate(temp);
      sdeliveryings(tempdev);
      rfs();
    }
  }

  class GNote {
    constructor(c,gen=false,autotyping=false) {
      this.code=c;
      this.qgen=gen;
      this.autotyping=autotyping;
    }
  }

  class Note extends Cell {
    static bust={"noteh":0, "notes":0, "notep":0, "noteu":0};

    constructor(d) {
      super(d);
      this.written=d.written || false;
      this.writecost=d.writecost || rdint(100,199);
      this.cstatus=d.cstatus || "";
      this.code=d.code || "";
      this.sellprice=d.sellprice || 0;
    }

    getattridict() {
      const sd=super.getattridict();
      sd["written"]=this.written;
      sd["writecost"]=this.writecost;
      sd["cstatus"]=this.cstatus;
      sd["code"]=this.code;
      sd["sellprice"]=this.sellprice;
      return(sd);
    }

    dpdetails() {
      return(<>{({"":"unactivated ","a":"activated ","u":"used "}[this.cstatus])+symtoname(this.type)}{this.cstatus===""?<></>:<> {"<"}<span className="codeinput">{this.code}</span>{">"}</>}</>);
    }

    getdetailsbuttons() {
      return <>
      {this.cstatus==="a" ? <>
      {this.written ? <></> :<button className={this.writecost<=vcash.current ? "dbutton xlongb" : "dbutton xlongb disabled"} onClick={() => {buy("write",this.writecost);}}>Write to globalcodes<br></br>with ${this.writecost}</button>}
      <button className="dbutton longb redhoveronly" onClick={() => {discardcode(this.type,this.code,"deactivate"); this.cstatus=""; rfs();}}>Deactivate</button>
      </>
      : this.cstatus==="u" ? <button className="dbutton" onClick={() => {sell(0);}}>Discard</button>
      : <>{Note.bust[this.type]>=10? <button className="dbutton disabled xxlongb">Cannot Activate<br></br>(Too many active {symtoname(this.type)}s)</button> :
      <button className="dbutton" onClick={() => {this.activate();}}>Activate</button>}
      <button className="dbutton redhoveronly" onClick={() => {discardcode(this.type,this.code,"discard"); sell(this.sellprice);}}>Discard{this.sellprice>0 ? <><br></br>for ${this.sellprice}</> : <></>}</button></>}
      </>
    }

    upgrade(c) {
      if (c==="write") {
        this.written=true;
        const temp={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
        temp[this.type].push(new GNote(this.code));
        sgcodedb(temp);
        rfs();
      }
    }

    activate() {
      if (this.code==="") {
        this.code=rdcode(Math.min(9,Math.max(1,rdint(-1,1)+Math.ceil(Math.max(vdiff.current-20,1)/4))));
        while (vggcodedb.current[this.type].includes(this.code) || vggcodedb.current["noteu"].includes(this.code)) {
          this.code=rdcode(Math.min(9,Math.max(1,rdint(-1,1)+Math.ceil(Math.max(vdiff.current-20,1)/4))));
        }
      }
      if (this.written===true) {
        const temp={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
        temp[this.type].push(new GNote(this.code));
        sgcodedb(temp);
        rfs();
      }
      const temp={"noteh":[...vcodedb.current["noteh"]], "notes":[...vcodedb.current["notes"]], "notep":[...vcodedb.current["notep"]], "noteu":[...vcodedb.current["noteu"]]};
      temp[this.type].push(new GNote(this.code));
      scodedb(temp);



      Note.bust[this.type]+=1;
      const temp2={"noteh":[...vggcodedb.current["noteh"]], "notes":[...vggcodedb.current["notes"]], "notep":[...vggcodedb.current["notep"]], "noteu":[...vggcodedb.current["noteu"]]};
      if (!temp2[this.type].map(note => note.code).includes(this.code)) {
        temp2[this.type].push(new GNote(this.code));
        sggcodedb(temp2);
      }
      this.cstatus="a";
      rfs();
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.written) {sd["backgroundImage"]="url(./img/gears/global"+this.cstatus+".gif), "+sd["backgroundImage"];}
      return sd;
    }
  }

  function discardcode(t,c,r) {
    const temp={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
    temp[t]=temp[t].filter((i) => {return i.code!==c});
    sgcodedb(temp);
    const temp2={"noteh":[...vcodedb.current["noteh"]], "notes":[...vcodedb.current["notes"]], "notep":[...vcodedb.current["notep"]], "noteu":[...vcodedb.current["noteu"]]};
    temp2[t]=temp2[t].filter((i) => {return i.code!==c});
    scodedb(temp2);
    const statetemp=[...vstate.current];
    for (let i=0; i<70; i++) {
      if (statetemp[i].type==="dev" && statetemp[i].autotypingcodetype[0]===t && statetemp[i].autotypingcode[0]===c) {
        statetemp[i].autotypingcodetype[0]="";
        statetemp[i].autotypingcode[0]="";
      }
      if (statetemp[i].type==="dev" && statetemp[i].autotypingcodetype[1]===t && statetemp[i].autotypingcode[1]===c) {
        statetemp[i].autotypingcodetype[1]="";
        statetemp[i].autotypingcode[1]="";
      }
    }
    sstate(statetemp);
    Note.bust[t]=temp2[t].length;
    if (r==="used") {
      const temp3={"noteh":[...vggcodedb.current["noteh"]], "notes":[...vggcodedb.current["notes"]], "notep":[...vggcodedb.current["notep"]], "noteu":[...vggcodedb.current["noteu"]]};
      temp3[t]=temp3[t].filter((i) => {return i.code!==c});
      sggcodedb(temp3);
      const temp4 = [...vstate.current];
      for (let i=0; i<69; i++) {
        if (temp4[i].type===t && temp4[i].code===c) {
          temp4[i].cstatus="u";
          break;
        }
      }
      sstate(temp4);
    }
    console.log(temp2);
    console.log(Note.bust);
    rfs();
  }

  class Block extends Cell {
    constructor(d) {
      super(d);
      if ("def" in d) {
        this.u = d.def;
        this.d = d.def;
        this.l = d.def;
        this.r = d.def;
      }
      if ("udlr" in d) {
        this.u = d.udlr[0] || false; //bool: Up connection?
        this.d = d.udlr[1] || false; //bool: Down connection?
        this.l = d.udlr[2] || false; //bool: Left connection?
        this.r = d.udlr[3] || false; //bool: Right connection?
      }
      this.celltype="b";
      this.buildcost = d.buildcost || [rdint(200,299),rdint(200,299),rdint(200,299),rdint(200,299)];
      this.sellprice = d.sellprice || rdint(400,599); //sell cost or forcewipe price
      this.upgradetime = d.upgradetime || [15,30,45,60];
      this.level=d.level || 1;
      this.transcon=d.transcon || {"u":false, "d":false, "l":false, "r":false};
      this.tobeupgraded=d.tobeupgraded || ""
    }

    getattridict() {
      const sd=super.getattridict();
      sd["udlr"]=[this.u, this.d, this.l, this.r];
      sd["celltype"]="b";
      sd["buildcost"]=[...this.buildcost];
      sd["sellprice"]=this.sellprice;
      sd["upgradetime"]=this.upgradetime;
      sd["level"]=this.level;
      sd["transcon"]={...this.transcon};
      sd["tobeupgraded"]=this.tobeupgraded;
      return(sd);
    }

    cparity() {return 1}

    usable() {return(this.upgrading===0);}

    getshowtext() {return (this.upgrading!==0 ? <>Upgrading...<br></br>({this.upgrading})</> : <></>)}

    getconnectedparts() {
      const st=vstate.current;
      const j=this.loc;
      const conto={};
      if (st[j].u && j>13 && st[j-14].d===true && st[j].cparity()+st[j-14].cparity()===3 && st[j-14].usable() && st[j].usable()) {
        conto["u"]=st[j-14];
      }
      if (st[j].d && j<56 && st[j+14].u===true && st[j].cparity()+st[j+14].cparity()===3 && st[j+14].usable() && st[j].usable()) {
        conto["d"]=st[j+14];
      }
      if (st[j].l && j%14!==0 && st[j-1].r===true && st[j].cparity()+st[j-1].cparity()===3 && st[j-1].usable() && st[j].usable()) {
        conto["l"]=st[j-1];
      }
      if (st[j].r && j%14!==13 && st[j+1].l===true && st[j].cparity()+st[j+1].cparity()===3 && st[j+1].usable() && st[j].usable()) {
        conto["r"]=st[j+1];
      }
      return conto;
    }

    getstyle() {
      const sd=super.getstyle();
      var bg=sd["backgroundImage"];
      var temp="";
      for (let i=0; i<4; i++) {
        if ([this.u, this.d, this.l, this.r][i]) {
          temp="udlr"[i]+this.cparity();
          if ("udlr"[i] in this.getconnectedparts()) {
            if (this.transcon["udlr"[i]]) {temp+="t";} else {temp+="o";}
          }
          bg+=", url(./img/connects/"+temp+".gif)";
        }
      }
      if (this.def) {bg="url(./img/gears/def.gif), "+bg;}
      if (!this.movable()) {bg="url(./img/blocks/inmov.gif), "+bg;}
      sd["backgroundImage"] = bg;
      return (sd);
    }

    itimerf() {
      if (this.upgrading>0) {
        this.upgrading-=1;
        console.log(this.loc,this.upgrading);
        rfs();
        if (this.upgrading<=0) {
          this.completeupgrade(this.tobeupgraded);
          this.tobeupgraded="";
        }
      }
    }

    upgrade(c) {
      this.tobeupgraded=c;
      this.setlatency = Date.now();
      this.upgrading=this.upgradetime[Math.min(this.level-1,this.upgradetime.length-1)];
    }

    completeupgrade(c) {}

    distrans(dir="udlr",active=true,fail=true) {
      for (let i=0; i<dir.length; i++) {
        this.transcon[dir[i]]=false;
        if (active) {
          const pos=this.loc+{"u":-14, "l":-1, "r":1, "d":14}[dir[i]];
          if (0<=pos && pos<=69 && vstate.current[pos].celltype==="b") {
            vstate.current[pos].distrans({"u":"d", "l":"r", "r":"l", "d":"u"}[dir[i]],false)
          }
        }
      }
      rfs();
    }
  }

  class Driver extends Block {
    constructor(d) {
      super(d);
      this.buildcost[4]+=(this.buildcost[0]+this.buildcost[1]+this.buildcost[2]+this.buildcost[3]);
    }

    getattridict() {
      const sd=super.getattridict();
      sd["buildcost"]=[...this.buildcost];
      return(sd);
    }

    getupgradebuttons() {
      const cost=this.buildcost[3+this.level];
      return (<>
      {this.def ? <button className="dbutton disabled">Cannot<br></br>Merge</button> :
      <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("mer",cost);}}>Merge to Multidriver<br></br>with ${cost}</button>}
      </>);
    }

    upgrade(c) {
      if (c==="mer") {
        smerging(this.buildcost[4]);
      }
    }
  }

  class Touchpad extends Block {}

  class Multidriver extends Block {
    constructor(d) {
      super(d);
      this.drivers=d.drivers || [];
      this.capacity=Math.max(this.drivers.length,1);
    }

    getattridict() {
      const sd=super.getattridict();
      sd["drivers"]=this.drivers;
      sd["capacity"]=this.capacity;
      return(sd);
    }

    dpdetails() {
      return(symtoname(this.type)+" <cap:"+this.capacity+"/4>");
    }

    mergable(d) {
      if (!this.usable() || this.capacity<=this.drivers.length || this.drivers.includes(d)) {return false;}
      return(["kl","ku","kn","ks"].includes(d))
    }

    getclass() {
      if (vmerging.current!==-1 && this.mergable(vstate.current[vselecting.current].type)) {return "nullclass";}
      else {return super.getclass();}
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.drivers.includes("kl")) {sd["backgroundImage"] = "url(./img/blocks/kml.gif), "+sd["backgroundImage"];}
      if (this.drivers.includes("ku")) {sd["backgroundImage"] = "url(./img/blocks/kmu.gif), "+sd["backgroundImage"];}
      if (this.drivers.includes("kn")) {sd["backgroundImage"] = "url(./img/blocks/kmn.gif), "+sd["backgroundImage"];}
      if (this.drivers.includes("ks")) {sd["backgroundImage"] = "url(./img/blocks/kms.gif), "+sd["backgroundImage"];}
      if (this.capacity>=1) {sd["backgroundImage"] = "url(./img/gears/g1"+(this.drivers.length>=1 ? "r" : "d")+".gif), "+sd["backgroundImage"];}
      if (this.capacity>=2) {sd["backgroundImage"] = "url(./img/gears/g2"+(this.drivers.length>=2 ? "r" : "d")+".gif), "+sd["backgroundImage"];}
      if (this.capacity>=3) {sd["backgroundImage"] = "url(./img/gears/g3"+(this.drivers.length>=3 ? "r" : "d")+".gif), "+sd["backgroundImage"];}
      if (this.capacity>=4) {sd["backgroundImage"] = "url(./img/gears/g4"+(this.drivers.length>=4 ? "r" : "d")+".gif), "+sd["backgroundImage"];}
      return(sd);
    }

    mergewith(d,cost) {
      if (this.mergable(d)) {this.drivers.push(d); this.sellprice+=cost; rfs();}
      return (this.mergable(d))
    }
    
    getupgradebuttons() {
      const cost=this.buildcost[3+this.level];
      const utime=this.upgradetime[Math.min(this.level-1,this.upgradetime.length-1)];
      return (<>
      {this.capacity===4 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("cap",cost);}}>Upgrade Capacity<br></br>with ${cost} ({utime}s)</button>}
      </>);
    }

    completeupgrade(c) {
      this.level+=1;
      if (c==="cap") {this.capacity+=1;}
    }
  }

  class Bruteforcer extends Block {
    constructor(d) {
      super(d);
      this.upath=d.upath || 0;
      this.brutetime=d.brutetime!==undefined ? d.brutetime : 5 ; //4 3 2 1
      this.break2p= d.break2p || 0; //40 70 100 100
      this.break3= d.break3 || 0; //10 30 50 80
      this.auto= d.auto || 0; //10 12 15 20 -> 300
    }

    getattridict() {
      const sd=super.getattridict();
      sd["upath"]=this.upath;
      sd["brutetime"]=this.brutetime;
      sd["break2p"]=this.break2p;
      sd["break3"]=this.break3;
      sd["auto"]=this.auto;
      return(sd);
    }

    dpdetails() {
      return(symtoname(this.type)+" <"+["","powerbreak, ","autotype, "][this.upath]+"lvl:"+this.level+"/5>");
    }

    getupgradebuttons() {
      const cost=this.buildcost[3+this.level];
      const utime=this.upgradetime[Math.min(this.level-1,this.upgradetime.length-1)];
      return <>
      {this.upath===2 || this.level===5 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("pb",cost);}}>Upgrade Powerbreak<br></br>with ${cost} ({utime}s)</button>}
      {this.upath===1 || this.level===5 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("at",cost);}}>Upgrade Autotype<br></br>with ${cost} ({utime}s)</button>}
      </>;}

    completeupgrade(c) {
      this.level+=1;
      this.brutetime=[7,5,4,3,2,1][this.level];
      if (c==="pb") {this.upath=1; this.break2p=[0,0,40,70,100,100][this.level]; this.break3=[0,0,10,30,50,80][this.level];}
      else if (c==="at") {this.upath=2; this.auto=[0,0,10,12,15,20][this.level];}
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.level>=2) {sd["backgroundImage"] = "url(./img/blocks/bf"+(this.upath===1 ? "pi" : "ai")+".gif), "+sd["backgroundImage"];}
      if (this.level>=2) {sd["backgroundImage"] = "url(./img/gears/g1"+(this.upath===1 ? "r" : "b")+".gif), "+sd["backgroundImage"];}
      if (this.level>=3) {sd["backgroundImage"] = "url(./img/gears/g2"+(this.upath===1 ? "r" : "b")+".gif), "+sd["backgroundImage"];}
      if (this.level>=4) {sd["backgroundImage"] = "url(./img/gears/g3"+(this.upath===1 ? "r" : "b")+".gif), "+sd["backgroundImage"];}
      if (this.level>=5) {sd["backgroundImage"] = "url(./img/gears/g4"+(this.upath===1 ? "r" : "b")+".gif), "+sd["backgroundImage"];}
      return(sd);
    }
  }

  class DevGuard extends Block {
    constructor(d) {
      super(d);
      this.codediff= d.codediff || 1; //2 3
      this.cracklvl= d.cracklvl || 1; //2 3
      this.loadtime= d.loadtime || 10; //7 4
      this.condir= d.condir || "";
      this.loadingtime= d.loadingtime || 0;
    }

    getattridict() {
      const sd=super.getattridict();
      sd["codediff"]=this.codediff;
      sd["cracklvl"]=this.cracklvl;
      sd["loadtime"]=this.loadtime;
      sd["condir"]=this.condir;
      sd["loadingtime"]=this.loadingtime;
      return(sd);
    }

    inuse() {return this.loadingtime!==0;}

    dpdetails() {
      return(symtoname(this.type)+" <sim:"+this.codediff+"/3, ext:"+this.cracklvl+"/3>");
    }

    getshowtext() {return (this.loadingtime>0 ? <><span className="whitebgsfont">Transferring...</span><br></br><span className="whitebgsfont">({this.loadingtime})</span></> : super.getshowtext())}

    getupgradebuttons() {
    const cost=this.buildcost[3+this.level];
    const utime=this.upgradetime[Math.min(this.level-1,this.upgradetime.length-1)];
    return (<>
    {this.codedif===3 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("sim",cost);}}>Upgrade Simplicity<br></br>with ${cost} ({utime}s)</button>}
    {this.cracklvl===3 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("ext",cost);}}>Upgrade Extensions<br></br>with ${cost} ({utime}s)</button>}
    </>);
    }

    completeupgrade(c) {
      this.level+=1;
      if (c==="sim") {this.codediff+=1; this.loadtime=[10,7,4][this.codediff-1];}
      else if (c==="ext") {this.cracklvl+=1;}
    }

    distrans(dir="udlr",active=true, fail=true) {
      if (dir.includes(this.condir)) {
        this.condir="";
        this.loadingtime=0;
      }
      super.distrans(dir,active,fail)
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.codediff>=2) {sd["backgroundImage"] = "url(./img/gears/g1r.gif), "+sd["backgroundImage"];}
      if (this.codediff>=3) {sd["backgroundImage"] = "url(./img/gears/g2r.gif), "+sd["backgroundImage"];}
      if (this.cracklvl>=2) {sd["backgroundImage"] = "url(./img/gears/g3b.gif), "+sd["backgroundImage"];}
      if (this.cracklvl>=3) {sd["backgroundImage"] = "url(./img/gears/g4b.gif), "+sd["backgroundImage"];}
      return(sd);
    }
  }

  function randchoice(arr,count) {
    return(arr.sort(() => 0.5 - Math.random()).slice(0,count));
  }

  function rdvir(s,n) {
    var o='';
    var b4space=0;
    const vircount = Math.ceil(s.length*n/8); //n
    const virloc=randchoice([...Array(s.length-1).keys()],vircount);
    for (let i = 0; i < s.length; i++) {
      if (s[i]===" ") {
        o+=" ";
        b4space-=1;
      }
      else {
        if (virloc.includes(i+b4space)) {
          o+="☣";
        }
        else {
          if (Math.random()<0.5) {
            o+=s[i].toUpperCase();
          }
          else {
            o+=s[i].toLowerCase();
          }
        }
      }
    }
    return o;
  }

  class ShowBlock extends Block {
    constructor(d) {
      super(d);
      this.vertified= d.vertified || false;
      this.autotypeprogress= d.autotypeprogress || 0;
    }

    itimerf() {
      super.itimerf();
      if (this.autotypeprogress<300) {
        this.autotypeprogress+=this.getbrute(3);
      }
      if (this.autotypeprogress>=300 && this.getbrute(3)>0) {
        if (this.autotype()) {
          this.autotypeprogress=0;
        }
      }
    }

    getattridict() {
      const sd=super.getattridict();
      sd["vertified"]=this.vertified;
      sd["autotypeprogress"]=this.autotypeprogress;
      return(sd);
    }

    cparity() {return 2}
    getscreen() {
      console.log("Getting screen from "+this.type+" at "+this.loc);
      return(<>Getting screen from {this.type} at {this.loc}</>)
    }

    autotype() {return true;}

    getbrute(i) {
      const conparts=this.getconnectedparts();
      var d=[6,0,0,0];
      for (let i = 0; i < 4; i++) {
        if ("udlr"[i] in conparts) {
          if (conparts["udlr"[i]].type==='bf') {d[0]=Math.min(d[0],conparts["udlr"[i]].brutetime); d[1]=Math.max(d[1],conparts["udlr"[i]].break2p);
          d[2]=Math.max(d[2],conparts["udlr"[i]].break3); d[3]=Math.max(d[3],conparts["udlr"[i]].auto);}
        }
      }
      return d[i];
    }

    getdrivers() {
      const conparts=this.getconnectedparts();
      const add=['','','',''];
      for (let i = 0; i < 4; i++) {
        if ("udlr"[i] in conparts) {
          if (conparts["udlr"[i]].type==='kl' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("kl"))) {add[0]='a';}
          if (conparts["udlr"[i]].type==='ku' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("ku"))) {add[1]='A';}
          if (conparts["udlr"[i]].type==='kn' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("kn"))) {add[2]='1';}
          if (conparts["udlr"[i]].type==='ks' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("ks"))) {add[3]='!';}
        }
      }
      const o='('+add.join("")+')';
      return(o==='()'? "None":o);
    }

    gettypeable() {
      const conparts=this.getconnectedparts();
      var o='';
      for (let i = 0; i < 4; i++) {
        if ("udlr"[i] in conparts) {
          if (conparts["udlr"[i]].type==='kl' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("kl"))) {o+='qwertyuiopasdfghjklzxcvbnm';}
          if (conparts["udlr"[i]].type==='ku' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("ku"))) {o+='QWERTYUIOPASDFGHJKLZXCVBNM';}
          if (conparts["udlr"[i]].type==='kn' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("kn"))) {o+='1234567890';}
          if (conparts["udlr"[i]].type==='ks' || (conparts["udlr"[i]].type==="km" && conparts["udlr"[i]].drivers.includes("ks"))) {o+='~!@#$%^&*()+`-={}[]:;<>?,./';}
        }
      }
      return(o);
    }
  }

  class LabControl extends ShowBlock {
    getscreen() {
      return (<>
        <div className="screenlabel">Lab control</div>
        <div id="labcontrolbg"></div></>)
    }
  }

  class CoinMiner extends ShowBlock {
    constructor(d) {
      super(d);
      this.codediff=1;
      this.minespeed=1;
      this.partstate=[-1,-1];
      this.starting=[false,false]
      this.startingtime=[0,0];
      this.mineprog=[0,0];
      this.reward=[];
      this.codes=[[],[]];
      this.inputboxs = ["",""];
      this.inputnote = ["⚠ no suitable drivers supporting input 'a'",-1]
    }

    getshowtext() {}

    codeammend(i,code,rec=false) {}

    autotype() {}

    startmining(t,n) {
      if (t===0) {this.startminee(n); return;}
      this.startingtime[n]=t;
      const startingInterval = setInterval(()=> {if (vtimeon.current) {
        this.startingtime[n]-=1;
        if (this.startingtime[n]<=0) {
          clearInterval(startingInterval);
          this.startmine(n);
        }
        rfs();
      }} ,1000)
    }

    startmine(n) {
      this.starting[n]=false;
      this.inputboxs[n]="";
      var addprog=1;
      const ran=rdint(0,99);
      if (ran<this.getbrute(2)) {addprog=3;}
      else if (ran<this.getbrute(1)) {addprog=2;}
      this.partstate[n]=Math.min(this.codes[n].length,this.partstate[n]+addprog); 
      //if complete, go to mining
      rfs();
    }

    handlesubmit(n) {
      if ("⠀"+this.inputboxs[n]+"⠀"===this.codes[this.partstate[n]]) {
        this.starting[n]=true;
        setTimeout(() => {
          this.startmining(this.getbrute(0),n);
        },rdint(1,199));
        rfs();
      }
      else {
        this.inputnote[0]="⚠ Incorrect code";
        this.inputnote[1]=n;
        rfs();
      }
    }

    handlekeypress(k,loc) {
      if (!this.decrypting[loc]) {
        var newwarn=""; //⚠ no drivers supporting input 'a'
        if (k==="Enter") {this.handlesubmit(loc);}
        if (k==="Backspace") {
          this.inputboxs[loc]=this.inputboxs[loc].slice(0,this.inputboxs[loc].length-1);
          this.inputnote[0]=newwarn;
          this.inputnote[1]=loc;
        }
        if (k.length===1 && this.inputboxs[loc].length!==8) {
          if (this.gettypeable().includes(k)) {
            this.inputboxs[loc]+=k;
          }
          else {
            newwarn="⚠ no suitable drivers supporting input '"+k+"'";
          }
          this.inputnote[0]=newwarn;
          this.inputnote[1]=loc;
        }
        rfs();
      }
    }

    getbuttonstyle(n,inputbox) {
      const sd={};
      if (this.decrypting[n]) {return sd;}
      if (inputbox==="" && (this.loc!==vfselecting.current[0] || n!==vfselecting.current[1])) {sd["color"]="#888";}
      if (vfselecting.current[0] === this.loc && vfselecting.current[1]===n) {
        sd["border"] = "#0AA";
        sd["borderStyle"] = "solid";
        sd["backgroundColor"] = "#99EDC3";
        sd["zIndex"] = "1";
      }
      return (sd);
    }

    displayins(code,n) {
      if (code.includes(" code")) { //globalnotes code
        return(<div className="virusins">𐤏 Input {code} to start mining {["UFC","CSC"][n]} ({this.partstate[n]}/{this.codes[n].length}):</div>)
      }
      else {
        return(<div className="virusins">𐤏 Type <span className="codeinput">{code}</span> to start mining {["UFC","CSC"][n]} ({this.partstate[n]}/{this.codes[n].length}):</div>)
      }
    }

    inputboxtext(code,inputbox, n) {
      if (this.loc!==vfselecting.current[0] || n!==vfselecting.current[1]) {
        if (inputbox==="") {
          if (code.includes(" code")) { //globalnotes code
            return('input '+code+' here');
          }
          else {
            return('type "'+code+'" here');
          }
        }
        return inputbox;
      }
      else {
        if (inputbox.length===8) {
          return inputbox;
        }
        return (inputbox+"_");
      }
    }

    displayinputbox(code,inputbox,n) {
      return(<div className="codeinputboxdiv linemargin">
      <button className={this.decrypting[n] ? "loading codeinputbox":"codeinputbox"} onClick={() => {sfselecting([this.loc,n]); rfs();}} style={this.getbuttonstyle(n,inputbox)}>
      {this.inputboxtext(code,inputbox,n)}</button>
      <button className={this.decrypting[n] ? "loading submitcodebtn":"submitcodebtn"} onClick={() => this.handlesubmit(n)}>
      {this.starting[n] ? "STARTING..." : "START"}</button>
      </div>);
    }

    getpart(n) {
      if (this.partstate[n]===-1) { //ready
        return(<></>)
      }
      else if (this.partstate[n]===2) { //cracking
        return(<></>)
      }
      else if (this.partstate[n]===3) { //reseting
        return(<></>)
      }
      else { //typing start
        return(<><div className="linemargin">{this.displayins(this.codes[n][this.partstate[0]],n)}</div>
        {this.displayinputbox(this.codes[n][this.partstate[0]],this.inputboxs[n],n)}
        <div className="warnnote">{this.inputnote[1]===n ? this.inputnote[0] : ""}</div></>)
      }
    }

    getscreen() {
      return (<>
        <div className="screenlabel">Mine for more cash!</div>
        {this.getpart(0)}{this.getpart(1)}
        <div id="coinminerbg"></div></>)
    }
  }

  class Shopware extends ShowBlock {
    constructor(d) {
      super(d);
      this.prices=d.prices || [rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),
        rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(600,799),0,0,0,rdint(150,249)];
      this.buying=d.buying !==undefined ? d.buying : -1;
      this.warnnote=d.warning || "";
      this.explainnote=<>{"{Hover over an item for more information.}"}</>;
      this.service=d.service || 1;
      this.stock=d.stock || 1;
      this.locked=d.locked || [true,true,true,true,true,false,true,true,true,true,true,true,false,false,false,true];
      this.keycount=d.keycount!==undefined ? d.keycount : 2; //2
      this.loadtime=d.loadtime || 3;
      this.dtime=d.dtime || 10;
      this.orderingtime=d.orderingtime || -1;
      this.penddeployarea = d.penddeployarea || 0;
    }

    getattridict() {
      const sd=super.getattridict();
      sd["prices"]=this.prices;
      sd["buying"]=this.buying;
      sd["warnnote"]=this.warnnote;
      sd["service"]=this.service;
      sd["stock"]=this.stock;
      sd["locked"]=[...this.locked];
      sd["keycount"]=this.keycount;
      sd["loadtime"]=this.loadtime;
      sd["dtime"]=this.dtime;
      sd["orderingtime"]=this.orderingtime;
      sd["penddeployarea"]=this.penddeployarea;
      return(sd);
    }

    inuse() {return this.buying!==-1;}

    dpdetails() {
      return(symtoname(this.type)+" <ser:"+this.service+"/3, stk:"+this.stock+"/3>");
    }

    refreshprices() {
      this.prices=[[rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(900,1099),rdint(600,799),0,0,0,rdint(150,249)],
                  [rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(750,949),rdint(500,699),0,0,0,rdint(100,299)],
                  [rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(600,799),rdint(400,599),0,0,0,rdint(50,149)]][this.service-1];
    }

    handlehover(i) {
      var explain;
      if (i===-1) {
        this.explainnote=<>{"{Hover over an item for more information.}"}</>;
        rfs();
        return;}
      explain=[" lowdriver, allows lowercase inputs for connected components."," updriver, allows uppercase inputs for connected components.",
      " numdriver, allows connected components to input digits."," symdriver, allows connected components to input symbols."," touchpad, provides graphical interfaces for connected components.",
      " shopware, allows purchase of resources."," multidriver, merges multiple drivers together."," bruteforcer, increases processor efficiency of connected devices.",
      " devguard, allows connected devices to upgrade safty softwares."," labcontrol, manages lab breachs and exploits."," coinminer, uses drivers to mine coins and gain cash."
      ," mythblock, becomes a random block."," HCK code, generates a one time use HCK code."," PIN code, generates a one time use PIN code."," SEC code, generates a one time use SEC code."
      ," UNI code, generates a one time use UNI code."][i];
      this.explainnote=<>{"{"}{this.locked[i] ? <>Unlock</> : <span className="cash">${this.prices[i]}</span>}{explain}{"}"}</>;
      rfs();
    }

    handlebutton(i) {
      function deliveryarea(st) {
        for (let k=0; k<5; k++) {
          if (st[k*14+13].type==="e") {return k;}
        }
        return -1;
      }
      if (this.buying===-1 && this.locked[i]) {
        if (this.keycount>0) {
          if (i===9 || i===10) {
            this.warnnote="⚠ Work in progress (will be unlocked in future updates)";
          }
          else {
            this.keycount-=1;
            this.locked[i]=false;
          }
        }
        else {
          if (this.stock<3) {
            this.warnnote="⚠ Upgrade stock or buy a new shopware to unlock more resources";
          }
          else {
            this.warnnote="⚠ Buy a new shopware to unlock more resources";
          }
        }
      }
      else if (this.buying===-1) {
        const deployarea=deliveryarea(vstate.current);
        if (this.prices[i]>vcash.current) {
          this.warnnote="⚠ Not enough cash";
        }
        else if (deployarea===-1) {
          this.warnnote="⚠ Delivery Zone full";
        }
        else {
          this.buying=i;
          this.warnnote="";
          scash(vcash.current-this.prices[i]);
          this.penddeployarea=deployarea;
          this.setlatency = Date.now();
          this.orderingtime=this.loadtime;
        }
      }
      rfs();
    }

    itimerf() {
      super.itimerf();
      if (this.orderingtime>0) {
        this.orderingtime-=1;
      }
      if (this.orderingtime===0) { //finished ordering
        const temp = [...vstate.current];
        const tempdev = [...vdeliveryings.current];
        temp[this.penddeployarea*14+13]=new Delivery({"loc": this.penddeployarea*14+13,"type": "d", "dtype":["kl","ku","kn","ks","tp","sw","km","bf","dg","lc","cm","mb","noteh","notep","notes","noteu"][this.buying],
        "dtime":this.dtime, "deployarea":this.penddeployarea, "dsellprice": this.prices[this.buying]===0 ? 0: (Math.floor(this.prices[this.buying]/2)+rdint(-10,9))});
        tempdev[this.penddeployarea]=true;
        this.buying=-1;
        sstate(temp);
        sdeliveryings(tempdev);
        this.refreshprices();
        rfs();
        this.orderingtime=-1;
        this.penddeployarea=0;
      }
    }

    getbuttonclass (i) {
      if (this.buying!==-1) {
        return("loading");
      }
      if (this.prices[i]>vcash.current && !this.locked[i]) {
        return("disabled");
      }
      return "";
    }

    getbuttonstyle (i) {
      const sd={};
      sd["borderWidth"]=0;
      if (i<12) {
        sd["fontSize"]="min(0.9vw,1.8vh)";
        sd["backgroundImage"]="url(./img/blocks/"+["kl","ku","kn","ks","tp","sw","km","bf","dg","lc","cm","mb"][i]+".gif)";
        if (this.prices[i]>vcash.current && this.buying===-1 && !this.locked[i]) {
          sd["opacity"]=0.5;
        }
        if (this.buying!==-1 && this.buying!==i) {
          sd["opacity"]=0.5;
        }
      }
      else {
        if (this.prices[i]>vcash.current && this.buying===-1 && !this.locked[i]) {
          sd["backgroundColor"]="#cccccc";
        }
        if (this.buying!==-1 && this.buying!==i) {
          sd["backgroundColor"]="#cccccc";
        }
      }
      if (this.buying===i) {
        sd["backgroundColor"] = "#99EDC3";
      }
      if (this.locked[i] && this.buying===-1) {
        sd["backgroundColor"] = "#bbbbbb";
        if (this.keycount===0) {
          if (i<12) {sd["opacity"]=0.5;}
          else {sd["backgroundColor"] = "#cccccc"}
          sd["cursor"]="not-allowed";
        }
      }
      return(sd);
    }

    getbutton(i) {
      if (i<12) {
        return(<td colSpan="4" className="shopblock"><button style={this.getbuttonstyle(i)} className={this.getbuttonclass(i)} onMouseEnter={() => this.handlehover(i)} 
        onClick={() => this.handlebutton(i)}>{this.locked[i] ? <span className="whitebgfont">🔒</span> : <span className="cash whitebgfont">${this.prices[i]}</span>}</button></td>)
      }
      else {
        return(<td colSpan="6" className="shopcode"><button style={this.getbuttonstyle(i)} className={this.getbuttonclass(i)} onMouseEnter={() => this.handlehover(i)} 
        onClick={() => this.handlebutton(i)}>{this.locked[i] ? <span className="whitebgfont">🔒</span> : <span className="cash">${this.prices[i]}</span>} {["HCK","PIN","SEC","UNI"][i-12]} #</button></td>)
      }
    }

    getupgradebuttons() {
      const cost=this.buildcost[3+this.level];
      const utime=this.upgradetime[Math.min(this.level-1,this.upgradetime.length-1)];
      return <>
      {this.service===3 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("ser",cost);}}>Upgrade Service<br></br>with ${cost} ({utime}s)</button>}
      {this.stock===3 ? <></> : <button className={vcash.current<cost ? "dbutton disabled longb" : "dbutton longb"} onClick={() => {buy("stock",cost);}}>Upgrade Stock<br></br>with ${cost} ({utime}s)</button>}
      </>;}

    completeupgrade(c) {
      this.level+=1;
      if (c==="ser") {this.service+=1; this.loadtime=[3,2,1][this.service-1]; this.dtime=[10,6,2][this.service-1]; this.refreshprices();}
      else if (c==="stock") {this.stock+=1; this.keycount+=3;}
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.service>=2) {sd["backgroundImage"] = "url(./img/gears/g1r.gif), "+sd["backgroundImage"];}
      if (this.service>=3) {sd["backgroundImage"] = "url(./img/gears/g2r.gif), "+sd["backgroundImage"];}
      if (this.stock>=2) {sd["backgroundImage"] = "url(./img/gears/g3b.gif), "+sd["backgroundImage"];}
      if (this.stock>=3) {sd["backgroundImage"] = "url(./img/gears/g4b.gif), "+sd["backgroundImage"];}
      return(sd);
    }

    getscreen() {
      return (<>
        <div className="screenlabel">Click to buy! ({this.keycount}🔑)</div>
        <div className="scanware linemargin">{this.buying===-1 ? this.explainnote : "{Currently buying "+symtoname(["kl","ku","kn","ks","tp","sw","km","bf","dg","lc","cm","mb","noteh","notep","notes","noteu"][this.buying])+"}"}</div>
        <table onMouseLeave={() => this.handlehover(-1)} className={this.buying!==-1 ? "loading shoptable" : "shoptable"}>
          <tbody>
            <tr>
              {this.getbutton(12)}
              {this.getbutton(13)}
              {this.getbutton(14)}
              {this.getbutton(15)}
            </tr>
            <tr>
              {this.getbutton(0)}
              {this.getbutton(1)}
              {this.getbutton(2)}
              {this.getbutton(3)}
              {this.getbutton(4)}
              {this.getbutton(5)}
            </tr>
            <tr>
              {this.getbutton(6)}
              {this.getbutton(7)}
              {this.getbutton(8)}
              {this.getbutton(9)}
              {this.getbutton(10)}
              {this.getbutton(11)}
            </tr>
          </tbody>
        </table>
        <div className="warnnote">{this.warnnote}</div>
        <div id="shopwarebg"></div></>)
    }
  }

  class Device extends ShowBlock {
    constructor(d) {
      super(d);
      this.customer = d.customer || ["Alexia", "Ulfred", "Daniel", "Angela", "Victor", "Fox", "Pilot"][rdint(0,6)];
      this.devicetype = d.devicetype || ["iPhone","phone","MacBook","laptop","XBox","PS4", "PS5", "tablet","iPad", "mobile","robot","camera","PC", "iMac"][rdint(0,13)];
      this.codes = d.codes; // max 2*3 matrix
      this.inputboxs = d.inputboxs || ["","",""];
      this.progress = d.progress || [0,0,0,0];
      this.normalshow = this.customer+"'s "+this.devicetype;
      this.virusshow = rdvir(this.normalshow,this.codecount(this.codes)-this.progress[1]-this.progress[0]);
      this.inputnote = d.inputnote || ["⚠ no suitable drivers supporting input 'a'",-1]
      this.decrypting = d.decrypting || [false,false,false];
      this.decryptingtime = d.decryptingtime || [0,0,0];
      this.reward = d.reward || [0,0,0,0];
      this.dgcondir = d.dgcondir || "";
      this.cleanready = d.cleanready!==undefined ? d.cleanready : -1; //-1 not ready, 0 ready
      this.cleancode = d.cleancode || ["abcABC12"]; // max 1*2 matrix
      this.penddgloc = d.penddgloc || 0;
      this.autotypingcode = d.autotypingcode || ["",""]
      this.autotypingcodetype = d.autotypingcodetype || ["",""]
      this.returntime = d.returntime || -1;
      this.returntimeshow = this.returntime-vtime.current;
    }

    getattridict() {
      const sd=super.getattridict();
      sd["customer"]=this.customer;
      sd["devicetype"]=this.devicetype;
      sd["codes"]=this.codes.length===1 ? [[...this.codes[0]]] : [[...this.codes[0]],[...this.codes[1]]];
      sd["inputboxs"]=[...this.inputboxs];
      sd["progress"]=[...this.progress];
      sd["inputnote"]=[...this.inputnote];
      sd["decrypting"]=[...this.decrypting];
      sd["decryptingtime"]=[...this.decryptingtime];
      sd["reward"]=[...this.reward];
      sd["dgcondir"]=this.dgcondir;
      sd["cleanready"]=this.cleanready;
      sd["cleancode"]=[...this.cleancode];
      sd["penddgloc"]=this.penddgloc;
      sd["autotypingcode"]=[...this.autotypingcode];
      sd["autotypingcodetype"]=[...this.autotypingcodetype];
      sd["returntime"]=this.returntime;
      return(sd);
    }

    itimerf() {
      super.itimerf();
      if (this.returntimeshow!==0) {
        for (let n=0; n<3; n++) {
          if (this.decryptingtime[n]>0) {
            this.decryptingtime[n]-=1;
            if (this.decryptingtime[n]<=0) {
              this.decryptcode(n);
              this.decrypting[n]=false;
            }
            rfs();
          }
        }
        if (this.cleanready>0) {
          this.cleanready-=1;
          vstate.current[this.penddgloc].loadingtime-=1;
          rfs();
        }
        if (this.cleanready===0) {
          this.distrans(this.dgcondir,true,false);
          this.penddgloc=0;
        }
      }
    }

    itimerf2() {
      super.itimerf2();
      if (this.progress[3]===0) {
        this.virusshow = rdvir(this.normalshow,this.codecount(this.codes)-this.progress[1]-this.progress[0]);
      }
      else {this.virusshow=this.normalshow;}
      if (this.returntime!==-1 && this.returntime<=vtime.current) {
        this.returndevice();
      }
      else {
        this.returntimeshow=this.returntime-vtime.current;
      }
    }

    returndevice() {
      if (this.progress[3]===0) {clearInterval(this.nameinterval); buy("aban",this.sellprice,this.loc);}
      else {sell(this.reward[0],this.loc);}
    }

    codecount(codes) {return(codes.length===2 ? codes[0].length+codes[1].length : codes[0].length)}

    cleanedvirus() {
      this.progress[3]+=1;
      sfixcount(vfixcount.current+1);
      if (vfixcount.current%2===1 && vdiff.current<60) {sdiff(vdiff.current+1);}
      if (vfixcount.current%4===0 && vfixcount.current>0) {spawndev();}
      this.virusshow=this.normalshow;
      const temp = [...sellspawn]
      var addtime=vtime.current+rdint(6,9);
      while (vsellspawn.current.includes(addtime)) {
        addtime+=1;
      }
      temp.push(addtime);
      temp.sort((a,b) => a-b);
      ssellspawn(temp);
      if (vgamemode.current>=3 && vgamemode.current<=5 && gameended===false) {
        if (vgamemode.current===3 && vfixcount.current>=15) {endgame();}
        if (vgamemode.current===4 && vfixcount.current>=30) {endgame();}
        if (vgamemode.current===5 && vfixcount.current>=50) {endgame();}
      }
    }

    dpdetails() {
      if (this.progress[3]===0) {return (<>{this.normalshow} {"<"}Fix {this.returntime<=-1 ? <></> : <>in <span className="time">{distime(this.returntimeshow)}</span> </>}for <span className="cash">${this.reward[0]}</span>{">"}</>);}
      if (this.progress[3]===1) {return (<>{this.normalshow} {"<"}Already <span className="cash">${this.reward[0]}</span>, upgrade cleaners {this.returntime<=-1 ? <></> : <>in <span className="time">{distime(this.returntimeshow)}</span> </>}for <span className="cash">+${this.reward[1]}</span>{">"}</>);}
      if (this.progress[3]===2) {return (<>{this.normalshow} {"<"}Already <span className="cash">${this.reward[0]}</span>, upgrade firewall {this.returntime<=-1 ? <></> : <>in <span className="time">{distime(this.returntimeshow)}</span> </>}for <span className="cash">+${this.reward[2]}</span>{">"}</>);}
      if (this.progress[3]===3) {return (<>{this.normalshow} {"<"}Already <span className="cash">${this.reward[0]}</span>, upgrade antivirus {this.returntime<=-1 ? <></> : <>in <span className="time">{distime(this.returntimeshow)}</span> </>}for <span className="cash">+${this.reward[3]}</span>{">"}</>);}
      if (this.progress[3]===4) {return (<>{this.normalshow} {"<"}Fixed and fully upgraded, return device {this.returntime<=-1 ? <></> : <>in <span className="time">{distime(this.returntimeshow)}</span> </>}and collect <span className="cash">${this.reward[0]}</span>{">"}</>);}
    }

    getshowtext() {
      return (this.decryptingtime[2]!==0? <>Upgrading...<br></br>({this.decryptingtime[2]})</> :
      (this.decryptingtime[0]!==0 || this.decryptingtime[1]!==0) ? <>Decrypting...<br></br>
      {this.decryptingtime[0]!==0 ? "("+this.decryptingtime[0]+")": ""}{this.decryptingtime[1]!==0 ? "("+this.decryptingtime[1]+")": ""}</> : 
      this.cleanready>0 ? <>Receiving...<br></br>({this.cleanready})</> : "")
    }

    codeammend(i,code,rec=false) {
      var scode = code.slice(1,9);
      if (code.includes(" code")) {
        if (this.autotypingcodetype[i]!=="" && !vgcodedb.current[this.autotypingcodetype[i]].filter(gc => gc.autotyping).map(gc => gc.code).includes(this.autotypingcode[i])) {
          this.autotypingcode[i]="";
          this.autotypingcodetype[i]="";
        }
        if (this.autotypingcode[i]==="") {
          const ava1=vgcodedb.current[{"HCK code":"noteh","PIN code":"notep","SEC code":"notes"}[code]].filter(gc => !gc.autotyping).map(gc => gc.code);
          const ava2=vgcodedb.current["noteu"].filter(gc => !gc.autotyping).map(gc => gc.code);
          if (ava1.length!==0) {
            this.autotypingcodetype[i]={"HCK code":"noteh","PIN code":"notep","SEC code":"notes"}[code];
            this.autotypingcode[i]=ava1[0];
            const temp={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
            temp[this.autotypingcodetype[i]]=temp[this.autotypingcodetype[i]].map((j) => j.code===this.autotypingcode[i] ? new GNote(j.code, j.qgen, true) : j);
            sgcodedb(temp);
          }
          else if (ava2.length!==0) {
            this.autotypingcodetype[i]="noteu";
            this.autotypingcode[i]=ava2[0];
            const temp={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
            temp[this.autotypingcodetype[i]]=temp[this.autotypingcodetype[i]].map((j) => j.code===this.autotypingcode[i] ? new GNote(j.code, j.qgen, true) : j);
            sgcodedb(temp);
          }
          else {
            if (i===0) {
              if(this.codeammend(1,this.codes[1][this.progress[1]],false)) {return true;}
            }
            return false;
          }
        }
        scode=this.autotypingcode[i].slice(1,9);
      }
      var cur=this.inputboxs[i];
      if (cur===scode) {this.handlekeypress("Enter",i); rfs(); return true;}
      for (let j=0; j<cur.length; j++) {
        if (cur[j]!==scode[j]) {this.handlekeypress("Backspace",i); return true;}
      }
      if (this.gettypeable().includes(scode[cur.length])) {
        this.handlekeypress(scode[cur.length],i); return true;
      }
      else {
        if (i===0 && this.codes.length===2 && this.progress[1]!==this.codes[1].length && !this.decrypting[1]) {
          if(this.codeammend(1,this.codes[1][this.progress[1]],true)) {return true;}
          else {
            this.handlekeypress(scode[cur.length],i);
            return false;
          }
        }
        else {
          if (rec) {return false;}
          else {
            this.handlekeypress(scode[cur.length],i);
            return false;
          }
        }
      }
    }

    autotype() {
      if (this.progress[3]===4) {return true;}
      if (this.progress[3]===0) {
        if (this.progress[0]!==this.codes[0].length && !this.decrypting[0]) {if (!this.codeammend(0,this.codes[0][this.progress[0]])) {return false;}}
        else if (this.codes.length===2 && this.progress[1]!==this.codes[1].length && !this.decrypting[1]) {if (!this.codeammend(1,this.codes[1][this.progress[1]])) {return false;}}
        else {return false;}
      }
      else {
        const info=this.getcleaninfo();
        if (this.cleanready===0) {if (!this.codeammend(2,this.cleancode[this.progress[2]])) {return false;}}
        else if (this.cleanready===-1 && info[0][this.progress[3]-1]!==-1) {this.gettingcleancode(info[0][this.progress[3]-1],info[1][this.progress[3]-1],info[2][this.progress[3]-1]);}
        else {return false;}
      }
      rfs();
      return true;
    }

    getstyle() {
      const sd=super.getstyle();
      if (this.progress[3]>=2) {sd["backgroundImage"] = "url(./img/gears/s1.gif), "+sd["backgroundImage"];}
      if (this.progress[3]>=3) {sd["backgroundImage"] = "url(./img/gears/s2.gif), "+sd["backgroundImage"];}
      if (this.progress[3]>=4) {sd["backgroundImage"] = "url(./img/gears/s3.gif), "+sd["backgroundImage"];}
      return(sd);
    }

    decryptcode(n) {
      this.decrypting[n]=false;
      this.inputboxs[n]="";
      var addprog=1;
      const ran=rdint(0,99);
      if (ran<this.getbrute(2)) {addprog=3;}
      else if (ran<this.getbrute(1)) {addprog=2;}
      this.progress[n]=Math.min((n===2? this.cleancode.length : this.codes[n].length),this.progress[n]+addprog); 
      if (n!==2) {
        if (this.codecount(this.codes)-this.progress[1]-this.progress[0]===0) {this.cleanedvirus();}
      }
      else {
        if (this.cleancode.length===this.progress[2]) {
          this.cleanready=-1;
          this.progress[2]=0;
          this.reward[0]+=this.reward[this.progress[3]];
          this.progress[3]+=1;
        }
      }
      rfs();
    }

    handlesubmit(n) {
      var code=(n===2 ? this.cleancode[this.progress[n]] : this.codes[n][this.progress[n]]);
      var valid="⠀"+this.inputboxs[n]+"⠀"===code;
      if (!valid) {
        if (code.includes(" code")) {
          if (vcodedb.current[{"HCK code":"noteh","PIN code":"notep","SEC code":"notes"}[code]].map(gc => gc.code).includes("⠀"+this.inputboxs[n]+"⠀")) {
            valid=true;
            discardcode({"HCK code":"noteh","PIN code":"notep","SEC code":"notes"}[code],"⠀"+this.inputboxs[n]+"⠀","used");
          }
          else if (vcodedb.current["noteu"].map(gc => gc.code).includes("⠀"+this.inputboxs[n]+"⠀")) {
            valid=true;
            discardcode("noteu","⠀"+this.inputboxs[n]+"⠀","used");
          }
        }
      }
      if (valid) {
        this.decrypting[n]=true;
        this.setlatency = Date.now();
        this.decryptingtime[n]=this.getbrute(0);
        rfs();
      }
      else {
        this.inputnote[0]="⚠ Incorrect code";
        this.inputnote[1]=n;
        rfs();
      }
    }

    handlekeypress(k,loc) {
      if (!this.decrypting[loc]) {
        var newwarn=""; //⚠ no drivers supporting input 'a'
        if (k==="Enter") {this.handlesubmit(loc);}
        if (k==="Backspace") {
          this.inputboxs[loc]=this.inputboxs[loc].slice(0,this.inputboxs[loc].length-1);
          this.inputnote[0]=newwarn;
          this.inputnote[1]=loc;
        }
        if (k.length===1 && this.inputboxs[loc].length!==8) {
          if (this.gettypeable().includes(k)) {
            this.inputboxs[loc]+=k;
          }
          else {
            newwarn="⚠ no suitable drivers supporting input '"+k+"'";
          }
          this.inputnote[0]=newwarn;
          this.inputnote[1]=loc;
        }
        rfs();
      }
    }

    getbuttonstyle(n,inputbox) {
      const sd={};
      if (this.decrypting[n]) {return sd;}
      if (inputbox==="" && (this.loc!==vfselecting.current[0] || n!==vfselecting.current[1])) {sd["color"]="#888";}
      if (vfselecting.current[0] === this.loc && vfselecting.current[1]===n) {
        sd["border"] = "#0AA";
        sd["borderStyle"] = "solid";
        sd["backgroundColor"] = "#99EDC3";
        sd["zIndex"] = "1";
      }
      return (sd);
    }

    displayins(code,n) {
      if (n===2) {
        if (code.includes(" code")) { //globalnotes code
          return(<div className="virusins">𐤏 Input {code} to upgrade {["","cleaners","firewall","antivirus"][this.progress[3]]} ({this.progress[n]}/{this.cleancode.length}):</div>)
        }
        else {
          return(<div className="virusins">𐤏 Type <span className="codeinput">{code}</span> to upgrade {["","cleaners","firewall","antivirus"][this.progress[3]]} ({this.progress[n]}/{this.cleancode.length}):</div>)
        }
      }
      else if (this.progress[n]<this.codes[n].length) {
        if (code.includes(" code")) { //globalnotes code
          return(<div className="virusins">𐤏 Input {code} to decrypt virus {["cores","extensions"][n]} ({this.progress[n]}/{this.codes[n].length}):</div>)
        }
        else {
          return(<div className="virusins">𐤏 Type <span className="codeinput">{code}</span> to decrypt virus {["cores","extensions"][n]} ({this.progress[n]}/{this.codes[n].length}):</div>)
        }
      }
      else {
        return(<div className="virusins">✔ All virus {["cores","extensions"][n]} had been sucessfully decrypted ({this.progress[n]}/{this.codes[n].length})!</div>);
      }
    }

    inputboxtext(code,inputbox, n) {
      if (this.loc!==vfselecting.current[0] || n!==vfselecting.current[1]) {
        if (inputbox==="") {
          if (code.includes(" code")) { //globalnotes code
            return('input '+code+' here');
          }
          else {
            return('type "'+code+'" here');
          }
        }
        return inputbox;
      }
      else {
        if (inputbox.length===8) {
          return inputbox;
        }
        return (inputbox+"_");
      }
    }

    displayinputbox(code,inputbox,n) {
      if ((n===2 && this.cleanready===0) || (n!==2 && this.progress[n]<this.codes[n].length)) {
        return(<div className="codeinputboxdiv linemargin">
        <button className={this.decrypting[n] ? "loading codeinputbox":"codeinputbox"} onClick={() => {sfselecting([this.loc,n]); rfs();}} style={this.getbuttonstyle(n,inputbox)}>
          {this.inputboxtext(code,inputbox,n)}</button>
        <button className={this.decrypting[n] ? "loading submitcodebtn":"submitcodebtn"} onClick={() => this.handlesubmit(n)}>
          {n===2 ? (this.decrypting[n] ? "UPGRADING..." : "UPGRADE") : (this.decrypting[n] ? "DECRYPTING..." : "DECRYPT")}</button>
        </div>);
      }
      else {
        return(<></>);
      }
    }

    distrans(dir="udlr",active=true,fail=true) {
      if (this.cleanready>0 && dir.includes(this.dgcondir)) {
        clearInterval(this.loadcleaninterval);
        this.dgcondir="";
        if (fail) {this.cleanready=-1;}
      }
      super.distrans(dir,active)
    }

    gettingcleancode(diff,dgloc,time) {
      if (this.cleanready===-1) {
        this.setlatency = Date.now();
        this.penddgloc=dgloc;
        this.cleanready=time;
        vstate.current[dgloc].loadingtime=time;
        this.dgcondir={"-14":"d","-1":"r","1":"l","14":"u"}[(this.loc-dgloc).toString()]
        vstate.current[dgloc].condir={"-14":"d","-1":"r","1":"l","14":"u"}[(dgloc-this.loc).toString()]
        this.transcon[this.dgcondir]=true;
        vstate.current[dgloc].transcon[vstate.current[dgloc].condir]=true;
        this.cleancode=rdsimpcode(diff);
      rfs();
      }
    }

    getcleaninfo() {
      const conparts=this.getconnectedparts();
      var d=[-1,-1,-1];
      var cd=[-1,-1,-1];
      var t=[-1,-1,-1];
      var cong=false;
      for (let i = 0; i < 4; i++) {
        if ("uldr"[i] in conparts) {
          if (conparts["uldr"[i]].type==='dg') {
            cong=true;
            if (conparts["uldr"[i]].loadingtime===0) {
              if (conparts["uldr"[i]].cracklvl>=1 && conparts["uldr"[i]].codediff>d[0]) {d[0]=conparts["uldr"[i]].codediff; cd[0]=conparts["uldr"[i]].loc; t[0]=conparts["uldr"[i]].loadtime};
              if (conparts["uldr"[i]].cracklvl>=2 && conparts["uldr"[i]].codediff>d[1]) {d[1]=conparts["uldr"[i]].codediff; cd[1]=conparts["uldr"[i]].loc; t[1]=conparts["uldr"[i]].loadtime};
              if (conparts["uldr"[i]].cracklvl>=3 && conparts["uldr"[i]].codediff>d[2]) {d[2]=conparts["uldr"[i]].codediff; cd[2]=conparts["uldr"[i]].loc; t[2]=conparts["uldr"[i]].loadtime};
            }
          }
        }
      }
      return([d,cd,t,cong])
    }

    getcleanins() {
      if (this.progress[3]===4) {return <></>}
      const info=this.getcleaninfo()
      const d=info[0];
      const cd=info[1];
      const t=info[2];
      const cong=info[3];
      
      return (this.cleanready===0 ?
        <><div className="linemargin">{this.displayins(this.cleancode[this.progress[2]],2)}</div>
        {this.displayinputbox(this.cleancode[this.progress[2]],this.inputboxs[2],2)}
        <div className="warnnote">{this.inputnote[1]===2 ? this.inputnote[0] : ""}</div>
        </>
        : (this.progress[3]===4 ? <div className="linemargin virusins">𐤏 Return device back to owner</div>:
          (d[this.progress[3]-1]===-1 && this.cleanready===-1?
          <div className="linemargin virusins">{"𐤏 "+(d[0]!==-1 ? "Upgrade devguard extensions" : cong ? "Wait for connected devguard" : "Connect device to devguard")+
          " to upgrade device's "+["cleaners!","firewall!","antivirus!"][this.progress[3]-1]}</div>
          : <><div className="linemargin virusins">{"𐤏 Upgrade device's "+["cleaners","firewall","antivirus"][this.progress[3]-1]+" for a bonus reward!"}</div>
            <button className={this.cleanready===-1 ? "getdgbtn":"getdgbtn loading"} onClick={() => {this.gettingcleancode(d[this.progress[3]-1],cd[this.progress[3]-1],t[this.progress[3]-1]);}}>
              {this.cleanready===-1 ? "Obtain instructions to upgrade "+["cleaners!","firewall!","antivirus!"][this.progress[3]-1] : "Obtaining instructions, keep devguard connected..."}</button>
          </>))
      )
    }

    getscreen() {
      return (<>
      <div className="screenlabel">{this.virusshow}</div>

      <div className="scanware">{"|wireless scanware exploit activated at "+this.normalshow+"|"}<br></br>
      {"{drivers: "+this.getdrivers()+", reward: "+(this.progress[3]===0 ? "$0+$"+this.reward[0] : "$"+this.reward[0]+(this.progress[3]===4 ? "" : "+$"+this.reward[this.progress[3]]))+
      ", processor: [time: "+this.getbrute(0)+"s, x2: "+(this.getbrute(1)-this.getbrute(2))+"%, x3:"+this.getbrute(2)+"%]}"}</div>

      <div className="linemargin">{this.displayins(this.codes[0][this.progress[0]],0)}</div>
      {this.displayinputbox(this.codes[0][this.progress[0]],this.inputboxs[0],0)}
      <div className="warnnote">{this.inputnote[1]===0 ? this.inputnote[0] : ""}</div>

      {this.codes.length===2 ? <>
      <div className="linemargin">{this.displayins(this.codes[1][this.progress[1]],1)}</div>
      {this.displayinputbox(this.codes[1][this.progress[1]],this.inputboxs[1],1)}
      <div className="warnnote">{this.inputnote[1]===1 ? this.inputnote[0] : ""}</div>
      </> : <></>}

      {this.progress[3]>1 ? <div className="virusins"> {"✔ Device's "+["cleaners", "cleaners and firewall", "cleaners, firewall and antivirus"][this.progress[3]-2]+" are upgraded!"}</div> : <></>}
      {this.progress[3]>0 ? this.getcleanins() : <></>}

      <div id={this.progress[3]>0 ? "cleanbg" : "virusbg"}></div></>)
    }
  }

  function rdint(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  function rdcode(diff) {
    function rc(t,l) {
      const d={"l":'qwertyuiopasdfghjklzxcvbnm',"u":'QWERTYUIOPASDFGHJKLZXCVBNM',"n":'1234567890',"s":'~!@#$%^&*()+`-={}[]:;<>?,./'};
      const chars=d[t];
      const charlen=chars.length;
      var o='';
      for (let i = 0; i < l; i++) {
        o+= chars.charAt(Math.floor(Math.random()*charlen));
      }
      return o;
    }
    function msp(p,m) {
      if (m>p) {return "ERROR"}
      const rints = randchoice([1, 2, 3, 4, 5, 6, 7],p-1);
      rints.push(0)
      rints.push(8);
      rints.sort((a,b) => a-b); //Generate t-1 distinct ints, indicating where to slice
      const lenparts = [];
      for (let i = 0; i < p; i++) {
        lenparts.push(rints[i+1]-rints[i]);
      }

      var seq=[];
      var count=[-1,-1,-1,-1];
      while (count[0]+count[1]+count[2]+count[3]<m) {
        seq=[];
        count=[0,0,0,0];
        for (let i = 0; i < p; i++) {
          var temp=rdint(0,3)
          seq.push("luns"[temp]);
          count[temp]=1;
        }
      }

      var o="";
      for (let i = 0; i < p; i++) {
        o+=rc(seq[i],lenparts[i]);
      }
      return "⠀"+o+"⠀";
    }
    if (diff===1) {return msp(2,2);}
    if (diff===2) {return msp(3,2);}
    if (diff===3) {return msp(4,2);}
    if (diff===4) {if (Math.random()<0.5) {return msp(4,3);} else {return msp(5,2);}}
    if (diff===5) {return msp(5,3);}
    if (diff===6) {return msp(6,3);}
    if (diff===7) {if (Math.random()<0.5) {return msp(7,3);} else {return msp(6,4);}}
    if (diff===8) {if (Math.random()<0.5) {return msp(8,3);} else {return msp(7,4);}}
    if (diff===9) {return msp(8,4);}
  }

  function rdcodeblock(diff) {
    var cbl=0;
    var cb=[];
    var otu=0;

    if (diff<4) {cb=[0]; cbl=0;}
    else if (diff<6) {if (Math.random()<0.5) {cb=[0]; cbl=0;} else {cb=[0,0]; cbl=1;}}
    else if (diff<9) {cb=[0,0]; cbl=1;}
    else if (diff<12) {if (Math.random()<0.5) {cb=[0,0]; cbl=1;} else {cb=[0,0,0]; cbl=2;}}
    else if (diff<16) {cb=[0,0,0]; cbl=2;}
    else if (diff<20) {if (Math.random()<0.5) {cb=[0,0,0]; cbl=2;} else {cb=[0,0,0,0]; cbl=3;}}
    else if (diff<24) {cb=[0,0,0,0]; cbl=3;}
    else if (diff<28) {if (Math.random()<0.5) {cb=[0,0,0,0]; cbl=3;} else {cb=[0,0,0,0,0]; cbl=4;}}
    else if (diff<32) {cb=[0,0,0,0,0]; cbl=4;}
    else if (diff<36) {if (Math.random()<0.5) {cb=[0,0,0,0,0]; cbl=3;} else {cb=[0,0,0,0,0,0]; cbl=5;}}
    else {cb=[0,0,0,0,0,0]; cbl=5;}

    if (enableotc) {
      if (diff<21) {otu=0;}
      else if (diff<26) {if (Math.random()<0.5) {otu=0;} else {otu=1;}}
      else if (diff<31) {otu=1;}
      else if (diff<36) {if (Math.random()<0.5) {otu=1;} else {otu=2;}}
      else if (diff<41) {otu=2;}
      else if (diff<46) {if (Math.random()<0.5) {otu=2;} else {otu=3;}}
      else if (diff<51) {otu=3;}
      else if (diff<56) {if (Math.random()<0.5) {otu=3;} else {otu=4;}}
      else {otu=4;}
      diff-=Math.floor(diff*otu/(1+cbl));
      for (let i=0; i<otu; i++) {
        cb[i]=20;
      }
      cb.sort((a,b) => a-b);
      cbl-=otu;
    }
    for (let i=0; i<Math.min(diff,60); i++) {
      cb[rdint(0,cbl)]+=1;
      cb.sort((a,b) => a-b);
      if (cb[cbl]===10) {
        cbl-=1;
      }
    }
    cbl=randchoice(cb,cb.length);
    for (let i=0; i<cb.length; i++) {
      if (cb[i]!==20) {
        cb[i]+=rdint(-1,1);
        cb[i]=rdcode(Math.min(9,Math.max(1,cb[i])));
      }
      else {
        cb[i]=["HCK code","PIN code","SEC code"][rdint(0,2)];
      }
    }
    if (cb.length===1) {return([cb]);}
    if (cb.length===2) {return([[cb[0]],[cb[1]]]);}
    if (cb.length===3) {if (Math.random()<0.5) {return([[cb[0],cb[1]],[cb[2]]]);} else {return([[cb[0]],[cb[1],cb[2]]]);}}
    if (cb.length===4) {if (Math.random()<0.4) {return([[cb[0],cb[1]],[cb[2],cb[3]]]);} 
    else if (Math.random()<0.5) {return([[cb[0]],[cb[1],cb[2],cb[3]]]);} else {return([[cb[0],cb[1],cb[2]],[cb[3]]]);}}
    if (cb.length===5) {if (Math.random()<0.5) {return([[cb[0],cb[1],cb[2]],[cb[3],cb[4]]]);} else {return([[cb[0],cb[1]],[cb[2],cb[3],cb[4]]]);}}
    if (cb.length===6) {return([[cb[0],cb[1],cb[2]],[cb[3],cb[4],cb[5]]]);}
  }

  function rdsimpcode(diff) {
    const realdiff= 21-diff*6-rdint(0,2); //1-3, 7-9, 13-15
    var cb=[];
    if (realdiff<5) {cb=[realdiff];}
    else if (realdiff<=8) {if (Math.random()<0.5) {cb=[realdiff];} else {cb=[rdint(1,realdiff),0];}}
    else {cb=[rdint(Math.max(1,realdiff-9),Math.min(9,realdiff-1)),0];}
    if (cb.length===2) {cb[1]=realdiff-cb[0]}
    for (let i=0; i<cb.length; i++) {
      cb[i]=rdcode(cb[i]);
    }
    return(cb);
  }

  function gencell(loc,s="e",d={},reload=false) {
    if (s==="e") {return (new Cell({"loc":loc}));}
    const dbuildcost1=[rdint(400,599),rdint(400,599),rdint(400,599),rdint(400,599),rdint(50,149)];
    const dbuildcost2=[rdint(400,599),rdint(400,599),rdint(400,599),rdint(400,599),rdint(900,1099),rdint(1400,1599),rdint(1900,2099),rdint(2400,2599)]; //rdint(900,1099) //1->2 30s, 2->3 60s, 3->4 120s, 4->5 180s
    const dsellprice=d.sellprice !==null ? d.sellprice : rdint(400,599);
    const sel= d.sel || false;
    const def= d.def || false;
    if (s==="km") {return (reload ? new Multidriver(d) : new Multidriver({"sel":sel, "loc":loc, "type":s, "buildcost":dbuildcost2}))}
    if (s[0]==="k") {return (reload ? new Driver(d) : new Driver({"sel":sel, "loc":loc, "def":def, "type":s, "buildcost":dbuildcost1, "sellprice":dsellprice}));}
    if (s==="tp") {return (reload ? new Touchpad(d) : new Touchpad({"sel":sel, "loc":loc, "def":def, "type":s, "buildcost":dbuildcost1, "sellprice":dsellprice}));}
    if (s==="dev") {return (reload ? new Device(d) : new Device({"sel":sel, "loc":loc, "type":s, "udlr":[true, true, true, true], "buildcost":dbuildcost1, "sellprice":dsellprice,
    "codes":rdcodeblock(vdiff.current), "reward":[rdint(800,999),rdint(700,899),rdint(1300,1499),rdint(1900,2099)], "returntime":vtime.current+getreturntime()}));}
    if (s==="sw") {return (reload ? new Shopware(d) : new Shopware({"sel":sel, "def":def, "loc":loc, "type":s, "buildcost":dbuildcost2}));}
    if (s==="bf") {return (reload ? new Bruteforcer(d) : new Bruteforcer({"sel":sel, "loc":loc, "type":s, "buildcost":dbuildcost2}))}
    if (s==="dg") {return (reload ? new DevGuard(d) : new DevGuard({"sel":sel, "loc":loc, "type":s, "buildcost":dbuildcost2}))}
    if (s==="lc") {return (reload ? new LabControl(d) : new LabControl({"sel":sel, "loc":loc, "type":s, "buildcost":dbuildcost2}))}
    if (s==="cm") {return (reload ? new CoinMiner(d) : new CoinMiner({"sel":sel, "loc":loc, "type":s, "buildcost":dbuildcost2}))}
    if (s==="d") {return (new Delivery(d));}
    if (s==="pleak") {return (reload ? new PLeak(d) : new PLeak({"sel":sel, "loc":loc, "type":s, "minfixtime":(60-Math.floor(diff/2))+rdint(-2,2)}))}
    if (s[0]==="n") {return (reload ? new Note(d) : new Note({"sel":sel, "loc":loc, "type":s, "sellprice": dsellprice}))}
    if (s==="thkm") {return (reload ? new Multidriver(d) : new Multidriver({"sel":sel, "loc":loc, "type":"km", "buildcost":dbuildcost2, "upgradetime":[2,2,2,2], "drivers":["kl","ku"]}))}
    if (s==="tfkm") {return (reload ? new Multidriver(d) : new Multidriver({"sel":sel, "loc":loc, "type":"km", "buildcost":dbuildcost2, "upgradetime":[2,2,2,2], "drivers":["kl","ku","kn","ks"]}))}
    if (s==="tbf") {return (reload ? new Bruteforcer(d) : new Bruteforcer({"sel":sel, "loc":loc, "type":"bf", "buildcost":dbuildcost2, "upgradetime":[2,2,2,2]}))}
    if (s==="tdg") {return (reload ? new DevGuard(d) : new DevGuard({"sel":sel, "loc":loc, "type":"dg", "buildcost":dbuildcost2, "upgradetime":[2,2,2,2]}))}
    if (s==="mb") {return (gencell(loc,s=["kl","ku","kn","ks","tp","sw","km","bf","dg","mb"][rdint(0,8)],d,reload))} //"lc","cm"
  }

  function changeframe(x) {
    sframe(x);
    if (x===-1) {
      sfselecting([-1,-1]);
    }
  }

  const handlebutton = (j) => {
    if (merging===-1 && selecting!==-1 && state[selecting].type!=="d" && j%14!==13 && state[j].type==="e" && state[selecting].movable() && j%14>0) {state[selecting].distrans();}
    const temp = [...state]
    if (selecting===-1 || temp[selecting].type==="d") {
      if (temp[j].type==='e') {return}
      if (selecting!==-1) {temp[selecting].sel=false;}
      temp[j].sel=true;
      sselecting(j);
    }
    else {
      temp[selecting].sel=false;
      if (merging===-1) {
        if (j%14!==13 && temp[j].type==="e" && state[selecting].movable() && j%14>0) {
          const temp2 = temp[selecting];
          temp[selecting]=temp[j];
          temp[selecting].loc=selecting;
          temp[j]=temp2;
          temp[j].loc=j;
          sselecting(-1);
        }
        else if (temp[j].type!=='e' && j!==selecting) { //autoselect
          temp[j].sel=true;
          sselecting(j);
        }
        else {sselecting(-1);}
      }
      else {
        if (temp[j].type==="km" && temp[j].mergable(temp[selecting].type)) {
          temp[j].mergewith(temp[selecting].type, Math.floor(temp[selecting].buildcost[4]/2+temp[selecting].sellprice*85/100+rdint(-10,9)));
          temp[selecting]=gencell(selecting);
          scash(cash-merging);
        }
        smerging(-1);
        sselecting(-1);
      }
    }
    sstate(temp);
  }

  function buy(i,cost,pos=vselecting.current) {
    if (i==="aban") {
      scash(Math.max(0,vcash.current-cost));
      vstate.current[pos].distrans();
      const temp3={"noteh":[...vgcodedb.current["noteh"]], "notes":[...vgcodedb.current["notes"]], "notep":[...vgcodedb.current["notep"]], "noteu":[...vgcodedb.current["noteu"]]};
      const sellblock=vstate.current[pos];
      if (sellblock.autotypingcodetype[0]!=="") {
        temp3[sellblock.autotypingcodetype[0]]=temp3[sellblock.autotypingcodetype[0]].map((j) => j.code===sellblock.autotypingcode[0] ? new GNote(j.code, j.qgen, false) : j);
      }
      if (sellblock.autotypingcodetype[1]!=="") {
        temp3[sellblock.autotypingcodetype[1]]=temp3[sellblock.autotypingcodetype[1]].map((j) => j.code===sellblock.autotypingcode[1] ? new GNote(j.code, j.qgen, false) : j);
      }
      sgcodedb(temp3);
      const temp = [...vstate.current];
      temp[pos]=gencell(pos);
      sstate(temp);
      sselecting(-1);
      const temp2 = [...vsellspawn.current]
      var addtime=vtime.current+rdint(6,9);
      while (vsellspawn.current.includes(addtime)) {
        addtime+=1;
      }
      temp2.push(addtime);
      temp2.sort((a,b) => a-b);
      ssellspawn(temp2);
      if (vgamemode.current>=6 && vgamemode.current<=9 && gameended===false) {
        sstarstreak(0);
        sstarcount(vstarcount.current-1);
        if (vstarcount.current-1===0) {endgame();}
      }
    }
    else {
      if (vcash.current>=cost) {
        if (i!=="mer") {scash(vcash.current-cost)};
        const temp = [...vstate.current];
        if (i==="u") {temp[pos].u=true;}
        else if (i==="d") {temp[pos].d=true;}
        else if (i==="l") {temp[pos].l=true;}
        else if (i==="r") {temp[pos].r=true;}
        else {temp[pos].upgrade(i);}
        if (i!=="mer") {temp[pos].sellprice+=Math.floor(cost/2)+rdint(-10,9);}
        if (temp[pos].type[0]==="k" && temp[pos].type!=="km" && i!=="mer") {
          temp[pos].buildcost[4]-=Math.floor(cost*85/100)+rdint(-10,9);
        }
        sstate(temp);
      }
    }
  }

  function sell(c,pos=vselecting.current) {
    scash(Math.max(0,vcash.current+c));
    vstate.current[pos].distrans();
    const temp = [...vstate.current];
    temp[pos]=gencell(pos);
    sstate(temp);
    if (pos===vselecting.current) {sselecting(-1);}
  }

  const showdetails = (s,sel) => {
    if (sel===-1 || s[sel].type==="e") {
      return (
        <>
        <div className="details">
          empty
          <div className="detailsb">
            *please select a component above*
          </div>
        </div>
        </>
      )
    }
    const bk = s[sel];
    return (
      <>
      <div className="details">
        {bk.dpdetails()}
        <div className="detailsb">

          {bk.type==="d" ? "*component delivering*" : sel%14===13 ? "*components cannot be accessed in delivery zone*" : (sel%14)===0 ? "*components cannot be accessed in loading zone*" : 
          bk.upgrading!==0 ? "*component upgrading*" : vmerging.current!==-1 ? "*please select a multidriver above to merge with*" : bk.inuse() ? "*component in use*" : 
          bk.type==="pleak" ? bk.getupgradebuttons()
          : bk.type[0]==="n" ? 
          <>{bk.getdetailsbuttons()}</>
          : <>
          {bk.type==="tp" ? <button className="dbutton" onClick={() => changeframe(sel)}>View</button> : <></>}
          {bk.u ? <></> : <button className={cash<bk.buildcost[0] ? "dbutton disabled" : "dbutton"} onClick={() => buy("u",bk.buildcost[0])}>Build UCon<br></br>with ${bk.buildcost[0]}</button>}
          {bk.d ? <></> : <button className={cash<bk.buildcost[1] ? "dbutton disabled" : "dbutton"} onClick={() => buy("d",bk.buildcost[1])}>Build DCon<br></br>with ${bk.buildcost[1]}</button>}
          {bk.l ? <></> : <button className={cash<bk.buildcost[2] ? "dbutton disabled" : "dbutton"} onClick={() => buy("l",bk.buildcost[2])}>Build LCon<br></br>with ${bk.buildcost[2]}</button>}
          {bk.r ? <></> : <button className={cash<bk.buildcost[3] ? "dbutton disabled" : "dbutton"} onClick={() => buy("r",bk.buildcost[3])}>Build RCon<br></br>with ${bk.buildcost[3]}</button>}
          {bk.getupgradebuttons()}
          {bk.type!=="dev" ?
          <> {bk.def ? <button className="dbutton disabled">Cannot<br></br>Sell</button> : <button className="dbutton redhoveronly" onClick={() => sell(bk.sellprice)}>Sell for<br></br>${bk.sellprice}</button>} 
          </> : 
            <>{bk.progress[3]>0 ? <button className="dbutton xlongb" onClick={() => bk.returndevice()}>Return device and<br></br>collect ${bk.reward[0]}</button>
            : <button className="dbutton xlongb redhoveronly" onClick={() => bk.returndevice()}>Rewardless forcewipe<br></br>with ${bk.sellprice}</button>}</>
          }</>}
        </div>
      </div>
      </>
    )
  }

  function getscreen(dir,monj) {
    if (monj>=0) {
      if ("urld"[dir] in vstate.current[monj].getconnectedparts()) {
        return (vstate.current[monj+[-14,1,-1,14][dir]].getscreen());
      }
    }
    return(<><div id="nosig">no signal ⚠</div><div id="nosigbg"></div></>);
  }

  const showsetup = () => {
    function getbutton(j) {
      return(<button onClick={() => handlebutton(j)} className={vstate.current[j].getclass()}
      style={vstate.current[j].getstyle()}><span className="whitebgfont">{vstate.current[j].getshowtext()}</span></button>)
    }
    return (
        <>
        <tr>
          <td className="setup bu bl">{getbutton(0)}</td>
          <td className="setup bu">{getbutton(1)}</td>
          <td className="setup bu">{getbutton(2)}</td>
          <td className="setup bu">{getbutton(3)}</td>
          <td className="setup bu">{getbutton(4)}</td>
          <td className="setup bu">{getbutton(5)}</td>
          <td className="setup bu">{getbutton(6)}</td>
          <td className="setup bu">{getbutton(7)}</td>
          <td className="setup bu">{getbutton(8)}</td>
          <td className="setup bu">{getbutton(9)}</td>
          <td className="setup bu">{getbutton(10)}</td>
          <td className="setup bu">{getbutton(11)}</td>
          <td className="setup bu">{getbutton(12)}</td>
          <td className="setup bu br">{getbutton(13)}</td>
        </tr>
        <tr>
          <td className="setup bl">{getbutton(14)}</td>
          <td className="setup">{getbutton(15)}</td>
          <td className="setup">{getbutton(16)}</td>
          <td className="setup">{getbutton(17)}</td>
          <td className="setup">{getbutton(18)}</td>
          <td className="setup">{getbutton(19)}</td>
          <td className="setup">{getbutton(20)}</td>
          <td className="setup">{getbutton(21)}</td>
          <td className="setup">{getbutton(22)}</td>
          <td className="setup">{getbutton(23)}</td>
          <td className="setup">{getbutton(24)}</td>
          <td className="setup">{getbutton(25)}</td>
          <td className="setup">{getbutton(26)}</td>
          <td className="setup br">{getbutton(27)}</td>
        </tr>
        <tr>
          <td className="setup bl">{getbutton(28)}</td>
          <td className="setup">{getbutton(29)}</td>
          <td className="setup">{getbutton(30)}</td>
          <td className="setup">{getbutton(31)}</td>
          <td className="setup">{getbutton(32)}</td>
          <td className="setup">{getbutton(33)}</td>
          <td className="setup">{getbutton(34)}</td>
          <td className="setup">{getbutton(35)}</td>
          <td className="setup">{getbutton(36)}</td>
          <td className="setup">{getbutton(37)}</td>
          <td className="setup">{getbutton(38)}</td>
          <td className="setup">{getbutton(39)}</td>
          <td className="setup">{getbutton(40)}</td>
          <td className="setup br">{getbutton(41)}</td>
        </tr>
        <tr>
          <td className="setup bl">{getbutton(42)}</td>
          <td className="setup">{getbutton(43)}</td>
          <td className="setup">{getbutton(44)}</td>
          <td className="setup">{getbutton(45)}</td>
          <td className="setup">{getbutton(46)}</td>
          <td className="setup">{getbutton(47)}</td>
          <td className="setup">{getbutton(48)}</td>
          <td className="setup">{getbutton(49)}</td>
          <td className="setup">{getbutton(50)}</td>
          <td className="setup">{getbutton(51)}</td>
          <td className="setup">{getbutton(52)}</td>
          <td className="setup">{getbutton(53)}</td>
          <td className="setup">{getbutton(54)}</td>
          <td className="setup br">{getbutton(55)}</td>
        </tr>
        <tr>
          <td className="setup bd bl">{getbutton(56)}</td>
          <td className="setup bd">{getbutton(57)}</td>
          <td className="setup bd">{getbutton(58)}</td>
          <td className="setup bd">{getbutton(59)}</td>
          <td className="setup bd">{getbutton(60)}</td>
          <td className="setup bd">{getbutton(61)}</td>
          <td className="setup bd">{getbutton(62)}</td>
          <td className="setup bd">{getbutton(63)}</td>
          <td className="setup bd">{getbutton(64)}</td>
          <td className="setup bd">{getbutton(65)}</td>
          <td className="setup bd">{getbutton(66)}</td>
          <td className="setup bd">{getbutton(67)}</td>
          <td className="setup bd">{getbutton(68)}</td>
          <td className="setup bd br">{getbutton(69)}</td>
        </tr>
        </>
    )
  };

  function incomdevcount(st) {
    var c=0;
    for (let i = 0; i < 60; i++) {
      if (st[i].type==="dev" && st[i].progress[3]===0) {c+=1;}
    }
    return(c);
  }

  const maxspawncount=150;

  const spawndev = (c=1,reg=true) => {
    const ord=randchoice([...Array(5).keys()],5);
    const temp=[...vstate.current];
    var addcount=0;
    if (reg) {
      for (let i = 0; i < 5; i++) {
        if (temp[ord[i]*14].type==="e") {
          if (incomdevcount(vstate.current)+addcount>=maxspawncount) {
            break;
          }
          temp[ord[i]*14]=gencell(ord[i]*14,"dev");
          c-=1;
          addcount+=1;
          if (c===0) {break;}
        }
      }
    }
    sstate(temp);
    if (c!==0) {swaitingspawn(true);}
    return(c===0);
  }

  function canspawn() {
    for (let i = 0; i < 5; i++) {
      if (vstate.current[i*14].type==="e") {
        return(incomdevcount(vstate.current)<maxspawncount);
      }
    }
    return(false);
  }

  function spawnpleak() {
    const temp=[...vstate.current];
    const x = [];
    for (let i = 0; i < 70; i++) {
      if (temp[i].type==="e" && i%14!==0 && i%14!==13) {
        x.push(i);
      }
    }
    if (x.length!==0) {
      const y=x[rdint(0,x.length-1)];
      console.log(x,y);
      temp[y]=gencell(y,"pleak");
      sstate(temp);
    }
  }

  function getreturntime() {
    function countspace() {
      var x=0;
      for (let i = 0; i < 5; i++) {
        if (vstate.current[i*14].type==="e") {
          x+=1;
        }
      }
      return x;
    }
    var t=120-vdiff.current*2+rdint(1,20)
    const n= incomdevcount(vstate.current)+Math.min((vnxtspawn.current-vtime.current<=15 ? 1 : 0) + vsellspawn.current.filter((i) => i-vtime.current<=15).length, countspace())
    for (let i = 0; i < Math.max(n,2); i++) {
      t+=rdint(90,149)-Math.floor(vdiff.current/2);
    }
    return t;
  }

  function getlocalstorage(tag,d) {
    return(localStorage.getItem(tag)!==null ? JSON.parse(localStorage.getItem(tag)) : d)
  }

  const [timeon, stimeon] = useState(false);
  const vtimeon = useRef(false);
  const [dummy, sdummy] = useState(-1);
  function rfs() {sdummy(Math.random()); savestate(); console.log(vtime.current, vstate.current);}
  const [cash, scash] = useState(getlocalstorage('cash',50000));
  const vcash = useRef(getlocalstorage('cash',50000));
  const [diff, sdiff] = useState(getlocalstorage('diff',30));
  const vdiff = useRef(getlocalstorage('diff',30));
  const [selecting, sselecting] = useState(getlocalstorage('selecting',-1));
  const vselecting = useRef(getlocalstorage('selecting',-1));
  const [merging, smerging] = useState(getlocalstorage('merging',-1));
  const vmerging = useRef(getlocalstorage('merging',-1));
  const [fselecting, sfselecting] = useState(getlocalstorage('fselecting',[-1,-1]));
  const vfselecting = useRef(getlocalstorage('fselecting',[-1,-1]));
  const [frame, sframe]=useState(-2);
  const [vcode, svcode]=useState(rdcode(2));
  const [codedb, scodedb]=useState(getlocalstorage('codedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const vcodedb = useRef(getlocalstorage('codedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const [gcodedb, sgcodedb]=useState(getlocalstorage('gcodedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const vgcodedb = useRef(getlocalstorage('gcodedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const [ggcodedb, sggcodedb]=useState(getlocalstorage('ggcodedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const vggcodedb = useRef(getlocalstorage('ggcodedb',{"noteh":[], "notes":[], "notep":[], "noteu":[]}));
  const [gcodeshow, sgcodeshow]=useState(getlocalstorage('gcodeshow',"noteh"));
  
  const [fixcount, sfixcount] = useState(getlocalstorage('fixcount',0));
  const vfixcount = useRef(getlocalstorage('fixcount',0));
  const [deliveryings, sdeliveryings] = useState(getlocalstorage('deliveryings',[false,false,false,false,false]));
  const vdeliveryings = useRef(getlocalstorage('deliveryings',[false,false,false,false,false]));

  const [startingframe, sstartingframe] = useState(1);

  const [gamemode, sgamemode] = useState(getlocalstorage('gameset',[0,0,true,true])[0]);
  const vgamemode = useRef(getlocalstorage('gameset',[0,0,true,true])[0]);
  const [gamediff, sgamediff] = useState(getlocalstorage('gameset',[0,0,true,true])[1]);
  const [defaultgame, sdefaultgame] = useState(getlocalstorage('defaultgame',true));
  const [enableotc, senableotc] = useState(getlocalstorage('gameset',[0,0,true,true])[2]);
  const [enablecurse, senablecurse] = useState(getlocalstorage('gameset',[0,0,true,true])[3]);
  const [startset, sstartset] = useState(getlocalstorage('startset',[0,0,true,true]));
  const [time, stime] = useState(getlocalstorage('time',0));
  const vtime = useRef(getlocalstorage('time',0));
  const [nxtspawn, snxtspawn] = useState(getlocalstorage('nxtspawn',-1));
  const vnxtspawn = useRef(getlocalstorage('nxtspawn',-1));
  const [sellspawn, ssellspawn] = useState(getlocalstorage('sellspawn',[]));
  const vsellspawn = useRef(getlocalstorage('sellspawn',[]));
  const [pleakspawn, spleakspawn] = useState(getlocalstorage('pleakspawn',[]));
  const vpleakspawn = useRef(getlocalstorage('pleakspawn',[]));
  const [waitingspawn, swaitingspawn] = useState(getlocalstorage('waitingspawn',false));
  const [nxtincdiff, snxtincdiff] = useState(getlocalstorage('nxtincdiff',-1));
  const [autoincdiffed, sautoincdiffed] = useState(getlocalstorage('autoincdiffed',0));
  const [ongoinggame, songoinggame] = useState(getlocalstorage('ongoinggame',false));
  const [gameended, sgameended] = useState(getlocalstorage('gameended',false));
  const [endscreen, sendscreen] = useState(getlocalstorage('endscreen',false));
  const [starcount, sstarcount] = useState(getlocalstorage('starcount',-1));
  const vstarcount = useRef(getlocalstorage('starcount',-1));
  const [starstreak, sstarstreak] = useState(getlocalstorage('starstreak',-1));

  const [state, sstate]=useState(localStorage.getItem('state')!==null ? JSON.parse(localStorage.getItem('state')).map(i => gencell(i.loc, i.type, i, true)):
    [gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6),gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
        gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24), gencell(25), gencell(26), gencell(27,"ku",{"def":true}),
        gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38), gencell(39), gencell(40), gencell(41,"kn",{"def":true}),
        gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52), gencell(53), gencell(54), gencell(55,"ks",{"def":true}),
        gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66,"kl"), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})]
  );
  const vstate = useRef(localStorage.getItem('state')!==null ? JSON.parse(localStorage.getItem('state')).map(i => gencell(i.loc, i.type, i, true)):
    [gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6),gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
        gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24), gencell(25), gencell(26), gencell(27,"ku",{"def":true}),
        gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38), gencell(39), gencell(40), gencell(41,"kn",{"def":true}),
        gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52), gencell(53), gencell(54), gencell(55,"ks",{"def":true}),
        gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})]
  );

  useEffect(() => {
    vstate.current=state;
    rfs();
  },[state])

  useEffect(() => {
    if (frame!==-2) {localStorage.setItem('frame',JSON.stringify(frame));}
  },[frame])

  useEffect(() => {
    vdiff.current=diff;
    localStorage.setItem('diff',JSON.stringify(diff));
  },[diff])

  useEffect(() => {
    vsellspawn.current=sellspawn;
    localStorage.setItem('sellspawn',JSON.stringify([...sellspawn]));
  },[sellspawn])

  useEffect(() => {
    vtime.current=time;
    localStorage.setItem('time',JSON.stringify(time));
  },[time])

  useEffect(() => {
    vtimeon.current=timeon;
  },[timeon])

  useEffect(() => {
    vfixcount.current=fixcount;
    localStorage.setItem('fixcount',JSON.stringify(fixcount));
  },[fixcount])

  useEffect(() => {
    vcodedb.current=codedb;
    localStorage.setItem('codedb',JSON.stringify({...codedb}));
  },[codedb])

  useEffect(() => {
    vgcodedb.current=gcodedb;
    localStorage.setItem('gcodedb',JSON.stringify({...gcodedb}));
  },[gcodedb])

  useEffect(() => {
    vggcodedb.current=ggcodedb;
    localStorage.setItem('ggcodedb',JSON.stringify({...ggcodedb}));
  },[ggcodedb])

  useEffect(() => {
    localStorage.setItem('gcodeshow',JSON.stringify(gcodeshow));
  },[gcodeshow])

  useEffect(() => {
    localStorage.setItem('startset',JSON.stringify([...startset]));
  },[startset])

  useEffect(() => {
    vgamemode.current=gamemode
  },[gamemode])

  useEffect(() => {
    vnxtspawn.current=nxtspawn;
    localStorage.setItem('nxtspawn',JSON.stringify(nxtspawn));
  },[nxtspawn])

  useEffect(() => {
    localStorage.setItem('waitingspawn',JSON.stringify(waitingspawn));
  },[waitingspawn])

  useEffect(() => {
    localStorage.setItem('nxtincdiff',JSON.stringify(nxtincdiff));
  },[nxtincdiff])

  useEffect(() => {
    localStorage.setItem('autoincdiffed',JSON.stringify(autoincdiffed));
  },[autoincdiffed])

  useEffect(() => {
    vpleakspawn.current=pleakspawn;
    localStorage.setItem('pleakspawn',JSON.stringify(pleakspawn));
  },[pleakspawn])

  useEffect(() => {
    vselecting.current=selecting;
    localStorage.setItem('selecting',JSON.stringify(selecting));
  },[selecting])

  useEffect(() => {
    vmerging.current=merging;
    localStorage.setItem('merging',JSON.stringify(merging));
  },[merging])

  useEffect(() => {
    vfselecting.current=fselecting;
    localStorage.setItem('fselecting',JSON.stringify([...fselecting]));
    rfs();
  },[fselecting])

  useEffect(() => {
    vcash.current=cash;
    localStorage.setItem('cash',JSON.stringify(cash));
  },[cash])

  useEffect(() => {
    vdeliveryings.current=deliveryings;
    localStorage.setItem('deliveryings',JSON.stringify([...deliveryings]));
  },[deliveryings])

  useEffect(() => {
    localStorage.setItem('defaultgame',JSON.stringify(defaultgame));
  },[defaultgame])

  useEffect(() => {
    localStorage.setItem('gameended',JSON.stringify(gameended));
  },[gameended])

  useEffect(() => {
    localStorage.setItem('endscreen',JSON.stringify(endscreen));
  },[endscreen])

  useEffect(() => {
    localStorage.setItem('starcount',JSON.stringify(starcount));
    vstarcount.current=starcount;
  },[starcount])

  useEffect(() => {
    localStorage.setItem('starstreak',JSON.stringify(starstreak));
  },[starstreak])

  // User has switched back to the tab
  const onFocus = () => {
    console.log("Tab is in focus");
  };

  // User has switched away from the tab (AKA tab is hidden)
  const onBlur = () => {
    console.log("Tab is blurred");
    stimeon(false);
  };

  useEffect(() => {
    document.title = 'Decryptinator (v0.2) - Strategic typing game, Undarfly Universe';
    window.addEventListener('keydown', handlekeypress);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
        window.removeEventListener('keydown', handlekeypress);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    let intervalid;
    if (timeon) {
      intervalid = setInterval(() => stime(time + 1), 1000);
      for (let i=0; i<70; i++) {
        if (Date.now()-state[i].setlatency<1000) {
          state[i].latency=1000-(Date.now()-state[i].setlatency);
          state[i].setlatency=0;
        }
        if (Date.now()-state[i].setlatency2<1000) {
          state[i].latency2=1000-(Date.now()-state[i].setlatency2);
          state[i].setlatency2=0;
        }
        setTimeout(() => {state[i].itimerf();}, state[i].latency);
        setTimeout(() => {state[i].itimerf2();}, state[i].latency2);
      }
      if (time%60===0) {
        setTimeout(() => {
          const n = 1+Math.floor((diff-1)/10)+(diff%10<5 && rdint(1,2)===1 ? -1 : 0)
          const temp=[];
          for (let i=0; i<n; i++) {
            temp.push(time+rdint(1+Math.floor(60*i/n),Math.floor(60*(i+1)/n)));
          }
          spleakspawn(temp);
          vpleakspawn.current=temp;
        }, rdint(1,999));
      }
      if (vpleakspawn.current.length>=1 && time>=vpleakspawn.current[0]) {
        spawnpleak();
        const temp = [...vpleakspawn.current];
        temp.shift();
        spleakspawn(temp);
        localStorage.setItem('pleakspawn',JSON.stringify(temp));
      }
      if (time===nxtspawn) {
        if (spawndev()) {
          const temp=time+rdint(280,319);
          snxtspawn(temp);
          localStorage.setItem('nxtspawn',JSON.stringify(temp));
        }
      }
      if (vsellspawn.current.length>=1 && time>=vsellspawn.current[0]) {
        setTimeout(() => {
          spawndev();
          const temp = [...vsellspawn.current];
          temp.shift();
          ssellspawn(temp);
          localStorage.setItem('sellspawn',JSON.stringify(temp));
        }, rdint(1,999));
      }
      if (time===nxtincdiff) {
        if (diff<60) {
          sdiff(diff+1);
          const temp1=autoincdiffed*60+rdint(110,129);
          const temp2=autoincdiffed+1;
          snxtincdiff(temp1);
          sautoincdiffed(temp2);
          localStorage.setItem('nxtincdiff',JSON.stringify(temp1));
          localStorage.setItem('autoincdiffed',JSON.stringify(temp2));
        }
      }
      if (waitingspawn) {
        if (canspawn()) {
          const temp=time+rdint(6,9);
          snxtspawn(temp);
          swaitingspawn(false);
          localStorage.setItem('nxtspawn',JSON.stringify(temp));
          localStorage.setItem('waitingspawn',JSON.stringify(false));
        }
      }
      if (vgamemode.current>=0 && vgamemode.current<=2 && gameended===false) {
        if (vgamemode.current===0 && time>=10*60) {endgame();}
        if (vgamemode.current===1 && time>=20*60) {endgame();}
        if (vgamemode.current===2 && time>=30*60) {endgame();}
      }
      console.log('time: ',time,', nspawn: ',nxtspawn, 'sellspawn', sellspawn);
    }
    return () => clearInterval(intervalid);
  }, [timeon, time]);

  function distime(s,shorthand=false) {
    if (shorthand) {
      return (s+"s");
    }
    else {
      const h=(Math.floor(s/3600)<10 ? "0" : "")+Math.floor(s/3600);
      const m=(Math.floor((s%3600)/60)<10 ? "0" : "")+Math.floor((s%3600)/60);
      const ss=(Math.floor(s%60)<10 ? "0" : "")+Math.floor(s%60);
      return(h==="00" ? m+":"+ss : h+":"+m+":"+ss);
    }
  }

  function handlekeypress(e) {
    if (vfselecting.current[0]!==-1) {
      (vstate.current)[vfselecting.current[0]].handlekeypress(e.key,vfselecting.current[1]);
    }
  }

  function startnewgame() {
    sgamemode(startset[0]);
    sgamediff(startset[1]);
    sautoincdiffed(0);
    scash([5000,4500,4000,3500][startset[1]]);
    sdiff([1,6,11,16][startset[1]]);
    vdiff.current=[1,6,11,16][startset[1]];
    senableotc(startset[2]);
    senablecurse(startset[3]);
    localStorage.setItem('gameset',JSON.stringify([...startset]));

    if (startset[0]===6 || startset[0]===8) {sstarcount(3); vstarcount.current=3;}
    if (startset[0]===7 || startset[0]===9) {sstarcount(5); vstarcount.current=5;}

    stime(0); vtime.current=0;
    sstate([gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6),gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
    gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24), gencell(25), gencell(26), gencell(27,"ku",{"def":true}),
    gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38), gencell(39), gencell(40), gencell(41,"kn",{"def":true}),
    gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52), gencell(53), gencell(54), gencell(55,"ks",{"def":true}),
    gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})])

    vstate.current=[gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6), gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
    gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24), gencell(25), gencell(26), gencell(27,"ku",{"def":true}),
    gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38), gencell(39), gencell(40), gencell(41,"kn",{"def":true}),
    gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52), gencell(53), gencell(54), gencell(55,"ks",{"def":true}),
    gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})];

    if (startset[0]===11) {scash(60000);
      sdiff(40);
      vdiff.current=40;
      sstate([gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6),gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
        gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24,"thkm"), gencell(25,"tdg"), gencell(26,"tdg"), gencell(27,"ku",{"def":true}),
        gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38,"tfkm"), gencell(39,"tbf"), gencell(40,"tdg"), gencell(41,"kn",{"def":true}),
        gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52,"tfkm"), gencell(53,"tbf"), gencell(54,"tbf"), gencell(55,"ks",{"def":true}),
        gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})]
    );
    
    vstate.current=[gencell(0), gencell(1), gencell(2), gencell(3), gencell(4), gencell(5), gencell(6),gencell(7), gencell(8), gencell(9), gencell(10), gencell(11), gencell(12), gencell(13,"kl",{"def":true}),
    gencell(14), gencell(15),gencell(16), gencell(17), gencell(18), gencell(19), gencell(20),gencell(21), gencell(22), gencell(23), gencell(24,"thkm"), gencell(25,"tdg"), gencell(26,"tdg"), gencell(27,"ku",{"def":true}),
    gencell(28), gencell(29),gencell(30), gencell(31), gencell(32), gencell(33), gencell(34),gencell(35), gencell(36), gencell(37), gencell(38,"tfkm"), gencell(39,"tbf"), gencell(40,"tdg"), gencell(41,"kn",{"def":true}),
    gencell(42), gencell(43),gencell(44), gencell(45), gencell(46), gencell(47), gencell(48),gencell(49), gencell(50), gencell(51), gencell(52,"tfkm"), gencell(53,"tbf"), gencell(54,"tbf"), gencell(55,"ks",{"def":true}),
    gencell(56), gencell(57),gencell(58), gencell(59), gencell(60), gencell(61), gencell(62),gencell(63), gencell(64), gencell(65), gencell(66), gencell(67,"sw",{"def":true}), gencell(68), gencell(69,"tp",{"def":true})]
    }

    swaitingspawn(false);
    snxtspawn(rdint(130,169));
    snxtincdiff(rdint(50,69));
    ssellspawn([]);
    spleakspawn([]);
    spawndev(2);
    sgcodedb({"noteh":[], "notes":[], "notep":[], "noteu":[]});
    sggcodedb({"noteh":[], "notes":[], "notep":[], "noteu":[]});
    scodedb({"noteh":[], "notes":[], "notep":[], "noteu":[]});
    sgcodeshow("noteh");

    console.log(vstate.current);

    songoinggame(true); localStorage.setItem('ongoinggame',JSON.stringify(true));
    sgameended(false);
    sendscreen(false);
    sframe(-1);
    rfs();
    stimeon(true);
    sstartingframe(1);
  }

  function endgame() {
    if (gameended===false) {
      stimeon(false);
      sendscreen(true);
    } 
  }
  //★★★☆☆
  function gameendstat() {
    return(<>You fixed <span style={{"color":"#ff0"}}>{fixcount} </span> device{fixcount===1 ? "": "s"} in <span  style={{"color":"#f0f"}}> {distime(vtime.current)} </span> with <span style={{"color":"#0f0"}}> ${vcash.current} </span> left!</>)
  }

  function disgamemode() {
    return(["Best in 20 minutes","Best in 40 minutes","Best in 60 minutes","Fastest to 30 fixes","Fastest to 60 fixes","Fastest to 100 fixes",
      ["3☆ St☆r-keep☆r","3★ St☆r-keep☆r","3★ St★r-keep☆r","3★ St★r-keep★r"][vstarcount.current],
      ["5☆ St☆r-k☆☆p☆r","5★ St☆r-k☆☆p☆r","5★ St★r-k☆☆p☆r","5★ St★r-k★☆p☆r","5★ St★r-k★★p☆r","5★ St★r-k★★p★r"][vstarcount.current],
      ["3☆ Regen St☆r-keep☆r","3★ Regen St☆r-keep☆r","3★ Regen St★r-keep☆r","3★ Regen St★r-keep★r"][vstarcount.current],
      ["5☆ Regen St☆r-k☆☆p☆r","5★ Regen St☆r-k☆☆p☆r","5★ Regen St★r-k☆☆p☆r","5★ Regen St★r-k★☆p☆r","5★ Regen St★r-k★★p☆r","5★ Regen St★r-k★★p★r"][vstarcount.current],
      "Rental","Sandbox"][vgamemode.current]+" <"+(defaultgame ? "" : "*")+["E","N","H","💀"][gamediff]+(gameended ? "∞" : "")+">")
  }

  function startingmenu(n) {
    function getstyle(w,h,s,n=-1) {
      const sd={"width":w,"height":h}
      if (startset[s]===n) {
        sd["borderColor"] = "#0AA";
        sd["borderStyle"] = "solid";
        sd["backgroundColor"] = "#99EDC3";
        sd["zIndex"] = "1";
      }
      return(sd)
    }
    function sstartsetx(x,n) {
      if (n===8 || n===9 || n===10) {return;}
      const temp=[...startset];
      temp[x]=n;
      sstartset(temp);
    }
    if (n===1 || n===11) {
      return(<>
      <div id="starttitle">D☣cryptinator</div>
      <div id="startdes">An original <a href="https://fly.undarr.com/" target="_blank" rel="noreferrer">Undarfly</a> react.js game by <a href="https://fly.undarr.com/profile/" target="_blank" rel="noreferrer">Ulfred Chan</a>, 2024</div>
      {n===1 ? 
      <><button className="startbutton" onClick={() => {sstartingframe(11);}}>Start Game</button>
      <a href="https://fly.undarr.com/decryptinator/" target="_blank" rel="noreferrer"><button className="startbutton">How to Play</button></a>
      <button className="startbutton" onClick={() => {sstartingframe(21);}}>View High Scores</button></>
      :<>{ongoinggame ? <button className="startbutton" onClick={() => {sstartingframe(1); sframe(getlocalstorage('frame',-1));}}><div style={{"fontSize":"min(2.5vw,5vh)"}}>Continue Game</div>
        <div style={{"fontSize":"min(1vw,2vh)"}}>{disgamemode()}, <span className="cash">${cash}</span>, <span className="time">{distime(time)}</span>, <span className="diff">💀{"<"}{diff}{"/60>"}</span>, Fixed {"<"}{fixcount}{">"}</div></button>
      : <button className="startbutton disabled">Continue Game</button>}
      {ongoinggame ? <button className="startbutton" onClick={() => {sstartingframe(111);}}><div style={{"fontSize":"min(2.5vw,5vh)"}}>Start New Game</div>
      <div style={{"fontSize":"min(1vw,2vh)"}}>⚠ Warning, starting a new game will wipe the progress of the current game ⚠</div></button>
      : <button className="startbutton" onClick={() => {sstartingframe(111);}}>Start New Game</button>}
      <button className="startbutton" onClick={() => {sstartingframe(1);}}>Back</button></>
      }
      <br></br>
      <br></br>
      <div id="startdes">Inspired by <a href="https://store.steampowered.com/app/1831530/PC_Creator__PC_Building_Simulator/" target="_blank" rel="noreferrer">PC creator</a>, dedicated to <a href="https://www.instagram.com/meliora_csa/" target="_blank" rel="noreferrer">Meliora</a>.</div>
      </>)
    }
    if (n===21) {
      return(<>
      <div id="starttitle">High Scores</div>
      <div id="startdes">(In progress)</div>
      <button className="startbutton" onClick={() => {sstartingframe(1);}}>Back</button>
      </>)
    }
    if (n===111) {
      return(<>
      <div id="starttitle">D☣cryptinator</div>
      <div>
      <div id="startdes">Gamemode: (Click to select)</div>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,0)} onClick={() => {sstartsetx(0,0);}}>10 mins</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,1)} onClick={() => {sstartsetx(0,1);}}>20 mins</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,2)} onClick={() => {sstartsetx(0,2);}}>30 mins</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,3)} onClick={() => {sstartsetx(0,3);}}>15 fixes</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,4)} onClick={() => {sstartsetx(0,4);}}>30 fixes</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,5)} onClick={() => {sstartsetx(0,5);}}>50 fixes</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,6)} onClick={() => {sstartsetx(0,6);}}>3 Stars</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,7)} onClick={() => {sstartsetx(0,7);}}>5 Stars</button>
      <button className="startbutton2 disabled" style={getstyle("15%","min(4vw,8vh)",0,8)} onClick={() => {sstartsetx(0,8);}}>3 StarsR</button>
      <button className="startbutton2 disabled" style={getstyle("15%","min(4vw,8vh)",0,9)} onClick={() => {sstartsetx(0,9);}}>5 StarsR</button>
      <button className="startbutton2 disabled" style={getstyle("15%","min(4vw,8vh)",0,10)} onClick={() => {sstartsetx(0,10);}}>Rental</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",0,11)} onClick={() => {sstartsetx(0,11);}}>Sandbox</button>
      </div>
      <div>
      <div id="startdes">Game difficulty: (Click to select)</div>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",1,0)} onClick={() => {sstartsetx(1,0);}}>Easy</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",1,1)} onClick={() => {sstartsetx(1,1);}}>Normal</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",1,2)} onClick={() => {sstartsetx(1,2);}}>Hard</button>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)",1,3)} onClick={() => {sstartsetx(1,3);}}>Insane</button>
      </div>
      <br></br>
      <br></br>
      <br></br>
      <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)")} onClick={() => {sstartingframe(11);}}>Back</button>
      <button className="startbutton2 disabled" style={getstyle("30%","min(4vw,8vh)")} onClick={() => {}}>Further Customize</button>
      <button className="startbutton2" style={getstyle("30%","min(4vw,8vh)")} onClick={() => {startnewgame();}}>Start New Game!</button>
      </>)
    }
    if (n===1111) {
      return(<>
        <div id="starttitle">D☣cryptinator</div>
        <div>
        <div id="startdes">More Customizations: (Click to toggle)</div>

        </div>
        <br></br>
        <button className="startbutton2" style={getstyle("15%","min(4vw,8vh)")} onClick={() => {sstartingframe(11);}}>Back</button>
        <button className="startbutton2 disabled" style={getstyle("30%","min(4vw,8vh)")} onClick={() => {}}>Further customize</button>
        <button className="startbutton2" style={getstyle("30%","min(4vw,8vh)")} onClick={() => {startnewgame();}}>Start New Game!</button>
        </>)
    }
  }

  return (
    <div className="App">
    <link href="https://fonts.googleapis.com/css2?family=Shantell+Sans" rel="stylesheet"></link>
    <link rel="stylesheet"href="https://fonts.googleapis.com/css2?family=Playpen+Sans"></link>
    <link rel="stylesheet"href="https://fonts.googleapis.com/css2?family=Balsamiq+Sans"></link>
    <link rel="stylesheet"href="https://fonts.googleapis.com/css2?family=Comic+Neue"></link>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Audiowide"></link>
    <div className="header">
      <h1 className="header-left">Decryptinator (v0.2)</h1>
      <div className="header-right">
        <h1>an Original Game</h1>
      </div>
      <div style={{clear: "both"}}></div>
    </div>
    <div className={frame===-2 ? "startframe frame" : "frame hide"}>
      {startingmenu(startingframe)}
    </div>
    <button className={frame!==-2 ? "pausebutton" : "pausebutton hide"} onClick={() => {stimeon(false);}} style={{"backgroundImage" : "url(./img/pausebtn.gif)"}}></button>
    <div className="pauseoverlay" style={{"height":(frame!==-2 && !timeon ? "100%" : "0%"), "transition":(endscreen ? "0.5s" : "0s")}}>
      <div className={frame!==-2 && !timeon ? "pauseoverlayin" : "hide"}>
        <div id="pausetitle">{endscreen ? "G☣me ended!" : "D☣cryptinator"}</div>
        <div id="pausedes">{endscreen ? gameendstat() : "Game paused"}</div>
        <button className="startbutton" onClick={() => {stimeon(true); if (endscreen) {sendscreen(false); sgameended(true);}}}>{endscreen ? "Continue Endless" : "Continue Game"}</button>
        <button className="startbutton" onClick={() => {sframe(-2);}}>Back to main menu</button>
      </div>
    </div>
    <div className={frame===-1 ? "frame" : "frame hide"}>
    <table className="setup">
      <tbody>
        <tr>
          <td className="topbar taleft bd" colSpan="6">{disgamemode()}</td>
          <td className="topbar taright bd cash" colSpan="2">${cash}</td>
          <td className="topbar taright bd time" colSpan="2">{distime(time)} +</td>
          <td className="topbar taright bd diff" colSpan="2">💀{"<"}{diff}{"/60>"}</td>
          <td className="topbar taright bd" colSpan="2">Fixed {"<"}{fixcount}{">"}</td>
        </tr>
        {showsetup()}
      </tbody>
    </table>
      {showdetails(state,selecting)}
    </div>
    <div className={frame<=-1 ? "frame hide" : "frame"}>
    <table className="tstable">
      <tbody>
        <tr>
          <td className="topbar taleft" colSpan="6">{disgamemode()}</td>
          <td className="topbar taright cash" colSpan="2">${cash}</td>
          <td className="topbar taright time" colSpan="2">{distime(time)} +</td>
          <td className="topbar taright diff" colSpan="2">💀{"<"}{diff}{"/60>"}</td>
          <td className="topbar taright" colSpan="2">Fixed {"<"}{fixcount}{">"}</td>
        </tr>
        <tr>
          <td className="tsscreen" colSpan="6">
            <div className="tsscreendiv">
              {getscreen(0,frame)}
            </div>
            <div id="poslabel">up</div>
          </td>
          <td className="tsscreen" colSpan="6">
            <div className="tsscreendiv">
              {getscreen(1,frame)}
            </div>
            <div id="poslabel">right</div>
          </td>
          <td id="wirelessinfo" rowSpan="2" colSpan="2">
            <div id="wirelessinfodiv">
              <u>Wireless Info.</u><br></br>
              <br></br>
              Vert code:<br></br>
              <span className="codeinput">{vcode}</span><br></br>
              <br></br>
              Globalcodes:<br></br>
              <div id="gcodesframe">
                  <table id="gcodestable">
                    <tbody>
                    <tr style={{"height":"min(1.25vw,2.5vh)"}}>
                      <td style={{"height":"min(1.25vw,2.5vh)"}}><button className={gcodeshow==="noteh" ? "gcodeshowbsel" : "gcodeshowb"} onClick={() => {sgcodeshow("noteh"); rfs();}}>HCK</button></td>
                      <td style={{"height":"min(1.25vw,2.5vh)"}}><button className={gcodeshow==="notep" ? "gcodeshowbsel" : "gcodeshowb"} onClick={() => {sgcodeshow("notep"); rfs();}}>PIN</button></td>
                      <td style={{"height":"min(1.25vw,2.5vh)"}}><button className={gcodeshow==="notes" ? "gcodeshowbsel" : "gcodeshowb"} onClick={() => {sgcodeshow("notes"); rfs();}}>SEC</button></td>
                      <td style={{"height":"min(1.25vw,2.5vh)"}}><button className={gcodeshow==="noteu" ? "gcodeshowbsel" : "gcodeshowb"} onClick={() => {console.log(codedb, gcodedb); sgcodeshow("noteu"); rfs();}}>UNI</button></td>
                    </tr>
                    <tr><td colSpan="4" style={{"borderTop":"solid", "verticalAlign":"top", "paddingTop":"min(0.5vw,1vh)"}}>
                    {symtoname(gcodeshow)}s:<br></br>
                    {gcodedb[gcodeshow].length===0 ? <>*empty*</>: gcodedb[gcodeshow].map((i) => (
                    <>{i.autotyping ? <span className="normalfont">🖮</span> : <></>}{i.qgen ? <span className="normalfont">🛜</span> : <></>}{i.autotyping || i.qgen ? " " : ""}<span className="codeinput">{i.code}</span><br></br></>))}
                    </td></tr>
                    </tbody>
                  </table>
              </div>
              <br></br>
              <br></br>⠀
            </div>
            <div id="backtosetupdiv">
                <button id="backtosetupbtn" onClick={() => changeframe(-1)}>Back to<br></br>setup</button>
            </div>
          </td>
        </tr>
        <tr>
          <td className="tsscreen" colSpan="6">
            <div className="tsscreendiv">
              {getscreen(2,frame)}
            </div>
            <div id="poslabel">left</div>
          </td>
          <td className="tsscreen" colSpan="6">
            <div className="tsscreendiv">
              {getscreen(3,frame)}
            </div>
            <div id="poslabel">down</div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <footer><div className="footer1">Self Learning Project since 10th April 2024, by Ulfred Chan</div></footer>
    </div>
  );
}

export default App;