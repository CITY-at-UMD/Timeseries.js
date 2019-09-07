import{DataFrame as t}from"data-forge";import e from"dayjs";import{medianAbsoluteDeviation as r,quantile as n}from"simple-statistics";function o(){return(o=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t}).apply(this,arguments)}var a=function(t,e){return t===e||t!=t&&e!=e},i=function(t,e){for(var r=t.length;r--;)if(a(t[r][0],e))return r;return-1},u=Array.prototype.splice;function c(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}c.prototype.clear=function(){this.__data__=[],this.size=0},c.prototype.delete=function(t){var e=this.__data__,r=i(e,t);return!(r<0||(r==e.length-1?e.pop():u.call(e,r,1),--this.size,0))},c.prototype.get=function(t){var e=this.__data__,r=i(e,t);return r<0?void 0:e[r][1]},c.prototype.has=function(t){return i(this.__data__,t)>-1},c.prototype.set=function(t,e){var r=this.__data__,n=i(r,t);return n<0?(++this.size,r.push([t,e])):r[n][1]=e,this};var f=c,s="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function l(t,e){return t(e={exports:{}},e.exports),e.exports}var d,h="object"==typeof s&&s&&s.Object===Object&&s,p="object"==typeof self&&self&&self.Object===Object&&self,v=h||p||Function("return this")(),y=v.Symbol,b=Object.prototype,_=b.hasOwnProperty,g=b.toString,j=y?y.toStringTag:void 0,w=Object.prototype.toString,m=y?y.toStringTag:void 0,O=function(t){return null==t?void 0===t?"[object Undefined]":"[object Null]":m&&m in Object(t)?function(t){var e=_.call(t,j),r=t[j];try{t[j]=void 0;var n=!0}catch(t){}var o=g.call(t);return n&&(e?t[j]=r:delete t[j]),o}(t):function(t){return w.call(t)}(t)},A=function(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)},x=function(t){if(!A(t))return!1;var e=O(t);return"[object Function]"==e||"[object GeneratorFunction]"==e||"[object AsyncFunction]"==e||"[object Proxy]"==e},S=v["__core-js_shared__"],z=(d=/[^.]+$/.exec(S&&S.keys&&S.keys.IE_PROTO||""))?"Symbol(src)_1."+d:"",E=Function.prototype.toString,P=function(t){if(null!=t){try{return E.call(t)}catch(t){}try{return t+""}catch(t){}}return""},k=/^\[object .+?Constructor\]$/,T=Function.prototype,D=Object.prototype,M=RegExp("^"+T.toString.call(D.hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),F=function(t,e){var r=function(t,e){return null==t?void 0:t[e]}(t,e);return function(t){return!(!A(t)||(e=t,z&&z in e))&&(x(t)?M:k).test(P(t));var e}(r)?r:void 0},N=F(v,"Map"),V=F(Object,"create"),B=Object.prototype.hasOwnProperty,I=Object.prototype.hasOwnProperty;function $(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}$.prototype.clear=function(){this.__data__=V?V(null):{},this.size=0},$.prototype.delete=function(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e},$.prototype.get=function(t){var e=this.__data__;if(V){var r=e[t];return"__lodash_hash_undefined__"===r?void 0:r}return B.call(e,t)?e[t]:void 0},$.prototype.has=function(t){var e=this.__data__;return V?void 0!==e[t]:I.call(e,t)},$.prototype.set=function(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=V&&void 0===e?"__lodash_hash_undefined__":e,this};var q=$,R=function(t,e){var r,n,o=t.__data__;return("string"==(n=typeof(r=e))||"number"==n||"symbol"==n||"boolean"==n?"__proto__"!==r:null===r)?o["string"==typeof e?"string":"hash"]:o.map};function U(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}U.prototype.clear=function(){this.size=0,this.__data__={hash:new q,map:new(N||f),string:new q}},U.prototype.delete=function(t){var e=R(this,t).delete(t);return this.size-=e?1:0,e},U.prototype.get=function(t){return R(this,t).get(t)},U.prototype.has=function(t){return R(this,t).has(t)},U.prototype.set=function(t,e){var r=R(this,t),n=r.size;return r.set(t,e),this.size+=r.size==n?0:1,this};var L=U;function C(t){var e=this.__data__=new f(t);this.size=e.size}C.prototype.clear=function(){this.__data__=new f,this.size=0},C.prototype.delete=function(t){var e=this.__data__,r=e.delete(t);return this.size=e.size,r},C.prototype.get=function(t){return this.__data__.get(t)},C.prototype.has=function(t){return this.__data__.has(t)},C.prototype.set=function(t,e){var r=this.__data__;if(r instanceof f){var n=r.__data__;if(!N||n.length<199)return n.push([t,e]),this.size=++r.size,this;r=this.__data__=new L(n)}return r.set(t,e),this.size=r.size,this};var G=C;function W(t){var e=-1,r=null==t?0:t.length;for(this.__data__=new L;++e<r;)this.add(t[e])}W.prototype.add=W.prototype.push=function(t){return this.__data__.set(t,"__lodash_hash_undefined__"),this},W.prototype.has=function(t){return this.__data__.has(t)};var Z=W,Q=function(t,e){for(var r=-1,n=null==t?0:t.length;++r<n;)if(e(t[r],r,t))return!0;return!1},H=function(t,e,r,n,o,a){var i=1&r,u=t.length,c=e.length;if(u!=c&&!(i&&c>u))return!1;var f=a.get(t);if(f&&a.get(e))return f==e;var s=-1,l=!0,d=2&r?new Z:void 0;for(a.set(t,e),a.set(e,t);++s<u;){var h=t[s],p=e[s];if(n)var v=i?n(p,h,s,e,t,a):n(h,p,s,t,e,a);if(void 0!==v){if(v)continue;l=!1;break}if(d){if(!Q(e,function(t,e){if(!d.has(e)&&(h===t||o(h,t,r,n,a)))return d.push(e)})){l=!1;break}}else if(h!==p&&!o(h,p,r,n,a)){l=!1;break}}return a.delete(t),a.delete(e),l},J=v.Uint8Array,K=function(t){var e=-1,r=Array(t.size);return t.forEach(function(t,n){r[++e]=[n,t]}),r},X=function(t){var e=-1,r=Array(t.size);return t.forEach(function(t){r[++e]=t}),r},Y=y?y.prototype:void 0,tt=Y?Y.valueOf:void 0,et=Array.isArray,rt=Object.prototype.propertyIsEnumerable,nt=Object.getOwnPropertySymbols,ot=nt?function(t){return null==t?[]:(t=Object(t),function(e,r){for(var n=-1,o=null==e?0:e.length,a=0,i=[];++n<o;){var u=e[n];rt.call(t,u)&&(i[a++]=u)}return i}(nt(t)))}:function(){return[]},at=function(t){return null!=t&&"object"==typeof t},it=function(t){return at(t)&&"[object Arguments]"==O(t)},ut=Object.prototype,ct=ut.hasOwnProperty,ft=ut.propertyIsEnumerable,st=it(function(){return arguments}())?it:function(t){return at(t)&&ct.call(t,"callee")&&!ft.call(t,"callee")},lt=function(){return!1},dt=l(function(t,e){var r=e&&!e.nodeType&&e,n=r&&t&&!t.nodeType&&t,o=n&&n.exports===r?v.Buffer:void 0;t.exports=(o?o.isBuffer:void 0)||lt}),ht=/^(?:0|[1-9]\d*)$/,pt=function(t,e){var r=typeof t;return!!(e=null==e?9007199254740991:e)&&("number"==r||"symbol"!=r&&ht.test(t))&&t>-1&&t%1==0&&t<e},vt=function(t){return"number"==typeof t&&t>-1&&t%1==0&&t<=9007199254740991},yt={};yt["[object Float32Array]"]=yt["[object Float64Array]"]=yt["[object Int8Array]"]=yt["[object Int16Array]"]=yt["[object Int32Array]"]=yt["[object Uint8Array]"]=yt["[object Uint8ClampedArray]"]=yt["[object Uint16Array]"]=yt["[object Uint32Array]"]=!0,yt["[object Arguments]"]=yt["[object Array]"]=yt["[object ArrayBuffer]"]=yt["[object Boolean]"]=yt["[object DataView]"]=yt["[object Date]"]=yt["[object Error]"]=yt["[object Function]"]=yt["[object Map]"]=yt["[object Number]"]=yt["[object Object]"]=yt["[object RegExp]"]=yt["[object Set]"]=yt["[object String]"]=yt["[object WeakMap]"]=!1;var bt,_t=l(function(t,e){var r=e&&!e.nodeType&&e,n=r&&t&&!t.nodeType&&t,o=n&&n.exports===r&&h.process,a=function(){try{return n&&n.require&&n.require("util").types||o&&o.binding&&o.binding("util")}catch(t){}}();t.exports=a}),gt=_t&&_t.isTypedArray,jt=gt?(bt=gt,function(t){return bt(t)}):function(t){return at(t)&&vt(t.length)&&!!yt[O(t)]},wt=Object.prototype.hasOwnProperty,mt=Object.prototype,Ot=function(t,e){return function(r){return t(e(r))}}(Object.keys,Object),At=Object.prototype.hasOwnProperty,xt=function(t){return function(t,e,r){var n=function(t){return null!=(e=t)&&vt(e.length)&&!x(e)?function(t,e){var r=et(t),n=!r&&st(t),o=!r&&!n&&dt(t),a=!r&&!n&&!o&&jt(t),i=r||n||o||a,u=i?function(t,e){for(var r=-1,n=Array(t);++r<t;)n[r]=e(r);return n}(t.length,String):[],c=u.length;for(var f in t)!wt.call(t,f)||i&&("length"==f||o&&("offset"==f||"parent"==f)||a&&("buffer"==f||"byteLength"==f||"byteOffset"==f)||pt(f,c))||u.push(f);return u}(t):function(t){if((e=t)!==("function"==typeof(r=e&&e.constructor)&&r.prototype||mt))return Ot(t);var e,r,n=[];for(var o in Object(t))At.call(t,o)&&"constructor"!=o&&n.push(o);return n}(t);var e}(t);return et(t)?n:function(t,e){for(var r=-1,n=e.length,o=t.length;++r<n;)t[o+r]=e[r];return t}(n,r(t))}(t,0,ot)},St=Object.prototype.hasOwnProperty,zt=F(v,"DataView"),Et=F(v,"Promise"),Pt=F(v,"Set"),kt=F(v,"WeakMap"),Tt=P(zt),Dt=P(N),Mt=P(Et),Ft=P(Pt),Nt=P(kt),Vt=O;(zt&&"[object DataView]"!=Vt(new zt(new ArrayBuffer(1)))||N&&"[object Map]"!=Vt(new N)||Et&&"[object Promise]"!=Vt(Et.resolve())||Pt&&"[object Set]"!=Vt(new Pt)||kt&&"[object WeakMap]"!=Vt(new kt))&&(Vt=function(t){var e=O(t),r="[object Object]"==e?t.constructor:void 0,n=r?P(r):"";if(n)switch(n){case Tt:return"[object DataView]";case Dt:return"[object Map]";case Mt:return"[object Promise]";case Ft:return"[object Set]";case Nt:return"[object WeakMap]"}return e});var Bt=Vt,It=Object.prototype.hasOwnProperty,$t=function(t){var r=t[0],n=t[1],o=void 0===n?1:n;return function(t,n){var a=t[0];return Math.floor(e(n[0]).diff(a,r,!0)/o)>0}},qt=function(t,e,r){var n,o,a=e.startValue,i=e.endValue,u=e.entryIndex,c=e.numEntries,f=r.overrideValue,s=r.dateFunction,l=r.date,d=r.flag;if(!(-1===["pad","interpolate","average"].indexOf(t)||a&&i&&u&&c))throw new Error("fill Type not supported without date, index and entries");return"pad"===t?(n=a.value,f&&(n=f),o=["fill",t]):"interpolate"===t?(n=a.value+(u+1)*((i.value-a.value)/c),f&&(n=f),o=["fill",t]):"average"===t?(n=(a.value+i.value)/c,f&&(n=f/c),o=["fill",t]):"dateFunction"===t&&s?(n=s(l),o=["fill",t]):"value"===t&&!isNaN(f)&&f?(n=f,o=["fill",t]):(n=null,o=["fill"]),d&&(o=d),{value:n,flag:o}},Rt=function(t,r,n){var o=r[0],a=r[1],i=void 0===n?{}:n,u=i.overrideValue,c=i.dateFunction,f=i.flag;return function(r,n){for(var i=r[0],s=Math.floor(e(n[0]).diff(i,o)/a)-1,l=r[1],d=n[1],h=[],p=0;p<s;++p){var v=qt(t,{startValue:l,endValue:d,entryIndex:p,numEntries:s},{overrideValue:u,dateFunction:c,flag:f}),y=e(i).add((p+1)*a,o).toDate(),b=[y.valueOf(),Object.assign({},v,{date:y})];h.push(b)}return h}},Ut=function(i){var u,c;function f(e){void 0===e&&(e=[]),(e instanceof t||e instanceof f)&&(e=e.toArray());var r={values:e=e.sort(function(t,e){return new Date(t.date).valueOf()-new Date(e.date).valueOf()}),index:e.map(function(t){return new Date(t.date).valueOf()}),considerAllRows:!0};return i.call(this,r)||this}c=i,(u=f).prototype=Object.create(c.prototype),u.prototype.constructor=u,u.__proto__=c;var s,l=f.prototype;return l.dateRange=function(t,r){var n=e(this.first().date),o=e(this.last().date);return r&&(n=n.startOf(r),o=o.endOf(r)),o.diff(n,t)},l.at=function(t){return i.prototype.at.call(this,new Date(t).valueOf())},l.calculateThresholds=function(t){var e=void 0===t?{}:t,r=e.k,n=e.filterZeros,o=void 0===n||n,a=this.where(function(t){return null==t.flag||Array.isArray(t.flag)&&0===t.flag.length}).where(function(t){return!isNaN(t.value)&&null!==t.value}).getSeries("value");return o&&(a=a.where(function(t){return 0!==t})),r||(r=a.count()<1e3?Math.floor(.15*a.count()):Math.min.apply(Math,[1e3,Math.floor(.02*a.count())])),a.count()<5?{}:{esd:rosnerTest(a.toArray(),r).thresholds,box:boxPlotTest(a.toArray()).thresholds,modz:modifiedZScoreTest(a.toArray()).thresholds}},l.removeOutliers=function(t){var e=void 0===t?{}:t,r=e.lowerThreshold,n=e.upperThreshold;if(r>n)throw new Error("thresholds invalid");var o=function(t,e,r){return t<e||t>r};return this.generateSeries({raw:function(t){return o(t.value,r,n)?t.value:null},flag:function(t){return o(t.value,r,n)?["outlier"]:null}}).transformSeries({value:function(t){return o(t,r,n)?null:t}})},l.reset=function(){return this.withSeries({value:function(t){return t.raw&&!isNaN(t.raw)?t.raw:t.value}}).dropSeries(["flag","raw"])},l.group=function(t,r){if(-1===["hour","day","month","year"].indexOf(t))throw new Error("interval type not supported");return this.groupBy(function(r){return e(r.date).startOf(t)})},l.resample=function(t,r){var n=t[0],o=t[1],i=void 0===o?1:o;if(-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");var u=this.interval;if(function t(e,r,n,o,i){return e===r||(null==e||null==r||!at(e)&&!at(r)?e!=e&&r!=r:function(t,e,r,n,o,i){var u=et(t),c=et(e),f=u?"[object Array]":Bt(t),s=c?"[object Array]":Bt(e),l="[object Object]"==(f="[object Arguments]"==f?"[object Object]":f),d="[object Object]"==(s="[object Arguments]"==s?"[object Object]":s),h=f==s;if(h&&dt(t)){if(!dt(e))return!1;u=!0,l=!1}if(h&&!l)return i||(i=new G),u||jt(t)?H(t,e,r,n,o,i):function(t,e,r,n,o,i,u){switch(f){case"[object DataView]":if(t.byteLength!=e.byteLength||t.byteOffset!=e.byteOffset)return!1;t=t.buffer,e=e.buffer;case"[object ArrayBuffer]":return!(t.byteLength!=e.byteLength||!i(new J(t),new J(e)));case"[object Boolean]":case"[object Date]":case"[object Number]":return a(+t,+e);case"[object Error]":return t.name==e.name&&t.message==e.message;case"[object RegExp]":case"[object String]":return t==e+"";case"[object Map]":var c=K;case"[object Set]":if(c||(c=X),t.size!=e.size&&!(1&n))return!1;var s=u.get(t);if(s)return s==e;n|=2,u.set(t,e);var l=H(c(t),c(e),n,o,i,u);return u.delete(t),l;case"[object Symbol]":if(tt)return tt.call(t)==tt.call(e)}return!1}(t,e,0,r,n,o,i);if(!(1&r)){var p=l&&It.call(t,"__wrapped__"),v=d&&It.call(e,"__wrapped__");if(p||v){var y=p?t.value():t,b=v?e.value():e;return i||(i=new G),o(y,b,r,n,i)}}return!!h&&(i||(i=new G),function(t,e,r,n,o,a){var i=1&r,u=xt(t),c=u.length;if(c!=xt(e).length&&!i)return!1;for(var f=c;f--;){var s=u[f];if(!(i?s in e:St.call(e,s)))return!1}var l=a.get(t);if(l&&a.get(e))return l==e;var d=!0;a.set(t,e),a.set(e,t);for(var h=i;++f<c;){var p=t[s=u[f]],v=e[s];if(n)var y=i?n(v,p,s,e,t,a):n(p,v,s,t,e,a);if(!(void 0===y?p===v||o(p,v,r,n,a):y)){d=!1;break}h||(h="constructor"==s)}if(d&&!h){var b=t.constructor,_=e.constructor;b!=_&&"constructor"in t&&"constructor"in e&&!("function"==typeof b&&b instanceof b&&"function"==typeof _&&_ instanceof _)&&(d=!1)}return a.delete(t),a.delete(e),d}(t,e,r,n,o,i))}(e,r,n,o,t,i))}(u,[n,i]))return this;var c=e(0);return e(0).add(u[1],u[0]).diff(c)<e(0).add(i,n).diff(c)?this.downsample([n,i],r):this.upsample([n,i],r)},l.upsample=function(t,e){var r=t[0],n=t[1];return void 0===e&&(e="avg"),this.fillGaps($t([r,n]),Rt(e,[r,n]))},l.downsample=function(t,r){var n=t[0],a=t[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var i=function(t){return e(t.date).startOf(n)};return a&&(i=function(t){return e(t.date).startOf(n).add(a,n)}),this.groupBy(i).select(function(t){return o({date:e(t.first().date).startOf(n).toDate()},function(t){for(var e=-1,r=null==t?0:t.length,n={};++e<r;){var o=t[e];n[o[0]]=o[1]}return n}(t.getColumnNames().filter(function(t){return"date"!==t}).map(function(e){var n;switch(r){case"median":n=t.deflate(function(t){return t[e]}).median();break;case"avg":n=t.deflate(function(t){return t[e]}).average();break;default:n=t.deflate(function(t){return t[e]}).sum()}return[e,n]})))}).inflate().withIndex(function(t){return t.date.valueOf()})},l.calculateStatistics=function(t){var e=void 0===t?{}:t,o=e.filterZeros,a=void 0!==o&&o,i=e.filterNegative,u=void 0===i||i,c=this.deflate(function(t){return t[columnName]}).where(function(t){return!isNaN(t)});u&&(c=c.where(function(t){return t>=0})),a&&(c=c.where(function(t){return 0!==t}));var f=c.median(),s=c.average(),l=c.count(),d=c.std(),h=c.min(),p=c.max(),v=r(c.toArray()),y=n(c.toArray(),.25),b=n(c.toArray(),.75);return{median:f,mean:s,count:l,std:d,min:h,max:p,mad:v,q1:y,q3:b,iqr:b-y}},l.dataQuality=function(){return this.count(),this.getSeries("flag").where(function(t){return null==t||Array.isArray(t)&&0===t.length}).count(),this.getSeries("flag").where(function(t){return Array.isArray(t)}).where(function(t){return-1!==t.indexOf("missing")}).count(),this.getSeries("flag").where(function(t){return Array.isArray(t)}).where(function(t){return-1!==t.indexOf("outlier")}).count(),this.getSeries("flag").where(function(t){return Array.isArray(t)}).where(function(t){return-1!==t.indexOf("zeroFill")}).count(),{}},l.populate=function(t,e){var r;switch(void 0===e&&(e="avg"),e){case"fill":r=t;break;default:r=t/this.getIndex().count()}return this.generateSeries({value:function(t){return r}})},l.fill=function(t,e){return t&&Array.isArray(t)||(t=this.interval),new f(this.fillGaps($t(t),Rt(e,t)))},f.blank=function(t,r,n){var a=n[0],i=n[1],u=void 0===i?1:i;if(["minute","hour","day","month","year"].indexOf(a)<0)throw console.error(interval),new Error("interval type not supported");var c=new f([{date:new Date(t)},{date:new Date(r)}]).fillGaps($t([a,u]),function(t,r){var n=t[0],a=t[1];return function(t,r){for(var i=t[0],u=Math.floor(e(r[0]).diff(i,n)/a)-1,c=[],f=0;f<u;++f){var s=e(i).add((f+1)*a,n).toDate();c.push([s.valueOf(),o({date:s,value:null},void 0)])}return c}}([a,u])).between(t,r);return new f(c)},f.aggregate=function(e){return Array.isArray(e)||(e=[e]),e=e.map(function(t){return new f(t)}),new f(t.concat(e).groupBy(function(t){return t.date}).select(function(t){var e={date:t.first().date};return t.getColumnNames().filter(function(t){return"date"!==t}).forEach(function(r){return e[r]=t.deflate(function(t){return t[r]}).sum()}),e}).inflate().toArray())},(s=[{key:"interval",get:function(){var t,r,n,o=this.first().date,a=this.last().date;return t=this.between(o,a).getIndex().window(2).select(function(t){return t.last()-t.first()}).detectValues().orderBy(function(t){return t.Frequency}).orderBy(function(t){return t.Value}).last().Value,r=e(),(n=e().add(t)).diff(r,"year",!0)>=1?["year",n.diff(r,"year")]:n.diff(r,"month",!0)>=1?["month",n.diff(r,"month")]:n.diff(r,"day",!0)>=1?["day",n.diff(r,"day")]:n.diff(r,"hour",!0)>=1?["hour",n.diff(r,"hour")]:["minute",n.diff(r,"minute")]}}])&&function(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}(f.prototype,s),f}(t);export default Ut;
//# sourceMappingURL=index.modern.js.map