import e from"dayjs";import t,{DataFrame as r}from"data-forge";import n from"lodash/isEqual";import o from"lodash/has";import i from"lodash/get";import l from"lodash/fromPairs";import s from"lodash/toPairs";import{mean as u,median as d,medianAbsoluteDeviation as f,quantile as v,sampleStandardDeviation as h,max as p,ckmeans as g}from"simple-statistics";import{Studentt as c}from"distributions";function m(){return(m=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(e[a]=r[a])}return e}).apply(this,arguments)}function y(e,t){if(null==e)return{};var r,a,n={},o=Object.keys(e);for(a=0;a<o.length;a++)t.indexOf(r=o[a])>=0||(n[r]=e[r]);return n}var w=t=>{var[r,a]=t,n=e();return e().add(a,r).diff(n)},S=(e,t,r)=>{var a,{startValue:n,endValue:o,entryIndex:i,numEntries:u}=t,{overrideValue:d,dateFunction:f,date:v,flag:h}=r;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(a=l(s(n).map(e=>{var[t,r]=e;return[t,n[t]]})),h=h||["fill","pad"]):"interpolate"===e?(a=l(s(n).map(e=>{var[t,r]=e;return[t,n[t]+(i+1)*((o[t]-n[t])/(u+1))]})),h=h||["fill",e]):"average"===e?(a=l(s(n).map(e=>{var[t,r]=e;return[t,(n[t]+o[t])/u]})),h=h||["fill",e]):"dateFunction"===e&&f?(a=l(s(n).map(e=>{var[t,r]=e;return[t,f(v)]})),h=h||["fill",e]):"value"===e?(a=l(s(n).map(e=>{var[t,r]=e;return[t,"number"==typeof d?d:d[t]]})),h=h||["fill",e]):(a=l(s(n).map(e=>{var[t,r]=e;return[t,null]})),h=["fill"]),m({},a,{flag:h})},b=e=>{var t=e.group("month").select(e=>({month:e.first().date.month(),value:e.getSeries("value").where(e=>e).average()})),r=new Map(t.toArray().map(e=>{var{month:t,value:r}=e;return[t,r]})),a=t.getSeries("value").average();return r.set("default",a),r},O=e=>{var t=e.groupBy(e=>e.date.year()).select(e=>{var t=e.first().date.startOf("year"),r=new E(e).downsample(["month",1],"avg"),a=r.getSeries("value").average(),n=b(r);return n.set("avg",a),[t.year(),n]});return new Map(t.toArray())},A=function(e,t){var{years:r=3,series:a="value",aggregator:n="average",validOnly:o=!0}=void 0===t?{}:t,i=e.groupBy(e=>e.date.startOf("month").toDate()).select(e=>({date:e.first().date.startOf("month"),value:e.getSeries(a).where(e=>!o||Boolean(e)).average()})).inflate().withIndex(e=>e.date.toDate()).bake(),l=i.groupBy(e=>e.date.month()).select(e=>{var t=new Map(e.rollingWindow(r).select(t=>[t.last().date.year(),t.getSeries(a).where(e=>!o||Boolean(e)).average()||e.getSeries(a).where(e=>!o||Boolean(e)).average()]));return e.where(e=>!t.has(e.date.year())).forEach(e=>{var r=i.before(e.date.toDate()).count()>0?i.before(e.date.toDate()).last()[a]:i.getSeries(a).average();t.set(e.date.year(),r)}),[e.first().date.month(),t]});return new Map(l.toArray())},x=e=>t=>e.get(t.date.month()),D=e=>t=>{var r=t.date.month(),a=t.date.year();return e.has(r)?e.has(r)?e.get(r).get(a):u([...e.get(r).values()]):u([...e.values()].map(e=>[...e.values()].reduce((e,t)=>e.concat(t),[])))},N=function(e,t){var{validOnly:r=!0,series:a="value"}=void 0===t?{}:t;return t=>{var r=e.before(t.date.toDate()).getSeries(a).where(e=>e);return r.count()>0?r.last():0}},I=function(e,t){var{validOnly:r=!0,series:a="value",years:n=3}=void 0===t?{}:t;return t=>{var r=e.subset(["date",a]).after(t.date.subtract(n,"year").toDate()).before(t.date.toDate()).bake(),o=r.where(e=>e.date.month()===t.date.month()).where(e=>e.date.date()===t.date.date()).where(e=>e.date.hour()===t.date.hour()).where(e=>e.date.minute()===t.date.minute()).getSeries(a).where(e=>e);return o.count()<n?o.appendPair([null,r.getSeries(a).where(e=>e).average()]).average():o.average()}};function C(e){var t=e.deflate(e=>e.x).toArray(),a=h(t),n=u(t);if(0===a){var o=e.generateSeries({ares:e=>0});return{R:0,std:a,mean:n,df:o}}var i=new r({values:t.map(e=>({x:e,ares:Math.abs(e-n)/a}))});return{R:p(i.deflate(e=>e.ares).toArray()),df:i,std:a,mean:n}}function M(e,t,r){var a=function(e,t,r){return 1-r/(2*(e-t+1))}(e,t,r),n=function(e,t){return new c(t).inv(e)}(a,e-t-1);return{lambda:n*(e-t)/Math.sqrt((e-t-1+Math.pow(n,2))*(e-t+1)),p:a,t:n}}var V=(e,t,r)=>.6745*(e-r)/t;function B(e){var t=d(e),r=f(e),a=(e=e.sort((e,t)=>t-e).filter(e=>e>0).map(e=>[e,V(e,r,t)])).filter(e=>{var[t,r]=e;return Math.abs(r)>=3.5});return{thresholds:{upper:Math.min(Infinity,...a.map(e=>e[0])),lower:0}}}function E(r,a){if(void 0===r&&(r=[]),r instanceof E)return r;r instanceof t.DataFrame&&(r=r.toArray());var n={values:r=r.map(t=>{var{date:r}=t,a=y(t,["date"]);return m({date:e(r)},a)}).sort((e,t)=>e.date.valueOf()-t.date.valueOf()),index:r.map(e=>{var{date:t}=e;return t.toDate()}),considerAllRows:!0};t.DataFrame.call(this,n)}function F(e){var{series:t="value",lower:r,upper:a}=void 0===e?{}:e;if(r>a)throw new Error("thresholds invalid");var n=this.where(e=>((e,t,r)=>e<t||e>r)(e[t],r,a)).generateSeries({raw:e=>e[t],flag:e=>{var{flag:t=[]}=e;return["outlier",...t]}}).transformSeries({[t]:e=>null});return new E(this.merge(n))}function k(e,t){return void 0===e&&(e=["value"]),void 0===t&&(t="total"),new E(this.generateSeries({[t]:t=>e.map(e=>t[e]||0).reduce((e,t)=>e+t,0)}))}function R(e){var t;if(e instanceof E||(e=new E(e)),e.count()>1){var r,a=this.getInterval(),i=e.interval;if(!n(a,i))throw console.error(a,i),new Error("baseline and data intervals do not match");switch(a[0]){case"day":r=e=>e.month()+"-"+e.date();break;case"month":r=e=>e.month();break;default:r=e=>0}var l=e.withIndex(e=>r(e.date));t=this.generateSeries({baseline:e=>{return t=r(e.date),(a=l.at(t))&&o(a,"value")?a.value:l.getSeries("value").average();var t,a}})}else t=this.generateSeries({baseline:t=>e.first().value});return new E(t=t.generateSeries({delta:e=>{return(e.value-(t=e.baseline))/t;var t}}))}(E.prototype=Object.create(t.DataFrame.prototype)).constructor=E,E.prototype.getValueColumns=function(){return this.detectTypes().where(e=>"number"===e.Type).distinct(e=>e.Column).getSeries("Column").toArray()},E.prototype.getInterval=function(){var t,r,a;return t=this.getIndex().window(2).select(e=>e.last()-e.first()).detectValues().orderBy(e=>-e.Frequency).first().Value,r=e(),(a=e().add(t)).diff(r,"month",!0)>=11?["year",Math.ceil(a.diff(r,"year",!0))]:a.diff(r,"day",!0)>=28?["month",Math.ceil(a.diff(r,"month",!0))]:a.diff(r,"hour",!0)>=23?["day",Math.ceil(a.diff(r,"day",!0))]:a.diff(r,"minute",!0)>=55?["hour",Math.ceil(a.diff(r,"hour",!0))]:["minute",a.diff(r,"minute")]},E.prototype.getDateRange=function(t,r){var a=e(this.first().date),n=e(this.last().date);return r&&(a=a.startOf(r),n=n.endOf(r)),n.diff(a,t)},E.prototype.cvrsme=function(e,t){var r=this.subset([e,t]).resetIndex().generateSeries({actual:t=>t[e]||0,simulated:e=>e[t]||0}).dropSeries([e,t]).generateSeries({diff:e=>e.actual-e.simulated}),a=r.count(),n=r.getSeries("actual").sum()/a;return Math.sqrt(r.getSeries("diff").sum()/(a-1))/n},E.prototype.nmbe=function(e,t){var r=this.subset([e,t]).resetIndex().generateSeries({actual:t=>t[e]||0,simulated:e=>e[t]||0}).dropSeries([e,t]).generateSeries({diff:e=>e.actual-e.simulated}),a=r.count(),n=r.getSeries("actual").sum()/a;return r.getSeries("diff").sum()/((a-1)*n)},E.prototype.asCSV=function(){return this.transformSeries({date:t=>e(t).toISOString()}).toCSV()},E.prototype.calculateStatistics=function(e){void 0===e&&(e={});var{column:t="value",filterZeros:r=!1,filterNegative:a=!0}=e,n=this.deflate(e=>e[t]).where(e=>!isNaN(e));a&&(n=n.where(e=>e>=0)),r&&(n=n.where(e=>0!==e));var o=n.median(),i=n.average(),l=n.count(),s=n.std(),u=n.min(),d=n.max(),h=f(n.toArray()),p=v(n.toArray(),.25),g=v(n.toArray(),.75);return{median:o,mean:i,count:l,std:s,min:u,max:d,mad:h,q1:p,q3:g,iqr:g-p}},E.prototype.calculateThresholdOptions=function(e){var{k:t,filterZeros:a=!0,filterNegative:n=!0}=void 0===e?{}:e,o=this.where(e=>null==e.flag||Array.isArray(e.flag)&&0===e.flag.length).where(e=>!isNaN(e.value)&&null!==e.value).getSeries("value");if(a&&(o=o.where(e=>0!==e)),n&&(o=o.where(e=>e>0)),t||(t=o.count()<1e3?Math.floor(.15*o.count()):Math.min(1e3,Math.floor(.02*o.count()))),o.count()<5)return{};var i,l,s,u,{thresholds:d}=function(e,t,a){void 0===e&&(e=[]),void 0===t&&(t=10),void 0===a&&(a=.05);for(var n,o=new r({values:e.map(e=>({x:e}))}),i=o.getSeries("x").count(),l=1,s=[],u=!1;l<=t;){var d={};1===l?function(){var{R:e,df:t,mean:r,std:a}=C(o);n=t.where(t=>t.ares!==e),d=Object.assign({},d,{mean:r,std:a,Value:t.where(t=>t.ares===e).getSeries("x").first(),R:e})}():function(){var{R:e,df:t,mean:r,std:a}=C(n);n=t.where(t=>t.ares!==e),d=Object.assign({},d,{mean:r,std:a,Value:t.where(t=>t.ares===e).getSeries("x").first(),R:e})}();var{lambda:f}=M(i,l,a);if(d=Object.assign({},d,{lambda:f}),s.push(d),u&&d.R>d.lambda&&(u=!1),0===d.R)break;if(d.R<d.lambda){if(u)break;u=!0}l++}var v=(s=new r(s).generateSeries({outlier:e=>e.R>e.lambda}).takeWhile(e=>e.outlier)).where(e=>e.Value>0).deflate(e=>e.Value);return{outliers:s,thresholds:{lower:0,upper:v.count()>0?v.min():Infinity},iterations:l}}(o.toArray(),t),{thresholds:f}=(i=o.toArray(),{thresholds:{lowerInner:(l=v(i,.25))-1.5*(u=(s=v(i,.75))-l),upperInner:l-3*u,lowerOuter:s+1.5*u,upperOuter:s+3*u}}),{thresholds:h}=B(o.toArray());return{esd:d,box:f,modz:h}},E.prototype.getBestThreshold=function(){try{var e=this.calculateThresholdOptions(),t=g([i(e,"esd.upper",null),i(e,"modz.upper",null),i(e,"box.lowerOuter",null),i(e,"box.upperOuter",null)].filter(e=>e),2);return p(t.reduce((e,t)=>e.length>t.length?e:t))}catch(e){throw console.error(e),new Error("Cannot determine threshold")}},E.prototype.betweenDates=function(t,r){return t=e(t).toDate(),r=e(r).toDate(),new E(this.between(t,r))},E.prototype.transformAllSeries=function(e,t){var{exclude:r}=t,a=this,n=n=a.detectTypes().where(e=>"number"===e.Type).distinct(e=>e.Column).getSeries("Column").toArray();return r&&Array.isArray(r)&&(n=n.filter(e=>-1===r.indexOf(e))),n.forEach(t=>{a=a.transformSeries({[t]:t=>isNaN(t)?t:e(t)})}),a},E.prototype.reset=function(){return new E(this.withSeries({value:e=>e.flag&&Array.isArray(e.flag)&&e.flag.length>0?e.raw:e.value}).subset(["date","value"]).where(e=>!isNaN(e.value)&&null!==e.value))},E.prototype.fromTotalizer=function(e,t){void 0===e&&(e="value");var{acceptInitial:r=!1}=void 0===t?{}:t;return this.subset(["date",e]).toArray().map((t,a,n)=>{var o=r?t[e]:null;return n[a-1]&&(o=t[e]-n[a-1][e]),{date:t.date,[e]:o}}),new E(a)},E.prototype.toTotalizer=function(e,t){return this.subset(["date",e]).toArray().map((t,r,a)=>{var n=a.slice(0,r).map(t=>t[e]).reduce((e,t)=>e+t,0);return{date:t.date,[e]:n}}),new E(a)},E.prototype.group=function(t,r){if(-1===["hour","day","month","year"].indexOf(t))throw new Error("interval type not supported");return this.groupBy(r=>e(r.date).startOf(t))},E.prototype.removeOutliers=F,E.prototype.clean=F,E.prototype.downsample=function(t,r){var[a,n]=t;if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var o=e=>e.date.startOf(a),i=this.getValueColumns();return n&&(o=e=>e.date.startOf(a).add(n,a)),new E(this.groupBy(o).select(e=>m({date:e.first().date.startOf(a)},l([...i.map(t=>{var a;switch(r){case"median":a=e.deflate(e=>e[t]).where(e=>!isNaN(e)&&null!==e).median();break;case"avg":a=e.deflate(e=>e[t]).where(e=>!isNaN(e)&&null!==e).average();break;default:a=e.deflate(e=>e[t]).where(e=>!isNaN(e)&&null!==e).sum()}return[t,a]}),...e.getColumnNames().filter(e=>"date"!==e).filter(e=>-1===i.indexOf(e)).map(t=>{var r=e.deflate(e=>e[t]).distinct().toArray();return 1===r.length&&(r=r[0]),[t,r]})]))).inflate().withIndex(t=>e(t.date).toDate()))},E.prototype.downsampleClean=function(t,r){var[a,n]=t;if(void 0===r&&(r=.8),-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");var o=e=>e.date.startOf(a);this.getValueColumns(),n&&(o=e=>e.date.startOf(a).add(n,a));var i=this.groupBy(o).select(e=>({date:e.first().date.startOf(a),value:new E(e).dataQuality().setIndex("flag").at("clean").percent>=r?e.deflate(e=>e.value).where(e=>!isNaN(e)&&null!==e).sum():null})).inflate().withIndex(t=>e(t.date).toDate());return new E(i)},E.prototype.upsample=function(t,r,a){var[n,o]=t;void 0===r&&(r="average"),void 0===a&&(a=!1);var i=this.fillGaps((t=>{var[r,a=1]=t;return(t,n)=>{var o=t[0];return Math.floor(e(n[0]).diff(o,r,!0)/a)>0}})([n,o]),function(t,r,a){var[n,o]=r,{overrideValue:i,dateFunction:l,flag:s}={};return(r,a)=>{for(var u=e(r[0]),d=e(a[0]),f=Math.floor(e(d).diff(u,n)/o)-1,v=r[1],h=a[1],p=[],g=0;g<f;++g){var c=S(t,{startValue:v,endValue:h,entryIndex:g,numEntries:f},{overrideValue:i,dateFunction:l,flag:s}),m=e(u).add((g+1)*o,n).toDate(),y=[m.valueOf(),Object.assign({},c,{date:m})];p.push(y)}return p}}(r,[n,o]));return a||(i=i.dropSeries(["flag"])),new E(i)},E.prototype.populate=function(e,t){var r;switch(void 0===t&&(t="average"),t){case"fill":r=e;break;default:r=e/this.count()}return new E(this.generateSeries({value:e=>r}))},E.prototype.reduceToValue=function(e){return new E(this.generateSeries({value:t=>function(e,t){return void 0===t&&(t=[]),t.map(t=>e[t]).filter(e=>e)[0]||0}(t,e)}).subset(["date","value"]))},E.prototype.cumulativeSum=function(e){e||(e=this.getValueColumns()),e&!Array.isArray(e)&&(e=[e]);var t=this;return e.forEach(e=>{var r;t=t.withSeries(e,t.getSeries(e).select((r=0,e=>r+=e)))}),new E(t)},E.prototype.totalRows=k,E.prototype.totalRow=k,E.prototype.totalColumns=k,E.prototype.rollingPercentChange=function(e,t){void 0===e&&(e="value"),void 0===t&&(t=!0);var r=this.getSeries(e).rollingWindow(2).select(e=>{var t=(e.last()-e.first())/Math.abs(e.first());return[e.getIndex().last(),t]}).withIndex(e=>e[0]).select(e=>e[1]),a=this.withSeries("delta",r);return t||(a=a.transformSeries({delta:e=>100*e})),new E(a)},E.prototype.baselinePercentChange=R,E.prototype.addBaselineDelta=R,E.prototype.annualIntensity=function(t){void 0===t&&(t=1);var r=this.getInterval();return new E(this.groupBy(e=>e.date.year()).select(a=>{var n,o=a.first().date,i=a.last().date.add(r[1]||1,r[0]||"month"),s=(n=o,365/e(i).diff(e(n),"day"));return m({startDate:o,endDate:i},l(this.getValueColumns().map(e=>[e,a.deflate(t=>t[e]).where(e=>e).sum()*s/t])))}).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},E.prototype.fillMissing=function(){var e=this.first().date.toDate(),t=this.last().date.toDate(),r=this.getInterval(),a=E.blank(e,t,r,"missing").withIndex(e=>e.date.valueOf()).merge(this.withIndex(e=>e.date.valueOf())).generateSeries({flag:e=>null==e.value?e.flag:void 0});return new E(a)},E.prototype.fillNull=function(e){var{series:t="value",value:r,callback:a}=e,n=e=>null==e[t];return a?new E(this.generateSeries({flag:e=>n(e)?["fill",...e.flag||[]]:e.flag,[t]:e=>n(e)?a(e):e[t]})):r?new E(this.generateSeries({flag:e=>n(e)?["fill",...e.flag||[]]:e.flag}).transformSeries({[t]:e=>null==e?r:e})):this},E.prototype.zeroFaultDetection=function(e){Array.isArray(e)||(e=[e,1]),e=w(e);var t=this.where(e=>0===e.value).ensureSeries("interval",this.where(e=>0===e.value).getSeries("date").amountChange()).where(t=>t.interval<=e).subset(["date"]).generateSeries({value:e=>null,flag:e=>["zeroFault"]});return new E(this.merge(t))},E.prototype.dataQuality=function(){var e=this.count(),t=this.where(e=>Array.isArray(e.flag)&&e.flag.length>0).groupBy(e=>e.flag.toString()).select(t=>({flag:t.first().flag,count:t.count(),percent:t.count()/e})).inflate(),r=this.where(e=>null==e.flag||Array.isArray(e.flag)&&0===e.flag.length).count();return t.appendPair([t.count(),{flag:"clean",count:r,percent:r/e}]).orderByDescending(e=>e.count)},E.prototype.monthlyWithQual=function(){var t=this.getInterval(),r=w(t);return new E(this.groupBy(t=>e(t.date).startOf().valueOf()).select(t=>{var a=e(t.first().date).startOf("month").toDate(),n=Math.floor(e(a).endOf("month").diff(e(a),"millisecond")/r),o=(new Date(a.getFullYear(),a.getMonth()+1,0).getDate(),t.getSeries("value").where(e=>e&&0!==e).toArray().length),i=t.getSeries("value").where(e=>!isNaN(e)).sum();return{date:a,value:isNaN(i)?0:i,count:o,fullCount:n,score:o/n}}).inflate().withIndex(e=>e.date.toDate()))},E.prototype.threeYearAverage=function(t,r,a){void 0===r&&(r="value"),t=e(t),a||(a=this.getSeries(r).where(e=>!isNaN(e)&&null!==e).average());var n=this.before(t.toDate()).where(e=>e.date.month()===t.month()).orderBy(t=>e(t.date)).tail(3);return n.count()>0?n.getSeries(r).where(e=>!isNaN(e)&&null!==e).average():a},E.prototype.averageFill=function(){var e=this,t=e.getSeries("value").where(e=>!isNaN(e)&&null!==e).average();return new E(e.generateSeries({rollingAverage:r=>e.threeYearAverage(r.date,"value",t)}).generateSeries({flag:e=>e.value?e.flag:["filled",...e.flag||[]]}).generateSeries({value:e=>e.value?e.value:e.rollingAverage}).dropSeries(["rollingAverage"]))},E.prototype.toArray=function(){var e=[];for(var t of this.getContent().values)void 0!==t&&e.push(t);return e.map(e=>{var{date:t}=e,r=y(e,["date"]);return m({date:t.toDate()},r)})},E.prototype.atDate=function(t){if(!this.none())for(var r of(t=e(t).valueOf(),this.getContent().pairs))if(r[0].valueOf()===t)return r[1]},E.blank=function(t,r,a,n){var[o,i=1]=a;if(["minute","hour","day","month","year"].indexOf(o)<0)throw console.error(s),new Error("interval type not supported");t=e(t),r=e(r);for(var l=[t],s=w([o,i]);l[l.length-1].valueOf()<r.valueOf();)l.push(e(l[l.length-1]).add(i,o));var u=new E(l.map(e=>({date:e})));return n&&(u=new E(u.generateSeries({flag:e=>[n]}))),u},E.aggregate=function(e){Array.isArray(e)||(e=[e]),e=e.map(e=>new E(e));var r=new Set(e.map(e=>e.getValueColumns()).reduce((e,t)=>e.concat(t),[]));return new E(t.DataFrame.concat(e).groupBy(e=>e.date).select(e=>{var t={date:e.first().date};return r.forEach(r=>t[r]=e.deflate(e=>e[r]).sum()),e.getColumnNames().filter(e=>"date"!==e).filter(e=>-1===r.has(e)).forEach(r=>{var a=e.deflate(e=>e[r]).distinct().toArray();1===a.length&&(a=a[0]),t[r]=a}),t}).inflate())},E.concat=e=>(Array.isArray(e)||(e=[e]),e=e.map(e=>new E(e).withIndex(e=>e.date.valueOf())),new E(t.DataFrame.concat(e))),E.merge=e=>(Array.isArray(e)||(e=[e]),e=e.map(e=>new E(e).withIndex(e=>e.date.valueOf())),new E(t.DataFrame.merge(e)));export{E as Timeseries,I as annualAverage,O as annualMonthlyAverageMap,b as averageMonthlyMap,D as fillMonthlyBAnnualyMap,x as fillMonthlyByMap,A as monthlyRollingAverageMap,N as pad};
//# sourceMappingURL=index.modern.js.map
