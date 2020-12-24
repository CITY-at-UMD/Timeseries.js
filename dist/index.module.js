import e from"dayjs";import t,{DataFrame as r}from"data-forge";import n from"lodash/isEqual";import u from"lodash/has";import o from"lodash/get";import i from"lodash/fromPairs";import f from"lodash/toPairs";import{mean as l,median as s,medianAbsoluteDeviation as c,quantile as d,sampleStandardDeviation as v,max as h,ckmeans as p}from"simple-statistics";import{Studentt as g}from"distributions";function m(){return(m=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}function y(e,t){if(null==e)return{};var r,n,a={},u=Object.keys(e);for(n=0;n<u.length;n++)t.indexOf(r=u[n])>=0||(a[r]=e[r]);return a}var w=function(t){var r=t[0],n=t[1],a=e();return e().add(n,r).diff(a)},S=function(e,t,r){var n,a=t.startValue,u=t.endValue,o=t.entryIndex,l=t.numEntries,s=r.overrideValue,c=r.dateFunction,d=r.date,v=r.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=i(f(a).map(function(e){var t=e[0];return[t,a[t]]})),v=v||["fill","pad"]):"interpolate"===e?(n=i(f(a).map(function(e){var t=e[0];return[t,a[t]+(o+1)*((u[t]-a[t])/(l+1))]})),v=v||["fill",e]):"average"===e?(n=i(f(a).map(function(e){var t=e[0];return[t,(a[t]+u[t])/l]})),v=v||["fill",e]):"dateFunction"===e&&c?(n=i(f(a).map(function(e){return[e[0],c(d)]})),v=v||["fill",e]):"value"===e?(n=i(f(a).map(function(e){var t=e[0];return[t,"number"==typeof s?s:s[t]]})),v=v||["fill",e]):(n=i(f(a).map(function(e){return[e[0],null]})),v=["fill"]),m({},n,{flag:v})},b=function(e){var t=e.group("month").select(function(e){return{month:e.first().date.month(),value:e.getSeries("value").where(function(e){return e}).average()}}),r=new Map(t.toArray().map(function(e){return[e.month,e.value]})),n=t.getSeries("value").average();return r.set("default",n),r},O=function(e){var t=e.groupBy(function(e){return e.date.year()}).select(function(e){var t=e.first().date.startOf("year"),r=new B(e).downsample(["month",1],"avg"),n=r.getSeries("value").average(),a=b(r);return a.set("avg",n),[t.year(),a]});return new Map(t.toArray())},A=function(e,t){var r=void 0===t?{}:t,n=r.years,a=void 0===n?3:n,u=r.series,o=void 0===u?"value":u,i=r.validOnly,f=void 0===i||i,l=e.groupBy(function(e){return e.date.startOf("month").toDate()}).select(function(e){return{date:e.first().date.startOf("month"),value:e.getSeries(o).where(function(e){return!f||Boolean(e)}).average()}}).inflate().withIndex(function(e){return e.date.toDate()}).bake(),s=l.groupBy(function(e){return e.date.month()}).select(function(e){var t=new Map(e.rollingWindow(a).select(function(t){return[t.last().date.year(),t.getSeries(o).where(function(e){return!f||Boolean(e)}).average()||e.getSeries(o).where(function(e){return!f||Boolean(e)}).average()]}));return e.where(function(e){return!t.has(e.date.year())}).forEach(function(e){var r=l.before(e.date.toDate()).count()>0?l.before(e.date.toDate()).last()[o]:l.getSeries(o).average();t.set(e.date.year(),r)}),[e.first().date.month(),t]});return new Map(s.toArray())},x=function(e){return function(t){return e.get(t.date.month())}},D=function(e){return function(t){var r=t.date.month(),n=t.date.year();return e.has(r)?e.has(r)?e.get(r).get(n):l([].concat(e.get(r).values())):l([].concat(e.values()).map(function(e){return[].concat(e.values()).reduce(function(e,t){return e.concat(t)},[])}))}},N=function(e,t){var r=(void 0===t?{}:t).series,n=void 0===r?"value":r;return function(t){var r=e.before(t.date.toDate()).getSeries(n).where(function(e){return e});return r.count()>0?r.last():0}},I=function(e,t){var r=void 0===t?{}:t,n=r.series,a=void 0===n?"value":n,u=r.years,o=void 0===u?3:u;return function(t){var r=e.subset(["date",a]).after(t.date.subtract(o,"year").toDate()).before(t.date.toDate()).bake(),n=r.where(function(e){return e.date.month()===t.date.month()}).where(function(e){return e.date.date()===t.date.date()}).where(function(e){return e.date.hour()===t.date.hour()}).where(function(e){return e.date.minute()===t.date.minute()}).getSeries(a).where(function(e){return e});return n.count()<o?n.appendPair([null,r.getSeries(a).where(function(e){return e}).average()]).average():n.average()}};function M(e){var t=e.deflate(function(e){return e.x}).toArray(),n=v(t),a=l(t);if(0===n){var u=e.generateSeries({ares:function(e){return 0}});return{R:0,std:n,mean:a,df:u}}var o=new r({values:t.map(function(e){return{x:e,ares:Math.abs(e-a)/n}})});return{R:h(o.deflate(function(e){return e.ares}).toArray()),df:o,std:n,mean:a}}function C(e,t,r){var n=function(e,t,r){return 1-r/(2*(e-t+1))}(e,t,r),a=function(e,t){return new g(t).inv(e)}(n,e-t-1);return{lambda:a*(e-t)/Math.sqrt((e-t-1+Math.pow(a,2))*(e-t+1)),p:n,t:a}}var k=function(e,t,r){return.6745*(e-r)/t};function V(e){var t=s(e),r=c(e),n=(e=e.sort(function(e,t){return t-e}).filter(function(e){return e>0}).map(function(e){return[e,k(e,r,t)]})).filter(function(e){return Math.abs(e[1])>=3.5});return{thresholds:{upper:Math.min.apply(Math,[Infinity].concat(n.map(function(e){return e[0]}))),lower:0}}}function B(r,n){if(void 0===r&&(r=[]),r instanceof B)return r;r instanceof t.DataFrame&&(r=r.toArray());var a={values:r=r.map(function(t){var r=t.date,n=y(t,["date"]);return m({date:e(r)},n)}).sort(function(e,t){return e.date.valueOf()-t.date.valueOf()}),index:r.map(function(e){return e.date.toDate()}),considerAllRows:!0};t.DataFrame.call(this,a)}function E(e){var t,r=void 0===e?{}:e,n=r.series,a=void 0===n?"value":n,u=r.lower,o=r.upper;if(u>o)throw new Error("thresholds invalid");var i=this.where(function(e){return function(e,t,r){return e<t||e>r}(e[a],u,o)}).generateSeries({raw:function(e){return e[a]},flag:function(e){var t=e.flag;return["outlier"].concat(void 0===t?[]:t)}}).transformSeries(((t={})[a]=function(e){return null},t));return new B(this.merge(i))}function F(e,t){var r;return void 0===e&&(e=["value"]),void 0===t&&(t="total"),new B(this.generateSeries(((r={})[t]=function(t){return e.map(function(e){return t[e]||0}).reduce(function(e,t){return e+t},0)},r)))}function R(e){var t;if(e instanceof B||(e=new B(e)),e.count()>1){var r,a=this.getInterval(),o=e.interval;if(!n(a,o))throw console.error(a,o),new Error("baseline and data intervals do not match");switch(a[0]){case"day":r=function(e){return e.month()+"-"+e.date()};break;case"month":r=function(e){return e.month()};break;default:r=function(e){return 0}}var i=e.withIndex(function(e){return r(e.date)});t=this.generateSeries({baseline:function(e){return t=r(e.date),(n=i.at(t))&&u(n,"value")?n.value:i.getSeries("value").average();var t,n}})}else t=this.generateSeries({baseline:function(t){return e.first().value}});return new B(t=t.generateSeries({delta:function(e){return(e.value-(t=e.baseline))/t;var t}}))}(B.prototype=Object.create(t.DataFrame.prototype)).constructor=B,B.prototype.getValueColumns=function(){return this.detectTypes().where(function(e){return"number"===e.Type}).distinct(function(e){return e.Column}).getSeries("Column").toArray()},B.prototype.getInterval=function(){var t,r,n;return t=this.getIndex().window(2).select(function(e){return e.last()-e.first()}).detectValues().orderBy(function(e){return-e.Frequency}).first().Value,r=e(),(n=e().add(t)).diff(r,"month",!0)>=11?["year",Math.ceil(n.diff(r,"year",!0))]:n.diff(r,"day",!0)>=28?["month",Math.ceil(n.diff(r,"month",!0))]:n.diff(r,"hour",!0)>=23?["day",Math.ceil(n.diff(r,"day",!0))]:n.diff(r,"minute",!0)>=55?["hour",Math.ceil(n.diff(r,"hour",!0))]:["minute",n.diff(r,"minute")]},B.prototype.getDateRange=function(t,r){var n=e(this.first().date),a=e(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,t)},B.prototype.cvrsme=function(e,t){var r=this.subset([e,t]).resetIndex().generateSeries({actual:function(t){return t[e]||0},simulated:function(e){return e[t]||0}}).dropSeries([e,t]).generateSeries({diff:function(e){return e.actual-e.simulated}}),n=r.count(),a=r.getSeries("actual").sum()/n;return Math.sqrt(r.getSeries("diff").sum()/(n-1))/a},B.prototype.nmbe=function(e,t){var r=this.subset([e,t]).resetIndex().generateSeries({actual:function(t){return t[e]||0},simulated:function(e){return e[t]||0}}).dropSeries([e,t]).generateSeries({diff:function(e){return e.actual-e.simulated}}),n=r.count(),a=r.getSeries("actual").sum()/n;return r.getSeries("diff").sum()/((n-1)*a)},B.prototype.calculateStatistics=function(e){void 0===e&&(e={});var t=e.column,r=void 0===t?"value":t,n=e.filterZeros,a=void 0!==n&&n,u=e.filterNegative,o=void 0===u||u,i=this.deflate(function(e){return e[r]}).where(function(e){return!isNaN(e)});o&&(i=i.where(function(e){return e>=0})),a&&(i=i.where(function(e){return 0!==e}));var f=i.median(),l=i.average(),s=i.count(),v=i.std(),h=i.min(),p=i.max(),g=c(i.toArray()),m=d(i.toArray(),.25),y=d(i.toArray(),.75);return{median:f,mean:l,count:s,std:v,min:h,max:p,mad:g,q1:m,q3:y,iqr:y-m}},B.prototype.calculateThresholdOptions=function(e){var t,n,a,u,o=void 0===e?{}:e,i=o.k,f=o.filterZeros,l=void 0===f||f,s=o.filterNegative,c=void 0===s||s,v=this.where(function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length}).where(function(e){return!isNaN(e.value)&&null!==e.value}).getSeries("value");return l&&(v=v.where(function(e){return 0!==e})),c&&(v=v.where(function(e){return e>0})),i||(i=v.count()<1e3?Math.floor(.15*v.count()):Math.min.apply(Math,[1e3,Math.floor(.02*v.count())])),v.count()<5?{}:{esd:function(e,t,n){void 0===e&&(e=[]),void 0===t&&(t=10),void 0===n&&(n=.05);for(var a,u=new r({values:e.map(function(e){return{x:e}})}),o=u.getSeries("x").count(),i=1,f=[],l=!1;i<=t;){var s={};1===i?function(){var e=M(u),t=e.R,r=e.df,n=e.mean,o=e.std;a=r.where(function(e){return e.ares!==t}),s=Object.assign({},s,{mean:n,std:o,Value:r.where(function(e){return e.ares===t}).getSeries("x").first(),R:t})}():function(){var e=M(a),t=e.R,r=e.df,n=e.mean,u=e.std;a=r.where(function(e){return e.ares!==t}),s=Object.assign({},s,{mean:n,std:u,Value:r.where(function(e){return e.ares===t}).getSeries("x").first(),R:t})}();var c=C(o,i,n);if(s=Object.assign({},s,{lambda:c.lambda}),f.push(s),l&&s.R>s.lambda&&(l=!1),0===s.R)break;if(s.R<s.lambda){if(l)break;l=!0}i++}var d=(f=new r(f).generateSeries({outlier:function(e){return e.R>e.lambda}}).takeWhile(function(e){return e.outlier})).where(function(e){return e.Value>0}).deflate(function(e){return e.Value});return{outliers:f,thresholds:{lower:0,upper:d.count()>0?d.min():Infinity},iterations:i}}(v.toArray(),i).thresholds,box:(t=v.toArray(),n=d(t,.25),a=d(t,.75),{thresholds:{lowerInner:n-1.5*(u=a-n),upperInner:n-3*u,lowerOuter:a+1.5*u,upperOuter:a+3*u}}).thresholds,modz:V(v.toArray()).thresholds}},B.prototype.getBestThreshold=function(){try{var e=this.calculateThresholdOptions(),t=p([o(e,"esd.upper",null),o(e,"modz.upper",null),o(e,"box.lowerOuter",null),o(e,"box.upperOuter",null)].filter(function(e){return e}),2);return h(t.reduce(function(e,t){return e.length>t.length?e:t}))}catch(e){throw console.error(e),new Error("Cannot determine threshold")}},B.prototype.betweenDates=function(t,r){return t=e(t).toDate(),r=e(r).toDate(),new B(this.between(t,r))},B.prototype.transformAllSeries=function(e,t){var r=t.exclude,n=this,a=a=n.detectTypes().where(function(e){return"number"===e.Type}).distinct(function(e){return e.Column}).getSeries("Column").toArray();return r&&Array.isArray(r)&&(a=a.filter(function(e){return-1===r.indexOf(e)})),a.forEach(function(t){var r;n=n.transformSeries(((r={})[t]=function(t){return isNaN(t)?t:e(t)},r))}),n},B.prototype.reset=function(){return new B(this.withSeries({value:function(e){return e.flag&&Array.isArray(e.flag)&&e.flag.length>0?e.raw:e.value}}).subset(["date","value"]).where(function(e){return!isNaN(e.value)&&null!==e.value}))},B.prototype.fromTotalizer=function(e,t){void 0===e&&(e="value");var r=(void 0===t?{}:t).acceptInitial,n=void 0!==r&&r;return this.subset(["date",e]).toArray().map(function(t,r,a){var u,o=n?t[e]:null;return a[r-1]&&(o=t[e]-a[r-1][e]),(u={date:t.date})[e]=o,u}),new B(a)},B.prototype.toTotalizer=function(e,t){return this.subset(["date",e]).toArray().map(function(t,r,n){var a,u=n.slice(0,r).map(function(t){return t[e]}).reduce(function(e,t){return e+t},0);return(a={date:t.date})[e]=u,a}),new B(a)},B.prototype.group=function(t,r){if(-1===["hour","day","week","month","year"].indexOf(t))throw new Error("interval type not supported");return this.groupBy(function(r){return e(r.date).startOf(t)})},B.prototype.removeOutliers=E,B.prototype.clean=E,B.prototype.downsample=function(t,r){var n=t[0],a=t[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var u=function(e){return e.date.startOf(n)},o=this.getValueColumns();return a&&(u=function(e){return e.date.startOf(n).add(a,n)}),new B(this.groupBy(u).select(function(e){return m({date:e.first().date.startOf(n)},i([].concat(o.map(function(t){var n;switch(r){case"median":n=e.deflate(function(e){return e[t]}).where(function(e){return!isNaN(e)&&null!==e}).median();break;case"avg":n=e.deflate(function(e){return e[t]}).where(function(e){return!isNaN(e)&&null!==e}).average();break;default:n=e.deflate(function(e){return e[t]}).where(function(e){return!isNaN(e)&&null!==e}).sum()}return[t,n]}),e.getColumnNames().filter(function(e){return"date"!==e}).filter(function(e){return-1===o.indexOf(e)}).map(function(t){var r=e.deflate(function(e){return e[t]}).distinct().toArray();return 1===r.length&&(r=r[0]),[t,r]}))))}).inflate().withIndex(function(t){return e(t.date).toDate()}))},B.prototype.downsampleClean=function(t,r){var n=t[0],a=t[1];if(void 0===r&&(r=.8),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");var u=function(e){return e.date.startOf(n)};this.getValueColumns(),a&&(u=function(e){return e.date.startOf(n).add(a,n)});var o=this.groupBy(u).select(function(e){return{date:e.first().date.startOf(n),value:new B(e).dataQuality().setIndex("flag").at("clean").percent>=r?e.deflate(function(e){return e.value}).where(function(e){return!isNaN(e)&&null!==e}).sum():null}}).inflate().withIndex(function(t){return e(t.date).toDate()});return new B(o)},B.prototype.upsample=function(t,r,n){var a=t[0],u=t[1];void 0===r&&(r="average"),void 0===n&&(n=!1);var o=this.fillGaps(function(t){var r=t[0],n=t[1],a=void 0===n?1:n;return function(t,n){var u=t[0];return Math.floor(e(n[0]).diff(u,r,!0)/a)>0}}([a,u]),function(t,r,n){var a=r[0],u=r[1],o={},i=o.overrideValue,f=o.dateFunction,l=o.flag;return function(r,n){for(var o=e(r[0]),s=e(n[0]),c=Math.floor(e(s).diff(o,a)/u)-1,d=r[1],v=n[1],h=[],p=0;p<c;++p){var g=S(t,{startValue:d,endValue:v,entryIndex:p,numEntries:c},{overrideValue:i,dateFunction:f,flag:l}),m=e(o).add((p+1)*u,a).toDate(),y=[m.valueOf(),Object.assign({},g,{date:m})];h.push(y)}return h}}(r,[a,u]));return n||(o=o.dropSeries(["flag"])),new B(o)},B.prototype.populate=function(e,t){var r;switch(void 0===t&&(t="average"),t){case"fill":r=e;break;default:r=e/this.count()}return new B(this.generateSeries({value:function(e){return r}}))},B.prototype.reduceToValue=function(e){return new B(this.generateSeries({value:function(t){return function(e,t){return void 0===t&&(t=[]),t.map(function(t){return e[t]}).filter(function(e){return e})[0]||0}(t,e)}}).subset(["date","value"]))},B.prototype.cumulativeSum=function(e){e||(e=this.getValueColumns()),e&!Array.isArray(e)&&(e=[e]);var t=this;return e.forEach(function(e){var r;t=t.withSeries(e,t.getSeries(e).select((r=0,function(e){return r+=e})))}),new B(t)},B.prototype.totalRows=F,B.prototype.totalRow=F,B.prototype.totalColumns=F,B.prototype.rollingPercentChange=function(e,t){void 0===e&&(e="value"),void 0===t&&(t=!0);var r=this.getSeries(e).rollingWindow(2).select(function(e){var t=(e.last()-e.first())/Math.abs(e.first());return[e.getIndex().last(),t]}).withIndex(function(e){return e[0]}).select(function(e){return e[1]}),n=this.withSeries("delta",r);return t||(n=n.transformSeries({delta:function(e){return 100*e}})),new B(n)},B.prototype.baselinePercentChange=R,B.prototype.addBaselineDelta=R,B.prototype.annualIntensity=function(t){var r=this;void 0===t&&(t=1);var n=this.getInterval();return new B(this.groupBy(function(e){return e.date.year()}).select(function(a){var u,o=a.first().date,f=a.last().date.add(n[1]||1,n[0]||"month"),l=(u=o,365/e(f).diff(e(u),"day"));return m({startDate:o,endDate:f},i(r.getValueColumns().map(function(e){return[e,a.deflate(function(t){return t[e]}).where(function(e){return e}).sum()*l/t]})))}).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},B.prototype.fillMissing=function(){var e=this.first().date.toDate(),t=this.last().date.toDate(),r=this.getInterval(),n=B.blank(e,t,r,"missing").withIndex(function(e){return e.date.valueOf()}).merge(this.withIndex(function(e){return e.date.valueOf()})).generateSeries({flag:function(e){return null==e.value?e.flag:void 0}});return new B(n)},B.prototype.fillNull=function(e){var t,r,n=e.series,a=void 0===n?"value":n,u=e.value,o=e.callback,i=function(e){return null==e[a]};return o?new B(this.generateSeries(((t={flag:function(e){return i(e)?["fill"].concat(e.flag||[]):e.flag}})[a]=function(e){return i(e)?o(e):e[a]},t))):u?new B(this.generateSeries({flag:function(e){return i(e)?["fill"].concat(e.flag||[]):e.flag}}).transformSeries(((r={})[a]=function(e){return null==e?u:e},r))):this},B.prototype.zeroFaultDetection=function(e){Array.isArray(e)||(e=[e,1]),e=w(e);var t=this.where(function(e){return 0===e.value}).ensureSeries("interval",this.where(function(e){return 0===e.value}).getSeries("date").amountChange()).where(function(t){return t.interval<=e}).subset(["date"]).generateSeries({value:function(e){return null},flag:function(e){return["zeroFault"]}});return new B(this.merge(t))},B.prototype.dataQuality=function(){var e=this.count(),t=this.where(function(e){return Array.isArray(e.flag)&&e.flag.length>0}).groupBy(function(e){return e.flag.toString()}).select(function(t){return{flag:t.first().flag,count:t.count(),percent:t.count()/e}}).inflate(),r=this.where(function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length}).count();return t.appendPair([t.count(),{flag:"clean",count:r,percent:r/e}]).orderByDescending(function(e){return e.count})},B.prototype.monthlyWithQual=function(){var t=this.getInterval(),r=w(t);return new B(this.groupBy(function(t){return e(t.date).startOf().valueOf()}).select(function(t){var n=e(t.first().date).startOf("month").toDate(),a=Math.floor(e(n).endOf("month").diff(e(n),"millisecond")/r),u=(new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),t.getSeries("value").where(function(e){return e&&0!==e}).toArray().length),o=t.getSeries("value").where(function(e){return!isNaN(e)}).sum();return{date:n,value:isNaN(o)?0:o,count:u,fullCount:a,score:u/a}}).inflate().withIndex(function(e){return e.date.toDate()}))},B.prototype.threeYearAverage=function(t,r,n){void 0===r&&(r="value"),t=e(t),n||(n=this.getSeries(r).where(function(e){return!isNaN(e)&&null!==e}).average());var a=this.before(t.toDate()).where(function(e){return e.date.month()===t.month()}).orderBy(function(t){return e(t.date)}).tail(3);return a.count()>0?a.getSeries(r).where(function(e){return!isNaN(e)&&null!==e}).average():n},B.prototype.averageFill=function(){var e=this,t=e.getSeries("value").where(function(e){return!isNaN(e)&&null!==e}).average();return new B(e.generateSeries({rollingAverage:function(r){return e.threeYearAverage(r.date,"value",t)}}).generateSeries({flag:function(e){return e.value?e.flag:["filled"].concat(e.flag||[])}}).generateSeries({value:function(e){return e.value?e.value:e.rollingAverage}}).dropSeries(["rollingAverage"]))},B.prototype.toArray=function(){var e=[],t=this.getContent().values,r=Array.isArray(t),n=0;for(t=r?t:t[Symbol.iterator]();;){var a;if(r){if(n>=t.length)break;a=t[n++]}else{if((n=t.next()).done)break;a=n.value}void 0!==a&&e.push(a)}return e.map(function(e){var t=e.date,r=y(e,["date"]);return m({date:t.toDate()},r)})},B.prototype.atDate=function(t){if(!this.none()){t=e(t).valueOf();var r=this.getContent().pairs,n=Array.isArray(r),a=0;for(r=n?r:r[Symbol.iterator]();;){var u;if(n){if(a>=r.length)break;u=r[a++]}else{if((a=r.next()).done)break;u=a.value}var o=u;if(o[0].valueOf()===t)return o[1]}}},B.blank=function(t,r,n,a){var u=n[0],o=n[1],i=void 0===o?1:o;if(["minute","hour","day","month","year"].indexOf(u)<0)throw console.error(l),new Error("interval type not supported");t=e(t),r=e(r);for(var f=[t],l=w([u,i]);f[f.length-1].valueOf()<r.valueOf();)f.push(e(f[f.length-1]).add(i,u));var s=new B(f.map(function(e){return{date:e}}));return a&&(s=new B(s.generateSeries({flag:function(e){return[a]}}))),s},B.aggregate=function(e){Array.isArray(e)||(e=[e]),e=e.map(function(e){return new B(e)});var r=new Set(e.map(function(e){return e.getValueColumns()}).reduce(function(e,t){return e.concat(t)},[]));return new B(t.DataFrame.concat(e).groupBy(function(e){return e.date}).select(function(e){var t={date:e.first().date};return r.forEach(function(r){return t[r]=e.deflate(function(e){return e[r]}).sum()}),e.getColumnNames().filter(function(e){return"date"!==e}).filter(function(e){return-1===r.has(e)}).forEach(function(r){var n=e.deflate(function(e){return e[r]}).distinct().toArray();1===n.length&&(n=n[0]),t[r]=n}),t}).inflate())},B.concat=function(e){return Array.isArray(e)||(e=[e]),e=e.map(function(e){return new B(e).withIndex(function(e){return e.date.valueOf()})}),new B(t.DataFrame.concat(e))},B.merge=function(e){return Array.isArray(e)||(e=[e]),e=e.map(function(e){return new B(e).withIndex(function(e){return e.date.valueOf()})}),new B(t.DataFrame.merge(e))};export{B as Timeseries,I as annualAverage,O as annualMonthlyAverageMap,b as averageMonthlyMap,D as fillMonthlyBAnnualyMap,x as fillMonthlyByMap,A as monthlyRollingAverageMap,N as pad};
//# sourceMappingURL=index.module.js.map
