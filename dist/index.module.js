import e from"dayjs";import t,{DataFrame as r}from"data-forge";import n from"lodash/isEqual";import a from"lodash/has";import u from"lodash/get";import o from"lodash/fromPairs";import i from"lodash/toPairs";import{mean as f,median as l,medianAbsoluteDeviation as c,quantile as s,sampleStandardDeviation as d,max as h,ckmeans as v}from"simple-statistics";import{Studentt as p}from"distributions";function g(){return(g=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}var m=function(t){var r=t[0],n=t[1],a=e();return e().add(n,r).diff(a)},y=function(e,t,r){var n,a=t.startValue,u=t.endValue,f=t.entryIndex,l=t.numEntries,c=r.overrideValue,s=r.dateFunction,d=r.date,h=r.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=o(i(a).map((function(e){var t=e[0];return[t,a[t]]}))),h=h||["fill","pad"]):"interpolate"===e?(n=o(i(a).map((function(e){var t=e[0];return[t,a[t]+(f+1)*((u[t]-a[t])/(l+1))]}))),h=h||["fill",e]):"average"===e?(n=o(i(a).map((function(e){var t=e[0];return[t,(a[t]+u[t])/l]}))),h=h||["fill",e]):"dateFunction"===e&&s?(n=o(i(a).map((function(e){return[e[0],s(d)]}))),h=h||["fill",e]):"value"===e?(n=o(i(a).map((function(e){var t=e[0];return[t,"number"==typeof c?c:c[t]]}))),h=h||["fill",e]):(n=o(i(a).map((function(e){return[e[0],null]}))),h=["fill"]),g({},n,{flag:h})},w=function(e){return new Map(e.group("month").select((function(e){return{month:e.first().date.month(),value:e.getSeries("value").where((function(e){return e})).average()}})).toArray().map((function(e){return[e.month,e.value]})))},b=function(e){return new Map(e.groupBy((function(e){return e.date.year()})).select((function(e){var t=e.first().date.startOf("year"),r=new Timeseries(e).downsample(["month",1],"avg"),n=r.getSeries("value").average(),a=w(r);return a.set("avg",n),[t.year(),a]})).toArray())},S=function(e,t){var r=void 0===t?{}:t,n=r.years,a=void 0===n?3:n,u=r.series,o=void 0===u?"value":u,i=e.groupBy((function(e){return e.date.startOf("month").toDate()})).select((function(e){return{date:e.first().date.startOf("month"),value:e.getSeries(o).where((function(e){return e})).average()}})).inflate().withIndex((function(e){return e.date.toDate()})).bake(),f=i.groupBy((function(e){return e.date.month()})).select((function(e){var t=new Map(e.rollingWindow(a).select((function(e){return[e.last().date.year(),e.getSeries(o).average()]})));return e.where((function(e){return!t.has(e.date.year())})).forEach((function(e){var r=i.before(e.date.toDate()).count()>0?i.before(e.date.toDate()).last()[o]:i.getSeries(o).average();t.set(e.date.year(),r)})),[e.first().date.month(),t]})).toArray();return new Map(f)},O=function(e){return function(t){return e.get(t.date.month())}},A=function(e){return function(t){var r=t.date.month(),n=t.date.year();return e.has(r)?e.has(r)?e.get(r).get(n):f([].concat(e.get(r).values())):f([].concat(e.values()).map((function(e){return[].concat(e.values()).reduce((function(e,t){return e.concat(t)}),[])})))}},x=function(e,t){var r=(void 0===t?{}:t).series,n=void 0===r?"value":r;return function(t){var r=e.before(t.date.toDate()).getSeries(n).where((function(e){return e}));return r.count()>0?r.last():0}},D=function(e,t){var r=void 0===t?{}:t,n=r.series,a=void 0===n?"value":n,u=r.years,o=void 0===u?3:u;return function(t){var r=e.subset(["date",a]).after(t.date.subtract(o,"year").toDate()).before(t.date.toDate()).bake(),n=r.where((function(e){return e.date.month()===t.date.month()})).where((function(e){return e.date.date()===t.date.date()})).where((function(e){return e.date.hour()===t.date.hour()})).where((function(e){return e.date.minute()===t.date.minute()})).getSeries(a).where((function(e){return e}));return n.count()<o?n.appendPair([null,r.getSeries(a).where((function(e){return e})).average()]).average():n.average()}};function N(e){var t=e.deflate((function(e){return e.x})).toArray(),n=d(t),a=f(t);if(0===n){var u=e.generateSeries({ares:function(e){return 0}});return{R:0,std:n,mean:a,df:u}}var o=new r({values:t.map((function(e){return{x:e,ares:Math.abs(e-a)/n}}))});return{R:h(o.deflate((function(e){return e.ares})).toArray()),df:o,std:n,mean:a}}function M(e,t,r){var n=function(e,t,r){return 1-r/(2*(e-t+1))}(e,t,r),a=function(e,t){return new p(t).inv(e)}(n,e-t-1);return{lambda:a*(e-t)/Math.sqrt((e-t-1+Math.pow(a,2))*(e-t+1)),p:n,t:a}}var I=function(e,t,r){return.6745*(e-r)/t};function V(e){var t=l(e),r=c(e),n=(e=e.sort((function(e,t){return t-e})).filter((function(e){return e>0})).map((function(e){return[e,I(e,r,t)]}))).filter((function(e){return Math.abs(e[1])>=3.5}));return{thresholds:{upper:Math.min.apply(Math,[Infinity].concat(n.map((function(e){return e[0]})))),lower:0}}}var C=function(e,t){return(t-e)/e};function F(r,n){if(r instanceof F)return r;r instanceof t.DataFrame&&(r=r.toArray());var a={values:r=r.map((function(t){var r=t.date,n=function(e,t){if(null==e)return{};var r,n,a={},u=Object.keys(e);for(n=0;n<u.length;n++)t.indexOf(r=u[n])>=0||(a[r]=e[r]);return a}(t,["date"]);return g({date:e(r)},n)})).sort((function(e,t){return e.date.valueOf()-t.date.valueOf()})),index:r.map((function(e){return e.date.toDate()})),considerAllRows:!0};t.DataFrame.call(this,a)}function k(e){var t,r=void 0===e?{}:e,n=r.series,a=void 0===n?"value":n,u=r.lower,o=r.upper;if(u>o)throw new Error("thresholds invalid");var i=this.where((function(e){return function(e,t,r){return e<t||e>r}(e[a],u,o)})).generateSeries({raw:function(e){return e[a]},flag:function(e){var t=e.flag;return["outlier"].concat(void 0===t?[]:t)}}).transformSeries(((t={})[a]=function(e){return null},t));return new F(this.merge(i))}function E(e){var t;if(e instanceof F||(e=new F(e)),e.count()>1){var r,u=this.getInterval(),o=e.interval;if(!n(u,o))throw console.error(u,o),new Error("baseline and data intervals do not match");switch(u[0]){case"day":r=function(e){return e.month()+"-"+e.date()};break;case"month":r=function(e){return e.month()};break;default:r=function(e){return 0}}var i=e.withIndex((function(e){return r(e.date)}));t=this.generateSeries({baseline:function(e){return t=r(e.date),(n=i.at(t))&&a(n,"value")?n.value:i.getSeries("value").average();var t,n}})}else t=this.generateSeries({baseline:function(t){return e.first().value}});return new F(t=t.generateSeries({delta:function(e){return C(e.baseline,e.value)}}))}(F.prototype=Object.create(t.DataFrame.prototype)).constructor=F,F.prototype.getValueColumns=function(){return this.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()},F.prototype.getInterval=function(){var t,r,n;return t=this.getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return-e.Frequency})).first().Value,r=e(),(n=e().add(t)).diff(r,"month",!0)>=11?["year",Math.ceil(n.diff(r,"year",!0))]:n.diff(r,"day",!0)>=28?["month",Math.ceil(n.diff(r,"month",!0))]:n.diff(r,"hour",!0)>=23?["day",Math.ceil(n.diff(r,"day",!0))]:n.diff(r,"minute",!0)>=55?["hour",Math.ceil(n.diff(r,"hour",!0))]:["minute",n.diff(r,"minute")]},F.prototype.getDateRange=function(t,r){var n=e(this.first().date),a=e(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,t)},F.prototype.calculateStatistics=function(e){void 0===e&&(e={});var t=e.column,r=void 0===t?"value":t,n=e.filterZeros,a=void 0!==n&&n,u=e.filterNegative,o=void 0===u||u,i=this.deflate((function(e){return e[r]})).where((function(e){return!isNaN(e)}));o&&(i=i.where((function(e){return e>=0}))),a&&(i=i.where((function(e){return 0!==e})));var f=i.median(),l=i.average(),d=i.count(),h=i.std(),v=i.min(),p=i.max(),g=c(i.toArray()),m=s(i.toArray(),.25),y=s(i.toArray(),.75);return{median:f,mean:l,count:d,std:h,min:v,max:p,mad:g,q1:m,q3:y,iqr:y-m}},F.prototype.calculateThresholdOptions=function(e){var t,n,a,u,o=void 0===e?{}:e,i=o.k,f=o.filterZeros,l=void 0===f||f,c=o.filterNegative,d=void 0===c||c,h=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return l&&(h=h.where((function(e){return 0!==e}))),d&&(h=h.where((function(e){return e>0}))),i||(i=h.count()<1e3?Math.floor(.15*h.count()):Math.min.apply(Math,[1e3,Math.floor(.02*h.count())])),h.count()<5?{}:{esd:function(e,t,n){void 0===e&&(e=[]),void 0===t&&(t=10),void 0===n&&(n=.05);for(var a,u=new r({values:e.map((function(e){return{x:e}}))}),o=u.getSeries("x").count(),i=1,f=[],l=!1;i<=t;){var c={};1===i?function(){var e=N(u),t=e.R,r=e.df,n=e.mean,o=e.std;a=r.where((function(e){return e.ares!==t})),c=Object.assign({},c,{mean:n,std:o,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}():function(){var e=N(a),t=e.R,r=e.df,n=e.mean,u=e.std;a=r.where((function(e){return e.ares!==t})),c=Object.assign({},c,{mean:n,std:u,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}();var s=M(o,i,n);if(c=Object.assign({},c,{lambda:s.lambda}),f.push(c),l&&c.R>c.lambda&&(l=!1),0===c.R)break;if(c.R<c.lambda){if(l)break;l=!0}i++}var d=(f=new r(f).generateSeries({outlier:function(e){return e.R>e.lambda}}).takeWhile((function(e){return e.outlier}))).where((function(e){return e.Value>0})).deflate((function(e){return e.Value}));return{outliers:f,thresholds:{lower:0,upper:d.count()>0?d.min():Infinity},iterations:i}}(h.toArray(),i).thresholds,box:(t=h.toArray(),n=s(t,.25),a=s(t,.75),{thresholds:{lowerInner:n-1.5*(u=a-n),upperInner:n-3*u,lowerOuter:a+1.5*u,upperOuter:a+3*u}}).thresholds,modz:V(h.toArray()).thresholds}},F.prototype.getBestThreshold=function(){try{var e=this.calculateThresholdOptions(),t=v([u(e,"esd.upper",null),u(e,"modz.upper",null),u(e,"box.lowerOuter",null),u(e,"box.upperOuter",null)].filter((function(e){return e})),2);return h(t.reduce((function(e,t){return e.length>t.length?e:t})))}catch(e){throw console.error(e),new Error("Cannot determine threshold")}},F.prototype.betweenDates=function(e,t){return new F(this.between(e,t))},F.prototype.transformAllSeries=function(e,t){var r=t.exclude,n=this,a=a=n.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray();return r&&Array.isArray(r)&&(a=a.filter((function(e){return-1===r.indexOf(e)}))),a.forEach((function(t){var r;n=n.transformSeries(((r={})[t]=function(t){return isNaN(t)?t:e(t)},r))})),n},F.prototype.reset=function(){return new F(this.withSeries({value:function(e){return e.flag&&Array.isArray(e.flag)&&e.flag.length>0?e.raw:e.value}}).subset(["date","value"]).where((function(e){return!isNaN(e.value)&&null!==e.value})))},F.prototype.group=function(t,r){if(-1===["hour","day","month","year"].indexOf(t))throw new Error("interval type not supported");return this.groupBy((function(r){return e(r.date).startOf(t)}))},F.prototype.removeOutliers=k,F.prototype.clean=k,F.prototype.downsample=function(t,r){var n=t[0],a=t[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var u=function(e){return e.date.startOf(n)},i=this.getValueColumns();return a&&(u=function(e){return e.date.startOf(n).add(a,n)}),new F(this.groupBy(u).select((function(e){return g({date:e.first().date.startOf(n)},o([].concat(i.map((function(t){var n;switch(r){case"median":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).median();break;case"avg":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).average();break;default:n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).sum()}return[t,n]})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===i.indexOf(e)})).map((function(t){var r=e.deflate((function(e){return e[t]})).distinct().toArray();return 1===r.length&&(r=r[0]),[t,r]})))))})).inflate().withIndex((function(t){return e(t.date).toDate()})))},F.prototype.upsample=function(t,r){var n=t[0],a=t[1];return void 0===r&&(r="avg"),new F(this.fillGaps(function(t){var r=t[0],n=t[1],a=void 0===n?1:n;return function(t,n){var u=t[0];return Math.floor(e(n[0]).diff(u,r,!0)/a)>0}}([n,a]),function(t,r,n){var a=r[0],u=r[1],o={},i=o.overrideValue,f=o.dateFunction,l=o.flag;return function(r,n){for(var o=e(r[0]),c=e(n[0]),s=Math.floor(e(c).diff(o,a)/u)-1,d=r[1],h=n[1],v=[],p=0;p<s;++p){var g=y(t,{startValue:d,endValue:h,entryIndex:p,numEntries:s},{overrideValue:i,dateFunction:f,flag:l}),m=e(o).add((p+1)*u,a).toDate(),w=[m.valueOf(),Object.assign({},g,{date:m})];v.push(w)}return v}}(r,[n,a])))},F.prototype.populate=function(e,t){var r;switch(void 0===t&&(t="avg"),t){case"fill":r=e;break;default:r=e/this.count()}return new F(this.generateSeries({value:function(e){return r}}))},F.prototype.reduceToValue=function(e){return new F(this.generateSeries({value:function(t){return function(e,t){return void 0===t&&(t=[]),t.map((function(t){return e[t]})).filter((function(e){return e}))[0]||0}(t,e)}}).subset(["date","value"]))},F.prototype.rollingPercentChange=function(e){return new F(this.withSeries("delta",this.getSeries("value").percentChange()))},F.prototype.baselinePercentChange=E,F.prototype.addBaselineDelta=E,F.prototype.annualIntensity=function(t){var r=this;void 0===t&&(t=1);var n=this.getInterval();return new F(this.groupBy((function(e){return e.date.year()})).select((function(a){var u,i=a.first().date,f=a.last().date.add(n[1]||1,n[0]||"month"),l=(u=i,365/e(f).diff(e(u),"day"));return g({startDate:i,endDate:f},o(r.getValueColumns().map((function(e){return[e,a.deflate((function(t){return t[e]})).where((function(e){return e})).sum()*l/t]}))))})).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},F.prototype.fillMissing=function(){var e=this.first().date.toDate(),t=this.last().date.toDate(),r=this.getInterval(),n=F.blank(e,t,r,"missing").withIndex((function(e){return e.date.valueOf()})).merge(this.withIndex((function(e){return e.date.valueOf()}))).generateSeries({flag:function(e){return null==e.value?e.flag:void 0}});return new F(n)},F.prototype.fillNull=function(e){var t,r,n=e.series,a=void 0===n?"value":n,u=e.value,o=e.callback,i=function(e){return null==e[a]};return o?new F(this.generateSeries(((t={flag:function(e){return i(e)?["fill"].concat(e.flag||[]):e.flag}})[a]=function(e){return i(e)?o(e):e[a]},t))):u?new F(this.generateSeries({flag:function(e){return i(e)?["fill"].concat(e.flag||[]):e.flag}}).transformSeries(((r={})[a]=function(e){return null==e?u:e},r))):this},F.prototype.zeroFaultDetection=function(e){Array.isArray(e)||(e=[e,1]),e=m(e);var t=this.where((function(e){return 0===e.value})).ensureSeries("interval",this.where((function(e){return 0===e.value})).getSeries("date").amountChange()).where((function(t){return t.interval<=e})).subset(["date"]).generateSeries({value:function(e){return null},flag:function(e){return["zeroFault"]}});return new F(this.merge(t))},F.prototype.dataQuality=function(){var e=this.count(),t=this.where((function(e){return Array.isArray(e.flag)&&e.flag.length>0})).groupBy((function(e){return e.flag.toString()})).select((function(t){return{flag:t.first().flag,count:t.count(),percent:t.count()/e*100}})).inflate();return console.log(t.toString()),{}},F.prototype.monthlyWithQual=function(){var t=this.getInterval(),r=m(t);return new F(this.groupBy((function(t){return e(t.date).startOf().valueOf()})).select((function(t){var n=e(t.first().date).startOf("month").toDate(),a=Math.floor(e(n).endOf("month").diff(e(n),"millisecond")/r),u=(new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),t.getSeries("value").where((function(e){return e&&0!==e})).toArray().length),o=t.getSeries("value").where((function(e){return!isNaN(e)})).sum();return{date:n,value:isNaN(o)?0:o,count:u,fullCount:a,score:u/a}})).inflate().withIndex((function(e){return e.date.toDate()})))},F.prototype.threeYearAverage=function(t,r,n){void 0===r&&(r="value"),t=e(t),n||(n=this.getSeries(r).where((function(e){return!isNaN(e)&&null!==e})).average());var a=this.before(t.toDate()).where((function(e){return e.date.month()===t.month()})).orderBy((function(t){return e(t.date)})).tail(3);return a.count()>0?a.getSeries(r).where((function(e){return!isNaN(e)&&null!==e})).average():n},F.prototype.averageFill=function(){var e=this,t=e.getSeries("value").where((function(e){return!isNaN(e)&&null!==e})).average();return new F(e.generateSeries({rollingAverage:function(r){return e.threeYearAverage(r.date,"value",t)}}).generateSeries({flag:function(e){return e.value?e.flag:["filled"].concat(e.flag||[])}}).generateSeries({value:function(e){return e.value?e.value:e.rollingAverage}}).dropSeries(["rollingAverage"]))},F.blank=function(t,r,n,a){var u=n[0],o=n[1],i=void 0===o?1:o;if(["minute","hour","day","month","year"].indexOf(u)<0)throw console.error(l),new Error("interval type not supported");t=e(t),r=e(r);for(var f=[t],l=m([u,i]);f[f.length-1].valueOf()<r.valueOf();)f.push(e(f[f.length-1]).add(i,u));var c=new F(f.map((function(e){return{date:e}})));return a&&(c=new F(c.generateSeries({flag:function(e){return[a]}}))),c},F.aggregate=function(e){Array.isArray(e)||(e=[e]),e=e.map((function(e){return new F(e)}));var r=new Set(e.map((function(e){return e.getValueColumns()})).reduce((function(e,t){return e.concat(t)}),[]));return new F(t.DataFrame.concat(e).groupBy((function(e){return e.date})).select((function(e){var t={date:e.first().date};return r.forEach((function(r){return t[r]=e.deflate((function(e){return e[r]})).sum()})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===r.has(e)})).forEach((function(r){var n=e.deflate((function(e){return e[r]})).distinct().toArray();1===n.length&&(n=n[0]),t[r]=n})),t})).inflate())},F.concat=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new F(e).withIndex((function(e){return e.date.valueOf()}))})),new F(t.DataFrame.concat(e))},F.merge=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new F(e).withIndex((function(e){return e.date.valueOf()}))})),new F(t.DataFrame.merge(e))};export{F as Timeseries,D as annualAverage,b as annualMonthlyAverageMap,w as averageMonthlyMap,A as fillMonthlyBAnnualyMap,O as fillMonthlyByMap,S as monthlyRollingAverageMap,x as pad};
//# sourceMappingURL=index.module.js.map
